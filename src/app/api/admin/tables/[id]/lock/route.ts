import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tableId = (await params).id;
    if (!tableId) {
      return NextResponse.json({ error: 'Missing table ID' }, { status: 400 });
    }

    const body = await req.json();
    const { is_locked } = body;

    if (typeof is_locked !== 'boolean') {
      return NextResponse.json({ error: 'is_locked must be a boolean' }, { status: 400 });
    }

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: table, error: fetchError } = await supabase
      .from('tables')
      .select('restaurant_id, restaurants!inner(user_id)')
      .eq('id', tableId)
      .single();

    if (fetchError || !table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    const restaurantUser = (table.restaurants as any)?.user_id;
    if (restaurantUser !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update
    const { error: updateError } = await supabase
      .from('tables')
      .update({ is_locked })
      .eq('id', tableId);

    if (updateError) {
      console.error('Failed to update table lock:', updateError);
      return NextResponse.json({ error: 'Failed to update table lock' }, { status: 500 });
    }

    return NextResponse.json({ success: true, is_locked }, { status: 200 });

  } catch (error) {
    console.error('Table Lock API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
