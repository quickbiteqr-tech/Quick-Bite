import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function GET(req: Request, { params }: { params: Promise<{ qr_id: string }> }) {
  try {
    const qrId = (await params).qr_id;

    if (!qrId) {
      return NextResponse.redirect(new URL('/404', req.url));
    }

    const supabase = await createServerClient();

    // 1. Lookup the table using the qr_id (which is the table UUID)
    const { data: tableRecord, error: tableError } = await supabase
      .from('tables')
      .select('id, table_number, restaurant_id, current_session_id, restaurants!inner(slug)')
      .eq('id', qrId)
      .single();

    if (tableError || !tableRecord) {
      console.error('QR Routing Error:', tableError);
      return NextResponse.redirect(new URL('/404', req.url));
    }
    
    // 1.5 Smart Gatekeeper: Table-Centric Session Sharing
    const cookieStore = await cookies();
    const restaurantSlug = Array.isArray(tableRecord.restaurants) 
      ? tableRecord.restaurants[0].slug 
      : (tableRecord.restaurants as any).slug;

    // Use Service Role Client to bypass RLS
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let dinerSessionId = tableRecord.current_session_id;

    if (dinerSessionId) {
      // Check if this table has any active/unpaid orders
      const { data: unpaidOrders } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('table_id', tableRecord.id)
        .eq('is_paid', false)
        .neq('status', 'cancelled')
        .limit(1);

      if (!unpaidOrders || unpaidOrders.length === 0) {
        // Table has a session ID but no unpaid orders, meaning the previous diners left.
        // We generate a new session.
        dinerSessionId = crypto.randomUUID();
      }
    } else {
      // No current session, generate a new one
      dinerSessionId = crypto.randomUUID();
    }

    // Save session ID to the table (this handles both new sessions and re-affirming shared sessions)
    const { error: updateError } = await supabaseAdmin
      .from('tables')
      .update({ current_session_id: dinerSessionId })
      .eq('id', qrId);

    if (updateError) {
      console.error('Failed to update table session:', updateError);
    }

    // 3. Construct the qb_table_context
    const tableContext = {
      restaurantId: tableRecord.restaurant_id,
      tableNumber: tableRecord.table_number,
      tableId: tableRecord.id,
    };

    // 4. Set secure cookies
    const maxAge = 10800; // 3 hours

    cookieStore.set({
      name: 'qb_session',
      value: dinerSessionId,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: maxAge,
      path: '/',
    });

    // To sync with our existing `diner_session_id` logic if it is still expected elsewhere
    cookieStore.set({
      name: 'diner_session_id',
      value: dinerSessionId,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: maxAge,
      path: '/',
    });

    cookieStore.set({
      name: 'qb_table_context',
      value: Buffer.from(JSON.stringify(tableContext)).toString('base64'),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: maxAge,
      path: '/',
    });

    // 5. Redirect to the clean menu URL
    return NextResponse.redirect(new URL(`/restaurant/${restaurantSlug}/table/${tableRecord.table_number}`, req.url));

  } catch (error) {
    console.error('QR Routing Exception:', error);
    return NextResponse.redirect(new URL('/404', req.url));
  }
}
