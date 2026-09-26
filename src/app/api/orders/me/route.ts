import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('qb_session')?.value;
    const contextCookie = cookieStore.get('qb_table_context')?.value;

    if (!sessionId || !contextCookie) {
      return NextResponse.json({ orders: [], aggregatedTotal: 0, hasActiveOrders: false }, { status: 200 });
    }

    let restaurantId: string;
    let tableNumber: string;

    try {
      const decoded = Buffer.from(contextCookie, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      restaurantId = parsed.restaurantId;
      tableNumber = parsed.tableNumber;
    } catch (e) {
      return NextResponse.json({ orders: [], aggregatedTotal: 0, hasActiveOrders: false }, { status: 200 });
    }

    const supabase = await createServerClient();

    // 1. Verify the session matches the table's current session
    const { data: tableData } = await supabase
      .from('tables')
      .select('id, current_session_id')
      .eq('restaurant_id', restaurantId)
      .eq('table_number', String(tableNumber))
      .single();

    if (!tableData || tableData.current_session_id !== sessionId) {
      return NextResponse.json({ orders: [], aggregatedTotal: 0, hasActiveOrders: false }, { status: 200 });
    }

    // Use admin client for fetching orders to bypass RLS on order_items for anonymous users
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. Fetch all active orders for this table
    const { data: activeOrders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        track_code,
        status,
        total_amount,
        estimated_time,
        created_at,
        order_items (
          quantity,
          price,
          variant_label,
          modifiers,
          menu_items:menu_item_id (
            name,
            image_url
          )
        )
      `)
      .eq('table_id', tableData.id)
      .not('status', 'in', '("completed", "cancelled")')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Fetch Active Orders Error:", error);
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    if (!activeOrders || activeOrders.length === 0) {
      return NextResponse.json({ orders: [], aggregatedTotal: 0, hasActiveOrders: false, tableId: tableData.id }, { status: 200 });
    }

    const aggregatedTotal = activeOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

    return NextResponse.json({
      orders: activeOrders,
      aggregatedTotal,
      hasActiveOrders: true,
      restaurantId,
      tableId: tableData.id,
    }, { status: 200 });

  } catch (err) {
    console.error("GET /api/orders/me Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
