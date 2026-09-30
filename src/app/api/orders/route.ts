import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { orderRateLimit } from "@/lib/rate-limit";

const cartItemSchema = z.object({
  id: z.string().uuid("Invalid menu item ID"),
  quantity: z.number().int().positive("Quantity must be greater than 0").max(100, "Quantity too high"),
  price: z.number().nonnegative("Price cannot be negative").optional(),
  variantId: z.string().uuid("Invalid variant ID").optional(),
  variantLabel: z.string().max(200).optional(),
  variantPrice: z.number().nonnegative("Variant price cannot be negative").optional(),
  selectedModifiers: z.array(
    z.object({
      id: z.string(),
      name: z.string().max(200),
      price: z.number().nonnegative(),
    })
  ).max(50).optional(),
  unitPrice: z.number().nonnegative("Unit price cannot be negative").optional(),
});

const orderSchema = z.object({
  restaurantId: z.string().uuid("Invalid restaurant ID"),
  tableId: z.string().uuid("Invalid table ID"),
  totalAmount: z.number().optional(), // Ignored by the server
  cartItems: z.array(cartItemSchema).min(1, "Cart cannot be empty"),
  deviceId: z.string().optional(),
  idempotencyKey: z.string().uuid("Invalid idempotency key"),
});

// GET all orders for logged-in restaurant
export async function GET() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Find restaurant for this user
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (restaurantError || !restaurant) {
      return NextResponse.json({ error: "Restaurant not found for user" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("orders")
    .select("id, status, total_amount, created_at, track_code, estimated_time, idempotency_key, order_items(id, quantity, price, variant_label, modifiers, menu_items(name)), restaurants(restaurant_name, slug), tables(table_number)")
    .eq("restaurant_id", restaurant.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

// POST create a new order (public endpoint for customers)
export async function POST(req: Request) {
  // Rate Limit Check
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success: rateLimitSuccess } = await orderRateLimit.limit(ip);
  if (!rateLimitSuccess) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const supabase = await createServerClient();
  
  const body = await req.json();
  const validatedData = orderSchema.safeParse(body);

  if (!validatedData.success) {
    return NextResponse.json(
      { error: "Invalid request payload", details: validatedData.error.flatten() },
      { status: 400 }
    );
  }

  const { restaurantId, tableId, cartItems, deviceId, idempotencyKey } = validatedData.data;

  // Idempotency Check
  const { data: existingOrder } = await supabase
    .from("orders")
    .select("id, track_code, restaurants(slug)")
    .eq("idempotency_key", idempotencyKey)
    .gte("created_at", new Date(Date.now() - 60 * 1000).toISOString())
    .maybeSingle();

  if (existingOrder) {
    const restaurantSlug = Array.isArray(existingOrder.restaurants) 
      ? existingOrder.restaurants[0]?.slug 
      : (existingOrder.restaurants as any)?.slug;
      
    return NextResponse.json({ 
      success: true, 
      trackCode: existingOrder.track_code,
      restaurantSlug: restaurantSlug,
      message: "Order already processed" 
    }, { status: 200 }); 
  }

  // 0. Check Device Ban (No Phantom 200 OK for orders)
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check IP ban first
  const { data: bannedIp } = await supabaseAdmin
    .from('banned_ips')
    .select('ip_address')
    .eq('ip_address', ip)
    .eq('restaurant_id', restaurantId)
    .maybeSingle();

  if (bannedIp) {
      await supabaseAdmin
        .from('tables')
        .update({ current_session_id: null })
        .eq('restaurant_id', restaurantId)
        .eq('id', tableId);
      return NextResponse.json({ error: 'Your access has been restricted by the restaurant.' }, { status: 403 });
  }

  if (deviceId) {
    const { data: bannedDevice } = await supabaseAdmin
      .from('banned_devices')
      .select('device_id')
      .eq('device_id', deviceId)
      .eq('restaurant_id', restaurantId)
      .single();

    if (bannedDevice) {
      return NextResponse.json({ error: 'Device Restricted' }, { status: 403 });
    }
  }

  // 1. Fetch authentic base prices from the database for this specific restaurant
  const menuItemIds = cartItems.map((item) => item.id);
  const { data: menuItems, error: menuError } = await supabase
    .from("menu_items")
    .select("id, price")
    .in("id", menuItemIds)
    .eq("restaurant_id", restaurantId); // Prevents cross-tenant item forgery

  if (menuError || !menuItems) {
    return NextResponse.json(
      { error: "Invalid menu items or mismatched restaurant." }, 
      { status: 400 }
    );
  }

  const priceMap = new Map(menuItems.map((item) => [item.id, item.price]));

  // Securely fetch variant and modifier prices from DB
  const variantIds = cartItems.map(i => i.variantId).filter(Boolean) as string[];
  const { data: variants } = variantIds.length > 0 
    ? await supabase.from('menu_item_variants').select('id, price').in('id', variantIds) 
    : { data: [] };
  const variantMap = new Map(variants?.map(v => [v.id, v.price]) || []);

  const modifierIds = cartItems.flatMap(i => i.selectedModifiers?.map(m => m.id) || []);
  const { data: modifiers } = modifierIds.length > 0 
    ? await supabase.from('menu_item_modifiers').select('id, price').in('id', modifierIds) 
    : { data: [] };
  const modifierMap = new Map(modifiers?.map(m => [m.id, m.price]) || []);

  // 3. Securely recalculate the total amount
  let serverCalculatedTotal = 0;
  
  const secureOrderItems = cartItems.map((item) => {
    const basePrice = priceMap.get(item.id) || 0;
    const variantPrice = item.variantId ? (variantMap.get(item.variantId) || 0) : 0;
    
    const modifierTotal = (item.selectedModifiers || []).reduce((sum, mod) => {
      return sum + (modifierMap.get(mod.id) || 0);
    }, 0);
    
    // Server acts as the ultimate source of truth
    const finalUnitPrice = basePrice + variantPrice + modifierTotal;
      
    serverCalculatedTotal += finalUnitPrice * item.quantity;
    
    return {
      menu_item: item.id, // Column mapped via foreign key in Supabase
      quantity: item.quantity,
      price: finalUnitPrice,
      variant_id: item.variantId || null,
      variant_label: item.variantLabel || null,
      modifiers: item.selectedModifiers || null,
    };
  });

  // Validate table existence and ownership
  const { data: tableData } = await supabase
    .from("tables")
    .select("id")
    .eq("id", tableId)
    .eq("restaurant_id", restaurantId)
    .single();

  if (!tableData) {
    return NextResponse.json({ error: "Invalid table or restaurant mismatch." }, { status: 400 });
  }

  // 4. Insert ONE order into the 'orders' table with secure total
  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      restaurant_id: restaurantId,
      table_id: tableId,
      total_amount: serverCalculatedTotal,
      status: "pending",
      idempotency_key: idempotencyKey,
    })
    .select()
    .single();

  if (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }

  if (cartItems.length > 0) {
    const itemsPayload = secureOrderItems.map((i) => ({
      order_id: order.id,
      menu_item: i.menu_item,
      quantity: i.quantity,
      price: i.price,
      variant_id: i.variant_id,
      variant_label: i.variant_label,
      modifiers: i.modifiers,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(itemsPayload);
    if(itemsError) {
        // Rollback order creation if items fail to insert
        await supabase.from('orders').delete().eq('id', order.id);
        return NextResponse.json({ error: `Could not save order items: ${itemsError.message}` }, { status: 500 });
    }
  }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('slug')
    .eq('id', restaurantId)
    .single();

  return NextResponse.json({ 
    success: true, 
    trackCode: order.track_code, 
    restaurantSlug: restaurant?.slug 
  }, { status: 201 });
}