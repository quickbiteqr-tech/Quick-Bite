"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Volume2, VolumeX, Utensils, MessageSquareWarning } from "lucide-react";

export function GlobalRealtimeListener() {
  const pathname = usePathname();
  const router = useRouter();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  
  // Audio State & Refs
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const tableMapRef = useRef<Record<string, string>>({});

  // Initialize Audio Context & Fetch Restaurant ID
  useEffect(() => {

    const fetchRestaurant = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("restaurants")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setRestaurantId(data.id);
        
        // Fetch tables to resolve table_id -> table_number for order payloads
        const { data: tablesData } = await supabase
          .from("tables")
          .select("id, table_number")
          .eq("restaurant_id", data.id);
          
        if (tablesData) {
          const map: Record<string, string> = {};
          tablesData.forEach(t => map[t.id] = String(t.table_number));
          tableMapRef.current = map;
        }
      }
    };

    fetchRestaurant();
  }, []);

  const playChime = useCallback(() => {
    if (!isAudioEnabled) return;
    
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch (A5)
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1); // Drop to (A4)
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05); // Fade in
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5); // Fade out
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.log("Web Audio API chime failed:", e);
    }
  }, [isAudioEnabled]);

  // Global Click Listener to unlock Audio Context (Autoplay Bypass)
  useEffect(() => {
    const unlockAudio = () => {
      if (!isAudioEnabled) setIsAudioEnabled(true);
      window.removeEventListener("click", unlockAudio);
    };
    window.addEventListener("click", unlockAudio);
    return () => window.removeEventListener("click", unlockAudio);
  }, [isAudioEnabled]);

  // Supabase Realtime Channel
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel("global-dashboard-listener")
      // Listen to Orders
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const tableNum = payload.new.table_number || tableMapRef.current[payload.new.table_id] || "Unknown";
          playChime();
          
          // Route Awareness: Don't show toast if already on Queue page
          if (pathname !== "/v2-dashboard/queue") {
            toast.custom((t) => (
              <div className="flex w-full items-center gap-4 rounded-xl border-l-4 border-l-[#6DBE45] bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6DBE45]/10 text-[#6DBE45]">
                  <Utensils size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-black text-slate-900">New Order: Table {tableNum}</h3>
                  <p className="text-xs font-semibold text-slate-500">A new order just dropped in.</p>
                </div>
                <button
                  onClick={() => {
                    toast.dismiss(t);
                    router.push("/v2-dashboard/queue");
                  }}
                  className="rounded-lg bg-[#6DBE45] px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#5aa337] transition-colors"
                >
                  Go to Queue
                </button>
              </div>
            ), { duration: 6000 });
          }
        }
      )
      // Listen to Service Requests
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "service_requests",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const tableNum = payload.new.table_number || "Unknown";
          const reqType = payload.new.request_type || "Service";
          playChime();

          toast.custom((t) => (
            <div className="flex w-full items-center gap-4 rounded-xl border-l-4 border-l-amber-500 bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                <MessageSquareWarning size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-black text-slate-900">Service Request: Table {tableNum}</h3>
                <p className="text-xs font-semibold text-slate-500 line-clamp-1">Needs: {reqType}</p>
              </div>
              <button
                onClick={() => {
                  toast.dismiss(t);
                }}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Dismiss
              </button>
            </div>
          ), { duration: 8000 });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, pathname, router, playChime]);

  // Render a subtle floating toggle for the manager to mute audio easily
  return (
    <div className="fixed bottom-24 right-6 md:bottom-6 z-[100]">
      <button
        onClick={() => setIsAudioEnabled(!isAudioEnabled)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 shadow-lg transition-all hover:scale-105 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
        title={isAudioEnabled ? "Mute Notifications" : "Unmute Notifications"}
      >
        {isAudioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} className="text-slate-400" />}
      </button>
    </div>
  );
}
