// src/app/api/push/subscribe/route.ts

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { orderId, subscription } = await req.json();
    if (!orderId || !subscription?.endpoint) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const p256dh = subscription.keys?.p256dh;
    const auth = subscription.keys?.auth;

    if (!p256dh || !auth) {
        return NextResponse.json({ error: 'Subscription is missing keys' }, { status: 400 });
    }

    const supabase = await createServerClient(); // FIXED: Removed await
    // Upsert by endpoint to avoid duplicates and update order_id if needed
    const { error } = await supabase
      .from('web_push_subscriptions')
      .upsert({
        order_id: orderId,
        endpoint: subscription.endpoint,
        p256dh, auth
      }, { onConflict: 'endpoint' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}