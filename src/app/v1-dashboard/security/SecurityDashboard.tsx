"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Lock, Unlock, ShieldOff, Trash2, Clock, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

export default function SecurityDashboard() {
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
      const { data: rest } = await supabase
        .from('restaurants')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (rest) {
        setRestaurantId(rest.id);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!restaurantId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch banned devices
        const resBan = await fetch(`/api/admin/banned-devices?restaurantId=${restaurantId}`);
        if (resBan.ok) {
          const json = await resBan.json();
          setBannedDevices(json.data || []);
        }

        // Fetch tables
        const { data: tData } = await supabase
          .from('tables')
          .select('id, table_number, is_locked')
          .eq('restaurant_id', restaurantId)
          .order('table_number', { ascending: true });
        if (tData) setTables(tData);

        // Fetch service request history (last 50)
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
    if (!confirm(`Clear Table ${tableNumber} and revoke all active diner sessions?`)) return;
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
    return <div className="p-8 text-slate-500 font-semibold animate-pulse">Loading Security Center...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 pb-24">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <ShieldAlert className="text-red-500 h-8 w-8" />
          Security & Access Control
        </h1>
        <p className="text-slate-500 mt-2 text-sm max-w-2xl">
          Manage shadowbanned devices, review service request histories to catch pranksters, and lock tables instantly to kill all active digital ordering sessions for a physical table.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column */}
        <div className="space-y-8">
          
          {/* Table Locks & Clear Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-800">Table Operations (Killswitches)</h2>
            </div>
            <div className="p-6">
              {tables.length === 0 ? (
                <p className="text-sm text-slate-500">No tables active.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {tables.map(table => (
                    <div key={table.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${table.is_locked ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}`}>
                          {table.is_locked ? <Lock size={18} /> : <Unlock size={18} />}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900">Table {table.table_number}</p>
                          <p className="text-xs font-semibold text-slate-500">Status: {table.is_locked ? 'Locked' : 'Open'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleLock(table.id, table.is_locked)}
                          disabled={actionLoading === `lock-${table.id}`}
                          className={`flex items-center justify-center min-w-[100px] px-3 py-1.5 text-xs font-bold rounded-lg transition-colors disabled:opacity-50 ${table.is_locked ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                          {actionLoading === `lock-${table.id}` ? <Loader2 size={14} className="animate-spin" /> : (table.is_locked ? 'Unlock Menu' : 'Lock Menu')}
                        </button>
                        <button
                          onClick={() => handleClearTable(table.table_number)}
                          disabled={actionLoading === `clear-${table.table_number}`}
                          className="flex items-center justify-center min-w-[120px] gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === `clear-${table.table_number}` ? <Loader2 size={14} className="animate-spin" /> : <><Trash2 size={14} /> Clear Sessions</>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Banned Devices */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <ShieldOff className="text-red-500 h-5 w-5" />
              <h2 className="font-bold text-slate-800">Shadowbanned Devices</h2>
            </div>
            <div className="p-0">
              {bannedDevices.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No devices are currently banned.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {bannedDevices.map(ban => (
                    <li key={ban.device_id} className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{ban.reason}</p>
                        <p className="text-xs text-slate-500 mt-1">Device: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{ban.device_id.slice(0, 8)}...</span></p>
                        <p className="text-xs text-slate-400 mt-1">{new Date(ban.created_at).toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => handleUnblock(ban.device_id)}
                        disabled={actionLoading === `unblock-${ban.device_id}`}
                        className="flex items-center justify-center min-w-[80px] px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 shadow-sm disabled:opacity-50"
                      >
                        {actionLoading === `unblock-${ban.device_id}` ? <Loader2 size={14} className="animate-spin" /> : 'Unblock'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Service Request History */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-fit">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Clock className="text-slate-500 h-5 w-5" />
            <h2 className="font-bold text-slate-800">Recent Service Activity Log</h2>
          </div>
          <div className="p-0 overflow-y-auto max-h-[800px]">
            {serviceHistory.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No service requests yet.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {serviceHistory.map(req => (
                  <li key={req.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">Table {req.table_number}</span>
                        <span className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full ${
                          req.status === 'resolved' ? 'bg-green-100 text-green-700' :
                          req.status === 'ignored' ? 'bg-slate-200 text-slate-600' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-700 mt-1">{req.request_type}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <p className="text-xs text-slate-400">{new Date(req.created_at).toLocaleString()}</p>
                        {req.device_id && (
                          <p className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 rounded">
                            {req.device_id.slice(0, 6)}...
                          </p>
                        )}
                      </div>
                    </div>
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
