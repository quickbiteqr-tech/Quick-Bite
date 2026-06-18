'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { AdminRestaurant, RestaurantStatus } from '@/components/admin/types';
import {
  Store,
  Search,
  Loader2,
  ShieldBan,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
} from 'lucide-react';
import Link from 'next/link';

const PAGE_SIZE = 15;

export default function RestaurantsPage() {
  // ─── State ───
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | RestaurantStatus>('');
  const [page, setPage] = useState(1);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ─── Fetch ───
  const fetchRestaurants = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const restaurantsData = (data as AdminRestaurant[]) ?? [];

      // Fetch emails securely
      if (restaurantsData.length > 0) {
        const userIds = [...new Set(restaurantsData.map((r) => r.user_id).filter(Boolean))];
        try {
          const res = await fetch('/api/admin/fetch-emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userIds }),
          });
          if (res.ok) {
            const { emails } = await res.json();
            restaurantsData.forEach((r) => {
              if (r.user_id && emails[r.user_id]) {
                r.email = emails[r.user_id];
              }
            });
          }
        } catch (emailErr) {
          console.error('Error fetching emails:', emailErr);
        }
      }

      setRestaurants(restaurantsData);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to load restaurants.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  // ─── Filtered & Paginated ───
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return restaurants.filter((r) => {
      const matchesSearch =
        !q ||
        r.restaurant_name.toLowerCase().includes(q) ||
        (r.owner_name?.toLowerCase().includes(q) ?? false) ||
        (r.email?.toLowerCase().includes(q) ?? false);
      const matchesStatus = !statusFilter || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [restaurants, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  // ─── Toggle Status ───
  const toggleStatus = async (restaurant: AdminRestaurant) => {
    const newStatus: RestaurantStatus = restaurant.status === 'active' ? 'blacklisted' : 'active';
    const verb = newStatus === 'blacklisted' ? 'blacklist' : 'reactivate';

    if (!confirm(`Are you sure you want to ${verb} "${restaurant.restaurant_name}"?`)) return;

    setTogglingId(restaurant.id);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ status: newStatus })
        .eq('id', restaurant.id);

      if (error) throw error;

      setRestaurants((prev) =>
        prev.map((r) => (r.id === restaurant.id ? { ...r, status: newStatus } : r))
      );
      toast.success(
        `"${restaurant.restaurant_name}" is now ${newStatus === 'active' ? 'active' : 'blacklisted'}.`
      );
    } catch (err) {
      console.error('Toggle error:', err);
      toast.error(`Failed to ${verb} restaurant.`);
    } finally {
      setTogglingId(null);
    }
  };

  // ─── Stats ───
  const activeCount = restaurants.filter((r) => r.status === 'active').length;
  const blacklistedCount = restaurants.filter((r) => r.status === 'blacklisted').length;

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-emerald-600">
          <Store className="h-4 w-4" />
          Restaurants
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Restaurant Management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          View, search, and manage all restaurants on the platform.
        </p>
      </div>

      {/* ── Quick Stats ── */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold tabular-nums text-slate-900">{restaurants.length}</p>
          <p className="text-xs text-slate-500">Total</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold tabular-nums text-emerald-700">{activeCount}</p>
          <p className="text-xs text-emerald-600">Active</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold tabular-nums text-red-700">{blacklistedCount}</p>
          <p className="text-xs text-red-600">Blacklisted</p>
        </div>
      </div>

      {/* ── Search & Filter ── */}
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, owner, or email…"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as '' | RestaurantStatus)}
          className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="blacklisted">Blacklisted</option>
        </select>
        <span className="shrink-0 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{filtered.length}</span> results
        </span>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center rounded-xl border border-slate-200 bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <Store className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">
            {restaurants.length === 0 ? 'No restaurants yet' : 'No matching restaurants'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {restaurants.length === 0
              ? 'Restaurants will appear here once users sign up.'
              : 'Try a different search or filter.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Restaurant</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Owner</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Email</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {r.logo_url ? (
                          <img src={r.logo_url} alt="" className="h-8 w-8 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-400">
                            {r.restaurant_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900">{r.restaurant_name}</p>
                          {r.slug && (
                            <p className="text-[11px] text-slate-400">/{r.slug}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.owner_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{r.email || '—'}</td>
                    <td className="px-4 py-3">
                      {r.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          Blacklisted
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {r.slug && (
                          <a
                            href={`/${r.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                            title="View public page"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <Link
                          href={`/admin/restaurants/${r.id}`}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                          title="View details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleStatus(r)}
                          disabled={togglingId === r.id}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                            r.status === 'active'
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {togglingId === r.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : r.status === 'active' ? (
                            <ShieldBan className="h-3.5 w-3.5" />
                          ) : (
                            <ShieldCheck className="h-3.5 w-3.5" />
                          )}
                          {r.status === 'active' ? 'Blacklist' : 'Reactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="divide-y divide-slate-100 lg:hidden">
            {paginated.map((r) => (
              <div key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {r.logo_url ? (
                      <img src={r.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-400">
                        {r.restaurant_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{r.restaurant_name}</p>
                      <p className="text-xs text-slate-500">{r.owner_name || 'No owner'}</p>
                    </div>
                  </div>
                  {r.status === 'active' ? (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  ) : (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      Blacklisted
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] text-slate-400">
                      Joined {new Date(r.created_at).toLocaleDateString()}
                    </p>
                    <Link
                      href={`/admin/restaurants/${r.id}`}
                      className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      View details
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleStatus(r)}
                    disabled={togglingId === r.id}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                      r.status === 'active'
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {togglingId === r.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : r.status === 'active' ? (
                      <ShieldBan className="h-3.5 w-3.5" />
                    ) : (
                      <ShieldCheck className="h-3.5 w-3.5" />
                    )}
                    {r.status === 'active' ? 'Blacklist' : 'Reactivate'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
              <p className="text-xs text-slate-500">
                Page <span className="font-semibold text-slate-700">{safePage}</span> of{' '}
                <span className="font-semibold text-slate-700">{totalPages}</span>
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
