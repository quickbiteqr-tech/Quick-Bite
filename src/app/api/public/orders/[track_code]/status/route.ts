// src/app/api/public/orders/[track_code]/status/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: Request, { params }: { params: Promise<{ track_code: string }> }) {
  try {
    const { track_code: code } = await params;

    if (!code) return NextResponse.json({ error: "Tracking code missing" }, { status: 400 });

    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, total_amount, estimated_time, created_at, table_id, tables ( table_number )')
      .eq('track_code', code)
      .single();

    if (error || !data) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('quantity, price, menu_item, menu_items ( name )')
      .eq('order_id', data.id);

    if (itemsError) {
      console.error("Status API Items Error:", itemsError);
    }

    return NextResponse.json({
      status: data.status,
      total_amount: data.total_amount,
      estimated_time: data.estimated_time,
      created_at: data.created_at,
      table_number:
        (Array.isArray(data.tables)
          ? data.tables[0]?.table_number
          : (data.tables as { table_number?: string | number } | null)?.table_number) ??
        data.table_id ??
        null,
      items: items ?? [],
    });
  } catch (err: unknown) {
    console.error("Status API Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
