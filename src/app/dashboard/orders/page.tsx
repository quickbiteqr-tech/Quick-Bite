import React from 'react';
import LiveOrders from './LiveOrders';
import OrderHistory from './OrderHistory';
import OrderStatsCards from '@/components/OrderStatsCards';

export default function Orders() {
  return (
    <div className="min-h-[calc(100vh-2rem)] font-sans text-slate-800 selection:bg-[#6DBE45] selection:text-white">
      <div className="mx-auto max-w-7xl">
        {/* Page hero — matches menu / tables */}
        <div className="relative mb-5 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#6DBE45]/12 via-white to-slate-50/80"
            aria-hidden
          />
          <div className="relative px-5 py-6 sm:px-8 sm:py-7">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#6DBE45]">Orders</p>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Orders dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
              Live queue on the left, history on the right—scroll each panel independently on large screens.
            </p>
          </div>
        </div>

        <OrderStatsCards />

        {/* Two columns: stack on mobile; equal height feel */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6 lg:items-start">
          <section
            id="live-orders-section"
            aria-labelledby="live-orders-title"
            className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
          >
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
              <div>
                <h2 id="live-orders-title" className="text-sm font-semibold text-slate-900">
                  Live queue
                </h2>
                <p className="text-xs text-slate-500">Confirm, prep, and serve</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#6DBE45]/25 bg-[#6DBE45]/10 px-2.5 py-1 text-xs font-semibold text-[#3d8a2e]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#6DBE45] opacity-40" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#6DBE45]" />
                </span>
                Live
              </span>
            </header>
            <div className="h-[min(78vh,900px)] min-h-[280px] min-w-0 min-h-0 px-3 py-4 sm:px-4">
              <LiveOrders embedded />
            </div>
          </section>

          <section
            id="order-history-section"
            aria-labelledby="order-history-title"
            className="flex min-h-0 flex-col rounded-2xl border border-slate-100 bg-white shadow-sm"
          >
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
              <div>
                <h2 id="order-history-title" className="text-sm font-semibold text-slate-900">
                  History
                </h2>
                <p className="text-xs text-slate-500">Completed &amp; past orders</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                Archive
              </span>
            </header>
            <div className="max-h-[min(78vh,900px)] min-h-[280px] overflow-y-auto px-3 py-4 sm:px-4">
              <OrderHistory />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
