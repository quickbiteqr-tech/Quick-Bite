'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateQR } from '@/lib/api/generateQR';
import { supabase } from '@/lib/supabase/client';
import { CheckCircle2, AlertCircle, Download, Eye, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QRModal from '@/components/QRModal';

type Restaurant = {
  id: string;
  owner_name: string;
  restaurant_name: string;
  email: string;
  phone: string;
  address: string;
  upi_id: string;
  logo_url: string | null;
  qr_url: string;
  created_at: Date | null;
  user_id: string;
  slug: string;
};

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-[#6DBE45] focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/20 sm:text-base';

export default function AddTablePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [tableNumber, setTableNumber] = useState<number>();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalState, setModalState] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);

  useEffect(() => {
    const fetchRestaurant = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.from('restaurants').select('*').eq('user_id', user.id).single();
      if (error) {
        setLoading(false);
        return;
      }
      setRestaurant(data);
      setLoading(false);
    };
    fetchRestaurant();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalState(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const tableNumberRaw = formData.get('tableNumber') as string;
    const num = Number(tableNumberRaw);
    setTableNumber(num);
    
    const restaurantSlug = restaurant?.slug;
    const restaurantId = restaurant?.id;
    
    if (!restaurantSlug || !restaurantId) {
      setModalState({ type: 'error', title: 'Error', message: 'Restaurant details not found.' });
      setIsSubmitting(false);
      return;
    }

    try {
      
      const response = await generateQR(restaurantSlug, restaurantId, num);

      if (response && typeof response === 'object' && response.tableId) {
        setModalState({
          type: 'success',
          title: 'Table Created!',
          message: `Table ${num} has been successfully added to your restaurant.`,
        });
      }
      
    } catch (error: any) {
      console.error("Failed to create table:", error);
      
      let errMsg = "Something went wrong generating the QR code.";
      if (error.message?.includes('already exists')) {
        errMsg = error.message.replace('Failed to generate QR: ', ''); 
      }
      
      setModalState({
        type: 'error',
        title: 'Failed to Add Table',
        message: errMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mx-auto max-w-lg font-sans text-slate-800 selection:bg-[#6DBE45] selection:text-white">
        <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#6DBE45]/12 via-white to-slate-50/80"
            aria-hidden
          />
          <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:border-[#6DBE45]/40 hover:text-[#6DBE45]"
              aria-label="Go back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6DBE45]">New table</p>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900">Add table</h1>
              <p className="mt-1 text-sm text-slate-500">We&apos;ll create the QR after you save.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <label htmlFor="tableNumber" className="mb-2 block text-sm font-semibold text-slate-800">
              Table number <span className="text-red-500">*</span>
            </label>
            <input
              id="tableNumber"
              type="text"
              name="tableNumber"
              value={tableNumber ?? ''}
              onChange={(e) => setTableNumber(Number(e.target.value))}
              className={inputClass}
              placeholder="e.g. 4"
              required
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#6DBE45] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(109,190,69,0.25)] transition-all hover:bg-[#5aa337] disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : 'Save table'}
            </button>
          </div>
        </form>
      </div>

      {/* Success/Error Feedback Modal */}
      <AnimatePresence>
        {modalState && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (modalState.type === 'success') {
                router.push('/dashboard/tables');
              } else {
                setModalState(null);
              }
            }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${modalState.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {modalState.type === 'success' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-900">
                  {modalState.title}
                </h3>
                <p className="mb-8 text-sm leading-relaxed text-slate-600">
                  {modalState.message}
                </p>
                
                <button
                  onClick={() => {
                    if (modalState.type === 'success') {
                      router.push('/dashboard/tables');
                    } else {
                      setModalState(null);
                    }
                  }}
                  className={`w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-sm transition-transform active:scale-[0.98] ${modalState.type === 'success' ? 'bg-[#6DBE45] hover:bg-[#5aa337]' : 'bg-slate-900 hover:bg-slate-800'}`}
                >
                  {modalState.type === 'success' ? 'View QR Codes' : 'Try Again'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
