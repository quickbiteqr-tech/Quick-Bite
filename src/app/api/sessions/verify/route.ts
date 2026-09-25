import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { restaurantId, tableNumber } = body;

    if (!restaurantId || !tableNumber) {
      return NextResponse.json({ valid: false, reason: 'missing_params' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const sessionId = cookieStore.get('diner_session_id')?.value;

    if (!sessionId) {
      return NextResponse.json({ valid: false, reason: 'no_session' }, { status: 200 });
    }

    const supabase = await createServerClient();

    // Check if session exists in DB
    const { data: session } = await supabase
      .from('diner_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!session) {
      // First time we are seeing this session, register it
      const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(); // 3 hours

      const { error: insertError } = await supabase
        .from('diner_sessions')
        .insert({
          id: sessionId,
          restaurant_id: restaurantId,
          table_number: tableNumber,
          expires_at: expiresAt,
          revoked: false,
        });

      if (insertError) {
        console.error('Failed to register session:', insertError);
        // We'll still return valid: true to not break the user experience on a DB hiccup
        return NextResponse.json({ valid: true });
      }

      return NextResponse.json({ valid: true });
    }

    // Session exists, let's verify it
    if (session.revoked) {
      return NextResponse.json({ valid: false, reason: 'revoked' });
    }

    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, reason: 'expired' });
    }

    return NextResponse.json({ valid: true });

  } catch (error) {
    console.error('Session verify API Error:', error);
    return NextResponse.json({ valid: false, reason: 'error' }, { status: 500 });
  }
}
