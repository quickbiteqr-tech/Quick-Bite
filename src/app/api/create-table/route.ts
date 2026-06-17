// File: app/api/create-table/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE! 
);

export async function POST(req: Request) {
  try {
    const { restaurantSlug, tableNumber, restaurantId } = await req.json();

    if (!restaurantSlug || !restaurantId || !tableNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { error: dbError } = await supabaseAdmin.rpc('create_table_with_qr', {
      restaurant_uuid: restaurantId,
      table_num: tableNumber,
    });

    if (dbError) {
      // PostgreSQL error code '23505' means "unique violation" (duplicate record)
      if (dbError.code === '23505' || dbError.message.includes('duplicate')) {
        return NextResponse.json(
          { error: `Table ${tableNumber} already exists.` },
          { status: 409 }
        );
      }
      throw new Error(`Database error: ${dbError.message}`);
    }

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

      await supabaseAdmin
        .from('tables') // Replace 'tables' with your actual table name if it is different
        .delete()
        .eq('restaurant_id', restaurantId)
        .eq('table_number', tableNumber);

      return NextResponse.json(
        { error: `Supabase function failed: ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const qrUrl = data.qrCodeUrl || data.url; 

    if (qrUrl) {
       await supabaseAdmin
        .from('tables') // Replace 'tables' with your actual table name
        .update({ qr_url: qrUrl })
        .eq('restaurant_id', restaurantId)
        .eq('table_number', tableNumber);
    }

    return NextResponse.json({ success: true, qrCodeUrl: qrUrl, ...data });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}