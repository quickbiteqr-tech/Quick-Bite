'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Receipt, Users, CheckCircle2, ChevronRight, Loader2, Share2, Wallet } from 'lucide-react';
import { useCheckoutStore } from '@/lib/store/useCheckoutStore';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function CheckoutSheet() {
  const { 
    isCheckoutSheetOpen, 
    setCheckoutSheetOpen, 
    activeOrders, 
    aggregatedTotal, 
    splitWays, 
    setSplitWays,
    restaurantName,
    restaurantUpiId,
    fetchActiveSession
  } = useCheckoutStore();

  const [isProcessing, setIsProcessing] = useState(false);

  const splitAmount = aggregatedTotal / splitWays;
  
  // Format for UPI
  // Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=INR
  const upiIntent = restaurantUpiId 
    ? `upi://pay?pa=${encodeURIComponent(restaurantUpiId)}&pn=${encodeURIComponent(restaurantName || 'Restaurant')}&am=${splitAmount.toFixed(2)}&cu=INR`
    : null;

  const handleShareWhatsApp = () => {
    if (!restaurantUpiId) {
      alert("UPI ID not configured for this restaurant.");
      return;
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://quickbiteqr.co.in';
    const pa = encodeURIComponent(restaurantUpiId);
    const pn = encodeURIComponent(restaurantName || 'Restaurant');
    const am = splitAmount.toFixed(2);
    
    const redirectLink = `${baseUrl}/pay?pa=${pa}&pn=${pn}&am=${am}`;

    const rawText = `${restaurantName || 'Restaurant'}
Your share for today's meal is ₹${am}.

Pay directly via UPI: 
${redirectLink}
`;

    window.open(`https://wa.me/?text=${encodeURIComponent(rawText)}`, '_blank');
  };

  const handlePayNow = () => {
    if (upiIntent) {
      window.location.href = upiIntent;
    } else {
      alert("UPI ID not configured for this restaurant.");
    }
  };

  return (
    <AnimatePresence>
      {isCheckoutSheetOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCheckoutSheetOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[101] flex flex-col bg-slate-100 rounded-t-[2rem] shadow-2xl overflow-hidden max-h-[90vh]"
          >
            {/* Header */}
            <div className="bg-white px-6 py-5 flex items-center justify-between shadow-sm relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#6DBE45]/10 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-[#6DBE45]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Your Active Bill</h2>
                  <p className="text-xs font-semibold text-slate-500">{activeOrders.length} Order{activeOrders.length !== 1 ? 's' : ''} in progress</p>
                </div>
              </div>
              <button 
                onClick={() => setCheckoutSheetOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 pb-32">
              
              {/* Order List Breakdown */}
              <div className="space-y-4 mb-8">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Order Breakdown</h3>
                
                {activeOrders.map((order, idx) => {
                  const currentStatus = order.status?.toLowerCase() || 'pending';
                  const isServed = ['ready', 'served', 'complete'].includes(currentStatus);
                  const isPreparing = currentStatus === 'preparing';
                  
                  return (
                  <div key={order.id} className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 mb-4 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#6DBE45] to-[#4c972b]" />
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-50 pl-2">
                      <div>
                        <div className="text-xs font-bold text-slate-400">ORDER #{order.track_code}</div>
                        <div className="text-sm font-bold text-slate-800 mt-0.5">
                          Total: ₹{Number(order.total_amount).toFixed(2)}
                        </div>
                      </div>
                      <div className={`text-xs font-bold px-3 py-1.5 rounded-lg capitalize flex items-center gap-1.5 ${
                        isServed ? 'bg-emerald-50 text-emerald-600' :
                        isPreparing ? 'bg-blue-50 text-blue-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {isServed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {currentStatus === 'ready' ? 'served' : currentStatus}
                      </div>
                    </div>
                    
                    {/* Items */}
                    <div className="space-y-3 pl-2 mb-5">
                      {order.order_items.map((item, i) => {
                        const itemName = Array.isArray(item.menu_items) 
                          ? item.menu_items[0]?.name 
                          : item.menu_items?.name || 'Unknown Item';
                          
                        return (
                        <div key={i} className="flex justify-between items-start">
                          <div className="flex gap-3">
                            <div className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0 border border-slate-100">
                              {item.quantity}x
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-800 leading-tight">{itemName}</div>
                              {item.variant_label && (
                                <div className="text-xs font-medium text-slate-500 mt-0.5">{item.variant_label}</div>
                              )}
                            </div>
                          </div>
                          <div className="text-sm font-bold text-slate-900">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      )})}
                    </div>

                    {/* Live Tracker Timeline */}
                    <div className="pl-2 pt-4 border-t border-slate-50">
                      <div className="flex items-center justify-between relative">
                        {/* Connecting Line */}
                        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-100 -translate-y-1/2 z-0" />
                        
                        {/* Step 1: Received */}
                        <div className="relative z-10 flex flex-col items-center gap-1.5 bg-white px-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                            true ? 'bg-[#6DBE45] border-[#6DBE45] text-white' : 'bg-white border-slate-200'
                          }`}>
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Received</span>
                        </div>
                        
                        {/* Step 2: Preparing */}
                        <div className="relative z-10 flex flex-col items-center gap-1.5 bg-white px-2">
                          {isPreparing && <OrderCountdown updatedAt={order.created_at} etaMinutes={order.estimated_time} />}
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                            (isPreparing || isServed) ? 'bg-[#6DBE45] border-[#6DBE45] text-white' : 'bg-white border-slate-200'
                          }`}>
                            {(isPreparing || isServed) && <CheckCircle2 className="w-3 h-3" />}
                          </div>
                          <span className={`text-[10px] font-bold uppercase ${(isPreparing || isServed) ? 'text-[#6DBE45]' : 'text-slate-400'}`}>Cooking</span>
                        </div>

                        {/* Step 3: Served */}
                        <div className="relative z-10 flex flex-col items-center gap-1.5 bg-white px-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                            isServed ? 'bg-[#6DBE45] border-[#6DBE45] text-white' : 'bg-white border-slate-200'
                          }`}>
                            {isServed && <CheckCircle2 className="w-3 h-3" />}
                          </div>
                          <span className={`text-[10px] font-bold uppercase ${isServed ? 'text-[#6DBE45]' : 'text-slate-400'}`}>Served</span>
                        </div>
                      </div>
                    </div>

                  </div>
                )})}
              </div>

              {/* Aggregated Bill Summary */}
              <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 mb-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Bill Summary
                </h3>
                <div className="space-y-3 mb-4 pb-4 border-b border-slate-100">
                  {Object.values(
                    activeOrders.flatMap(o => o.order_items).reduce((acc: any, item) => {
                      const itemName = Array.isArray(item.menu_items) 
                        ? item.menu_items[0]?.name 
                        : item.menu_items?.name || 'Unknown Item';
                      
                      const key = `${itemName}-${item.variant_label || ''}`;
                      if (!acc[key]) {
                        acc[key] = { name: itemName, variant: item.variant_label, quantity: 0, total: 0 };
                      }
                      acc[key].quantity += item.quantity;
                      acc[key].total += (item.price * item.quantity);
                      return acc;
                    }, {})
                  ).map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-start text-sm">
                      <div className="flex gap-2 text-slate-700">
                        <span className="font-bold text-slate-500">{item.quantity}x</span>
                        <div>
                          <span className="font-semibold">{item.name}</span>
                          {item.variant && <div className="text-xs text-slate-400">{item.variant}</div>}
                        </div>
                      </div>
                      <div className="font-bold text-slate-800">
                        ₹{item.total.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center text-lg font-bold text-slate-900">
                  <span>Grand Total</span>
                  <span>₹{aggregatedTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Split Bill Calculator */}
              <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 mb-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Split the Bill
                </h3>
                
                <div className="flex items-center justify-between mb-6">
                  <span className="text-base font-bold text-slate-700">How many people?</span>
                  <div className="flex items-center gap-4 bg-slate-50 rounded-full p-1 border border-slate-100">
                    <button 
                      onClick={() => setSplitWays(splitWays - 1)}
                      className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center font-bold text-slate-600 active:scale-95"
                    >
                      -
                    </button>
                    <span className="font-bold text-lg text-slate-900 w-4 text-center">{splitWays}</span>
                    <button 
                      onClick={() => setSplitWays(splitWays + 1)}
                      className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center font-bold text-slate-600 active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-end pt-4 border-t border-slate-100">
                  <div className="text-slate-500 text-sm font-medium">Per Person</div>
                  <div className="text-3xl font-bold text-slate-900">
                    <span className="text-xl text-slate-400 mr-1">₹</span>
                    {splitAmount.toFixed(2)}
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Action Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-5 pt-4 pb-8 flex gap-3 z-20">
              
              {splitWays > 1 && (
                <button 
                  onClick={handleShareWhatsApp}
                  className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-bold rounded-2xl py-4 flex items-center justify-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  Request Share
                </button>
              )}

              <button 
                onClick={handlePayNow}
                className="flex-[2] bg-[#6DBE45] hover:bg-[#5aa337] transition-colors text-white font-bold rounded-2xl py-4 flex items-center justify-center gap-2 text-lg shadow-[0_8px_20px_rgba(109,190,69,0.2)]"
              >
                <Wallet className="w-5 h-5" />
                Pay via UPI
              </button>
              
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function OrderCountdown({ updatedAt, etaMinutes }: { updatedAt?: string, etaMinutes?: number | null }) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!updatedAt || !etaMinutes) {
      setTimeLeft('');
      return;
    }

    const targetTime = new Date(updatedAt).getTime() + etaMinutes * 60000;

    const calculateTime = () => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft('00:00');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [updatedAt, etaMinutes]);

  if (!timeLeft) return null;

  return (
    <div className="absolute -top-6 whitespace-nowrap text-[10px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded shadow-sm">
      ⏳ {timeLeft}
    </div>
  );
}
