// src/app/api/magic/[token]/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    if (!token) return NextResponse.json({ error: "Missing token." }, { status: 400 });

    const supabase = await createServerClient();

    // Fetch payment link row
    const { data: link, error: linkErr } = await supabase
      .from("payment_links")
      .select("id, token, expires_at, used, order_id")
      .eq("token", token)
      .single();

    if (linkErr || !link) {
      return NextResponse.json({ error: "Invalid or expired link." }, { status: 404 });
    }

    const now = new Date();
    if (link.used) return NextResponse.json({ error: "This link has already been used." }, { status: 410 });
    if (new Date(link.expires_at) < now) return NextResponse.json({ error: "This link has expired." }, { status: 410 });

    // Fetch the order to get track_code and restaurant_id
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, track_code, restaurant_id")
      .eq("id", link.order_id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Fetch restaurant slug
    const { data: restaurant, error: restErr } = await supabase
      .from("restaurants")
      .select("slug")
      .eq("id", order.restaurant_id)
      .single();

    if (restErr || !restaurant) {
      return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
    }

    // Mark link as used (single-use). We do this before redirecting to prevent race.
    const { error: markErr } = await supabase
      .from("payment_links")
      .update({ used: true })
      .eq("id", link.id);

    if (markErr) {
      console.error("Failed to mark payment_link as used:", markErr);
      // proceed — don't fail redirect for minor DB glitch
    }

    // Build checkout URL. Prefer NEXT_PUBLIC_BASE_URL; otherwise derive from request.
    const envBase = process.env.NEXT_PUBLIC_BASE_URL;
    const host = req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "http";
    const base = envBase && envBase !== "***" ? envBase.replace(/\/$/, "") : `${proto}://${host}`;

    const checkoutPath = `/checkout/${order.track_code}?slug=${encodeURIComponent(restaurant.slug)}`;
    const redirectUrl = new URL(checkoutPath, base).toString();

    return NextResponse.redirect(redirectUrl);
  } catch (err: unknown) {
    console.error("Magic link GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
