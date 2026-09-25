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
      .from('banned_ips')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch banned IPs error:', error);
      return NextResponse.json({ error: 'Failed to fetch restricted devices' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Banned IPs GET Error:', error);
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
    const { ip_address, restaurantId } = body;

    if (!ip_address || !restaurantId) {
      return NextResponse.json({ error: 'Missing IP or restaurantId' }, { status: 400 });
    }

    const { error } = await supabase
      .from('banned_ips')
      .delete()
      .eq('ip_address', ip_address)
      .eq('restaurant_id', restaurantId);

    if (error) {
      console.error('Delete banned IP error:', error);
      return NextResponse.json({ error: 'Failed to unban IP' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'IP unbanned successfully' }, { status: 200 });
  } catch (error) {
    console.error('Banned IPs DELETE Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
