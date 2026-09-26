import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ActiveOrderWarningModalProps {
  isOpen: boolean;
  tableNumber: string;
  actionType: 'clear' | 'ban' | null;
  unpaidAmount: number;
  orders: any[];
  onDismiss: () => void;
  onConfirm: () => void;
}

export default function ActiveOrderWarningModal({
  isOpen,
  tableNumber,
  actionType,
  unpaidAmount,
  orders,
  onDismiss,
  onConfirm
}: ActiveOrderWarningModalProps) {
  if (!isOpen || !actionType) return null;

  const isBan = actionType === 'ban';
  const actionName = isBan ? 'Force Ban Device' : 'Mark Paid & Clear Table';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={onDismiss}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl bg-white shadow-2xl z-10 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                <AlertTriangle className="h-8 w-8 text-blue-500" strokeWidth={2.5} />
              </div>
              
              <h2 className="mb-1 text-xl font-bold text-slate-900">
                Table {tableNumber} Checkout
              </h2>
              <p className="text-[14px] text-slate-500">
                {isBan ? 'Banning this device will wipe their session.' : 'Review the active bill before clearing this table.'}
              </p>
            </div>
            
            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 mb-6">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Order Breakdown</div>
              <div className="space-y-4">
                {orders.map((order, idx) => (
                  <div key={order.id} className="border-b border-slate-200/60 last:border-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-xs font-bold text-slate-500">#{order.track_code}</div>
                      <div className="text-xs font-bold px-2 py-1 bg-amber-50 text-amber-600 rounded capitalize">{order.status}</div>
                    </div>
                    <div className="space-y-2">
                      {order.order_items.map((item: any, i: number) => {
                        const itemName = Array.isArray(item.menu_items) 
                          ? item.menu_items[0]?.name 
                          : item.menu_items?.name || 'Unknown Item';
                          
                        return (
                        <div key={i} className="flex justify-between items-start text-sm">
                          <div className="flex gap-2">
                            <span className="font-bold text-slate-600">{item.quantity}x</span>
                            <div>
                              <span className="font-semibold text-slate-800">{itemName}</span>
                              {item.variant_label && <div className="text-xs text-slate-500">{item.variant_label}</div>}
                            </div>
                          </div>
                          <div className="font-bold text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</div>
                        </div>
                      )})}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
                <span className="font-bold text-slate-700">Total Due</span>
                <span className="text-2xl font-bold text-slate-900">₹{unpaidAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3">
              <button
                onClick={onConfirm}
                className={`w-full rounded-xl py-3.5 text-sm font-bold text-white transition shadow-md ${isBan ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-[#6DBE45] hover:bg-[#5aa337] shadow-[#6DBE45]/20'}`}
              >
                {actionName}
              </button>
              <button
                onClick={onDismiss}
                className="w-full rounded-xl bg-slate-100 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
