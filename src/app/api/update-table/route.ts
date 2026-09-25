import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  try {
    const { tableId, newTableNumber, restaurantId } = await req.json();

    if (!tableId || !newTableNumber || !restaurantId ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // AUTH GUARD: Verify the requester is logged in
    const supabaseAuth = await createServerClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: restaurantData, error: restaurantError } = await supabaseAdmin
      .from('restaurants') // Make sure this matches your actual table name
      .select('slug, user_id')
      .eq('id', restaurantId)
      .single();

    // OWNERSHIP GUARD: Ensure the user actually owns the restaurant
    if (restaurantError || !restaurantData?.slug) {
      return NextResponse.json({ error: "Restaurant not found or missing slug." }, { status: 404 });
    }

    if (restaurantData.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this restaurant." }, { status: 403 });
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

    return NextResponse.json({ success: true });

  } catch (err: unknown) {
    console.error("Backend Error in /api/update-table:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}