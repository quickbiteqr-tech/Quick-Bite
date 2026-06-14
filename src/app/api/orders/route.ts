// src/app/api/orders/route.ts

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET all orders for logged-in restaurant
export async function GET() {
  const supabase = await createServerClient(); // FIXED: Removed await

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
    .eq("restaurant_id", restaurant.id) // FIXED: filter by restaurant ID
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

// POST create a new order (public endpoint for customers)
export async function POST(req: Request) {
  const supabase = await createServerClient(); // FIXED: Removed await
  const body = await req.json();
  
  const { restaurantId, tableId, totalAmount, cartItems } = body;

  if (!restaurantId || !tableId || !totalAmount || !Array.isArray(cartItems)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      restaurant_id: restaurantId,
      table_id: tableId,
      total_amount: totalAmount,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (cartItems.length > 0) {
    const itemsPayload = cartItems.map((i: { id: string; quantity: number; price: number }) => ({
      order_id: order.id,
      menu_item: i.id,
      quantity: i.quantity,
      price: i.price,
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