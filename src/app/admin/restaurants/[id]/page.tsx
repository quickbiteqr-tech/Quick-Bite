'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  ChevronLeft,
  Store,
  Mail,
  User,
  ShieldBan,
  ShieldCheck,
  Loader2,
  ReceiptText,
} from 'lucide-react';
import Link from 'next/link';
import type { AdminRestaurant, RestaurantStatus } from '@/components/admin/types';

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export default function RestaurantMonitoringPage() {
  const { id } = useParams();
  const router = useRouter();

  const [restaurant, setRestaurant] = useState<AdminRestaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    async function fetchData() {
      try {
        // 1. Fetch restaurant
        const { data: restData, error: restError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', id)
          .single();

        if (restError) throw restError;
        
        let fetchedRestaurant = restData as AdminRestaurant;

        // 2. Fetch secure email
        if (fetchedRestaurant.user_id) {
          try {
            const res = await fetch('/api/admin/fetch-emails', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userIds: [fetchedRestaurant.user_id] }),
            });
            if (res.ok) {
              const { emails } = await res.json();
              if (emails[fetchedRestaurant.user_id]) {
                fetchedRestaurant.email = emails[fetchedRestaurant.user_id];
              }
            }
          } catch (e) {
            console.error('Error fetching email', e);
          }
        }

        setRestaurant(fetchedRestaurant);

        // 3. Fetch orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('id, total_amount, status, created_at')
          .eq('restaurant_id', id)
          .order('created_at', { ascending: false })
          .limit(50);

        // Ignore orders error if table doesn't perfectly match yet
        if (!ordersError && ordersData) {
          setOrders(ordersData as Order[]);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        toast.error('Failed to load restaurant details.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  const toggleStatus = async () => {
    if (!restaurant) return;
    
    const newStatus: RestaurantStatus = restaurant.status === 'active' ? 'blacklisted' : 'active';
    const verb = newStatus === 'blacklisted' ? 'blacklist' : 'reactivate';

    if (!confirm(`Are you sure you want to ${verb} "${restaurant.restaurant_name}"?`)) return;

    setToggling(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ status: newStatus })
        .eq('id', restaurant.id);

      if (error) throw error;

      setRestaurant({ ...restaurant, status: newStatus });
      toast.success(
        `"${restaurant.restaurant_name}" is now ${newStatus === 'active' ? 'active' : 'blacklisted'}.`
      );
    } catch (err) {
      console.error('Toggle error:', err);
      toast.error(`Failed to ${verb} restaurant.`);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-slate-800">Restaurant not found</h2>
        <button onClick={() => router.back()} className="mt-4 text-emerald-600 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* ── Header ── */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/restaurants"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {restaurant.restaurant_name}
          </h1>
          <p className="text-sm text-slate-500 flex items-center gap-2">
            Monitoring Dashboard
            {restaurant.status === 'active' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                Blacklisted
              </span>
            )}
          </p>
        </div>
        <div className="ml-auto">
          <button
            onClick={toggleStatus}
            disabled={toggling}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-70 ${
              restaurant.status === 'active'
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {toggling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : restaurant.status === 'active' ? (
              <ShieldBan className="h-4 w-4" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {restaurant.status === 'active' ? 'Blacklist Restaurant' : 'Reactivate Restaurant'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column: Details ── */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-slate-900 uppercase tracking-wider">Restaurant Details</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Store className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Name</p>
                  <p className="text-sm font-medium text-slate-900">{restaurant.restaurant_name}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Owner</p>
                  <p className="text-sm font-medium text-slate-900">{restaurant.owner_name || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500">Email</p>
                  <p className="text-sm font-medium text-slate-900 truncate" title={restaurant.email || 'Not available'}>
                    {restaurant.email || 'Not available'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Orders Feed ── */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
            <div className="border-b border-slate-100 bg-slate-50/50 p-5 flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recent Orders feed</h2>
              <span className="ml-auto rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                {orders.length}
              </span>
            </div>

            <div className="flex-1 overflow-auto p-0">
              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-slate-500">
                  <ReceiptText className="h-10 w-10 text-slate-300 mb-3" />
                  <p className="text-sm font-medium">No recent orders found.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-white z-10 shadow-sm">
                    <tr className="border-b border-slate-100">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Order ID</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Amount</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-slate-600">
                          {order.id.slice(0, 8)}...
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-900">
                          ${Number(order.total_amount || 0).toFixed(2)}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                            order.status === 'completed' || order.status === 'delivered'
                              ? 'bg-emerald-50 text-emerald-700'
                              : order.status === 'cancelled'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {order.status || 'Pending'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-xs text-slate-500">
                          {new Date(order.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
