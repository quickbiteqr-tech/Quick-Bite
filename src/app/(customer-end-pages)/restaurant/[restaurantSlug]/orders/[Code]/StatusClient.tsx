'use client';

import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import RestaurantLogoCircle from '@/app/(customer-end-pages)/PublicPagesComponents/RestaurantLogoCircle';

type OrderItem = {
  quantity: number;
  price: number;
  menu_item?: string | null;
  menu_items?: { name?: string } | null;
};

type InitialOrder = {
  id: string;
  trackCode: string;
  status: string;
  eta?: number | null;
  createdAt: string;
  totalAmount: number;
  tableNumber?: string | null;
  items?: OrderItem[];
};

type Restaurant = {
  name?: string;
  logoUrl?: string | null;
};

const parseOrderTimestamp = (value?: string | null) => {
  if (!value) return null;

  // Supabase can return timestamps without timezone; treat those as UTC.
  const trimmed = value.trim();
  const hasTimezone = /([zZ]|[+-]\d{2}:\d{2})$/.test(trimmed);
  const normalized = hasTimezone ? trimmed : `${trimmed.replace(' ', 'T')}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatOrderPlacedAt = (value?: string | null) => {
  const parsed = parseOrderTimestamp(value);
  return parsed ? format(parsed, 'PPP, p') : '—';
};

export default function StatusClient({
  initialOrder,
  restaurant,
}: {
  initialOrder: InitialOrder;
  restaurant: Restaurant;
}) {
  const [order, setOrder] = useState<InitialOrder>(initialOrder);

  // Poll the public status endpoint every 6s to reflect real-time changes
  useEffect(() => {
    let mounted = true;
    async function fetchStatus() {
      try {
        const res = await fetch(`/api/public/orders/${order.trackCode}/status`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        const rawEta = data.estimated_time ?? data.etaMinutes ?? data.eta ?? null;
        const rawTableNumber =
          data.table_number ??
          data.tableNumber ??
          (Array.isArray(data.tables)
            ? data.tables[0]?.table_number
            : data.tables?.table_number) ??
          null;
        const parsedEta =
          rawEta === null || rawEta === undefined || rawEta === ''
            ? null
            : Number(rawEta);
        // Expecting { status: 'confirmed', total_amount, estimated_time, created_at, items: [...] }
        setOrder((prev) => ({
          ...prev,
          status: data.status ?? prev.status,
          eta: Number.isFinite(parsedEta) ? parsedEta : prev.eta,
          tableNumber:
            rawTableNumber === null || rawTableNumber === undefined || rawTableNumber === ''
              ? prev.tableNumber
              : String(rawTableNumber),
          createdAt: data.created_at ?? prev.createdAt,
          totalAmount: data.total_amount ?? prev.totalAmount,
          items: data.items ?? prev.items,
        }));
      } catch {
        // ignore polling transient errors
      }
    }

    const interval = setInterval(fetchStatus, 6000);
    // initial fetch
    fetchStatus();

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [order.trackCode]);

  const statusToLabel = (s: string) => {
    if (!s) return 'pending';
    return s.toLowerCase();
  };

  const statusBadge = (s: string) => {
    const lower = statusToLabel(s);
    const base = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold';
    switch (lower) {
      case 'pending':
        return `${base} bg-yellow-100 text-yellow-800`;
      case 'confirmed':
      case 'paid':
      case 'prepaid':
        return `${base} bg-green-100 text-green-800`;
      case 'preparing':
        return `${base} bg-blue-100 text-blue-800`;
      case 'ready':
      case 'served':
      case 'complete':
        return `${base} bg-indigo-100 text-indigo-800`;
      case 'cancelled':
      case 'failed':
        return `${base} bg-red-100 text-red-800`;
      default:
        return `${base} bg-gray-100 text-gray-800`;
    }
  };

  const statusDisplayLabel = (s: string) => {
    const lower = statusToLabel(s);
    if (lower === 'ready' || lower === 'served' || lower === 'complete') return 'Served';
    return s || 'pending';
  };

  return (
    <div className="min-h-screen bg-[#e2e8df] px-3 py-6 sm:px-4 sm:py-8">
      <div className="mx-auto max-w-5xl rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div className="sticky top-0 z-20 rounded-t-3xl border-b border-gray-100 bg-white/90 px-4 py-4 backdrop-blur-md sm:px-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <RestaurantLogoCircle
          logoUrl={restaurant?.logoUrl}
          restaurantName={restaurant?.name}
          className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-xl font-bold text-gray-700"
        />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[#2D3436]">{restaurant?.name ?? 'Restaurant'}</h1>
          <p className="text-sm text-muted-foreground">Live Order Status</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Live
        </span>
      </div>
      </div>
      <div className="p-4 sm:p-6">

      {/* Top info card */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#FF6B00] via-orange-400 to-amber-300" />
        <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          <div>
            <div className="text-sm text-muted-foreground">Tracking Code</div>
            <div className="font-semibold">{order.trackCode}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Table Number</div>
            <div className="font-semibold">
              {order.tableNumber ? `Table #${order.tableNumber}` : 'Not specified'}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Order Placed</div>
            <div className="font-semibold">
              {formatOrderPlacedAt(order.createdAt)}
            </div>
          </div>
          <div className="text-left md:text-right">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="font-bold text-lg">₹{Number(order.totalAmount ?? 0).toFixed(2)}</div>
            <div className="mt-2">
              <span className={`${statusBadge(order.status)} animate-pulse-soft`}>{statusDisplayLabel(order.status)}</span>
            </div>
          </div>
        </div>
        {/* Order items summary */}
        <div className="mt-6">
          <h3 className="text-md font-semibold mb-2">Your Order</h3>
          <div className="divide-y">
            {(order.items ?? []).length === 0 ? (
              <div className="text-sm text-muted-foreground py-3">No items available.</div>
            ) : (
              (order.items ?? []).map((it: OrderItem, idx: number) => {
                const name = it.menu_items?.name ?? (typeof it.menu_item === 'string' ? it.menu_item : 'Item');
                return (
                  <div key={idx} className="flex justify-between items-center py-3">
                    <div className="text-sm text-gray-700">{name} x {it.quantity}</div>
                    <div className="text-sm font-medium">₹{Number(it.price ?? 0).toFixed(2)}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Layout: timeline left / details right (stack on narrow screens) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Timeline */}
        <div>
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="font-semibold mb-4">Order Progress</h3>
            <div className="text-sm text-muted-foreground mb-3 text-right">
              Estimated Time: {order.eta !== null && order.eta !== undefined ? `${order.eta}m` : 'N/A'}
            </div>
            <OrderTimeline currentStatus={order.status ?? 'pending'} />
          </div>
        </div>

        {/* Right column: details & actions (simple for customers) */}
        <div>
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="font-semibold mb-2">Details</h3>
            <dl className="grid grid-cols-1 gap-y-2 text-sm text-muted-foreground">
              <div>
                <dt className="text-xs">Tracking code</dt>
                <dd className="text-gray-700">{order.trackCode}</dd>
              </div>
              <div>
                <dt className="text-xs">Table Number</dt>
                <dd className="text-gray-700">{order.tableNumber ? `Table #${order.tableNumber}` : 'Not specified'}</dd>
              </div>
              <div>
                <dt className="text-xs">Status</dt>
                <dd className="text-gray-700">{order.status}</dd>
              </div>
              <div>
                <dt className="text-xs">Placed</dt>
                <dd className="text-gray-700">{formatOrderPlacedAt(order.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs">Total amount</dt>
                <dd className="text-gray-700">₹{Number(order.totalAmount ?? 0).toFixed(2)}</dd>
              </div>
            </dl>
          </div>

          {/* Optional: small note / contact */}
          <div className="mt-4 rounded-2xl border border-gray-100 bg-[#F9FAFB] p-4 text-sm text-muted-foreground">
            <p>If you have issues with payment or order, please contact the restaurant.</p>
          </div>
        </div>
      </div>
      </div>
      </div>
    </div>
  );
}

/**
 * Simple timeline component — map your order status into a sequence and highlight current.
 */
function OrderTimeline({ currentStatus }: { currentStatus: string }) {
  // canonical progression (lowercase)
  const steps = [
    { key: 'payment_pending', label: 'Order placed' },
    { key: 'pending', label: 'Order received' },
    { key: 'confirmed', label: 'Order confirmed' },
    { key: 'preparing', label: 'Being cooked' },
    { key: 'ready', label: 'Served' },
    // { key: 'complete', label: 'Complete' },
  ];

  // normalize incoming status
  const norm = (s = '') => s.toString().toLowerCase();
  const current = norm(currentStatus);

  // determine index of active step — try to match several mappings
  const statusToIndex = (s: string) => {
    s = norm(s);
    if (s === 'paid' || s === 'prepaid') return 1; // treat as after payment
    if (s === 'payment_pending' || s === 'pending') return 1;
    if (s === 'confirmed') return 2;
    if (s === 'preparing') return 3;
    if (s === 'ready' || s === 'served' || s === 'complete') return 4;
    if (s === 'cancelled' || s === 'failed') return -1;
    return 0;
  };

  const activeIndex = statusToIndex(current);
  const isFinalServedState = current === 'ready' || current === 'served' || current === 'complete';

  return (
    <div className="space-y-4">
      {steps.map((s, i) => {
        const isFinalStep = i === steps.length - 1;
        const isDone =
          (activeIndex > i && activeIndex !== -1) ||
          (isFinalStep && activeIndex === i && isFinalServedState);
        const isActive = activeIndex === i;
        return (
          <div key={s.key} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className={`h-4 w-4 rounded-full flex items-center justify-center ${isDone ? 'bg-green-600 text-white' : isActive ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-500'}`}>
                {isDone ? '✓' : i + 1}
              </div>
              {i !== steps.length - 1 && <div className={`h-full w-px ${isDone ? 'bg-green-300' : 'bg-gray-200'} flex-1 mt-2`} />}
            </div>
            <div>
              <div className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>{s.label}</div>
              <div className="text-sm text-muted-foreground">{isDone ? 'Completed' : isActive ? 'In progress' : 'Pending'}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
