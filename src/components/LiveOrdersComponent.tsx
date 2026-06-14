'use client';

import React from 'react';
import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Clock, ChefHat, CheckCircle, XCircle, Utensils, Package, CreditCard, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { OrderItem, OrderItemStatus } from '@/app/dashboard/orders/LiveOrders';
import { setOrderStatus } from '@/lib/api/orders';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';

interface LiveOrdersComponentProps {
  fetchLiveOrders: () => Promise<void>;
  refreshing: boolean;
  liveOrders: OrderItem[] | null;
  filteredOrders: OrderItem[] | null;
  activeStatus: OrderItemStatus | 'All';
  setActiveStatus: (status: OrderItemStatus | 'All') => void;
  formatDate: (dateString: string) => string;
  getTotalPrice: (orders: OrderItem[] | null) => number;
  errorMsg?: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  /** Slimmer chrome when nested under Orders dashboard (stats live above). */
  embedded?: boolean;
}

const ETA_PRESETS = [5, 10, 15, 20, 25, 30];

type GroupedLiveOrder = {
  orderId: string;
  status: OrderItemStatus | null;
  createdAt: string;
  order: OrderItem['order'];
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    lineTotal: number;
  }>;
  totalAmount: number;
};

const LiveOrdersComponent: React.FC<LiveOrdersComponentProps> = ({
  fetchLiveOrders,
  refreshing,
  liveOrders,
  filteredOrders,
  activeStatus,
  setActiveStatus,
  formatDate,
  getTotalPrice,
  errorMsg,
  search,
  onSearchChange,
  embedded = false,
}) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [etaChoice, setEtaChoice] = useState<Record<string, number>>({});

  const groupOrdersById = (orders: OrderItem[] | null): GroupedLiveOrder[] => {
    const grouped = new Map<string, GroupedLiveOrder>();
    for (const entry of orders ?? []) {
      const orderId = entry.order.id;
      const lineTotal = Number(entry.price ?? 0) * Number(entry.quantity ?? 0);
      if (!grouped.has(orderId)) {
        grouped.set(orderId, {
          orderId,
          status: entry.status,
          createdAt: entry.created_at,
          order: entry.order,
          items: [],
          totalAmount: 0,
        });
      }
      const current = grouped.get(orderId);
      if (!current) continue;
      current.items.push({
        id: entry.id,
        name: entry.menu_item?.name ?? 'Unknown item',
        quantity: Number(entry.quantity ?? 0),
        price: Number(entry.price ?? 0),
        lineTotal,
      });
      current.totalAmount += lineTotal;
    }
    return Array.from(grouped.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  const groupedLiveOrders = groupOrdersById(liveOrders);
  const groupedFilteredOrders = groupOrdersById(filteredOrders);
  const nonCancelledGroupedOrders = groupedLiveOrders.filter((o) => o.status !== 'Cancelled');
  const nonCancelledLiveOrders = (liveOrders ?? []).filter((o) => o.status !== 'Cancelled');

  const handleUpdate = async (orderId: string, status: OrderItemStatus, eta?: number | null) => {
    try {
      setUpdatingId(orderId);
      await setOrderStatus(orderId, status, eta ?? null);
      await fetchLiveOrders();
    } catch (e: unknown) {
      console.error('[update status]', e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to update status';
      alert(errorMessage);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusIcon = (status: OrderItemStatus | null) => {
    switch (status) {
      case 'Pending': return <Clock className="h-4 w-4" />;
      case 'Confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'Preparing': return <ChefHat className="h-4 w-4" />;
      case 'Serve': return <CheckCircle className="h-4 w-4" />;
      case 'Cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: OrderItemStatus | null) => {
    switch (status) {
      case 'Cancelled': return 'destructive';
      case 'Confirmed':
      case 'Preparing':
      case 'Serve': return 'default';
      case 'Pending':
      default: return 'secondary';
    }
  };

  return (
    <div className={cn('w-full', embedded && 'flex h-full min-h-0 flex-col overflow-hidden')}>
      {/* Toolbar: search + refresh (always); title block when not embedded */}
      <div
        className={cn(
          'mb-4 flex flex-col gap-3 sm:mb-5',
          embedded ? 'sm:flex-row sm:items-center' : 'sm:flex-row sm:items-end sm:justify-between'
        )}
      >
        {!embedded && (
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#6DBE45]/25 bg-[#6DBE45]/10">
              <Image src="/clock.png" alt="" width={22} height={22} className="h-5 w-5 opacity-90" />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Live orders</h1>
              <p className="text-xs text-slate-500 sm:text-sm">Real-time updates from your floor</p>
            </div>
          </div>
        )}
        <div
          className={cn(
            'flex w-full flex-col gap-2 sm:flex-row sm:items-center',
            embedded ? 'sm:flex-1' : 'sm:max-w-xl sm:justify-end'
          )}
        >
          <div className="min-w-0 flex-1">
            <label htmlFor="live-orders-search" className="sr-only">
              Search orders
            </label>
            <Input
              id="live-orders-search"
              placeholder="Search track, table, item…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-10 rounded-xl border-slate-200 bg-white text-sm shadow-sm focus-visible:border-[#6DBE45] focus-visible:ring-[#6DBE45]/20"
            />
          </div>
          <Button
            type="button"
            onClick={fetchLiveOrders}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="h-10 shrink-0 rounded-xl border-[#6DBE45]/40 bg-white text-[#6DBE45] hover:bg-[#6DBE45] hover:text-white sm:px-4"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? '…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Something went wrong</p>
            <p className="mt-0.5 opacity-90">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Summary — hidden when embedded (dashboard shows OrderStatsCards above) */}
      {!embedded && (
      <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 lg:grid-cols-3 lg:gap-4">
        <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold text-slate-500 sm:text-sm">
              <div className="rounded-lg bg-slate-100 p-1.5">
                <Package className="h-3.5 w-3.5 text-slate-600 sm:h-4 sm:w-4" />
              </div>
              <span className="truncate">Total orders</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold text-slate-900 sm:text-2xl">
              {nonCancelledGroupedOrders.length}
            </div>
            <p className="mt-1 text-xs text-slate-500">In view</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold text-slate-500 sm:text-sm">
              <div className="rounded-lg bg-amber-50 p-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-600 sm:h-4 sm:w-4" />
              </div>
              <span className="truncate">Pending</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold text-amber-600 sm:text-2xl">
              {groupedLiveOrders.filter((o) => o.status === 'Pending').length}
            </div>
            <p className="mt-1 text-xs text-slate-500">Awaiting action</p>
          </CardContent>
        </Card>

        <Card className="col-span-2 rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md lg:col-span-1">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold text-slate-500 sm:text-sm">
              <div className="rounded-lg bg-[#6DBE45]/15 p-1.5">
                <CreditCard className="h-3.5 w-3.5 text-[#5aa337] sm:h-4 sm:w-4" />
              </div>
              <span className="truncate">Total value</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold text-[#6DBE45] sm:text-2xl">
              ₹{getTotalPrice(nonCancelledLiveOrders).toFixed(2)}
            </div>
            <p className="mt-1 text-xs text-slate-500">Listed orders</p>
          </CardContent>
        </Card>
      </div>
      )}

      <Tabs
        value={activeStatus}
        onValueChange={(v) => setActiveStatus(v as OrderItemStatus | 'All')}
        className={cn(
          'z-40 -mx-1 mb-1 flex w-[calc(100%+0.5rem)] flex-col rounded-xl border border-slate-100 bg-white/95 p-1.5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80',
          !embedded && 'sticky top-0'
        )}
      >
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0 shadow-none sm:justify-center">
          <TabsTrigger
            value="All"
            className="min-h-9 flex-1 rounded-lg px-3 py-2 text-xs font-semibold data-[state=active]:bg-[#6DBE45] data-[state=active]:text-white data-[state=inactive]:text-slate-600 sm:min-w-[88px] sm:flex-none sm:text-sm"
          >
            All
          </TabsTrigger>
          <TabsTrigger
            value="Pending"
            className="min-h-9 flex-1 rounded-lg px-2 py-2 text-xs font-semibold data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=inactive]:text-slate-600 sm:min-w-[100px] sm:flex-none sm:gap-1.5 sm:text-sm"
          >
            <Clock className="hidden h-3.5 w-3.5 sm:inline" />
            Pending
          </TabsTrigger>
          <TabsTrigger
            value="Confirmed"
            className="min-h-9 flex-1 rounded-lg px-2 py-2 text-xs font-semibold data-[state=active]:bg-[#6DBE45] data-[state=active]:text-white data-[state=inactive]:text-slate-600 sm:min-w-[110px] sm:flex-none sm:gap-1.5 sm:text-sm"
          >
            <CheckCircle className="hidden h-3.5 w-3.5 sm:inline" />
            Confirmed
          </TabsTrigger>
          <TabsTrigger
            value="Preparing"
            className="min-h-9 flex-1 rounded-lg px-2 py-2 text-xs font-semibold data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=inactive]:text-slate-600 sm:min-w-[110px] sm:flex-none sm:gap-1.5 sm:text-sm"
          >
            <ChefHat className="hidden h-3.5 w-3.5 sm:inline" />
            Preparing
          </TabsTrigger>
          <TabsTrigger
            value="Serve"
            className="min-h-9 flex-1 rounded-lg px-2 py-2 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=inactive]:text-slate-600 sm:min-w-[96px] sm:flex-none sm:gap-1.5 sm:text-sm"
          >
            <Package className="hidden h-3.5 w-3.5 sm:inline" />
            Serve
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div
        className={cn(
          'mt-4',
          embedded && 'min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1',
          !embedded && 'max-h-[calc(100vh-20rem)] overflow-y-auto overscroll-contain pr-1'
        )}
      >
          {groupedFilteredOrders.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
               {groupedFilteredOrders.map((order) => {
                const isUpdating = updatingId === order.orderId;
                const eta = etaChoice[order.orderId] ?? 15;
                const restaurantSlug =
                  order.order.restaurant.slug ||
                  order.order.restaurant.name.toLowerCase().replace(/\s+/g, '-');
                return (
                  <Card key={order.orderId} className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
                    <div
                      className={cn(
                        'absolute left-0 top-0 h-1 w-full rounded-t-2xl',
                        order.status === 'Pending'
                          ? 'bg-amber-400'
                          : order.status === 'Confirmed'
                            ? 'bg-[#6DBE45]'
                            : order.status === 'Preparing'
                              ? 'bg-slate-600'
                              : order.status === 'Serve'
                                ? 'bg-emerald-500'
                                : 'bg-red-500'
                      )}
                    />
                    
                    <CardHeader className="pb-1.5 p-2 relative z-10">
                      <div className="flex flex-col gap-1.5">
                        {/* Order ID and Status Row */}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="outline" className="font-mono text-xs bg-gray-100 border-gray-300 text-gray-700 px-1.5 py-0.5">
                              #{order.orderId.slice(-6)}
                            </Badge>
                            <Link
                              href={`/restaurant/${restaurantSlug}/orders/${order.order.track_code}`}
                              className="flex items-center gap-0.5 text-xs font-semibold text-[#6DBE45] transition-colors hover:text-[#5aa337] hover:underline"
                              target="_blank"
                            >
                              <span className="hidden sm:inline">Order</span> #{order.order.track_code}
                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                              </svg>
                            </Link>
                            {order.order.table_number && (
                              <Badge variant="outline" className="border-[#6DBE45]/25 bg-[#6DBE45]/10 px-1.5 py-0.5 text-xs text-[#3d8a2e]">
                                <span className="hidden sm:inline">Table </span>#{order.order.table_number}
                              </Badge>
                            )}
                          </div>
                          <Badge 
                            variant={getStatusVariant(order.status)} 
                            className={cn(
                              "px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-semibold flex-shrink-0 rounded-full shadow-sm hover:shadow-md transition-all duration-300 w-fit",
                              order.status === 'Pending' && 'bg-yellow-50 text-yellow-700 border border-yellow-200',
                              order.status === 'Confirmed' &&
                                'border border-[#6DBE45]/30 bg-[#6DBE45]/10 text-[#2f6a24]',
                              order.status === 'Preparing' && 'border border-slate-200 bg-slate-50 text-slate-800',
                              order.status === 'Serve' && 'bg-teal-50 text-teal-700 border border-teal-200',
                              order.status === 'Cancelled' && 'bg-red-100 text-red-800 border border-red-200',
                              "group-hover:scale-105"
                            )}
                          >
                            <span className="flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              {order.status}
                            </span>
                          </Badge>
                        </div>
                        
                        {/* Restaurant and Payment Info Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 text-xs text-gray-600">
                          <span className="flex items-center gap-1 font-medium">
                            <Utensils className="h-3 w-3" />
                            {order.order.restaurant.name}
                          </span>
                          <span className="hidden sm:block w-0.5 h-0.5 bg-gray-400 rounded-full"></span>
                          <span className="font-mono text-xs">{formatDate(order.createdAt)}</span>
                          <span className="hidden sm:block w-0.5 h-0.5 bg-gray-400 rounded-full"></span>
                          <span className="inline-flex w-fit items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-700">
                            Pay on table
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <Separator className="my-1" />
                    
                    <CardContent className="pt-2 pb-2 p-2">
                      <div className="flex flex-col gap-2">
                        <div className="space-y-1.5">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 rounded-lg border border-slate-100 bg-slate-50/70 px-2 py-1.5">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                                <p className="text-xs text-slate-600">
                                  Qty: {item.quantity} x ₹{item.price.toFixed(2)}
                                </p>
                              </div>
                              <p className="text-sm font-semibold text-slate-800">
                                ₹{item.lineTotal.toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                            <p className="text-lg font-bold text-slate-900 sm:text-xl">
                              ₹{order.totalAmount.toFixed(2)}
                            </p>
                            <p className="mt-0.5 text-xs font-medium text-slate-500">Order total</p>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Order Actions */}
                      <div className="mt-2 border-t border-slate-100 pt-2">
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap items-stretch sm:items-center">
                          {/* Row 1: Confirm and ETA Select */}
                          <div className="grid grid-cols-2 gap-1.5 sm:contents">
                            <Button
                              size="sm"
                              variant={order.status === 'Pending' ? 'default' : 'outline'}
                              className={cn(
                                "h-8 sm:h-7 text-xs font-semibold transition-colors rounded-md sm:flex-none",
                                order.status === 'Pending'
                                  ? 'border-0 bg-[#6DBE45] text-white hover:bg-[#5aa337]'
                                  : 'border border-[#6DBE45]/30 bg-[#6DBE45]/10 text-[#3d8a2e] hover:bg-[#6DBE45]/15 disabled:border-[#6DBE45] disabled:bg-[#6DBE45] disabled:text-white'
                              )}
                              disabled={isUpdating || order.status !== 'Pending'}
                              onClick={() => handleUpdate(order.orderId, 'Confirmed')}
                            >
                              {isUpdating && order.status === 'Pending' ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                  <span className="text-xs">Updating...</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1.5">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Confirm Order</span>
                                  <span className="sm:hidden">Confirm</span>
                                </div>
                              )}
                            </Button>
                            <select
                              className={cn(
                                "h-8 sm:h-7 rounded-md border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-gray-900 transition-colors sm:flex-none",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary",
                                "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-500",
                                "hover:border-slate-400"
                              )}
                              value={eta}
                              onChange={(e) => setEtaChoice((prev) => ({ ...prev, [order.orderId]: Number(e.target.value) }))}
                              disabled={isUpdating || (order.status !== 'Pending' && order.status !== 'Confirmed')}
                            >
                              {ETA_PRESETS.map((m) => (
                                <option key={m} value={m} className="text-sm">
                                  {m} min{m > 1 ? 's' : ''}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Row 2: Preparing and Serve */}
                          <div className="grid grid-cols-2 gap-1.5 sm:contents">
                            <Button
                              size="sm"
                              variant={order.status === 'Preparing' ? 'default' : 'outline'}
                              className={cn(
                                "h-8 sm:h-7 text-xs font-semibold transition-colors rounded-md sm:flex-none",
                                order.status === 'Preparing'
                                  ? 'border-0 bg-slate-700 text-white hover:bg-slate-800'
                                  : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:border-slate-700 disabled:bg-slate-700 disabled:text-white'
                              )}
                              disabled={isUpdating || (order.status !== 'Pending' && order.status !== 'Confirmed')}
                              onClick={() => handleUpdate(order.orderId, 'Preparing', eta)}
                            >
                              {isUpdating && order.status === 'Confirmed' ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                  <span className="text-xs">Updating...</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1.5">
                                  <ChefHat className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Start Preparing ({eta}m)</span>
                                  <span className="sm:hidden">Preparing</span>
                                </div>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant={order.status === 'Serve' ? 'default' : 'outline'}
                              className={cn(
                                "h-8 sm:h-7 text-xs font-semibold transition-colors rounded-md sm:flex-none",
                                order.status === 'Serve' 
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white border-0" 
                                  : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 disabled:bg-emerald-700 disabled:text-white disabled:border-emerald-700"
                              )}
                              disabled={isUpdating || order.status !== 'Preparing'}
                              onClick={() => handleUpdate(order.orderId, 'Serve')}
                            >
                              {isUpdating ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                  <span className="text-xs">Updating...</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1.5">
                                  <Package className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Mark as Served</span>
                                  <span className="sm:hidden">Serve</span>
                                </div>
                              )}
                            </Button>
                          </div>

                          {/* Row 3: Cancel (full width on mobile) */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 sm:h-7 text-xs font-semibold bg-rose-50 hover:bg-rose-100 border-rose-200 hover:border-rose-300 text-rose-700 transition-colors rounded-md sm:flex-none sm:ml-auto disabled:bg-rose-700 disabled:text-white disabled:border-rose-700 w-full sm:w-auto"
                            disabled={isUpdating || order.status === 'Serve' || order.status === 'Cancelled'}
                            onClick={() => {
                              if (confirm('Are you sure you want to cancel this order?')) {
                                handleUpdate(order.orderId, 'Cancelled');
                              }
                            }}
                          >
                            {order.status === 'Cancelled' ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <XCircle className="h-3.5 w-3.5" />
                                Cancelled
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5">
                                <XCircle className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Cancel Order</span>
                                <span className="sm:hidden">Cancel Order</span>
                              </div>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-slate-100 bg-slate-50/80 px-3 py-2">
                       <div className="flex items-center justify-between w-full">
                         <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5">
                           <div className="flex items-center gap-1">
                             <Clock className="h-2.5 w-2.5 text-gray-500" />
                             <p className="text-xs text-gray-600 font-medium">
                               Last updated: {new Date().toLocaleTimeString()}
                             </p>
                           </div>
                           <div className="w-0.5 h-0.5 bg-gray-300 rounded-full"></div>
                            <div className="flex items-center gap-0.5">
                              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#6DBE45]"></div>
                              <span className="text-xs font-semibold text-[#6DBE45]">Live</span>
                              <div className="sm:hidden flex items-center gap-0.5 ml-2">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                <span className="text-xs text-gray-500 font-medium">#{order.orderId.slice(-4)}</span>
                              </div>
                            </div>
                         </div>
                         <div className="hidden sm:flex items-center gap-1.5">
                           <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                           <span className="text-xs text-gray-500 font-medium">#{order.orderId.slice(-4)}</span>
                         </div>
                       </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-[#6DBE45]/25 bg-[#6DBE45]/10 px-6 py-16 text-center sm:py-20">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-[#6DBE45]/20 bg-white shadow-sm">
                <Clock className="h-10 w-10 text-[#6DBE45]/70" />
              </div>
              <h3 className="font-serif text-xl font-bold text-slate-900 sm:text-2xl">No orders found</h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
                {activeStatus === 'All'
                  ? 'No active orders right now. New orders will show up here as they come in.'
                  : `No orders with status “${activeStatus}”.`}
              </p>
              {activeStatus !== 'All' && (
                <Button
                  variant="outline"
                  className="mt-8 rounded-xl border-[#6DBE45]/40 bg-white text-[#6DBE45] hover:bg-[#6DBE45] hover:text-white"
                  onClick={() => setActiveStatus('All')}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  View all orders
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
  );
};

export default LiveOrdersComponent;