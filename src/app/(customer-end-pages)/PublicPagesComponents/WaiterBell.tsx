'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, Droplet, User, Trash2, Receipt, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';

interface WaiterBellProps {
  restaurantId: string;
  tableNumber: string;
  onOpenChange?: (isOpen: boolean) => void;
}

export default function WaiterBell({ restaurantId, tableNumber, onOpenChange }: WaiterBellProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);
  const [cooldown, setCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modalState, setModalState] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);

  useEffect(() => {
    // On mount, check if there's a stored timestamp
    const lastRing = localStorage.getItem(`qb_bell_${tableNumber}`);
    if (lastRing) {
      const elapsed = Math.floor((Date.now() - parseInt(lastRing, 10)) / 1000);
      if (elapsed < 60) {
        setCooldown(60 - elapsed);
      } else {
        localStorage.removeItem(`qb_bell_${tableNumber}`);
      }
    }
  }, [tableNumber]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleRequest = async (type: string) => {
    setIsSubmitting(true);
    try {
      const deviceId = localStorage.getItem('qb_device_id') || 'unknown';
      const res = await fetch('/api/service-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          tableNumber,
          restaurantId,
          deviceId,
        }),
      });

      const data = await res.json();
      
      if (res.status === 429 && data.remainingSeconds) {
        setIsOpen(false);
        setCooldown(data.remainingSeconds);
        localStorage.setItem(`qb_bell_${tableNumber}`, (Date.now() - (60 - data.remainingSeconds) * 1000).toString());
        throw new Error(data.error || 'Too many requests.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send request.');
      }
      
      setIsOpen(false);
      setCooldown(60);
      localStorage.setItem(`qb_bell_${tableNumber}`, Date.now().toString());
      
      setModalState({
        type: 'success',
        title: 'Request Sent',
        message: `Your request for ${type} has been sent to the staff. They will be with you shortly.`,
      });
      
    } catch (error: any) {
      setIsOpen(false);
      setModalState({
        type: 'error',
        title: 'Request Failed',
        message: error.message || 'Failed to send request. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const actions = [
    { type: 'Water', icon: Droplet, label: 'Water' },
    { type: 'Waiter', icon: User, label: 'Waiter' },
    { type: 'Clear Table', icon: Trash2, label: 'Clear Table' },
    { type: 'Bill', icon: Receipt, label: 'Bill' },
  ];

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-4 z-[45] flex flex-col items-center">
        {cooldown > 0 ? (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#6DBE45] bg-white text-[#6DBE45] shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
              <CheckCircle2 size={24} />
            </div>
            <span className="mt-1.5 text-[11px] font-extrabold text-slate-500 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm">
              0:{cooldown.toString().padStart(2, '0')}
            </span>
          </>
        ) : (
          <motion.button
            onClick={() => setIsOpen(true)}
            animate={{
              scale: [1, 1.05, 1],
              boxShadow: [
                '0 8px 30px rgba(0,0,0,0.12)',
                '0 8px 30px rgba(109,190,69,0.3)',
                '0 8px 30px rgba(0,0,0,0.12)',
              ],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-colors hover:bg-slate-50 active:scale-95"
          >
            <Bell size={24} strokeWidth={2.5} />
          </motion.button>
        )}
      </div>

      {/* Service Request Sheet */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[52] bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-[53] flex flex-col rounded-t-3xl bg-white p-6 pb-10 shadow-2xl mx-auto max-w-2xl"
            >
              <h3 className="mb-5 text-lg font-bold text-slate-800 tracking-tight">
                How can we help Table {tableNumber}?
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {actions.map((action) => (
                  <button
                    key={action.type}
                    onClick={() => handleRequest(action.type)}
                    disabled={isSubmitting}
                    className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-5 transition-all hover:bg-slate-100 active:scale-95 disabled:opacity-50"
                  >
                    <action.icon size={26} className="text-slate-600" />
                    <span className="text-sm font-bold text-slate-700">{action.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Success/Error Feedback Modal */}
      <AnimatePresence>
        {modalState && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalState(null)}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 text-center">
                  <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${modalState.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {modalState.type === 'success' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {modalState.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-8">
                    {modalState.message}
                  </p>
                  
                  <button
                    onClick={() => setModalState(null)}
                    className={`w-full py-3.5 rounded-xl text-sm font-bold text-white shadow-sm active:scale-[0.98] transition-transform ${modalState.type === 'success' ? 'bg-[#6DBE45] hover:bg-[#5aa337]' : 'bg-slate-900 hover:bg-slate-800'}`}
                  >
                    Got it
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
