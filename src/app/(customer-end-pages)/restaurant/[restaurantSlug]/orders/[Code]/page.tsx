// src/app/customer-end-pages/[restaurantSlug]/orders/[code]/page.tsx
import { createServerClient } from '@/lib/supabase/server';
import StatusClient from './StatusClient';
import { notFound } from 'next/navigation';

type PageProps = {
  params: Promise<{ restaurantSlug: string; Code: string }>;
};

export default async function OrderTrackPage({ params }: PageProps) {
  const { restaurantSlug, Code: orderCode } = await params;

  if (!restaurantSlug || !orderCode) return notFound();

  const supabase = await createServerClient();

  // Fetch order by track_code with table information
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      id, track_code, status, total_amount, estimated_time, created_at, restaurant_id,
      tables!inner ( id, table_number )
    `)
    .eq('track_code', orderCode)
    .single();

  if (orderError || !order) {
    console.error(`OrderTrackPage: Could not find order with code "${orderCode}"`, orderError);
    return notFound();
  }

  // Fetch restaurant and validate slug
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('restaurant_name, slug, logo_url')
    .eq('id', order.restaurant_id)
    .single();

  if (restaurantError || !restaurant) {
    console.error('OrderTrackPage: restaurant not found', restaurantError);
    return <div className="p-8 text-center text-red-600">Error: Could not find restaurant information for this order.</div>;
  }

  if (restaurant.slug !== restaurantSlug) return notFound();

  // Fetch order items (optional display)
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('quantity, price, menu_item, menu_items ( name )')
    .eq('order_id', order.id);

  if (itemsError) console.error('Error fetching order items:', itemsError);

  return (
    <StatusClient
      initialOrder={{
        id: order.id,
        trackCode: order.track_code,
        status: order.status,
        eta: order.estimated_time,
        createdAt: order.created_at,
        totalAmount: order.total_amount,
        tableNumber:
          (Array.isArray(order.tables)
            ? order.tables[0]?.table_number
            : (order.tables as { table_number?: string | number } | null)?.table_number) != null
            ? String(
                Array.isArray(order.tables)
                  ? order.tables[0]?.table_number
                  : (order.tables as { table_number?: string | number } | null)?.table_number
              )
            : null,
        items: (orderItems ?? []) as unknown as { quantity: number; price: number; menu_item: string; menu_items: { name: string } | null }[],
      }}
      restaurant={{
        name: restaurant.restaurant_name,
        logoUrl: restaurant.logo_url,
      }}
    />
  );
}
