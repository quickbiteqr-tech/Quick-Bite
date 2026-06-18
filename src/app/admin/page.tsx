'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { LayoutDashboard, BookOpen, Store, TrendingUp, Users, Package } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalRestaurants: number;
  activeRestaurants: number;
  blacklistedRestaurants: number;
  totalMenuItems: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRestaurants: 0,
    activeRestaurants: 0,
    blacklistedRestaurants: 0,
    totalMenuItems: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch restaurant counts
        const { count: totalRestaurants } = await supabase
          .from('restaurants')
          .select('*', { count: 'exact', head: true });

        const { count: activeRestaurants } = await supabase
          .from('restaurants')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        const { count: blacklistedRestaurants } = await supabase
          .from('restaurants')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'blacklisted');

        // Fetch menu library count
        const { count: totalMenuItems } = await supabase
          .from('global_menu_library')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalRestaurants: totalRestaurants ?? 0,
          activeRestaurants: activeRestaurants ?? 0,
          blacklistedRestaurants: blacklistedRestaurants ?? 0,
          totalMenuItems: totalMenuItems ?? 0,
        });
      } catch (err) {
        console.error('Error fetching admin stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    {
      label: 'Total Restaurants',
      value: stats.totalRestaurants,
      icon: Store,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'Active',
      value: stats.activeRestaurants,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      label: 'Blacklisted',
      value: stats.blacklistedRestaurants,
      icon: Users,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-100',
    },
    {
      label: 'Menu Library Items',
      value: stats.totalMenuItems,
      icon: Package,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
  ];

  const quickLinks = [
    { href: '/admin/menu-library', label: 'Menu Library', description: 'Upload and manage global dishes', icon: BookOpen },
    { href: '/admin/restaurants', label: 'Restaurants', description: 'View and manage all restaurants', icon: Store },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-emerald-600">
          <LayoutDashboard className="h-4 w-4" />
          Admin Dashboard
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Here&apos;s an overview of your QuickBite platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border ${card.border} bg-white p-5 shadow-sm transition-shadow hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">{card.label}</p>
                {loading ? (
                  <div className="mt-1 h-8 w-16 animate-pulse rounded bg-slate-100" />
                ) : (
                  <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                    {card.value.toLocaleString()}
                  </p>
                )}
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Quick actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                <link.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{link.label}</p>
                <p className="text-xs text-slate-500">{link.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
