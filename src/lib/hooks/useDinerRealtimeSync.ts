import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export function useDinerRealtimeSync(tableId: string | undefined, currentSessionId: string | undefined) {
  const [isLockedByRealtime, setIsLockedByRealtime] = useState(false);
  const [isSessionRevoked, setIsSessionRevoked] = useState(false);

  useEffect(() => {
    if (!tableId) return;

    let mounted = true;

    const channel = supabase.channel(`diner_realtime_${tableId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tables', filter: `id=eq.${tableId}` },
        (payload) => {
          if (!mounted) return;
          
          const newRecord = payload.new as any;
          
          if (newRecord.is_locked === true) {
            setIsLockedByRealtime(true);
          } else if (newRecord.is_locked === false) {
            setIsLockedByRealtime(false);
          }

          if (currentSessionId && newRecord.current_session_id !== currentSessionId) {
            // The active session on this table changed or was nullified (Clear Table)
            setIsSessionRevoked(true);
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [tableId, currentSessionId]);

  return { isLockedByRealtime, isSessionRevoked };
}
