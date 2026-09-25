import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ActiveOrderWarningModalProps {
  isOpen: boolean;
  tableNumber: string;
  onDismiss: () => void;
  onForceBan: () => void;
}

export default function ActiveOrderWarningModal({
  isOpen,
  tableNumber,
  onDismiss,
  onForceBan
}: ActiveOrderWarningModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onDismiss}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-50">
              <AlertTriangle className="h-8 w-8 text-yellow-500" strokeWidth={2.5} />
            </div>
            
            <h2 className="mb-2 text-xl font-bold text-slate-900">
              ⚠️ Active Order Detected
            </h2>
            
            <p className="mb-8 text-[15px] leading-relaxed text-slate-600">
              Table {tableNumber} currently has unpaid orders. Banning this device will lock them out of their menu and bill. Did you mean to just dismiss the bell?
            </p>

            <div className="flex w-full flex-col gap-3">
              <button
                onClick={onDismiss}
                className="w-full rounded-xl bg-slate-100 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
              >
                Dismiss Bell Only
              </button>
              <button
                onClick={onForceBan}
                className="w-full rounded-xl bg-red-500 py-3.5 text-sm font-bold text-white transition hover:bg-red-600"
              >
                Force Ban Device
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
