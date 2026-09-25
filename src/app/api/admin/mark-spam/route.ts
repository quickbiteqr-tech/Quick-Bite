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
    const { serviceRequestId, reason } = body;

    if (!serviceRequestId) {
      return NextResponse.json({ error: 'Missing serviceRequestId' }, { status: 400 });
    }

    // 1. Verify ownership & Fetch Device ID
    const { data: serviceRequest, error: fetchError } = await supabase
      .from('service_requests')
      .select('device_id, restaurant_id, table_number, restaurants!inner(user_id)')
      .eq('id', serviceRequestId)
      .single();

    if (fetchError || !serviceRequest) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 });
    }

    // Check if the authenticated user owns the restaurant that received this request
    const restaurantUser = (serviceRequest.restaurants as any)?.user_id;
    if (restaurantUser !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!serviceRequest.device_id || serviceRequest.device_id === 'unknown') {
      return NextResponse.json({ error: 'Cannot ban unknown Device ID' }, { status: 400 });
    }

    // 2. Insert into banned_devices
    // Construct reason if not provided
    const banReason = reason || `Spamming Table ${serviceRequest.table_number}`;

    const { error: banError } = await supabase
      .from('banned_devices')
      .upsert(
        {
          device_id: serviceRequest.device_id,
          restaurant_id: serviceRequest.restaurant_id,
          reason: banReason,
        },
        {
          onConflict: 'device_id, restaurant_id',
        }
      );

    if (banError) {
      console.error('Failed to ban device:', banError);
      return NextResponse.json({ error: 'Failed to ban device' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Device shadowbanned successfully' }, { status: 200 });

  } catch (error) {
    console.error('Mark Spam API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
