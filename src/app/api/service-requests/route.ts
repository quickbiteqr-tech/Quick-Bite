import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type } = body;

    const cookieStore = await cookies();
    const contextCookie = cookieStore.get('qb_table_context')?.value;
    
    if (!contextCookie || !type) {
      return NextResponse.json({ error: 'Missing table context or request type' }, { status: 400 });
    }

    let restaurantId, tableNumber, tableId;
    try {
      const decoded = Buffer.from(contextCookie, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      restaurantId = parsed.restaurantId;
      tableNumber = parsed.tableNumber;
      tableId = parsed.tableId;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid table context' }, { status: 400 });
    }

    if (!restaurantId || !tableNumber) {
      return NextResponse.json({ error: 'Incomplete table context' }, { status: 400 });
    }

    // 0.5 Strict Context Matching (Anti-Spoofing)
    if (body.restaurantId && body.restaurantId !== restaurantId) {
      return NextResponse.json({ error: 'Restaurant context mismatch' }, { status: 403 });
    }
    if (body.tableNumber && String(body.tableNumber) !== String(tableNumber)) {
      return NextResponse.json({ error: 'Table context mismatch' }, { status: 403 });
    }

    // 0.6 Device Ban Check
    const { deviceId } = body;
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    const supabase = await createServerClient();
    
    // We need service role to query banned_devices and tables (to bypass RLS for anonymous users)
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (deviceId) {
      const { data: bannedDevice } = await supabaseAdmin
        .from('banned_devices')
        .select('device_id')
        .eq('device_id', deviceId)
        .eq('restaurant_id', restaurantId)
        .single();

      if (bannedDevice) {
        // Explicitly block the user and kick them from the table
        await supabaseAdmin
          .from('tables')
          .update({ current_session_id: null })
          .eq('restaurant_id', restaurantId)
          .eq('table_number', String(tableNumber));
          
        return NextResponse.json({ error: 'Your device has been restricted by the restaurant. Please speak with a manager to restore your access.' }, { status: 403 });
      }
    }

    // 0.7 Single DB Query for Table Validation (Lock & Session)
    const sessionId = cookieStore.get('qb_session')?.value || cookieStore.get('diner_session_id')?.value;

    const { data: tableData, error: tableError } = await supabase
      .from('tables')
      .select('id, is_locked, current_session_id')
      .eq('restaurant_id', restaurantId)
      .eq('table_number', String(tableNumber))
      .single();

    if (tableError || !tableData) {
      console.error("Table lookup error:", tableError);
      return NextResponse.json({ error: 'We could not verify your table. Please scan the QR code on your table to restart your session.' }, { status: 404 });
    }

    if (tableData.is_locked) {
      return NextResponse.json({ error: 'This table is currently locked by the staff. Ordering is paused.' }, { status: 403 });
    }

    if (!sessionId || tableData.current_session_id !== sessionId) {
      return NextResponse.json({ error: 'Your session has expired or was cleared by staff. Please scan the QR code again.' }, { status: 403 });
    }

    // 3. Rate Limit Check (60-second cooldown)
    const sixtySecondsAgo = new Date(Date.now() - 60000).toISOString();
    const { data: recentRequests } = await supabase
      .from('service_requests')
      .select('created_at')
      .eq('session_id', sessionId)
      .gte('created_at', sixtySecondsAgo)
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentRequests && recentRequests.length > 0) {
      return NextResponse.json({ error: "You're doing that too fast! Please wait a moment before calling the staff again." }, { status: 429 });
    }

    // 4. Insert Request
    const { error: insertError } = await supabase
      .from('service_requests')
      .insert({
        restaurant_id: restaurantId,
        table_number: tableNumber,
        request_type: type,
        status: 'pending',
        session_id: sessionId,
        ip_address: ipAddress,
        device_id: deviceId || 'unknown',
      });

    if (insertError) {
      console.error('Failed to insert service request:', insertError);
      return NextResponse.json({ error: 'We could not send your request to the staff. Please ask them directly or try again.' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Service Request API Error:', error);
    return NextResponse.json({ error: "We're having trouble connecting to the system. Please scan the QR code on your table to refresh your session." }, { status: 500 });
  }
}
