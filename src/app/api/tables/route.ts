// src/app/api/tables/route.ts

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET all tables for the current restaurant
export async function GET() {
  const supabase = await createServerClient(); // FIXED: Removed await

  // 1. Get the logged in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Find the restaurant for this user
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (restaurantError || !restaurant) {
    return NextResponse.json(
      { error: "Restaurant not found for this user" },
      { status: 404 }
    );
  }

  // 3. Get tables for that restaurant
  const { data, error } = await supabase
    .from("tables")
    .select("id, table_number, qr_code_url, created_at")
    .eq("restaurant_id", restaurant.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

// POST create a new table
export async function POST(req: Request) {
  const supabase = await createServerClient(); // FIXED: Removed await
  const body = await req.json();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find restaurant for this user
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (restaurantError || !restaurant) {
    return NextResponse.json(
      { error: "Restaurant not found for this user" },
      { status: 404 }
    );
  }

  const { table_number, qr_code_url } = body;

  if (!table_number) {
    return NextResponse.json(
      { error: "Missing table_number" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("tables")
    .insert({
      restaurant_id: restaurant.id,
      table_number,
      qr_code_url: qr_code_url || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}