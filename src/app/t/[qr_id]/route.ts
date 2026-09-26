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
      .select('id, table_number, restaurant_id, restaurants!inner(slug)')
      .eq('id', qrId)
      .single();

    if (tableError || !tableRecord) {
      console.error('QR Routing Error:', tableError);
      return NextResponse.redirect(new URL('/404', req.url));
    }

    // 2. Generate a unique diner_session_id
    const dinerSessionId = crypto.randomUUID();

    // 2.5 Use Service Role Client to bypass RLS for anonymous scanners
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Save session ID to the table so we know the active session
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
    const cookieStore = await cookies();
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
    const restaurantSlug = Array.isArray(tableRecord.restaurants) 
      ? tableRecord.restaurants[0].slug 
      : (tableRecord.restaurants as any).slug;

    return NextResponse.redirect(new URL(`/restaurant/${restaurantSlug}/table/${tableRecord.table_number}`, req.url));

  } catch (error) {
    console.error('QR Routing Exception:', error);
    return NextResponse.redirect(new URL('/404', req.url));
  }
}
