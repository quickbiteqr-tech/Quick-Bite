'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Wallet, Loader2 } from 'lucide-react';

function PaymentRedirector() {
  const searchParams = useSearchParams();
  const [hasAttemptedRedirect, setHasAttemptedRedirect] = useState(false);

  const pa = searchParams.get('pa') || '';
  const pn = searchParams.get('pn') || '';
  const am = searchParams.get('am') || '';

  // Construct the native intent
  const intent = `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR`;

  useEffect(() => {
    if (pa && am) {
      // Instantly attempt redirect
      window.location.href = intent;
      setHasAttemptedRedirect(true);
    }
  }, [intent, pa, am]);

  if (!pa || !am) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold">!</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Invalid Payment Link</h1>
          <p className="text-sm text-slate-500">The payment details are missing or incomplete.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-100 max-w-sm w-full text-center">
        
        <div className="w-16 h-16 bg-[#6DBE45]/10 text-[#6DBE45] rounded-full flex items-center justify-center mx-auto mb-6">
          <Wallet className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          ₹{am}
        </h1>
        <p className="text-sm font-medium text-slate-500 mb-8">
          Paying <span className="text-slate-800 font-bold">{decodeURIComponent(pn)}</span>
        </p>

        {!hasAttemptedRedirect ? (
          <div className="flex flex-col items-center justify-center gap-3 text-slate-500 mb-6">
            <Loader2 className="w-6 h-6 animate-spin text-[#6DBE45]" />
            <p className="text-sm">Opening UPI app...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <a 
              href={intent}
              className="w-full bg-[#6DBE45] hover:bg-[#5aa337] transition-colors text-white font-bold rounded-xl py-4 flex items-center justify-center shadow-[0_8px_20px_rgba(109,190,69,0.2)]"
            >
              Pay via Any UPI App
            </a>
            <p className="text-xs font-medium text-slate-400">
              If your UPI app didn't open automatically, tap the button above.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#6DBE45]" />
      </div>
    }>
      <PaymentRedirector />
    </Suspense>
  );
}
