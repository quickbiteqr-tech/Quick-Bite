import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  // CRITICAL SECURITY REQUIREMENT:
  // Immediately block execution if we are in production.
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { email, id } = body;

    if (!email || !id) {
      return NextResponse.json(
        { error: 'Missing email or id in request body' },
        { status: 400 }
      );
    }

    // We must use the service role key to bypass RLS and insert an admin
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase Service Role configuration');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error: insertError } = await supabaseAdmin
      .from('admins')
      .upsert({ id, email }, { onConflict: 'id' });

    if (insertError) {
      console.error('Error inserting admin:', insertError);
      return NextResponse.json(
        { error: 'Failed to insert admin', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Admin successfully seeded', email, id },
      { status: 200 }
    );
  } catch (error) {
    console.error('Seed admin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
