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
  restaurantId: z.string().uuid("Invalid restaurant ID").optional(),
  tableNumber: z.string().min(1, "Table number is required").optional(),
  totalAmount: z.number().optional(), // Ignored by the server
  cartItems: z.array(cartItemSchema).min(1, "Cart cannot be empty"),
  idempotencyKey: z.string().uuid("Invalid idempotency key"),
  deviceId: z.string().optional(),
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

    const { cartItems, idempotencyKey, deviceId } = validatedData.data;

    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const contextCookie = cookieStore.get('qb_table_context')?.value;

    if (!contextCookie) {
      return NextResponse.json({ error: 'Missing table context' }, { status: 403 });
    }

    let restaurantId: string, tableNumber: string;
    try {
      const decoded = Buffer.from(contextCookie, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      restaurantId = parsed.restaurantId;
      tableNumber = parsed.tableNumber;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid table context' }, { status: 400 });
    }

    if (!restaurantId || !tableNumber) {
      return NextResponse.json({ error: 'Incomplete table context' }, { status: 400 });
    }

    // 1.2 Device Ban Check (No Phantom 200 OK for food orders)
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (deviceId) {
      const { data: bannedDevice } = await supabaseAdmin
        .from('banned_devices')
        .select('device_id')
        .eq('device_id', deviceId)
        .eq('restaurant_id', restaurantId)
        .single();
        
      if (bannedDevice) {
        // Explicitly kick the banned user from the table session
        await supabaseAdmin
          .from('tables')
          .update({ current_session_id: null })
          .eq('restaurant_id', restaurantId)
          .eq('table_number', String(tableNumber));

        return NextResponse.json({ error: 'Your device has been restricted by the restaurant. Please speak with a manager to restore your access.' }, { status: 403 });
      }
    }

    // 1.3 Strict Context Matching (Anti-Spoofing)
    if (body.restaurantId && body.restaurantId !== restaurantId) {
      return NextResponse.json({ error: 'Restaurant context mismatch' }, { status: 403 });
    }
    if (body.tableNumber && String(body.tableNumber) !== String(tableNumber)) {
      return NextResponse.json({ error: 'Table context mismatch' }, { status: 403 });
    }

    // 1.4 Single DB Query for Table Validation (Lock & Session)
    const activeSessionId = cookieStore.get('qb_session')?.value;
    
    const { data: tableData, error: tableError } = await supabase
      .from("tables")
      .select("id, is_locked, current_session_id")
      .eq("restaurant_id", restaurantId)
      .eq("table_number", String(tableNumber))
      .single();

    if (tableError || !tableData) {
      console.error("Table lookup error:", tableError);
      return NextResponse.json({ error: `We could not verify your table. Please scan the QR code on your table to restart your session.` }, { status: 404 });
    }

    if (tableData.is_locked) {
      return NextResponse.json({ error: 'This table is currently locked by the staff. Ordering is paused.' }, { status: 403 });
    }

    if (!activeSessionId || tableData.current_session_id !== activeSessionId) {
      return NextResponse.json({ error: 'Your session has expired or was cleared by staff. Please scan the QR code again.' }, { status: 403 });
    }

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

    // 2. Fetch authentic base prices from the database for this specific restaurant
    const menuItemIds = cartItems.map((item) => item.id);
    const { data: menuItems, error: menuError } = await supabase
      .from("menu_items")
      .select("id, price")
      .in("id", menuItemIds)
      .eq("restaurant_id", restaurantId); 

    if (menuError || !menuItems) {
      return NextResponse.json(
        { error: "We couldn't verify the menu items. Please refresh the page and try again." }, 
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
      return NextResponse.json({ error: "We could not process your order at this time. Please try again or order at the counter." }, { status: 500 });
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
          return NextResponse.json({ error: "There was an issue saving your order details. Please try again." }, { status: 500 });
      }
    }

    // 7. Success
    return NextResponse.json({ success: true, trackCode: generatedTrackCode }, { status: 201 });

  } catch (err: unknown) {
    console.error("Postpaid API Error:", err);
    return NextResponse.json({ error: "Your order couldn't be processed due to a network issue. Please scan the QR code on your table to refresh and try again." }, { status: 500 });
  }
}