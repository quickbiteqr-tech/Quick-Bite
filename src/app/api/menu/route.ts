// src/app/api/menu/route.ts

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createServerClient(); // FIXED: Removed await
  const body = await req.json();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find restaurant for this user to get the correct restaurant_id
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (restaurantError || !restaurant) {
      return NextResponse.json({ error: "Restaurant not found for user" }, { status: 404 });
  }

  const normalizedCategory = String(body.category ?? "mains").trim().toLowerCase();

  const { data, error } = await supabase
    .from("menu_items")
    .insert([
      {
        restaurant_id: restaurant.id, // Use the fetched restaurant ID
        name: body.name,
        description: body.description,
        price: body.price,
        category: normalizedCategory,
        available: body.available ?? true,
        photo_url: body.photo_url ?? null,
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}