'use client';

import { useState, useEffect, useRef } from 'react';
import { useCartStore } from '@/app/(customer-end-pages)/store/cartStore';
import CartItem from './CartItem';
import { X, ShoppingCart, Loader2, Landmark, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCheckoutStore } from '@/lib/store/useCheckoutStore';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  tableNumber: string;
  restaurantSlug: string;
}

type LoadingState = null | 'table';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(price);

export default function Cart({ isOpen, onClose, restaurantId, tableNumber, restaurantSlug }: CartProps) {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const [isLoading, setIsLoading] = useState<LoadingState>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);
  
  // Refs to track component state and prevent memory leaks
  const isMountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false); // Prevent multiple clicks
  const idempotencyKeyRef = useRef<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Reset loading state when user returns from UPI app (removed since we no longer have online payments)
  // useEffect(() => {
  //   const handleVisibilityChange = () => {
  //     if (document.visibilityState === 'visible' && isLoading === 'online') {
  //       // User returned without completing payment - reset loading state
  //       setIsLoading(null);
  //       setErrorMessage('Payment was not completed. Please try again.');
  //     }
  //   };

  //   document.addEventListener('visibilitychange', handleVisibilityChange);
  //   return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  // }, [isLoading]);

  const handleApiCall = async (url: string, body: object) => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ 
          error: `Server error: ${res.status} ${res.statusText}` 
        }));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      if (error instanceof TypeError) {
        // Network error
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      throw error;
    }
  };

  const safeSetState = (setter: () => void) => {
    if (isMountedRef.current) {
      setter();
    }
  };



  const handlePayOnTable = async () => {
    // Prevent multiple clicks
    if (isProcessingRef.current || isLoading === 'table' || orderSuccess) {
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Your cart is empty.');
      return;
    }

    // Initialize idempotency key for this checkout attempt if not already set
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = crypto.randomUUID();
    }

    // Set processing flag immediately to prevent double clicks
    isProcessingRef.current = true;
    setIsLoading('table');
    setErrorMessage(null);

    let deviceId = undefined;
    if (typeof window !== 'undefined') {
      deviceId = localStorage.getItem('qb_device_id') || undefined;
    }

    try {
      const data = await handleApiCall('/api/orders/postpaid', {
        cartItems: items,
        restaurantId,
        tableNumber,
        totalAmount: totalPrice(),
        idempotencyKey: idempotencyKeyRef.current,
        deviceId,
      });

      if (data?.success && data?.trackCode) {
        setOrderSuccess(true);
        clearCart();
        // Trigger global checkout store updates
        useCheckoutStore.getState().fetchActiveSession();
        // Small delay to show success state before opening drawer
        setTimeout(() => {
          handleClose();
          useCheckoutStore.getState().setCheckoutSheetOpen(true);
        }, 500);
      } else {
        throw new Error(data?.error || 'Failed to place postpaid order.');
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error 
        ? error.message 
        : 'An error occurred while placing your order.';
      
      console.error('Pay on table error:', error);
      safeSetState(() => {
        setErrorMessage(errMsg);
        setModalState({
          type: 'error',
          title: 'Order Failed',
          message: errMsg,
        });
      });
      // Reset processing flag on error so user can retry
      isProcessingRef.current = false;
    } finally {
      safeSetState(() => setIsLoading(null));
    }
  };
  
  const handleClose = () => {
    onClose();
    
    // Clear timeout if it exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Reset state after animation completes
    timeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setOrderSuccess(false);
        setErrorMessage(null);
        setIsLoading(null);
        isProcessingRef.current = false; // Reset processing flag
      }
    }, 300);
  };

  const disabled = items.length === 0 || !!isLoading || orderSuccess || isProcessingRef.current;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/45 backdrop-blur-[1px] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'} z-50`}
        onClick={handleClose}
      />
      <div
        className={`fixed bottom-0 left-0 right-0 z-[51] mx-auto h-[85vh] w-full max-w-2xl rounded-t-3xl border border-gray-100 bg-white shadow-2xl transition-transform duration-300 ${isOpen ? 'translate-y-0 animate-slide-up' : 'translate-y-full'}`}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100">
            <h2 className="text-xl sm:text-2xl font-bold text-[#2D3436]">Your Cart</h2>
            <button 
              onClick={handleClose} 
              className="rounded-full p-2 transition-colors hover:bg-gray-100"
              disabled={isLoading === 'table'} // Prevent closing during order placement
            >
              <X size={20} className="sm:w-6 sm:h-6" />
            </button>
          </div>
          
          {orderSuccess ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-700 p-4 sm:p-6">
              <div className="animate-pulse">
                <ShoppingCart size={40} className="sm:w-12 sm:h-12 mx-auto mb-4 text-green-500" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-green-600 mb-2">Thank You!</h3>
              <p className="text-gray-600 text-sm sm:text-base">Processing your order...</p>
              <div className="mt-4">
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-gray-400" />
              </div>
            </div>
          ) : (
            <>
              <div className="no-scrollbar flex-grow overflow-y-auto p-4 sm:p-6">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                    <ShoppingCart size={40} className="sm:w-12 sm:h-12 mb-4 text-gray-300" />
                    <p className="font-semibold text-base sm:text-lg mb-2">Your cart is empty</p>
                    <p className="text-xs sm:text-sm text-gray-400">Add some delicious items to get started!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {items.map((item) => (
                      <CartItem key={item.cartLineId} item={item} />
                    ))}
                  </div>
                )}
              </div>
              
              {items.length > 0 && (
                <div className="border-t border-gray-100 bg-gray-50 p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <span className="text-base sm:text-lg font-semibold text-gray-800">Subtotal</span>
                    <span className="text-lg sm:text-xl font-bold text-gray-900">
                      {formatPrice(totalPrice())}
                    </span>
                  </div>
                  
                  {errorMessage && (
                    <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-xs sm:text-sm">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-2">⚠️</div>
                        <div>{errorMessage}</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2 sm:space-y-3">
                    <button
                      onClick={handlePayOnTable}
                      disabled={disabled}
                      className="flex w-full items-center justify-center rounded-xl bg-[#2D3436] py-2.5 text-sm font-bold text-white transition hover:bg-[#1f2425] disabled:cursor-not-allowed disabled:opacity-50 sm:py-3 sm:text-base"
                    >
                      {isLoading === 'table' ? (
                        <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      ) : (
                        <Landmark className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                      {isLoading === 'table' ? 'Placing Order...' : 'Place Order'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Success/Error Feedback Modal */}
      <AnimatePresence>
        {modalState && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalState(null)}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
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