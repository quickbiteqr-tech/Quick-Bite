'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSafeReturnPath } from '@/lib/auth/return-path';

const REDIRECT_MS = 5000;

export function AuthRequiredContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeReturnPath(searchParams.get('next'));
  const signupHref = `/signup?next=${encodeURIComponent(nextPath)}`;
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(REDIRECT_MS / 1000));
  const [autoRedirectCancelled, setAutoRedirectCancelled] = useState(false);

  useEffect(() => {
    if (autoRedirectCancelled) return;

    const interval = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);

    const t = window.setTimeout(() => {
      router.replace(signupHref);
    }, REDIRECT_MS);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(t);
    };
  }, [router, signupHref, autoRedirectCancelled]);

  const cancelAutoRedirect = () => {
    setAutoRedirectCancelled(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-[#6DBE45] selection:text-white">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6DBE45] shadow-sm">
            <UserPlus className="h-7 w-7 text-white" aria-hidden />
          </div>
        </div>
        <h1 className="text-center text-2xl font-bold tracking-tight text-slate-900">
          You&apos;re not signed in
        </h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-slate-600">
          Sign in to your account or create one to use the restaurant dashboard. You can log in if you
          already have access, or continue to create a new account.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            className="w-full bg-[#6DBE45] text-white hover:bg-[#5aad3d] sm:w-auto"
            size="lg"
          >
            <Link href={signupHref} onClick={cancelAutoRedirect}>
              <UserPlus className="h-4 w-4" />
              Create account
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full border-slate-200 sm:w-auto" size="lg">
            <Link href={loginHref} onClick={cancelAutoRedirect}>
              <LogIn className="h-4 w-4" />
              Log in
            </Link>
          </Button>
        </div>

        {!autoRedirectCancelled ? (
          <p className="mt-6 text-center text-xs text-slate-500">
            Redirecting to sign up in{' '}
            <span className="font-semibold tabular-nums text-slate-700">{secondsLeft}</span>s —{' '}
            <button
              type="button"
              onClick={cancelAutoRedirect}
              className="font-medium text-[#6DBE45] underline-offset-2 hover:underline"
            >
              Stay on this page
            </button>
          </p>
        ) : (
          <p className="mt-6 text-center text-xs text-slate-500">Auto-redirect cancelled.</p>
        )}

        <div className="mt-6 flex justify-center">
          <Button asChild variant="outline" className="border-slate-200">
            <Link href="/" onClick={cancelAutoRedirect}>
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
