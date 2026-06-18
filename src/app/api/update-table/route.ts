import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  try {
    const { tableId, newTableNumber, restaurantId } = await req.json();

    if (!tableId || !newTableNumber || !restaurantId ) {
      console.log("tableId: ", tableId);
      console.log("newTableNumber: ", newTableNumber);
      console.log("restaurantId: ", restaurantId);
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: restaurantData, error: restaurantError } = await supabaseAdmin
      .from('restaurants') // Make sure this matches your actual table name
      .select('slug')
      .eq('id', restaurantId)
      .single();

    if (restaurantError || !restaurantData?.slug) {
      return NextResponse.json({ error: "Restaurant not found or missing slug." }, { status: 404 });
    }
    
    const restaurantSlug = restaurantData.slug;

    // STEP 1: Attempt to update the table number in the database
    const { error: dbError } = await supabaseAdmin
      .from('tables') 
      .update({ table_number: newTableNumber })
      .eq('id', tableId);

    // If it violates our Unique Constraint, Supabase returns error code 23505
    if (dbError) {
      if (dbError.code === '23505' || dbError.message.includes('duplicate')) {
        return NextResponse.json(
          { error: `Table ${newTableNumber} already exists.` },
          { status: 409 }
        );
      }
      throw new Error(`Database error: ${dbError.message}`);
    }

    // STEP 2: Generate the NEW QR code via your Edge Function
    const baseUrl = new URL(req.url).origin;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const functionUrl = `${supabaseUrl}/functions/v1/generate-table-qr`;

    const res = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`, 
      },
      body: JSON.stringify({ restaurantSlug, tableNumber: newTableNumber, baseUrl }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      await supabaseAdmin
        .from('tables')
        .delete()
        .eq('restaurant_id', restaurantId)
        .eq('table_number', newTableNumber);

      return NextResponse.json(
        { error: `QR generation failed: ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const qrUrl = data.qrCodeUrl || data.url; 

    // STEP 3: Update the table with the newly generated QR URL
    if (qrUrl) {
       await supabaseAdmin
        .from('tables') 
        .update({ qr_url: qrUrl })
        .eq('id', tableId);
    }

    return NextResponse.json({ success: true, qrCodeUrl: qrUrl });

  } catch (err: unknown) {
    console.error("Backend Error in /api/update-table:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}