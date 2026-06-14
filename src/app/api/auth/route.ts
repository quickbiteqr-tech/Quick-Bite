import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const {  session } = await req.json();

  const cookieStore = cookies();

  if (session) {
    // ✅ Save access_token in cookies
    (await
          // ✅ Save access_token in cookies
          cookieStore).set('sb-access-token', session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    (await cookieStore).set('sb-refresh-token', session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  } else {
    // ✅ Clear cookies on logout
    (await
          // ✅ Clear cookies on logout
          cookieStore).set('sb-access-token', '', { maxAge: 0, path: '/' });
    (await cookieStore).set('sb-refresh-token', '', { maxAge: 0, path: '/' });
  }

  return NextResponse.json({ success: true });
}
