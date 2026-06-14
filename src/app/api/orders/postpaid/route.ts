import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const { restaurantId, tableNumber, totalAmount, cartItems } = await req.json();

    if (!restaurantId || !tableNumber || !totalAmount || !Array.isArray(cartItems)) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // NEW: Look up the table's internal ID based on the restaurant and table number
    const { data: table, error: tableError } = await supabase
      .from('tables')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('table_number', tableNumber)
      .single();

    if (tableError || !table) {
      return NextResponse.json({ error: `Table "${tableNumber}" does not exist for this restaurant.` }, { status: 404 });
    }

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        restaurant_id: restaurantId,
        table_id: table.id, // MODIFIED: Use the looked-up internal ID
        total_amount: totalAmount,
        status: "pending",
        is_prepaid: false,
      })
      .select('id, track_code')
      .single();

    if (error) {
      console.error("Postpaid Order Insert Error:", error);
      return NextResponse.json({ error: "Failed to create order in database." }, { status: 500 });
    }

    const itemsPayload = cartItems.map((i: { id: string; quantity: number; price: number }) => ({
      order_id: order.id,
      menu_item: i.id,
      quantity: i.quantity,
      price: i.price,
      status: "pending", // Initialize each item with pending status
    }));
    const { error: itemsError } = await supabase.from("order_items").insert(itemsPayload);

    if (itemsError) {
      await supabase.from('orders').delete().eq('id', order.id); // Rollback
      return NextResponse.json({ error: `Could not save order items: ${itemsError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, trackCode: order.track_code }, { status: 201 });
  } catch (err: unknown) {
    console.error("Postpaid API Error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}