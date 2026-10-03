import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface RestrictedDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string | null;
}

export default function RestrictedDevicesModal({ isOpen, onClose, restaurantId }: RestrictedDevicesModalProps) {
  const [bannedIps, setBannedIps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && restaurantId) {
      fetchBannedIps();
    }
  }, [isOpen, restaurantId]);

  const fetchBannedIps = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/banned-devices?restaurantId=${restaurantId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setBannedIps(json.data || []);
    } catch (e) {
      toast.error('Failed to load restricted devices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblock = async (device_id: string) => {
    try {
      const res = await fetch('/api/admin/banned-devices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id, restaurantId }),
      });
      if (!res.ok) throw new Error('Failed to unblock');
      
      toast.success('Device unblocked successfully');
      setBannedIps(prev => prev.filter(ip => ip.device_id !== device_id));
    } catch (e) {
      toast.error('Error unblocking device');
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-slate-700" />
              <h2 className="text-lg font-bold text-slate-900">Restricted Devices</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : bannedIps.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Shield className="mb-4 h-12 w-12 text-slate-300" strokeWidth={1.5} />
                <p className="text-sm font-semibold text-slate-500">No restricted devices</p>
                <p className="mt-1 max-w-[250px] text-xs text-slate-400">Devices blocked from the Waiter Bell will appear here.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {bannedIps.map((ban) => (
                  <li
                    key={ban.device_id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-slate-900">
                        {ban.reason || 'Spamming Waiter Bell'} 
                        <span className="ml-1 font-normal text-slate-400">(Device: ...{ban.device_id?.slice(-4)})</span>
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Blocked {formatDate(ban.created_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnblock(ban.device_id)}
                      className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      Unblock
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
