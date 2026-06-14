import { Suspense } from 'react';
import { AuthRequiredContent } from './AuthRequiredContent';

function AuthRequiredFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="h-64 w-full max-w-md animate-pulse rounded-2xl bg-white shadow-lg" />
    </div>
  );
}

export default function AuthRequiredPage() {
  return (
    <Suspense fallback={<AuthRequiredFallback />}>
      <AuthRequiredContent />
    </Suspense>
  );
}
