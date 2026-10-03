'use client';
import React, { useState } from 'react';
import {
  Menu,
  X,
} from 'lucide-react';
import { DashboardNavCards } from '@/components/DashboardNavCards';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-[#6DBE45] selection:text-white">
      <div className="flex min-h-screen">
      {/* Mobile Menu Button */}
      <button
        type="button"
        aria-expanded={sidebarOpen}
        aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm transition-colors hover:border-[#6DBE45]/40 hover:bg-[#6DBE45]/5 hover:text-[#6DBE45]"
      >
        {sidebarOpen ? <X size={22} strokeWidth={2} /> : <Menu size={22} strokeWidth={2} />}
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed top-0 left-0 z-50 h-screen overflow-y-auto overflow-x-hidden
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:z-auto
      `}
      >
        <DashboardNavCards onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <main className="min-w-0 flex-1 overflow-auto p-3 pt-[4.25rem] sm:p-5 sm:pt-6 lg:ml-64 lg:p-8 lg:pt-8">
        <div className="mx-auto max-w-[2000px]">{children}</div>
      </main>
      </div>
    </div>
  );
}