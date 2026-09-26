'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, ChevronRight, Loader2 } from 'lucide-react';
import { useCheckoutStore } from '@/lib/store/useCheckoutStore';
import { useEffect } from 'react';

interface ActiveBillFloatingBarProps {
  isHidden?: boolean;
  isCartBarVisible?: boolean;
}

export default function ActiveBillFloatingBar({ isHidden, isCartBarVisible }: ActiveBillFloatingBarProps) {
  const { 
    hasActiveOrders, 
    aggregatedTotal, 
    isLoadingSession, 
    setCheckoutSheetOpen,
    fetchActiveSession,
    unsubscribeFromOrderUpdates
  } = useCheckoutStore();

  useEffect(() => {
    fetchActiveSession();
    return () => {
      unsubscribeFromOrderUpdates();
    };
  }, [fetchActiveSession, unsubscribeFromOrderUpdates]);

  if (isLoadingSession) return null;

  return (
    <AnimatePresence>
      {hasActiveOrders && !isHidden && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 200 }}
          className={`fixed left-0 right-0 px-4 z-[90] flex justify-center pointer-events-none mb-1 transition-all duration-300 ease-in-out ${isCartBarVisible ? 'bottom-[84px]' : 'bottom-4'}`}
        >
          <button
            onClick={() => setCheckoutSheetOpen(true)}
            className="w-full max-w-2xl pointer-events-auto bg-gradient-to-r from-[#6DBE45] to-[#5aa337] text-white rounded-xl p-1.5 shadow-xl flex items-center border border-white/20 hover:scale-[1.02] transition-transform group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-md">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            
            <div className="flex-1 flex items-center justify-between px-3">
              <div className="text-left">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-white/90">Active Bill</div>
                <div className="text-base font-bold text-white tracking-wide">
                  ₹{aggregatedTotal.toFixed(2)}
                </div>
              </div>
              
              <div className="flex items-center gap-1 text-sm font-bold text-white bg-black/10 px-3 py-1.5 rounded-lg group-hover:bg-black/20 transition-colors">
                View
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
