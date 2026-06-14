// src/app/api/debug/session/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    // Show raw incoming headers for debugging
    const rawCookies = req.headers.get("cookie") ?? "";

    // create server client (uses cookies() normally but here we read from Request)
    // We'll call the server helper to do the real work:
    const supabase = await createServerClient();

    // Attempt to read session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession().catch((e) => ({ data: null, error: e }));

    // Also get user (separate call)
    const { data: userData, error: userError } = await supabase.auth.getUser().catch((e) => ({ data: null, error: e }));

    return NextResponse.json({
      ok: true,
      rawCookies,
      session: sessionData ?? null,
      sessionError: sessionError ? (sessionError.message || sessionError) : null,
      user: userData ?? null,
      userError: userError ? (userError.message || userError) : null,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: errorMessage }, { status: 500 });
  }
}
