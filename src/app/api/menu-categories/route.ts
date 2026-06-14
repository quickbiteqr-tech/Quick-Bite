import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

type MenuCategoryRow = {
  id: number;
  restaurant_id: string;
  name: string;
  created_at?: string;
};

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (restaurantError || !restaurant) {
      return NextResponse.json({ error: "Restaurant not found for user" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("menu_categories")
      .select("id, restaurant_id, name, created_at")
      .eq("restaurant_id", restaurant.id)
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("GET menu-categories error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const name = String(body?.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    const normalizedName = name.toLowerCase();

    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (restaurantError || !restaurant) {
      return NextResponse.json({ error: "Restaurant not found for user" }, { status: 404 });
    }

    const { data: existing } = await supabase
      .from("menu_categories")
      .select("id")
      .eq("restaurant_id", restaurant.id)
      .ilike("name", normalizedName)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 });
    }

    const { data, error } = await supabase
      .from("menu_categories")
      .insert([{ restaurant_id: restaurant.id, name: normalizedName }])
      .select("id, restaurant_id, name, created_at")
      .single<MenuCategoryRow>();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("POST menu-categories error:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
