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

    // 1. Mark active un-cancelled orders as paid and archive them
    const { error: ordersError } = await supabaseAdmin
      .from('orders')
      .update({ is_paid: true, status: 'completed', is_archived: true })
      .eq('table_id', tableId)
      .eq('is_paid', false)
      .neq('status', 'cancelled');

    if (ordersError) {
      console.error('Failed to update active orders:', ordersError);
      return NextResponse.json({ error: 'Failed to update orders' }, { status: 500 });
    }

    // 2. Sweep any remaining unarchived orders on this table (e.g. cancelled orders) and archive them
    // We intentionally leave their is_paid status as false, we just hide them from the client.
    const { error: sweepError } = await supabaseAdmin
      .from('orders')
      .update({ is_archived: true })
      .eq('table_id', tableId)
      .eq('is_archived', false);

    if (sweepError) {
      console.error('Failed to sweep cancelled orders:', sweepError);
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
