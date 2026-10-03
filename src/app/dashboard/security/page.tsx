"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Lock, Unlock, ShieldOff, Trash2, Clock, ShieldAlert, Loader2, RefreshCcw, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface BannedDevice {
  device_id: string;
  reason: string;
  created_at: string;
}

interface ServiceRequestHistory {
  id: string;
  table_number: string;
  request_type: string;
  status: string;
  created_at: string;
  device_id: string;
}

interface TableStatus {
  id: string;
  table_number: string;
  is_locked: boolean;
}

export default function SecurityDashboardV2() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [bannedDevices, setBannedDevices] = useState<BannedDevice[]>([]);
  const [serviceHistory, setServiceHistory] = useState<ServiceRequestHistory[]>([]);
  const [tables, setTables] = useState<TableStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: rest } = await supabase.from('restaurants').select('id').eq('user_id', user.id).single();
      if (rest) setRestaurantId(rest.id);
    };
    init();
  }, []);

  useEffect(() => {
    if (!restaurantId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const resBan = await fetch(`/api/admin/banned-devices?restaurantId=${restaurantId}`);
        if (resBan.ok) {
          const json = await resBan.json();
          setBannedDevices(json.data || []);
        }

        const { data: tData } = await supabase
          .from('tables')
          .select('id, table_number, is_locked')
          .eq('restaurant_id', restaurantId)
          .order('table_number', { ascending: true });
        if (tData) setTables(tData);

        const { data: reqData } = await supabase
          .from('service_requests')
          .select('id, table_number, request_type, status, created_at, device_id')
          .eq('restaurant_id', restaurantId)
          .order('created_at', { ascending: false })
          .limit(50);
        if (reqData) setServiceHistory(reqData);
      } catch (error) {
        console.error("Error fetching security data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [restaurantId]);

  const handleUnblock = async (device_id: string) => {
    setActionLoading(`unblock-${device_id}`);
    try {
      const res = await fetch('/api/admin/banned-devices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id, restaurantId }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Device unblocked');
      setBannedDevices(prev => prev.filter(d => d.device_id !== device_id));
    } catch (e) {
      toast.error('Error unblocking device');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleLock = async (tableId: string, currentLock: boolean) => {
    setActionLoading(`lock-${tableId}`);
    const newLock = !currentLock;
    try {
      const res = await fetch(`/api/admin/tables/${tableId}/lock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_locked: newLock }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(`Table ${newLock ? 'locked' : 'unlocked'}`);
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, is_locked: newLock } : t));
    } catch (e) {
      toast.error('Failed to update table lock');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearTable = async (tableNumber: string) => {
    if (!window.confirm(`Clear Table ${tableNumber} and revoke all active diner sessions?`)) return;
    setActionLoading(`clear-${tableNumber}`);
    try {
      const res = await fetch('/api/admin/clear-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber, restaurantId }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(`Table ${tableNumber} cleared.`);
    } catch (e) {
      toast.error('Error clearing table.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#6DBE45]" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 font-sans pb-24 lg:pb-12">
      <div className="px-4 md:px-6 lg:px-8 pt-8 mb-8 border-b border-slate-200/60 pb-8 sticky top-0 bg-white/50 backdrop-blur-md z-20">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <ShieldAlert className="text-rose-500" /> Enterprise Command Center
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-2">
          Control operational killswitches, ban malicious devices, and audit service requests.
        </p>
      </div>

      <div className="px-4 md:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT: DANGER ZONE & BAN LIST */}
        <div className="space-y-8">
          
          {/* DANGER ZONE */}
          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-rose-100 bg-rose-50/30 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <h2 className="font-bold text-rose-900">Floor Killswitches</h2>
            </div>
            <div className="p-6">
              {tables.length === 0 ? (
                <p className="text-sm text-slate-500 font-semibold">No tables active.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {tables.map(table => (
                    <div key={table.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-sm ${table.is_locked ? 'bg-amber-100 text-amber-600' : 'bg-white text-slate-600 border border-slate-200'}`}>
                          {table.is_locked ? <Lock size={20} /> : <Unlock size={20} />}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-lg">Table {table.table_number}</p>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Status: <span className={table.is_locked ? 'text-amber-500' : 'text-[#6DBE45]'}>{table.is_locked ? 'LOCKED' : 'OPEN'}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleLock(table.id, table.is_locked)}
                          disabled={actionLoading === `lock-${table.id}`}
                          className={`flex-1 sm:flex-none flex items-center justify-center px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-sm disabled:opacity-50 ${table.is_locked ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                        >
                          {actionLoading === `lock-${table.id}` ? <Loader2 size={16} className="animate-spin" /> : (table.is_locked ? 'Unlock' : 'Lock')}
                        </button>
                        <button
                          onClick={() => handleClearTable(table.table_number)}
                          disabled={actionLoading === `clear-${table.table_number}`}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all shadow-sm disabled:opacity-50"
                        >
                          {actionLoading === `clear-${table.table_number}` ? <Loader2 size={16} className="animate-spin" /> : <><RefreshCcw size={14} /> Clear</>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* BAN LIST */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <ShieldOff className="text-slate-500 h-4 w-4" /> Banned Devices
              </h2>
              <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{bannedDevices.length}</span>
            </div>
            <div className="p-0">
              {bannedDevices.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm font-semibold text-slate-500">No malicious devices currently banned.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  <AnimatePresence>
                    {bannedDevices.map(ban => (
                      <motion.li 
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        key={ban.device_id} 
                        className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-black text-slate-900">{ban.reason}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                             <span className="font-mono text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                               {ban.device_id.slice(0, 8)}...
                             </span>
                             <span className="text-[10px] font-semibold text-slate-400 uppercase">
                               {new Date(ban.created_at).toLocaleDateString()}
                             </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnblock(ban.device_id)}
                          disabled={actionLoading === `unblock-${ban.device_id}`}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-[#6DBE45] hover:border-[#6DBE45] transition-all shadow-sm disabled:opacity-50"
                          title="Unban Device"
                        >
                          {actionLoading === `unblock-${ban.device_id}` ? <Loader2 size={16} className="animate-spin" /> : <Unlock size={16} />}
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: AUDIT LOG */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-fit max-h-[800px] flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Clock className="text-slate-500 h-4 w-4" /> Request Audit Log
            </h2>
            <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{serviceHistory.length}</span>
          </div>
          <div className="p-0 overflow-y-auto flex-1">
            {serviceHistory.length === 0 ? (
              <div className="p-8 text-center text-sm font-semibold text-slate-500">
                No recent service requests.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {serviceHistory.map(req => (
                  <li key={req.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">Table {req.table_number}</span>
                        <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-1 rounded-md ${
                          req.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                          req.status === 'ignored' ? 'bg-slate-200 text-slate-600' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-700">{req.request_type}</p>
                    {req.device_id && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Smartphone size={12} className="text-slate-400" />
                        <span className="font-mono text-[10px] font-bold text-slate-500">
                          {req.device_id.slice(0, 12)}...
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
