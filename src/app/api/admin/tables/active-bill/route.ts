import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tableNumber = searchParams.get('tableNumber');
    const restaurantId = searchParams.get('restaurantId');

    if (!tableNumber || !restaurantId) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: tableData } = await supabase
      .from('tables')
      .select('id, current_session_id')
      .eq('restaurant_id', restaurantId)
      .eq('table_number', tableNumber)
      .single();

    if (!tableData) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    // Verify ownership
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('user_id')
      .eq('id', restaurantId)
      .single();

    if (!restaurant || restaurant.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!tableData.current_session_id) {
      return NextResponse.json({ activeOrdersCount: 0, totalAmount: 0 }, { status: 200 });
    }

    // Fetch active orders
    const { data: activeOrders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id, track_code, status, total_amount,
        order_items (
          quantity, price, variant_label, menu_items:menu_item_id ( name )
        )
      `)
      .eq('table_id', tableData.id)
      .not('status', 'in', '("completed", "cancelled")');

    if (ordersError) {
      console.error("Orders Error:", ordersError);
      return NextResponse.json({ error: 'Failed to fetch active orders' }, { status: 500 });
    }

    const totalAmount = activeOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

    return NextResponse.json({
      activeOrdersCount: activeOrders?.length || 0,
      totalAmount,
      orders: activeOrders || []
    }, { status: 200 });

  } catch (error) {
    console.error('Active Bill API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
