'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/session';

/**
 * Client-side guard: redirects to /auth-required with `next` when unauthenticated.
 * Prefer middleware (`/dashboard`) for primary protection; use this for extra client checks.
 */
export const useProtectedRoute = () => {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const { session } = await getSession();

      if (!session) {
        const pathWithQuery =
          typeof window !== 'undefined'
            ? `${window.location.pathname}${window.location.search}`
            : `${pathname || '/dashboard'}`;
        router.replace(`/auth-required?next=${encodeURIComponent(pathWithQuery)}`);
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname]);

  return { loading };
};
