import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { tableId } = await req.json();

    if (!tableId) {
      return NextResponse.json({ error: 'Missing tableId' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Mark orders as paid
    const { error: ordersError } = await supabaseAdmin
      .from('orders')
      .update({ is_paid: true, status: 'completed' })
      .eq('table_id', tableId)
      .eq('is_paid', false)
      .neq('status', 'cancelled');

    if (ordersError) {
      console.error('Failed to update orders:', ordersError);
      return NextResponse.json({ error: 'Failed to update orders' }, { status: 500 });
    }

    // 2. Clear the active session from the table
    const { error: tableError } = await supabaseAdmin
      .from('tables')
      .update({ current_session_id: null })
      .eq('id', tableId);

    if (tableError) {
      console.error('Failed to update table session:', tableError);
      return NextResponse.json({ error: 'Failed to update table session' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settle Table API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
