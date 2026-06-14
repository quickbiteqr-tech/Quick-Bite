// src/app/api/orders/[orderId]/items/[itemId]/status/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

const CLIENT_TO_DB_STATUS: Record<string, string> = {
  Pending: "pending",
  Confirmed: "confirmed", 
  Preparing: "preparing",
  Ready: "ready",
  Served: "served",
  Serve: "served", // Handle "Serve" variant (without 'd')
  Cancelled: "cancelled",
  
  // Accept lowercase variants
  pending: "pending",
  confirmed: "confirmed",
  preparing: "preparing", 
  ready: "ready",
  served: "served",
  cancelled: "cancelled",
};

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ orderId?: string; itemId?: string }> }
) {
  try {
    const p = params ? await params : {};
    const { orderId, itemId } = p;
    
    if (!orderId || !itemId) {
      return NextResponse.json({ error: "Missing orderId or itemId" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { status: incomingStatus, etaMinutes, notes } = body ?? {};

    if (!incomingStatus) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const supabase = await createServerClient();

    // Authenticate user
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Verify order ownership through restaurant
    const { data: orderData, error: orderErr } = await supabase
      .from("orders")
      .select(`
        id, 
        restaurant_id,
        restaurants!inner(user_id)
      `)
      .eq("id", orderId)
      .single();

    if (orderErr || !orderData) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Type assertion for the restaurants data (it's an array with one element)
    const restaurantData = (orderData.restaurants as { user_id: string }[])[0];
    if (!restaurantData || restaurantData.user_id !== userData.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Verify the order item exists and belongs to this order
    const { data: itemData, error: itemErr } = await supabase
      .from("order_items")
      .select("id, order_id, status")
      .eq("id", itemId)
      .eq("order_id", orderId)
      .single();

    if (itemErr || !itemData) {
      return NextResponse.json({ error: "Order item not found" }, { status: 404 });
    }

    // Map status to database value
    // Normalize the incoming status (handle case variations)
    const normalizedStatus = String(incomingStatus).trim();
    const dbStatus = CLIENT_TO_DB_STATUS[normalizedStatus] || 
                     CLIENT_TO_DB_STATUS[normalizedStatus.toLowerCase()] ||
                     CLIENT_TO_DB_STATUS[normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1).toLowerCase()];
    
    if (!dbStatus) {
      console.error(`[Status API] Unknown status value: ${incomingStatus} (normalized: ${normalizedStatus})`);
      return NextResponse.json({ 
        error: `Unknown status value: ${incomingStatus}. Valid values are: pending, confirmed, preparing, ready, served, cancelled` 
      }, { status: 400 });
    }

    // Update the order item status
    const updatePayload: { 
      status: string; 
      estimated_time?: number | null;
      notes?: string;
      updated_at: string;
    } = {
      status: dbStatus,
      updated_at: new Date().toISOString(),
    };

    if (typeof etaMinutes !== "undefined") {
      updatePayload.estimated_time = Number(etaMinutes) || null;
    }

    if (notes) {
      updatePayload.notes = notes;
    }

    const { error: updateErr } = await supabase
      .from("order_items")
      .update(updatePayload)
      .eq("id", itemId);

    if (updateErr) {
      console.error("Failed to update order item:", updateErr);
      return NextResponse.json({ error: "Failed to update order item status" }, { status: 500 });
    }

    // Log the status change
    await supabase.from("order_item_status_events").insert({
      order_item_id: itemId,
      status: dbStatus,
      notes: notes || `Updated via dashboard`,
      updated_by: userData.user.id,
    });

    // Calculate and update overall order status
    await updateOverallOrderStatus(supabase, orderId);

    return NextResponse.json({ 
      success: true, 
      status: dbStatus,
      message: "Order item status updated successfully" 
    });

  } catch (err: unknown) {
    console.error("Order item status update error:", err);
    const errorMessage = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Helper function to calculate and update overall order status
async function updateOverallOrderStatus(supabase: Awaited<ReturnType<typeof createServerClient>>, orderId: string) {
  try {
    // Get all items for this order
    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .select("status")
      .eq("order_id", orderId);

    if (itemsErr || !items || items.length === 0) {
      return;
    }

    // Calculate overall status based on individual item statuses
    const statuses = items.map((item: { status: string }) => item.status);
    const overallStatus = calculateOverallStatus(statuses);

    // Update the order status
    await supabase
      .from("orders")
      .update({ 
        status: overallStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId);

    // Log the overall status change
    await supabase.from("order_status_events").insert({
      order_id: orderId,
      status: overallStatus,
      note: `Auto-updated based on individual item statuses`,
    });

  } catch (error) {
    console.error("Error updating overall order status:", error);
  }
}

// Calculate overall order status based on individual item statuses
function calculateOverallStatus(itemStatuses: string[]): string {
  if (itemStatuses.length === 0) return "pending";

  // If any item is cancelled, order is cancelled
  if (itemStatuses.includes("cancelled")) {
    return "cancelled";
  }

  // If all items are served, order is complete
  if (itemStatuses.every(status => status === "served")) {
    return "complete";
  }

  // If all items are ready, order is ready
  if (itemStatuses.every(status => status === "ready" || status === "served")) {
    return "ready";
  }

  // If any item is preparing, order is preparing
  if (itemStatuses.some(status => status === "preparing")) {
    return "preparing";
  }

  // If any item is confirmed, order is confirmed
  if (itemStatuses.some(status => status === "confirmed")) {
    return "confirmed";
  }

  // Default to pending
  return "pending";
}
