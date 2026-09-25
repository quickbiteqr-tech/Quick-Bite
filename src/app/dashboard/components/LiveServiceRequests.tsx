"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Check, X, ShieldAlert, Trash2, Volume2, VolumeX, BellRing, Droplet, User, Receipt, Coffee } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useRestaurantRealtime } from "@/lib/hooks/useRestaurantRealtime";
import ActiveOrderWarningModal from "./ActiveOrderWarningModal";

export default function LiveServiceRequests() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      const { data: rest } = await supabase
        .from('restaurants')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (rest && mounted) {
        setRestaurantId(rest.id);
      }
    };
    fetchUser();
    return () => { mounted = false; };
  }, []);

  const { requests, setRequests, soundEnabled, toggleSound } = useRestaurantRealtime(restaurantId);

  const handleAction = async (id: string, newStatus: string) => {
    // Optimistic UI
    setRequests(prev => prev.filter(req => req.id !== id));
    
    const { error } = await supabase
      .from('service_requests')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update request');
    }
  };

  const [banCandidateId, setBanCandidateId] = useState<string | null>(null);
  const [banCandidateTable, setBanCandidateTable] = useState<string>('');

  const initiateBan = async (id: string, tableNumber: string) => {
    // Check for active orders
    const { data: activeOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('table_number', tableNumber)
      .eq('restaurant_id', restaurantId)
      .in('status', ['pending', 'accepted', 'served']); // but NOT 'paid' or 'cancelled'
      
    if (activeOrders && activeOrders.length > 0) {
      // Intercept and show warning
      setBanCandidateId(id);
      setBanCandidateTable(tableNumber);
    } else {
      // Safe to ban
      await executeBan(id);
    }
  };

  const executeBan = async (id: string) => {
    setRequests(prev => prev.filter(req => req.id !== id));
    setBanCandidateId(null);

    try {
      const res = await fetch('/api/admin/mark-spam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceRequestId: id }),
      });
      if (res.ok) {
        toast.success('Device banned for 24 hours');
        await supabase.from('service_requests').update({ status: 'ignored' }).eq('id', id);
      } else {
        toast.error('Failed to ban device');
      }
    } catch (e) {
      toast.error('Error banning device');
    }
  };

  const dismissBan = () => {
    if (banCandidateId) {
      handleAction(banCandidateId, 'ignored');
      setBanCandidateId(null);
    }
  };

  const handleClearTable = async (tableNumber: string) => {
    if (!confirm(`Clear Table ${tableNumber} and revoke all active diner sessions?`)) return;
    
    setRequests(prev => prev.filter(req => req.table_number !== tableNumber));

    try {
      const res = await fetch('/api/admin/clear-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber, restaurantId }),
      });
      if (res.ok) {
        toast.success(`Table ${tableNumber} cleared successfully.`);
        if (restaurantId) {
          await supabase
            .from('service_requests')
            .update({ status: 'resolved' })
            .eq('restaurant_id', restaurantId)
            .eq('table_number', tableNumber)
            .eq('status', 'pending');
        }
      } else {
        toast.error('Failed to clear table.');
      }
    } catch (e) {
      toast.error('Error clearing table.');
    }
  };

  const getIconForType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'water': return <Droplet size={18} className="text-blue-500" />;
      case 'waiter': return <User size={18} className="text-amber-500" />;
      case 'bill': return <Receipt size={18} className="text-emerald-500" />;
      case 'clear table': return <Coffee size={18} className="text-rose-500" />;
      default: return <BellRing size={18} className="text-slate-500" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    return `${diff}m ago`;
  };

  if (requests.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <BellRing size={16} />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Live Service Requests ({requests.length})
          </h2>
        </div>
        <button
          onClick={toggleSound}
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${soundEnabled ? 'bg-[#6DBE45]/10 text-[#6DBE45]' : 'bg-slate-100 text-slate-500'}`}
        >
          {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          {soundEnabled ? 'Sound On' : 'Muted'}
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        <AnimatePresence>
          {requests.map((req) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between p-4 px-5 transition hover:bg-slate-50"
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-white p-2 min-w-[3.5rem] shadow-sm">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">TBL</span>
                  <span className="text-xl font-black text-slate-800">{req.table_number}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {getIconForType(req.request_type)}
                    <p className={`font-bold text-base ${req.request_type.toLowerCase() === 'clear table' ? 'text-rose-600' : 'text-slate-800'}`}>
                      {req.request_type}
                    </p>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{formatTimeAgo(req.created_at)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  title="Ban Device (24h)"
                  onClick={() => initiateBan(req.id, req.table_number)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <ShieldAlert size={18} />
                </button>
                <div className="h-6 w-px bg-slate-200 mx-1"></div>
                <button
                  onClick={() => handleAction(req.id, 'ignored')}
                  className="flex h-9 px-3 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 font-semibold text-xs border border-transparent hover:border-slate-200"
                >
                  Ignore
                </button>
                <button
                  onClick={() => handleAction(req.id, 'resolved')}
                  className="flex h-9 px-3 gap-1.5 items-center justify-center rounded-lg bg-[#6DBE45] text-white shadow-sm transition hover:bg-[#5aa337] font-bold text-xs"
                >
                  <Check size={14} /> Done
                </button>
                
                <button
                  onClick={() => handleClearTable(req.table_number)}
                  className="ml-2 flex h-9 px-3 gap-1.5 items-center justify-center rounded-lg bg-rose-500 text-white shadow-sm transition hover:bg-rose-600 font-bold text-xs"
                >
                  <Trash2 size={14} /> Clear Table
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <ActiveOrderWarningModal 
        isOpen={!!banCandidateId} 
        tableNumber={banCandidateTable} 
        onDismiss={dismissBan} 
        onForceBan={() => banCandidateId && executeBan(banCandidateId)} 
      />
    </div>
  );
}
