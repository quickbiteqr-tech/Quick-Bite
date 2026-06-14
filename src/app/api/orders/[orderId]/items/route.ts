// src/app/api/orders/[orderId]/items/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId?: string }> }
) {
  try {
    const p = params ? await params : {};
    const { orderId } = p;
    
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const supabase = await createServerClient();

    // Authenticate user
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get order with restaurant info to verify ownership
    const { data: orderData, error: orderErr } = await supabase
      .from("orders")
      .select(`
        id,
        track_code,
        status,
        total_amount,
        created_at,
        table:tables(table_number),
        restaurant:restaurants(id, restaurant_name, user_id)
      `)
      .eq("id", orderId)
      .single();

    if (orderErr || !orderData) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Type assertion for the restaurant data (it's an array with one element)
    const restaurantData = (orderData.restaurant as { user_id: string }[])[0];
    if (!restaurantData || restaurantData.user_id !== userData.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get all order items with their current status
    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .select(`
        id,
        quantity,
        price,
        status,
        estimated_time,
        notes,
        created_at,
        updated_at,
        menu_item:menu_items(id, name, description, photo_url)
      `)
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (itemsErr) {
      console.error("Error fetching order items:", itemsErr);
      return NextResponse.json({ error: "Failed to fetch order items" }, { status: 500 });
    }

    // Calculate order statistics
    const totalItems = items?.length || 0;
    const statusCounts = items?.reduce((acc: Record<string, number>, item: { status: string }) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {}) || {};

    const orderStats = {
      totalItems,
      statusCounts,
      allItemsReady: items?.every((item: { status: string }) => item.status === "ready" || item.status === "served") || false,
      allItemsServed: items?.every((item: { status: string }) => item.status === "served") || false,
      hasPreparingItems: items?.some((item: { status: string }) => item.status === "preparing") || false,
    };

    return NextResponse.json({
      order: orderData,
      items: items || [],
      stats: orderStats,
    });

  } catch (err: unknown) {
    console.error("Get order items error:", err);
    const errorMessage = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
