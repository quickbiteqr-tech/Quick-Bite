'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Clock, History, IndianRupee } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';

interface OrderStats {
  activeOrders: number;
  completedOrders: number;
  todayRevenue: number;
  todayOrders: number;
}

const OrderStatsCards: React.FC = () => {
  const [stats, setStats] = useState<OrderStats>({
    activeOrders: 0,
    completedOrders: 0,
    todayRevenue: 0,
    todayOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        setLoading(false);
        return;
      }

      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (restaurantError || !restaurant) {
        setLoading(false);
        return;
      }

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, status, total_amount, created_at')
        .eq('restaurant_id', restaurant.id);

      if (ordersError) {
        setLoading(false);
        return;
      }

      const activeStatuses = ['pending', 'confirmed', 'preparing', 'ready'];
      const activeOrders =
        orders?.filter((order) => activeStatuses.includes(order.status || '')).length || 0;

      const completedOrders =
        orders?.filter((order) => order.status === 'complete' || order.status === 'served').length || 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders =
        orders?.filter((order) => {
          const orderDate = new Date(order.created_at);
          return orderDate >= today && order.status !== 'cancelled';
        }) || [];

      const todayOrdersCount = todayOrders.length;
      const todayRevenue = todayOrders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);

      setStats({
        activeOrders,
        completedOrders,
        todayRevenue,
        todayOrders: todayOrdersCount,
      });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statCardClass =
    'cursor-pointer rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:border-[#6DBE45]/30 hover:shadow-md';

  return (
    <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
      <Card
        className={statCardClass}
        onClick={() => {
          document.getElementById('live-orders-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
      >
        <CardContent className="flex items-center gap-3 p-4 sm:p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#6DBE45]/12 text-[#5aa337]">
            <Clock className="h-6 w-6" strokeWidth={2} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500">Active</p>
            {loading ? (
              <div className="mt-1 h-7 w-12 animate-pulse rounded bg-slate-100" />
            ) : (
              <p className="text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">{stats.activeOrders}</p>
            )}
            <p className="truncate text-[10px] text-slate-400 sm:text-xs">In progress</p>
          </div>
        </CardContent>
      </Card>

      <Card
        className={statCardClass}
        onClick={() => {
          document.getElementById('order-history-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
      >
        <CardContent className="flex items-center gap-3 p-4 sm:p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <History className="h-6 w-6" strokeWidth={2} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500">Completed</p>
            {loading ? (
              <div className="mt-1 h-7 w-12 animate-pulse rounded bg-slate-100" />
            ) : (
              <p className="text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">{stats.completedOrders}</p>
            )}
            <p className="truncate text-[10px] text-slate-400 sm:text-xs">All time</p>
          </div>
        </CardContent>
      </Card>

      <Card
        className={`${statCardClass} col-span-2 lg:col-span-1`}
        onClick={() => {
          window.location.href = '/dashboard/analytics';
        }}
      >
        <CardContent className="flex items-center gap-3 p-4 sm:p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#6DBE45]/12 text-[#5aa337]">
            <IndianRupee className="h-6 w-6" strokeWidth={2} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500">Today</p>
            {loading ? (
              <div className="mt-1 h-7 w-20 animate-pulse rounded bg-slate-100" />
            ) : (
              <>
                <p className="text-lg font-bold text-[#6DBE45] sm:text-xl">{formatCurrency(stats.todayRevenue)}</p>
                <p className="text-[10px] text-slate-400 sm:text-xs">{stats.todayOrders} orders · tap analytics</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderStatsCards;
