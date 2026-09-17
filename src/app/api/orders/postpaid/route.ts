import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { orderRateLimit } from "@/lib/rate-limit";

const cartItemSchema = z.object({
  id: z.string().uuid("Invalid menu item ID"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  price: z.number().nonnegative("Price cannot be negative").optional(), // Ignored by the server
});

const postpaidOrderSchema = z.object({
  restaurantId: z.string().uuid("Invalid restaurant ID"),
  tableNumber: z.string().min(1, "Table number is required"),
  totalAmount: z.number().optional(), // Ignored by the server
  cartItems: z.array(cartItemSchema).min(1, "Cart cannot be empty"),
  idempotencyKey: z.string().uuid("Invalid idempotency key"),
});

export async function POST(req: Request) {
  try {
    // 0. Rate Limiting
    // Using a simple fallback IP if x-forwarded-for is missing
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const { success: rateLimitSuccess } = await orderRateLimit.limit(ip);
    
    if (!rateLimitSuccess) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const supabase = await createServerClient();
    
    // 1. Validate payload with Zod
    const body = await req.json();
    const validatedData = postpaidOrderSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const { restaurantId, tableNumber, cartItems, idempotencyKey } = validatedData.data;

    // 1.5. Idempotency Check (Database)
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id, track_code")
      .eq("idempotency_key", idempotencyKey)
      .gte("created_at", new Date(Date.now() - 60 * 1000).toISOString())
      .maybeSingle();

    if (existingOrder) {
      return NextResponse.json({ 
        success: true, 
        trackCode: existingOrder.track_code,
        message: "Order already processed" 
      }, { status: 200 }); 
    }

    // 2. Fetch authentic prices from the database for this specific restaurant
    const menuItemIds = cartItems.map((item) => item.id);
    const { data: menuItems, error: menuError } = await supabase
      .from("menu_items")
      .select("id, price")
      .in("id", menuItemIds)
      .eq("restaurant_id", restaurantId); // Prevents cross-tenant item forgery

    if (menuError || !menuItems || menuItems.length !== cartItems.length) {
      return NextResponse.json(
        { error: "Invalid menu items or mismatched restaurant." }, 
        { status: 400 }
      );
    }

    // 3. Create a lookup map for genuine prices
    const priceMap = new Map(menuItems.map((item) => [item.id, item.price]));

    // 4. Securely recalculate the total amount
    let serverCalculatedTotal = 0;
    const secureOrderItems = cartItems.map((item) => {
      const realPrice = priceMap.get(item.id)!;
      serverCalculatedTotal += realPrice * item.quantity;
      
      return {
        menu_item_id: item.id, // For postpaid items array mapping later
        quantity: item.quantity,
        price: realPrice, // Authentic database price
      };
    });

    // 5. Generate the readable track code
    const generatedTrackCode = 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // 6. Atomic Insert via RPC
    const { data: newOrderId, error: rpcError } = await supabase.rpc('place_order_atomic', {
      p_restaurant_id: restaurantId,
      p_table_number: tableNumber,
      p_total_amount: serverCalculatedTotal,
      p_idempotency_key: idempotencyKey,
      p_track_code: generatedTrackCode,
      p_cart_items: secureOrderItems
    });

    if (rpcError) {
      console.error("Atomic Order Insert Error:", rpcError);
      if (rpcError.message.includes('does not exist')) {
        return NextResponse.json({ error: `Table "${tableNumber}" does not exist for this restaurant.` }, { status: 404 });
      }
      return NextResponse.json({ error: "Failed to create order securely." }, { status: 500 });
    }

    // 7. Success
    return NextResponse.json({ success: true, trackCode: generatedTrackCode }, { status: 201 });

  } catch (err: unknown) {
    console.error("Postpaid API Error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}