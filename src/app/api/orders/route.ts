import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

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

const orderSchema = z.object({
  restaurantId: z.string().uuid("Invalid restaurant ID"),
  tableId: z.string().uuid("Invalid table ID"),
  totalAmount: z.number().optional(), // Ignored by the server
  cartItems: z.array(cartItemSchema).min(1, "Cart cannot be empty"),
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
    .select("*, order_items(*, menu_items(name)), restaurants(restaurant_name, slug), tables(table_number)")
    .eq("restaurant_id", restaurant.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

// POST create a new order (public endpoint for customers)
export async function POST(req: Request) {
  const supabase = await createServerClient();
  
  const body = await req.json();
  const validatedData = orderSchema.safeParse(body);

  if (!validatedData.success) {
    return NextResponse.json(
      { error: "Invalid request payload", details: validatedData.error.flatten() },
      { status: 400 }
    );
  }

  const { restaurantId, tableId, cartItems } = validatedData.data;

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

  // 3. Securely recalculate the total amount
  let serverCalculatedTotal = 0;
  
  const secureOrderItems = cartItems.map((item) => {
    // TODO: Strictly validate variant prices and modifier prices against DB
    // For now, we trust the client's `unitPrice` if variants/modifiers are present
    // because complex pricing logic has moved to the Relational Menu Architecture.
    const hasRelationalData = item.variantId || (item.selectedModifiers && item.selectedModifiers.length > 0);
    const finalUnitPrice = hasRelationalData && item.unitPrice !== undefined
      ? item.unitPrice
      : priceMap.get(item.id)!;
      
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

  // 4. Insert ONE order into the 'orders' table with secure total
  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      restaurant_id: restaurantId,
      table_id: tableId,
      total_amount: serverCalculatedTotal,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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