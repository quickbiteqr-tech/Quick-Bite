'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  IndianRupee,
  ShoppingBag,
  Scale,
  CalendarDays,
  RefreshCw,
  PieChart,
} from 'lucide-react';
import OrdersChart, { RevenueChart } from '@/components/charts/OrdersChart';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const formatInr = (n: number, fractionDigits = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(n);

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready',
    complete: 'Complete',
    served: 'Served',
    cancelled: 'Cancelled',
    unknown: 'Unknown',
  };
  return map[status] ?? status.replace(/_/g, ' ');
}

function statusStyles(status: string) {
  const s = status.toLowerCase();
  if (s === 'cancelled') return 'border-rose-100 bg-rose-50/90 text-rose-800';
  if (s === 'complete' || s === 'served')
    return 'border-[#6DBE45]/25 bg-[#6DBE45]/10 text-[#2f6a24]';
  if (s === 'ready') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (s === 'preparing') return 'border-slate-200 bg-slate-100 text-slate-800';
  if (s === 'confirmed') return 'border-[#6DBE45]/30 bg-[#6DBE45]/8 text-[#3d8a2e]';
  if (s === 'pending') return 'border-amber-200 bg-amber-50 text-amber-900';
  return 'border-slate-200 bg-white text-slate-700';
}

