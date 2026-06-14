// src/app/api/orders/[id]/route.ts

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function PUT(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const supabase = await createServerClient(); // FIXED: Removed await
  const { status, note, etaMinutes } = await req.json();
  const { orderId } = await params;

  // FIXED: Added Authorization check
  const { data: { user } } = await supabase.auth.getUser();
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
  
  // Verify the order belongs to this restaurant
  const { count, error: checkError } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('id', orderId)
    .eq('restaurant_id', restaurant.id);

  if (checkError || count === 0) {
    return NextResponse.json({ error: "Order not found or permission denied." }, { status: 404 });
  }

  // 1. Update order status
  const { error: updateError } = await supabase
    .from("orders")
    .update({ status, estimated_time: etaMinutes, status_updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (updateError) {
    console.error("Order update failed:", updateError.message);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // 2. Insert into order_status_events
  await supabase.from("order_status_events").insert({
    order_id: orderId,
    status,
    note,
  });

  // 3. Send notification
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/push/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        title: `Order ${status}`,
        message: note || `Your order status changed to ${status}`,
      }),
    });
  } catch (err) {
    console.error("Failed to send push notification:", err);
  }

  return NextResponse.json({ success: true });
}