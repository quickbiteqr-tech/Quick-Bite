import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

function parseCategoryId(rawId: string): number | null {
  const parsed = Number(rawId);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

async function getOwnerRestaurantId() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, restaurantId: null as string | null, error: "Unauthorized", status: 401 };
  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (error || !restaurant) {
    return { supabase, restaurantId: null as string | null, error: "Restaurant not found for user", status: 404 };
  }
  return { supabase, restaurantId: restaurant.id as string, error: null as string | null, status: 200 };
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const categoryId = parseCategoryId(id);
  if (!categoryId) return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });

  const { supabase, restaurantId, error, status } = await getOwnerRestaurantId();
  if (error || !restaurantId) return NextResponse.json({ error }, { status });

  const body = await req.json();
  const name = String(body?.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Category name is required" }, { status: 400 });
  const normalizedName = name.toLowerCase();

  const { data: previous } = await supabase
    .from("menu_categories")
    .select("name")
    .eq("id", categoryId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  if (!previous) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  const { data: existingSameName } = await supabase
    .from("menu_categories")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .ilike("name", normalizedName)
    .neq("id", categoryId)
    .maybeSingle();
  if (existingSameName) {
    return NextResponse.json({ error: "Category already exists" }, { status: 409 });
  }

  const { data, error: updateError } = await supabase
    .from("menu_categories")
    .update({ name: normalizedName })
    .eq("id", categoryId)
    .eq("restaurant_id", restaurantId)
    .select("id, restaurant_id, name, created_at")
    .single();

  let updatedCategory = data;

  // Fallback path: some DB setups allow insert/delete but block update on menu_categories.
  if (updateError) {
    const { data: inserted, error: insertError } = await supabase
      .from("menu_categories")
      .insert([{ restaurant_id: restaurantId, name: normalizedName }])
      .select("id, restaurant_id, name, created_at")
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: `Failed to rename category: ${updateError.message}` },
        { status: 400 }
      );
    }

    const { error: moveError } = await supabase
      .from("menu_items")
      .update({ category: normalizedName })
      .eq("restaurant_id", restaurantId)
      .ilike("category", previous.name);

    if (moveError) {
      return NextResponse.json({ error: moveError.message }, { status: 400 });
    }

    const { error: deleteOldError } = await supabase
      .from("menu_categories")
      .delete()
      .eq("id", categoryId)
      .eq("restaurant_id", restaurantId);

    if (deleteOldError) {
      return NextResponse.json({ error: deleteOldError.message }, { status: 400 });
    }

    updatedCategory = inserted;
  }

  // keep menu items aligned with renamed category
  if (previous?.name && previous.name.toLowerCase() !== normalizedName) {
    await supabase
      .from("menu_items")
      .update({ category: normalizedName })
      .eq("restaurant_id", restaurantId)
      .ilike("category", previous.name);
  }

  return NextResponse.json(updatedCategory);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const categoryId = parseCategoryId(id);
  if (!categoryId) return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });

  const { supabase, restaurantId, error, status } = await getOwnerRestaurantId();
  if (error || !restaurantId) return NextResponse.json({ error }, { status });

  const { data: category } = await supabase
    .from("menu_categories")
    .select("name")
    .eq("id", categoryId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  const { error: recategorizeError } = await supabase
    .from("menu_items")
    .update({ category: "mains" })
    .eq("restaurant_id", restaurantId)
    .eq("category", category.name.toLowerCase());

  if (recategorizeError) {
    return NextResponse.json({ error: recategorizeError.message }, { status: 400 });
  }

  const { error: deleteError } = await supabase
    .from("menu_categories")
    .delete()
    .eq("id", categoryId)
    .eq("restaurant_id", restaurantId);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