function isRevenueEligibleStatus(status: string | null | undefined) {
  const s = (status || '').toLowerCase();
  return s !== 'cancelled' && s !== 'failed';
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    todayRevenue: 0,
    todayOrders: 0,
    ordersByStatus: {} as Record<string, number>,
    ordersChartData: [] as { name: string; orders: number }[],
    revenueChartData: [] as { name: string; revenue: number }[],
  });

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Not authenticated');
      }

      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (restaurantError || !restaurant) {
        throw new Error('Restaurant not found');
      }

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, status, total_amount, created_at')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        throw ordersError;
      }

      const revenueEligibleOrders = (orders || []).filter((order) => isRevenueEligibleStatus(order.status));
      const totalRevenue =
        revenueEligibleOrders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const averageOrderValue = revenueEligibleOrders.length > 0 ? totalRevenue / revenueEligibleOrders.length : 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrdersArray =
        orders?.filter((order) => {
          const orderDate = new Date(order.created_at);
          return orderDate >= today;
        }) || [];
      const todayOrders = todayOrdersArray.length;
      const todayRevenue = todayOrdersArray
        .filter((order) => isRevenueEligibleStatus(order.status))
        .reduce(
        (sum, order) => sum + (Number(order.total_amount) || 0),
        0
      );

      const ordersByStatus: Record<string, number> = {};
      orders?.forEach((order) => {
        const status = order.status || 'unknown';
        ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
      });

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        date.setHours(0, 0, 0, 0);
        return date;
      });

      const ordersChartData = last7Days.map((date) => {
        const dayOrders =
          orders?.filter((order) => {
            const orderDate = new Date(order.created_at);
            orderDate.setHours(0, 0, 0, 0);
            return orderDate.getTime() === date.getTime();
          }) || [];
        return {
          name: date.toLocaleDateString('en-US', { weekday: 'short' }),
          orders: dayOrders.length,
        };
      });

      const revenueChartData = last7Days.map((date) => {
        const dayOrders =
          orders?.filter((order) => {
            const orderDate = new Date(order.created_at);
            orderDate.setHours(0, 0, 0, 0);
            return orderDate.getTime() === date.getTime();
          }) || [];
        const revenue = dayOrders
          .filter((order) => isRevenueEligibleStatus(order.status))
          .reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
        return {
          name: date.toLocaleDateString('en-US', { weekday: 'short' }),
          revenue,
        };
      });

      setAnalytics({
        totalRevenue,
        totalOrders,
        averageOrderValue,
        todayRevenue,
        todayOrders,
        ordersByStatus,
        ordersChartData,
        revenueChartData,
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const statCardClass =
    'h-full rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:border-[#6DBE45]/25 hover:shadow-md';

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center font-sans text-slate-800">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-[#6DBE45]"
          aria-hidden
        />
        <p className="mt-4 text-sm text-slate-500">Loading analytics…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 font-sans text-slate-800">
        <Card className="w-full max-w-md rounded-2xl border border-red-100 bg-white shadow-sm">
          <CardContent className="space-y-4 p-6 text-center">
            <p className="text-sm text-red-700">{error}</p>
            <Button
              type="button"
              onClick={fetchAnalytics}
              className="rounded-xl bg-[#6DBE45] text-white hover:bg-[#5aa337]"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const kpiItems = [
    {
      label: 'Total revenue',
      sub: 'All time',
      value: formatInr(analytics.totalRevenue),
      icon: IndianRupee,
      iconClass: 'bg-[#6DBE45]/12 text-[#5aa337]',
    },
    {
      label: 'Total orders',
      sub: 'Lifetime count',
      value: String(analytics.totalOrders),
      icon: ShoppingBag,
      iconClass: 'bg-slate-100 text-slate-600',
    },
    {
      label: 'Avg order value',
      sub: 'Per order',
      value: formatInr(analytics.averageOrderValue, 2),
      icon: Scale,
      iconClass: 'bg-[#6DBE45]/10 text-[#3d8a2e]',
    },
    {
      label: 'Today',
      sub: `${analytics.todayOrders} order${analytics.todayOrders === 1 ? '' : 's'} · today`,
      value: formatInr(analytics.todayRevenue),
      icon: CalendarDays,
      iconClass: 'bg-amber-50 text-amber-700',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-2rem)] font-sans text-slate-800 selection:bg-[#6DBE45] selection:text-white">
      <div className="mx-auto max-w-7xl">
        <div className="relative mb-5 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#6DBE45]/12 via-white to-slate-50/80"
            aria-hidden
          />
          <div className="relative flex flex-col gap-3 px-5 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:py-7">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#6DBE45]">
                Analytics
              </p>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Performance overview
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
                Revenue, volume, and order mix—last 7 days on the charts below.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchAnalytics}
              className="shrink-0 rounded-xl border-[#6DBE45]/40 text-[#3d8a2e] hover:bg-[#6DBE45]/10"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {kpiItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
            >
              <Card className={statCardClass}>
                <CardContent className="flex items-start gap-3 p-4 sm:p-5">
                  <div
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                      item.iconClass
                    )}
                  >
                    <item.icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-500">{item.label}</p>
                    <p className="mt-1 break-words text-lg font-bold tabular-nums text-slate-900 sm:text-xl">
                      {item.value}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-slate-400 sm:text-xs">{item.sub}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="flex items-center gap-2 font-serif text-lg text-slate-900">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6DBE45]/12 text-[#5aa337]">
                    <BarChart3 className="h-4 w-4" strokeWidth={2} />
                  </span>
                  Orders over time
                </CardTitle>
                <CardDescription>Last 7 days · count per day</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <OrdersChart data={analytics.ordersChartData} />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="flex items-center gap-2 font-serif text-lg text-slate-900">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6DBE45]/12 text-[#5aa337]">
                    <TrendingUp className="h-4 w-4" strokeWidth={2} />
                  </span>
                  Revenue over time
                </CardTitle>
                <CardDescription>Last 7 days · INR per day</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <RevenueChart data={analytics.revenueChartData} />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="flex items-center gap-2 font-serif text-lg text-slate-900">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <PieChart className="h-4 w-4" strokeWidth={2} />
                </span>
                Orders by status
              </CardTitle>
              <CardDescription>How your orders are distributed in the dataset</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {Object.keys(analytics.ordersByStatus).length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-[#6DBE45]/25 bg-[#6DBE45]/10 px-4 py-12 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-[#6DBE45]/20 bg-white shadow-sm">
                    <PieChart className="h-6 w-6 text-[#6DBE45]/70" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">No status data yet</p>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-slate-600 sm:text-sm">
                    When orders come in, you&apos;ll see counts for each status here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-3">
                  {Object.entries(analytics.ordersByStatus).map(([status, count]) => (
                    <div
                      key={status}
                      className={cn(
                        'rounded-xl border px-3 py-3 text-center transition-colors',
                        statusStyles(status)
                      )}
                    >
                      <p className="text-xl font-bold tabular-nums sm:text-2xl">{count}</p>
                      <p className="mt-1 text-xs font-medium capitalize text-slate-600">
                        {statusLabel(status)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
