// File: app/api/create-table/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { restaurantSlug, tableNumber } = await req.json();

    // 1. Automatically grab the current base URL (localhost or Vercel)
    const baseUrl = new URL(req.url).origin;

    // 2. Grab the Supabase URL from your .env file
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
    }

    // 3. Construct the proper Edge Function URL
    const functionUrl = `${supabaseUrl}/functions/v1/generate-table-qr`;

    // 4. Call your Supabase Edge Function
    const res = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`, 
      },
      // -> baseUrl is now passed along to the Edge Function here <-
      body: JSON.stringify({ restaurantSlug, tableNumber, baseUrl }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `Supabase function failed: ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json({ success: true, ...data });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}