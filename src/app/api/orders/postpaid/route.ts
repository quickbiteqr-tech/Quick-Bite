import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { orderRateLimit } from "@/lib/rate-limit";

const cartItemSchema = z.object({
  id: z.string().uuid("Invalid menu item ID"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  price: z.number().optional(), // Ignored by the server
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

    // 5. Look up the table's internal ID
    const { data: table, error: tableError } = await supabase
      .from('tables')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('table_number', tableNumber)
      .single();

    if (tableError || !table) {
      return NextResponse.json({ error: `Table "${tableNumber}" does not exist for this restaurant.` }, { status: 404 });
    }

    // 6. Generate the readable track code
    const generatedTrackCode = 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // 7. Insert ONE order into the 'orders' table with secure total
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        restaurant_id: restaurantId,
        table_id: table.id, 
        total_amount: serverCalculatedTotal,
        status: "pending",
        is_prepaid: false,
        track_code: generatedTrackCode,
        idempotency_key: idempotencyKey,
      })
      .select('id, track_code')
      .single();

    if (orderError || !order) {
      console.error("Postpaid Order Insert Error:", orderError);
      return NextResponse.json({ error: "Failed to create order in database." }, { status: 500 });
    }

    // 8. Map the secure items to the order we just created
    const itemsPayload = secureOrderItems.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      price: item.price,
    }));

    // 9. Insert the food items into the 'order_items' table
    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsPayload);

    if (itemsError) {
      // Rollback
      await supabase.from('orders').delete().eq('id', order.id); 
      return NextResponse.json({ error: `Could not save order items: ${itemsError.message}` }, { status: 500 });
    }

    // 10. Success
    return NextResponse.json({ success: true, trackCode: order.track_code }, { status: 201 });

  } catch (err: unknown) {
    console.error("Postpaid API Error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}