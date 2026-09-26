import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { tableNumber, restaurantId } = body;

    if (!tableNumber || !restaurantId) {
      return NextResponse.json({ error: 'Missing tableNumber or restaurantId' }, { status: 400 });
    }

    // 1. Verify ownership
    const { data: restaurant, error: fetchError } = await supabase
      .from('restaurants')
      .select('user_id')
      .eq('id', restaurantId)
      .single();

    if (fetchError || !restaurant || restaurant.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Mark diner_sessions as revoked for this table
    const { error: revokeError } = await supabase
      .from('diner_sessions')
      .update({ revoked: true, expires_at: new Date().toISOString() })
      .eq('restaurant_id', restaurantId)
      .eq('table_number', String(tableNumber));

    if (revokeError) {
      console.error('Failed to revoke sessions:', revokeError);
      return NextResponse.json({ error: 'Failed to clear table sessions' }, { status: 500 });
    }

    // 2.5 Nullify current_session_id on the table
    const { data: tableData } = await supabase
      .from('tables')
      .update({ current_session_id: null })
      .eq('restaurant_id', restaurantId)
      .eq('table_number', String(tableNumber))
      .select('id')
      .single();

    if (tableData) {
      await supabase
        .from('orders')
        .update({ status: 'complete' })
        .eq('table_id', tableData.id)
        .not('status', 'in', '("complete", "cancelled")');
    }

    // 3. Mark service requests as ignored/resolved? (Optional, maybe clear them)
    await supabase
      .from('service_requests')
      .update({ status: 'resolved' })
      .eq('restaurant_id', restaurantId)
      .eq('table_number', String(tableNumber))
      .eq('status', 'pending');

    return NextResponse.json({ success: true, message: 'Table cleared and sessions revoked.' }, { status: 200 });
  } catch (error) {
    console.error('Clear Table API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
