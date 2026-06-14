import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const WEB3FORMS_ACCESS_KEY = 'd7f21426-ce19-496a-9fb1-af327fa46bd9';

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | {
        restaurant_name?: string;
        phone?: string;
        address?: string;
        venue_type?: string | null;
        cuisine?: string;
        logo_url?: string;
        maps_url?: string;
      }
    | null;

  if (!body?.restaurant_name || !body.phone || !body.address) {
    return NextResponse.json(
      { ok: false, message: 'Missing required fields.' },
      { status: 400 }
    );
  }

  const payload = {
    access_key: WEB3FORMS_ACCESS_KEY,
    subject: 'QuickBite — Get Website form submission',
    from_name: body.restaurant_name,
    restaurant_name: body.restaurant_name,
    phone: body.phone,
    address: body.address,
    venue_type: body.venue_type ?? '',
    cuisine: body.cuisine ?? '',
    logo_url: body.logo_url ?? '',
    maps_url: body.maps_url ?? '',
    user_id: user.id,
    page: '/get-website',
  };

  const r = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });

  const json = (await r.json().catch(() => null)) as { success?: boolean; message?: string } | null;

  if (!r.ok || !json?.success) {
    return NextResponse.json(
      { ok: false, message: json?.message || 'Web3Forms submission failed.' },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, message: 'Submitted' });
}

