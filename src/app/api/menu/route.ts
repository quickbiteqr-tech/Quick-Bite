// src/app/api/menu/route.ts

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createServerClient();
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

  // 1. Insert Menu Item
  const { data: menuItem, error: menuError } = await supabase
    .from("menu_items")
    .insert([
      {
        restaurant_id: restaurant.id,
        name: body.name,
        description: body.description,
        price: body.price || 0,
        category: normalizedCategory,
        available: body.available ?? true,
        photo_url: body.photo_url ?? null,
        is_veg: body.dietary_tags?.includes('veg') ?? (body.is_veg ?? true), // Backwards compat
        dietary_tags: body.dietary_tags || [],
      },
    ])
    .select()
    .single();

  if (menuError || !menuItem) {
    return NextResponse.json({ error: menuError?.message || "Failed to create menu item" }, { status: 400 });
  }

  try {
    // 2. Insert Variants (if any)
    if (body.variants && body.variants.length > 0) {
      const variantPayload = body.variants.map((v: any, index: number) => ({
        menu_item_id: menuItem.id,
        label: v.label,
        price: parseFloat(v.price) || 0,
        sort_order: index,
      }));
      
      const { error: variantError } = await supabase
        .from("menu_item_variants")
        .insert(variantPayload);
        
      if (variantError) throw new Error("Failed to insert variants: " + variantError.message);
    }

    // 3. Insert Modifier Groups & Options (if any)
    if (body.modifier_groups && body.modifier_groups.length > 0) {
      for (let i = 0; i < body.modifier_groups.length; i++) {
        const group = body.modifier_groups[i];
        const { data: groupData, error: groupError } = await supabase
          .from("modifier_groups")
          .insert({
            menu_item_id: menuItem.id,
            name: group.name,
            min_selection: group.min_selection || 0,
            max_selection: group.max_selection || 1,
            is_required: group.is_required || false,
            sort_order: i,
          })
          .select()
          .single();

        if (groupError) throw new Error("Failed to insert modifier group: " + groupError.message);

        if (group.options && group.options.length > 0) {
          const optionsPayload = group.options.map((opt: any, optIndex: number) => ({
            modifier_group_id: groupData.id,
            name: opt.name,
            price: parseFloat(opt.price) || 0,
            sort_order: optIndex,
          }));

          const { error: optionsError } = await supabase
            .from("modifier_options")
            .insert(optionsPayload);

          if (optionsError) throw new Error("Failed to insert modifier options: " + optionsError.message);
        }
      }
    }
  } catch (err: any) {
    // Rollback the menu item if anything failed
    await supabase.from("menu_items").delete().eq("id", menuItem.id);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // Fetch the complete inserted item
  const { data: finalItem } = await supabase
    .from("menu_items")
    .select(`
      *,
      variants:menu_item_variants(*),
      modifier_groups:modifier_groups(
        *,
        options:modifier_options(*)
      )
    `)
    .eq("id", menuItem.id)
    .single();

  return NextResponse.json(finalItem || menuItem, { status: 201 });
}