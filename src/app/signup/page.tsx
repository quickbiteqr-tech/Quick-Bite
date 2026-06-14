import { Suspense } from 'react';
import AuthSlider from '@/components/auth/AuthSlider';

function AuthFallback() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl h-[700px] md:h-[600px] bg-white rounded-2xl shadow-2xl animate-pulse"></div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <AuthSlider defaultMode="signup" />
    </Suspense>
  );
}
