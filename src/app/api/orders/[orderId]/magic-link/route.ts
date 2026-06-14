// app/api/orders/[orderId]/magic-link/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const supabase = await createServerClient();

    // validate order exists
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, track_code, restaurant_id, status, upi_link")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Only allow magic link for payment_pending orders (adjust if needed)
    if (order.status !== "payment_pending") {
      return NextResponse.json({ error: "Magic link can only be generated for payment_pending orders." }, { status: 400 });
    }

    // generate a safe token (url-safe base64)
    const token = crypto.randomBytes(20).toString("base64url"); // node 16.18+ or polyfill
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    const { data: pl, error: insertErr } = await supabase
      .from("payment_links")
      .insert({
        order_id: orderId,
        token,
        expires_at: expiresAt,
      })
      .select("id, token, expires_at")
      .single();

    if (insertErr) {
      console.error("Insert payment_link error:", insertErr);
      return NextResponse.json({ error: "Failed to create magic link." }, { status: 500 });
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000";
    const normalizedBase = base.startsWith("http") ? base : `https://${base}`;
    // public consumption URL
    const magicUrl = `${normalizedBase}/api/magic/${token}`;

    return NextResponse.json({
      success: true,
      magicUrl,
      expiresAt: pl.expires_at,
    });

  } catch (err: unknown) {
    console.error("MagicLink POST error:", err);
    const errorMessage = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
