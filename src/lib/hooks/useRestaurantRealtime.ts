import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export interface ServiceRequest {
  id: string;
  table_number: string;
  request_type: string;
  status: string;
  created_at: string;
  ip_address: string;
}

export function useRestaurantRealtime(restaurantId: string | null) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize sound preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('qr_bell_sound');
    if (saved) setSoundEnabled(saved === 'true');
  }, []);

  const playDing = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      
      // If browser suspended audio context, try to resume
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1); // Drop to A4
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 1);
    } catch (error) {
      console.warn("Audio playback failed (likely blocked by browser autoplay policy):", error);
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('qr_bell_sound', String(next));
    if (next) playDing(); // Test the sound when enabling (user interaction bypasses autoplay block)
  };

  useEffect(() => {
    if (!restaurantId) return;

    let mounted = true;

    const fetchInitialData = async () => {
      const { data: initialRequests, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (initialRequests && mounted && !error) {
        setRequests(initialRequests);
      }
    };

    fetchInitialData();

    const channel = supabase.channel(`restaurant_realtime_${restaurantId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'service_requests', filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          if (payload.new.status === 'pending') {
            const newReq = payload.new as ServiceRequest;
            
            // Prepend new request instantly
            setRequests(prev => [newReq, ...prev]);
            
            // Trigger visual Toast notification
            toast.success(`🔔 Table ${newReq.table_number} requested ${newReq.request_type}`, {
              duration: 5000,
            });

            // Trigger HTML5 / Web Audio chime
            const isSoundOn = localStorage.getItem('qr_bell_sound') === 'true';
            if (isSoundOn) {
              playDing();
            }
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      // Cleanup prevents memory leaks
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  return {
    requests,
    setRequests,
    soundEnabled,
    toggleSound,
    playDing
  };
}
