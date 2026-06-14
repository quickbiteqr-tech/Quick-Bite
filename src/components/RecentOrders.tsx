'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import StatusBadge from './orders/StatusBadge';
import type { CustomerOrderStatus } from './orders/OrderStatusTimeline';

type Order = {
  id: string;
  track_code: string;
  created_at: string;
  status: CustomerOrderStatus;
};

export default function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Fetch latest orders
    const fetchOrders = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('id, track_code, created_at, status')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data && mounted) {
        setOrders(data as Order[]);
      }
      setLoading(false);
    };

    fetchOrders();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('realtime-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>

      {loading ? (
        <p className="text-gray-500 text-sm animate-pulse">Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500 text-sm">No recent orders yet.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {orders.map((order) => (
            <li
              key={order.id}
              className="py-3 flex justify-between items-center"
            >
              <span className="text-sm text-gray-600">
                #{order.track_code} – {formatDate(order.created_at)}
              </span>
              <StatusBadge status={order.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
