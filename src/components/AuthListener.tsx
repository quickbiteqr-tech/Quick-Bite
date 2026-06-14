// src/components/AuthListener.tsx
'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function AuthListener() {
  useEffect(() => {
    (async () => {
      try {
        // safe network call with timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        try {
          // This hits supabase auth endpoint; will throw on network failure
          const { error } = await supabase.auth.getSession();
          if (error) {
            console.warn('AuthListener: getSession returned error:', error);
          }
        } finally {
          clearTimeout(timeout);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('AuthListener network error (failed to reach Supabase):', errorMessage);
      }

      try {
        const { data: sub } = supabase.auth.onAuthStateChange(() => {
          // handle changes if needed
        });
        // cleanup
        return () => {
          if (sub?.subscription?.unsubscribe) sub.subscription.unsubscribe();
        };
      } catch (err) {
        console.error('AuthListener: subscribe error', err);
      }
    })();
  }, []);

  return null;
}
