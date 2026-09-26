import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tableId = (await params).id;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure the table belongs to the user
    const { data: tableData } = await supabase
      .from('tables')
      .select('restaurant_id, current_session_id')
      .eq('id', tableId)
      .single();

    if (!tableData) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('user_id')
      .eq('id', tableData.restaurant_id)
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
      .select('total_amount')
      .eq('table_id', tableId)
      .not('status', 'in', '("completed", "cancelled")');

    if (ordersError) {
      console.error("Orders Error:", ordersError);
      return NextResponse.json({ error: 'Failed to fetch active orders' }, { status: 500 });
    }

    const totalAmount = activeOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

    return NextResponse.json({
      activeOrdersCount: activeOrders?.length || 0,
      totalAmount
    }, { status: 200 });

  } catch (error) {
    console.error('Active Bill API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
