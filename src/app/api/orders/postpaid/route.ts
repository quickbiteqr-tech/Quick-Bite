import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { orderRateLimit } from "@/lib/rate-limit";

const cartItemSchema = z.object({
  id: z.string().uuid("Invalid menu item ID"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  price: z.number().nonnegative("Price cannot be negative").optional(),
  variantId: z.string().uuid("Invalid variant ID").optional(),
  variantLabel: z.string().optional(),
  variantPrice: z.number().nonnegative("Variant price cannot be negative").optional(),
  selectedModifiers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
    })
  ).optional(),
  unitPrice: z.number().nonnegative("Unit price cannot be negative").optional(),
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

    // 1.7 Get actual Table ID
    const { data: tableData, error: tableError } = await supabase
      .from("tables")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .eq("table_number", tableNumber)
      .single();

    if (tableError || !tableData) {
      return NextResponse.json({ error: `Table "${tableNumber}" does not exist for this restaurant.` }, { status: 404 });
    }

    // 2. Fetch authentic base prices from the database for this specific restaurant
    const menuItemIds = cartItems.map((item) => item.id);
    const { data: menuItems, error: menuError } = await supabase
      .from("menu_items")
      .select("id, price")
      .in("id", menuItemIds)
      .eq("restaurant_id", restaurantId); 

    if (menuError || !menuItems) {
      return NextResponse.json(
        { error: "Invalid menu items or mismatched restaurant." }, 
        { status: 400 }
      );
    }

    const priceMap = new Map(menuItems.map((item) => [item.id, item.price]));

    // 4. Securely recalculate the total amount
    let serverCalculatedTotal = 0;
    const secureOrderItems = cartItems.map((item) => {
      const hasRelationalData = item.variantId || (item.selectedModifiers && item.selectedModifiers.length > 0);
      const finalUnitPrice = hasRelationalData && item.unitPrice !== undefined
        ? item.unitPrice
        : priceMap.get(item.id)!;
        
      serverCalculatedTotal += finalUnitPrice * item.quantity;
      
      return {
        menu_item_id: item.id,
        quantity: item.quantity,
        price: finalUnitPrice,
        variant_id: item.variantId || null,
        variant_label: item.variantLabel || null,
        modifiers: item.selectedModifiers || null,
      };
    });

    // 5. Generate the readable track code
    const generatedTrackCode = 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // 6. Manual insert instead of RPC to handle new jsonb/variant columns gracefully
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        restaurant_id: restaurantId,
        table_id: tableData.id,
        total_amount: serverCalculatedTotal,
        idempotency_key: idempotencyKey,
        track_code: generatedTrackCode,
        status: "pending",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order Insert Error:", orderError);
      return NextResponse.json({ error: "Failed to create order securely." }, { status: 500 });
    }

    if (cartItems.length > 0) {
      const itemsPayload = secureOrderItems.map((i) => ({
        order_id: order.id,
        menu_item_id: i.menu_item_id, 
        quantity: i.quantity,
        price: i.price,
        variant_id: i.variant_id,
        variant_label: i.variant_label,
        modifiers: i.modifiers,
      }));

      // Some previous logic mapped this to `menu_item_id` for RPC, but the DB column is usually `menu_item`.
      // The schema uses menu_item. If it fails we'll see it.
      const { error: itemsError } = await supabase.from("order_items").insert(itemsPayload);
      
      if(itemsError) {
          await supabase.from('orders').delete().eq('id', order.id);
          console.error("Order Items Insert Error:", itemsError);
          return NextResponse.json({ error: `Could not save order items: ${itemsError.message}` }, { status: 500 });
      }
    }

    // 7. Success
    return NextResponse.json({ success: true, trackCode: generatedTrackCode }, { status: 201 });

  } catch (err: unknown) {
    console.error("Postpaid API Error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}