import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const { restaurantId, tableNumber, totalAmount, cartItems } = await req.json();

    if (!restaurantId || !tableNumber || !totalAmount || !Array.isArray(cartItems)) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // 1. Look up the table's internal ID
    const { data: table, error: tableError } = await supabase
      .from('tables')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('table_number', tableNumber)
      .single();

    if (tableError || !table) {
      return NextResponse.json({ error: `Table "${tableNumber}" does not exist for this restaurant.` }, { status: 404 });
    }

    // 2. Generate the readable track code
    const generatedTrackCode = 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // 3. Insert ONE order into the 'orders' table
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        restaurant_id: restaurantId,
        table_id: table.id, 
        total_amount: totalAmount,
        status: "pending",
        is_prepaid: false,
        track_code: generatedTrackCode, // Attach the code right here
      })
      .select('id, track_code')
      .single();

    if (orderError || !order) {
      console.error("Postpaid Order Insert Error:", orderError);
      return NextResponse.json({ error: "Failed to create order in database." }, { status: 500 });
    }

    // 4. Map the cart items so they belong to the order we just created
    const itemsPayload = cartItems.map((item: any) => ({
      order_id: order.id,       // The UUID of the new order
      menu_item_id: item.id,    // The UUID of the food
      quantity: item.quantity,
      price: item.price,
    }));

    // 5. Insert the food items into the 'order_items' table
    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsPayload);

    if (itemsError) {
      // If saving items fails, rollback (delete) the parent order so we don't have empty ghost orders
      await supabase.from('orders').delete().eq('id', order.id); 
      return NextResponse.json({ error: `Could not save order items: ${itemsError.message}` }, { status: 500 });
    }

    // 6. Success! Return the tracking code to the frontend
    return NextResponse.json({ success: true, trackCode: order.track_code }, { status: 201 });

  } catch (err: unknown) {
    console.error("Postpaid API Error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}