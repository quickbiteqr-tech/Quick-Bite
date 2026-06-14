// src/app/dashboard/orderhistory/page.tsx

import React from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Tag, CircleDollarSign, AlertCircle, History, CheckCircle, XCircle, ChefHat, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the type for our orders directly in this file
type HistoricalOrder = {
  id: string;
  track_code: string;
  created_at: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'complete' | 'cancelled';
  total_amount: number;
};

// Helper functions can be defined at the top level
const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'complete': return 'default';
        case 'cancelled': return 'destructive';
        default: return 'secondary';
    }
};

// This is an async Server Component
export default async function OrderHistoryPage() {
  const supabase = await createServerClient();

  // 1. Get the authenticated user (server-side)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login'); // Redirect if not logged in
  }

  // 2. Find the user's restaurant
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (restaurantError || !restaurant) {
    return (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg m-4">
            <AlertCircle className="inline-block mr-2" />
            Error: Could not find a restaurant associated with your account.
        </div>
    );
  }

  // 3. Fetch all orders
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, status, total_amount, created_at, track_code")
    .eq("restaurant_id", restaurant.id)
    .order("created_at", { ascending: false });

  if (ordersError) {
     return (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg m-4">
            <AlertCircle className="inline-block mr-2" />
            Error: {ordersError.message}
        </div>
    );
  }
  
  return (
    <div className="w-full">
      {orders && orders.length > 0 ? (
        <div className="space-y-2">
          {(orders as HistoricalOrder[]).map((order, index) => {
            const statusKey = order.status ?? 'unknown';
            return (
            <Card key={order.id} className="group relative overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md" style={{ animationDelay: `${index * 50}ms` }}>
              <div
                className={cn(
                  'absolute left-0 top-0 h-1 w-full',
                  order.status === 'pending' && 'bg-amber-400',
                  order.status === 'confirmed' && 'bg-[#6DBE45]',
                  order.status === 'preparing' && 'bg-slate-500',
                  order.status === 'ready' && 'bg-emerald-500',
                  order.status === 'complete' && 'bg-[#6DBE45]',
                  order.status === 'cancelled' && 'bg-red-500'
                )}
              />
              
              <CardContent className="p-2 sm:p-3 relative z-10">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2 sm:mb-3">
                  <div className="space-y-1.5 sm:space-y-2 w-full">
                    <div className="flex items-start sm:items-center gap-2 sm:gap-2.5">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 group-hover:from-emerald-100 group-hover:to-emerald-200 transition-all duration-300 flex-shrink-0">
                        <Tag className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-700 group-hover:text-emerald-600 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-sans text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors block truncate tracking-tight">
                          {order.track_code}
                        </span>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 tracking-wide font-sans">Order ID</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full whitespace-nowrap">
                        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                        <span className="truncate font-medium text-xs">{formatTime(order.created_at)}</span>
                      </span>
                      <span className="hidden sm:inline-block w-0.5 h-0.5 bg-slate-400 rounded-full"></span>
                      <span className="font-sans text-slate-600 bg-slate-50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs whitespace-nowrap font-medium">
                        {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <Badge 
                    variant={getStatusVariant(order.status)} 
                    className={cn(
                      "px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-semibold rounded-full shadow-sm hover:shadow-md transition-all duration-300 group-hover:scale-105 whitespace-nowrap tracking-wide",
                      // distinct colors per status (UI-only)
                      order.status === 'confirmed' && 'bg-blue-50 border border-blue-100 text-blue-700 hover:border-blue-200',
                      order.status === 'preparing' && 'bg-purple-50 border border-purple-100 text-purple-700 hover:border-purple-200',
                      order.status === 'ready' && 'bg-emerald-50 border border-emerald-100 text-emerald-700 hover:border-emerald-200',
                      order.status === 'cancelled' && 'bg-rose-50 border border-rose-100 text-rose-700 hover:border-rose-200',
                      order.status === 'complete' && 'bg-emerald-50 border border-emerald-100 text-emerald-700 hover:border-emerald-200',
                      ['pending'].includes(order.status) && 'bg-slate-50 border border-slate-100 text-slate-700 hover:border-slate-200'
                    )}
                  >
                    <span className="flex items-center gap-1">
                      {order.status === 'confirmed' && (
                        <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                      )}
                      {order.status === 'preparing' && (
                        <ChefHat className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                      )}
                      {order.status === 'ready' && (
                        <Package className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                      )}
                      {order.status === 'cancelled' && (
                        <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                      )}
                      {order.status === 'complete' && (
                        <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                      )}
                      {order.status === 'pending' && (
                        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                      )}
                      <span className="hidden sm:inline">{order.status}</span>
                      <span className="sm:hidden">{order.status}</span>
                    </span>
                  </Badge>
                </div>
                
                <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-600 tracking-wide font-sans">Total Amount</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-medium tracking-wide font-sans">Paid via Card</span>
                  </div>
                  <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-2 sm:p-2.5 rounded-lg border border-slate-200 w-full sm:w-auto">
                    <div className="flex items-center justify-between sm:justify-end gap-2">
                      <div className="p-1 sm:p-1.5 rounded-md bg-gradient-to-br from-emerald-50 to-emerald-100 group-hover:from-emerald-100 group-hover:to-emerald-200 transition-colors flex-shrink-0 border border-emerald-100">
                        <CircleDollarSign className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-600" />
                      </div>
                      <div className="text-right">
                        <span className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors font-display tracking-tight">
                          ₹{Number(order.total_amount ?? 0).toFixed(2)}
                        </span>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium tracking-wide font-sans">Final amount</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="bg-gradient-to-r from-slate-50 to-slate-100 py-1.5 sm:py-2 px-3 sm:px-4 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-1.5">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <div className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5 text-slate-500 flex-shrink-0" />
                      <p className="text-xs text-slate-600 font-medium truncate">
                        {new Date(order.created_at).toLocaleDateString('en-US', { 
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="hidden sm:block w-0.5 h-0.5 bg-slate-300 rounded-full"></div>
                    <div className={cn("flex items-center gap-0.5", 
                      order.status === 'confirmed' && 'text-blue-700',
                      order.status === 'preparing' && 'text-purple-700',
                      order.status === 'ready' && 'text-emerald-700',
                      order.status === 'cancelled' && 'text-rose-700',
                      order.status === 'complete' && 'text-emerald-700',
                      ['pending'].includes(order.status) && 'text-slate-700'
                    )}>
                      <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0',
                        order.status === 'confirmed' && 'bg-blue-500',
                        order.status === 'preparing' && 'bg-purple-500',
                        order.status === 'ready' && 'bg-emerald-500',
                        order.status === 'cancelled' && 'bg-rose-500',
                        order.status === 'complete' && 'bg-emerald-500',
                        ['pending'].includes(order.status) && 'bg-slate-400'
                      )}></div>
                      <span className="text-xs font-semibold whitespace-nowrap">
                        {order.status === 'complete'
                          ? 'Completed'
                          : statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full flex-shrink-0"></div>
                    <span className="text-xs text-slate-500 font-medium">#{order.id.slice(-4)}</span>
                  </div>
                </div>
              </CardFooter>
            </Card>
          );
          })}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-[#6DBE45]/25 bg-[#6DBE45]/10 px-4 py-10 text-center sm:py-12">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#6DBE45]/20 bg-white shadow-sm">
            <History className="h-6 w-6 text-[#6DBE45]/70" />
          </div>
          <p className="text-sm font-semibold text-slate-900">No history yet</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-600 sm:text-sm">
            Completed orders will show up here.
          </p>
        </div>
      )}
    </div>
  );
};

