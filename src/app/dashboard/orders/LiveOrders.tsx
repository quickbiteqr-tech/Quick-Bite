'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import '@/styles/scrollbar.css';
import { supabase } from '@/lib/supabase/client';
import LiveOrdersComponent from '@/components/LiveOrdersComponent';
export type OrderItemStatus = 'Pending' | 'Confirmed' | 'Preparing' | 'Serve' |  'Cancelled';

// MODIFIED: Added is_prepaid to the order object
export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  status: OrderItemStatus | null;
  created_at: string;
  order: {
    id: string;
    track_code: string | null;
    table_id: string | null;
    table_number: string | null;
    is_prepaid: boolean; // ADDED: To track payment method
    restaurant: { id: string; name: string; slug?: string | null; user_id: string };
  };
  menu_item: { id: string; name: string };
}

interface LiveOrdersProps {
  /** When true, hides duplicate title + summary cards (use on full Orders dashboard where stats exist above). */
  embedded?: boolean;
}

const LiveOrders = ({ embedded = false }: LiveOrdersProps) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [liveOrders, setLiveOrders] = useState<OrderItem[]>([]);
  const [restaurantIds, setRestaurantIds] = useState<string[]>([]);
  const [activeStatus, setActiveStatus] = useState<OrderItemStatus | 'All'>('All');
  const [search, setSearch] = useState('');

  // ===== helpers =====
  const dbToUiStatus = (db: string | null): OrderItemStatus | null => {
    switch (db) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'preparing': return 'Preparing';
      case 'ready': return 'Serve';
      case 'cancelled': return 'Cancelled';
      default: return null;
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getTotalPrice = (orders: OrderItem[] | null) =>
    (orders ?? []).reduce(
      (sum, o) => sum + Number(o.price ?? 0) * Number(o.quantity ?? 0),
      0
    );

  // ===== fetch all orders for restaurants owned by the logged-in user =====
  const fetchLiveOrders = useCallback(async () => {
    setRefreshing(true);
    try {
      // 1) current user
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      if (!user) throw new Error('Not authenticated');

      // 2) restaurants owned by this user
      const { data: restaurants, error: restErr } = await supabase
        .from('restaurants')
        .select('id, restaurant_name, user_id')
        .eq('user_id', user.id);

      if (restErr) throw restErr;

      const ids = (restaurants ?? []).map(r => r.id);
      setRestaurantIds(ids);

      if (ids.length === 0) {
        setLiveOrders([]);
        setErrorMsg('⚠️ No restaurants found for your account.');
        return;
      }

      // 3) orders that belong only to those restaurants
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, track_code, status, created_at, is_prepaid,
          table:tables ( id, table_number ),
          restaurant:restaurants ( id, restaurant_name, slug, user_id ),
order_items (
  id, quantity, price,
  menu_item:menu_item_id ( id, name )
)
        `)
        .in('restaurant_id', ids)
        .in('status', ['pending','confirmed','preparing','ready','cancelled'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log("Order data",data);

      // 4) normalize → one card per order item
      const normalized: OrderItem[] = (data || []).flatMap((order: unknown) => {
        if (typeof order !== 'object' || order === null) return [];
        const orderObj = order as Record<string, unknown>;
        return ((orderObj.order_items as unknown[]) || []).flatMap((item: unknown) => {
          if (typeof item !== 'object' || item === null) return [];
          const itemObj = item as Record<string, unknown>;
          const normalizedItem: OrderItem = {
            id: itemObj.id as string,
            quantity: itemObj.quantity as number,
            price: itemObj.price as number,
            status: dbToUiStatus(orderObj.status as string),
            created_at: orderObj.created_at as string,
            order: {
              id: orderObj.id as string,
              track_code: orderObj.track_code as string | null,
              table_id: orderObj.table ? String((orderObj.table as Record<string, unknown>).id) : null,
              table_number: (orderObj.table as Record<string, unknown>)?.table_number as string | null ?? null,
              is_prepaid: orderObj.is_prepaid as boolean,
              restaurant: {
                id: (orderObj.restaurant as Record<string, unknown>)?.id as string ?? '',
                name: (orderObj.restaurant as Record<string, unknown>)?.restaurant_name as string ?? '',
                slug: (orderObj.restaurant as Record<string, unknown>)?.slug as string ?? null,
                user_id: (orderObj.restaurant as Record<string, unknown>)?.user_id as string ?? '',
              },
            },
            menu_item: {
              id: (itemObj.menu_item as Record<string, unknown>)?.id as string ?? '',
              name: (itemObj.menu_item as Record<string, unknown>)?.name as string ?? '',
            },
          };
          return [normalizedItem];
        });
      });

      setLiveOrders(normalized);
      setErrorMsg(null);
    } catch (e: unknown) {
      console.error('[LiveOrders.fetch]', e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to load orders';
      setErrorMsg(errorMessage);
      setLiveOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // initial load
  useEffect(() => { fetchLiveOrders(); }, [fetchLiveOrders]);

  // realtime: refresh when any order changes for the owner's restaurants
  useEffect(() => {
    if (!restaurantIds.length) return;

    const channels = restaurantIds.map((rid) =>
      supabase
        .channel(`orders-${rid}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${rid}` },
          () => fetchLiveOrders()
        )
        .subscribe()
    );

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [restaurantIds, fetchLiveOrders]);

  // status + search filter
  const filteredOrders = useMemo(() => {
    let orders = [...liveOrders];

    if (activeStatus !== 'All') {
      orders = orders.filter((o) => o.status === activeStatus);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      orders = orders.filter((o) =>
        (o.order.track_code || '').toLowerCase().includes(q) ||
        (o.order.table_number || '').toLowerCase().includes(q) ||
        (o.menu_item.name || '').toLowerCase().includes(q) ||
        (o.order.restaurant.name || '').toLowerCase().includes(q) ||
        (o.status || '').toLowerCase().includes(q)
      );
    }
    return orders;
  }, [liveOrders, activeStatus, search]);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-100 bg-white">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-[#6DBE45]"
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div className={embedded ? 'min-h-[280px] h-full min-h-0 pb-2' : 'min-h-[50vh] pb-4'}>
      <LiveOrdersComponent
        liveOrders={liveOrders}
        filteredOrders={filteredOrders}
        refreshing={refreshing}
        fetchLiveOrders={fetchLiveOrders}
        activeStatus={activeStatus}
        setActiveStatus={setActiveStatus}
        formatDate={formatDate}
        getTotalPrice={(orders) => getTotalPrice(orders)}
        errorMsg={errorMsg}
        search={search}
        onSearchChange={setSearch}
        embedded={embedded}
      />
    </div>
  );
};

export default LiveOrders;