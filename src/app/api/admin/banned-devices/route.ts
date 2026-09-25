import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({ error: 'Missing restaurantId' }, { status: 400 });
    }

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('banned_devices')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch banned devices error:', error);
      return NextResponse.json({ error: 'Failed to fetch restricted devices' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Banned Devices GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { device_id, restaurantId } = body;

    if (!device_id || !restaurantId) {
      return NextResponse.json({ error: 'Missing Device ID or restaurantId' }, { status: 400 });
    }

    const { error } = await supabase
      .from('banned_devices')
      .delete()
      .eq('device_id', device_id)
      .eq('restaurant_id', restaurantId);

    if (error) {
      console.error('Delete banned device error:', error);
      return NextResponse.json({ error: 'Failed to unban device' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Device unbanned successfully' }, { status: 200 });
  } catch (error) {
    console.error('Banned Devices DELETE Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
