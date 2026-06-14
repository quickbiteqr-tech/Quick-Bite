// src/app/api/push/notify/route.ts

import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createServerClient } from '@/lib/supabase/server';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

// Only set VAPID details if keys are available
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export async function POST(req: Request) {
  try {
    // Check if VAPID keys are configured
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return NextResponse.json({ 
        error: 'Push notifications not configured. VAPID keys are missing.' 
      }, { status: 503 });
    }

    const { orderId, title, message, url } = await req.json(); // Changed 'body' to 'message' for clarity
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

    const supabase = await createServerClient(); // FIXED: Removed await
    const { data: subs, error } = await supabase
      .from('web_push_subscriptions')
      .select('*')
      .eq('order_id', orderId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!subs || subs.length === 0) {
        return NextResponse.json({ ok: true, message: "No subscriptions found for this order." });
    }

    const payload = JSON.stringify({ title: title || 'Order update', body: message || '', data: { url } });

    const results = await Promise.allSettled(
      subs.map(async (s) => {
        const subscription = {
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth }
        } as webpush.PushSubscription;
        try {
          await webpush.sendNotification(subscription, payload);
          return { ok: true, endpoint: s.endpoint };
        } catch (err: unknown) {
          // If subscription is gone, delete it from the DB
          const error = err as { statusCode?: number; message?: string };
          if (error.statusCode === 404 || error.statusCode === 410) {
            await supabase.from('web_push_subscriptions').delete().eq('endpoint', s.endpoint);
          }
          return { ok: false, error: error?.message, endpoint: s.endpoint };
        }
      })
    );

    return NextResponse.json({ ok: true, results });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}