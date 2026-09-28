"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { setOrderStatus } from '@/lib/api/orders';
import { useGlobalClock } from '@/hooks/useGlobalClock';
import { Loader2, Clock, CheckCircle2, ChefHat, Utensils, UtensilsCrossed, AlertCircle, Check } from 'lucide-react';
import { toast } from 'sonner';

// --- Types ---
type OrderItemStatus = 'Pending' | 'Confirmed' | 'Preparing' | 'Serve' | 'Cancelled';

const dbToUiStatus = (db: string | null): OrderItemStatus | null => {
  switch (db) {
    case 'pending': return 'Pending';
    case 'confirmed': return 'Confirmed';
    case 'preparing': return 'Preparing';
    case 'ready': return 'Serve';
    case 'cancelled': return 'Cancelled';
    default: return null;
  }
};

interface QueueOrder {
  orderId: string;
  status: OrderItemStatus;
  trackCode: string | null;
  tableNumber: string | null;
  createdAt: string;
  estimatedTime: number | null;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    variantLabel: string | null;
    modifiers: any[] | null;
  }>;
}

// --- ManagerOrderCard Component ---
const ManagerOrderCard = ({ order, onUpdate, now }: { order: QueueOrder, onUpdate: () => void, now: number }) => {
  const [updating, setUpdating] = useState(false);
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  const handleUpdate = async (status: string, eta?: number) => {
    setUpdating(true);
    try {
      if (status === 'CLEAR') {
        setHidden(true);
        return;
      }
      await setOrderStatus(order.orderId, status as any, eta || null);
      onUpdate(); 
    } catch (e) {
      toast.error('Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  // --- Math Logic ---
  const createdAtMs = new Date(order.createdAt).getTime();
  const minutesWaiting = Math.floor((now - createdAtMs) / 60000);

  let minutesRemaining: number | null = null;
  if (order.status === 'Preparing' && order.estimatedTime) {
    minutesRemaining = order.estimatedTime - minutesWaiting;
  }

  // --- Dynamic Traffic Light Styling ---
  let cardBg = "bg-white";
  let cardBorder = "border border-slate-200/60";
  let timerText = "text-slate-500 font-semibold";
  let timerIcon = <Clock className="w-3.5 h-3.5" />;
  let timerDisplay = `Waiting ${Math.max(0, minutesWaiting)}m`;

  if (order.status === 'Pending') {
    if (minutesWaiting > 5) {
      cardBg = "bg-red-50/50";
      cardBorder = "border border-red-200";
      timerText = "text-red-600 font-bold animate-pulse bg-red-100/50 px-2.5 py-1 rounded-md shadow-sm border border-red-200";
      timerIcon = <AlertCircle className="w-3.5 h-3.5" />;
    } else if (minutesWaiting >= 3) {
      cardBg = "bg-amber-50/50";
      cardBorder = "border border-amber-200";
      timerText = "text-amber-700 font-bold bg-amber-100/50 px-2.5 py-1 rounded-md shadow-sm border border-amber-200";
      timerIcon = <Clock className="w-3.5 h-3.5" />;
    } else {
      timerText = "text-slate-500 font-semibold py-1";
    }
  } else if (order.status === 'Preparing') {
    if (minutesRemaining !== null) {
      if (minutesRemaining < 0) {
        cardBg = "bg-white";
        cardBorder = "border border-slate-200/60 border-l-4 border-l-red-500";
        timerText = "text-red-600 font-bold animate-pulse bg-red-50 px-2.5 py-1 rounded-md shadow-sm border border-red-100";
        timerIcon = <AlertCircle className="w-3.5 h-3.5" />;
        timerDisplay = `${Math.abs(minutesRemaining)}m Overdue`;
      } else if (minutesRemaining <= 5) {
        cardBg = "bg-white";
        cardBorder = "border border-slate-200/60 border-l-4 border-l-amber-400";
        timerText = "text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-md shadow-sm border border-amber-100";
        timerIcon = <Clock className="w-3.5 h-3.5" />;
        timerDisplay = `ETA ${minutesRemaining}m`;
      } else {
        cardBg = "bg-white";
        cardBorder = "border border-slate-200/60 border-l-4 border-l-transparent";
        timerText = "text-slate-500 font-semibold py-1";
        timerDisplay = `ETA ${minutesRemaining}m`;
      }
    } else {
      timerText = "text-slate-500 font-semibold py-1";
      timerDisplay = `Preparing`;
    }
  }

  return (
    <div className={`${cardBg} rounded-[1.25rem] p-5 shadow-sm ${cardBorder} flex flex-col gap-4 hover:shadow-md transition-all relative overflow-hidden`}>
      
      {/* Top Header: Table & Time */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-1.5 bg-[#6DBE45]/15 text-[#4A8F2F] px-3 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider shadow-sm border border-[#6DBE45]/20">
          <Utensils className="w-3.5 h-3.5" />
          Table {order.tableNumber || 'To-Go'}
        </div>
        <div className={`flex items-center gap-1.5 text-xs ${timerText}`}>
          {timerIcon}
          {timerDisplay}
        </div>
      </div>
      
      {/* Order Info */}
      <div className="flex justify-between items-end border-b border-slate-200/60 pb-3">
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Order ID</p>
          <p className="text-xl font-black text-slate-800 leading-none">#{order.trackCode}</p>
        </div>
        <p className="text-xs font-semibold text-slate-400">
          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Item List */}
      <div className="flex flex-col gap-4 py-1">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex flex-col gap-2">
            <div className="flex gap-3 items-start text-sm">
              <span className="font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md text-xs shadow-sm border border-slate-200/60">{item.quantity}x</span>
              <span className="font-bold text-slate-800 leading-tight pt-0.5 text-[15px]">{item.name}</span>
            </div>
            
            {(item.variantLabel || (item.modifiers && item.modifiers.length > 0)) && (
              <div className="ml-9 flex flex-wrap gap-1.5">
                {item.variantLabel && (
                  <span className="bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border border-amber-200/50 shadow-sm">
                    {item.variantLabel}
                  </span>
                )}
                {item.modifiers && item.modifiers.map((m, i) => (
                  <span key={i} className="bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border border-amber-200/50 shadow-sm">
                    + {m.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-auto pt-5">
        {order.status === 'Pending' && (
          <div className="flex flex-col gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm mt-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Accept & Set ETA</p>
            <div className="flex gap-2">
              {[15, 25, 40].map(eta => (
                <button 
                  key={eta}
                  onClick={() => handleUpdate('Preparing', eta)}
                  disabled={updating}
                  className="flex-1 py-2 rounded-lg text-sm font-black transition-all border shadow-sm bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-800 hover:text-white hover:border-slate-800 active:scale-95"
                >
                  {eta}m
                </button>
              ))}
            </div>
          </div>
        )}

        {order.status === 'Preparing' && (
          <button 
            onClick={() => handleUpdate('Serve')}
            disabled={updating}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#6DBE45] hover:bg-[#5aa337] text-white font-black rounded-xl shadow-md transition-all active:scale-[0.98] text-sm"
          >
            {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" strokeWidth={3} /> Mark as Served</>}
          </button>
        )}

        {order.status === 'Serve' && (
          <button 
            onClick={() => handleUpdate('Complete')}
            disabled={updating}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 font-bold rounded-xl shadow-sm transition-all text-sm"
          >
            {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Clear Ticket'}
          </button>
        )}

        {order.status !== 'Serve' && order.status !== 'Cancelled' && (
          <button 
            onClick={() => { if(confirm('Are you sure you want to cancel this order?')) handleUpdate('Cancelled') }}
            disabled={updating}
            className="w-full mt-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            Cancel Order
          </button>
        )}
      </div>
    </div>
  );
};


// --- Main Page Component ---
export default function LiveOrderQueuePage() {
  const now = useGlobalClock();
  const [loading, setLoading] = useState(true);
  const [restaurantIds, setRestaurantIds] = useState<string[]>([]);
  const [orders, setOrders] = useState<QueueOrder[]>([]);

  const fetchOrders = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: restaurants } = await supabase.from('restaurants').select('id').eq('user_id', user.id);
      const ids = (restaurants || []).map(r => r.id);
      setRestaurantIds(ids);

      if (!ids.length) {
        setLoading(false);
        return;
      }

      // Fetch pending, preparing, ready. We bypass "confirmed" in this new streamlined queue.
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, track_code, status, created_at, estimated_time,
          table:tables ( id, table_number ),
          order_items (
            id, quantity, price, variant_label, modifiers,
            menu_item:menu_item_id ( id, name )
          )
        `)
        .in('restaurant_id', ids)
        .in('status', ['pending', 'preparing', 'ready'])
        .eq('is_paid', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Normalize and Group
      const grouped = new Map<string, QueueOrder>();
      (data || []).forEach((orderObj: any) => {
        const orderId = orderObj.id;
        if (!grouped.has(orderId)) {
          grouped.set(orderId, {
            orderId,
            status: dbToUiStatus(orderObj.status)!,
            trackCode: orderObj.track_code,
            tableNumber: orderObj.table?.table_number || null,
            createdAt: orderObj.created_at,
            estimatedTime: orderObj.estimated_time,
            items: []
          });
        }
        const current = grouped.get(orderId)!;
        (orderObj.order_items || []).forEach((item: any) => {
           current.items.push({
             id: item.id,
             name: item.menu_item?.name || 'Unknown',
             quantity: item.quantity || 1,
             variantLabel: item.variant_label,
             modifiers: item.modifiers
           });
        });
      });

      setOrders(Array.from(grouped.values()));
    } catch (e) {
      console.error(e);
      toast.error('Failed to load live queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!restaurantIds.length) return;
    const channels = restaurantIds.map(rid => 
      supabase.channel(`queue-${rid}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${rid}` }, fetchOrders)
        .subscribe()
    );
    return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
  }, [restaurantIds, fetchOrders]);

  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const preparingOrders = orders.filter(o => o.status === 'Preparing');
  const readyOrders = orders.filter(o => o.status === 'Serve');

  if (loading) {
     return (
        <div className="w-full h-[80vh] flex items-center justify-center">
           <Loader2 className="w-10 h-10 animate-spin text-[#6DBE45]" />
        </div>
     );
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-slate-50 font-sans px-4 md:px-6 lg:px-8 pt-4 md:pt-6 pb-24 lg:pb-6 overflow-hidden">
       
       {/* ATC Header */}
       <div className="mb-6 lg:mb-8 shrink-0 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-[#6DBE45]/15 flex items-center justify-center text-[#5aa337] shadow-sm border border-[#6DBE45]/20">
                  <UtensilsCrossed size={22} />
               </div>
               Live Order Queue
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-2 ml-13">
               Air Traffic Control for all incoming FOH orders.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
             <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
             <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Live Sync</span>
          </div>
       </div>

       {/* Kanban Board Container */}
       <div className="flex-1 flex flex-row overflow-x-auto overflow-y-hidden gap-6 pb-6 custom-scrollbar snap-x">
          
          {/* Column 1: New (Pending) */}
          <div className="flex flex-col min-w-[340px] w-[350px] lg:w-[400px] xl:w-[450px] bg-slate-100/60 rounded-[2rem] p-4 border border-slate-200 shrink-0 snap-center shadow-inner">
             <div className="flex justify-between items-center mb-5 px-2 pt-1">
                <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                   New (Pending)
                </h2>
                <span className="bg-white text-slate-700 px-3 py-1 rounded-full text-xs font-black shadow-sm border border-slate-200/80">
                   {pendingOrders.length}
                </span>
             </div>
             <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-10">
                {pendingOrders.map(o => <ManagerOrderCard key={o.orderId} order={o} onUpdate={fetchOrders} now={now} />)}
                {pendingOrders.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 pb-10">
                    <Clock size={40} className="opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">No new orders</p>
                  </div>
                )}
             </div>
          </div>

          {/* Column 2: Cooking (Preparing) */}
          <div className="flex flex-col min-w-[340px] w-[350px] lg:w-[400px] xl:w-[450px] bg-slate-100/60 rounded-[2rem] p-4 border border-slate-200 shrink-0 snap-center shadow-inner">
             <div className="flex justify-between items-center mb-5 px-2 pt-1">
                <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                   Cooking (Preparing)
                </h2>
                <span className="bg-white text-slate-700 px-3 py-1 rounded-full text-xs font-black shadow-sm border border-slate-200/80">
                   {preparingOrders.length}
                </span>
             </div>
             <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-10">
                {preparingOrders.map(o => <ManagerOrderCard key={o.orderId} order={o} onUpdate={fetchOrders} now={now} />)}
                {preparingOrders.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 pb-10">
                    <ChefHat size={40} className="opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">Kitchen is empty</p>
                  </div>
                )}
             </div>
          </div>

          {/* Column 3: Ready (Served) */}
          <div className="flex flex-col min-w-[340px] w-[350px] lg:w-[400px] xl:w-[450px] bg-[#6DBE45]/5 rounded-[2rem] p-4 border border-[#6DBE45]/15 shrink-0 snap-center shadow-inner">
             <div className="flex justify-between items-center mb-5 px-2 pt-1">
                <h2 className="text-[13px] font-black uppercase tracking-widest text-[#5aa337] flex items-center gap-2">
                   Ready (Served)
                </h2>
                <span className="bg-white text-[#5aa337] px-3 py-1 rounded-full text-xs font-black shadow-sm border border-[#6DBE45]/30">
                   {readyOrders.length}
                </span>
             </div>
             <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-10">
                {readyOrders.map(o => <ManagerOrderCard key={o.orderId} order={o} onUpdate={fetchOrders} now={now} />)}
                {readyOrders.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-[#6DBE45]/40 space-y-3 pb-10">
                    <CheckCircle2 size={40} className="opacity-50" />
                    <p className="text-xs font-bold uppercase tracking-widest">No orders waiting</p>
                  </div>
                )}
             </div>
          </div>

       </div>
    </div>
  );
}
