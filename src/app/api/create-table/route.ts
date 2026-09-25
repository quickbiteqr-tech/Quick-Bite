// File: app/api/create-table/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  try {
    const { restaurantSlug, tableNumber, restaurantId } = await req.json();

    if (!restaurantSlug || !restaurantId || !tableNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // AUTH GUARD: Verify the requester is logged in
    const supabaseAuth = await createServerClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // OWNERSHIP GUARD: Ensure the user actually owns the restaurant
    const { data: restaurant, error: ownerError } = await supabaseAdmin
      .from('restaurants')
      .select('user_id')
      .eq('id', restaurantId)
      .single();

    if (ownerError || !restaurant || restaurant.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this restaurant." }, { status: 403 });
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

    const { data: newTable } = await supabaseAdmin
      .from('tables')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('table_number', String(tableNumber))
      .single();

    return NextResponse.json({ success: true, tableNumber, tableId: newTable?.id });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}