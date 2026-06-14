// src/app/api/profile/route.ts

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base || `restaurant-${Date.now()}`;
}

// GET restaurant profile for current user
export async function GET() {
  const supabase = await createServerClient(); // FIXED: Removed await

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: "Profile not found for this user." }, { status: 404 });
  }

  return NextResponse.json(data);
}

// PUT update restaurant profile
export async function PUT(req: Request) {
  const supabase = await createServerClient(); // FIXED: Removed await
  const body = await req.json();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowedKeys = [
    "restaurant_name",
    "phone",
    "address",
    "logo_url",
    "banner_url",
    "description",
    "tagline",
    "venue_type",
    "cuisine",
    "maps_url",
    "whatsapp",
    "opening_time",
    "closing_time",
  ] as const;

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      updates[key] = body[key];
    }
  }

  const { data: existingRestaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  let data = null;
  let error = null;

  if (existingRestaurant?.id) {
    const updateResult = await supabase
      .from("restaurants")
      .update(updates)
      .eq("user_id", user.id)
      .select()
      .single();
    data = updateResult.data;
    error = updateResult.error;
  } else {
    const nameFromBody =
      typeof updates.restaurant_name === "string" && updates.restaurant_name.trim().length > 0
        ? updates.restaurant_name.trim()
        : `Restaurant ${user.email?.split("@")[0] ?? "Owner"}`;

    const metaOwner =
      (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
      (typeof user.user_metadata?.owner_name === "string" && user.user_metadata.owner_name.trim()) ||
      "";
    const ownerName = metaOwner || user.email?.split("@")[0] || "Owner";
    const accountEmail = user.email?.trim() || "noreply@placeholder.local";
    const phoneFromUpdates =
      typeof updates.phone === "string" ? updates.phone.trim() : "";
    const addressFromUpdates =
      typeof updates.address === "string" ? updates.address.trim() : "";

    const insertPayload = {
      user_id: user.id,
      restaurant_name: nameFromBody,
      slug: slugify(nameFromBody),
      owner_name: ownerName,
      email: accountEmail,
      phone: phoneFromUpdates || "—",
      address: addressFromUpdates || "—",
      ...updates,
    };

    const insertResult = await supabase
      .from("restaurants")
      .insert([insertPayload])
      .select()
      .single();
    data = insertResult.data;
    error = insertResult.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}