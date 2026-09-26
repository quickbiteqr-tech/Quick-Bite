import React from 'react';
import BillingDashboard from './BillingDashboard';

export default function BillingPage() {
  return (
    <div className="min-h-[calc(100vh-2rem)] font-sans text-slate-800 selection:bg-[#6DBE45] selection:text-white">
      <div className="mx-auto max-w-7xl">
        <div className="relative mb-5 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#6DBE45]/12 via-white to-slate-50/80"
            aria-hidden
          />
          <div className="relative px-5 py-6 sm:px-8 sm:py-7">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#6DBE45]">Billing</p>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Active Tables & Bills
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
              Manage unpaid sessions and settle bills across all active tables.
            </p>
          </div>
        </div>

        <BillingDashboard />
      </div>
    </div>
  );
}
