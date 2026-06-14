"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import LiveOrders from "./orders/LiveOrders";
import { supabase } from "@/lib/supabase/client";

export default function DashboardPage() {
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    setIsOffline(!navigator.onLine);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const resolveOwnerName = (user: { user_metadata?: Record<string, unknown> } | null) => {
      if (!mounted) return;
      const rawName = user?.user_metadata?.owner_name;
      const nextName = typeof rawName === "string" ? rawName.trim() : "";
      setOwnerName(nextName);
    };

    supabase.auth
      .getUser()
      .then(({ data }) => resolveOwnerName(data.user ?? null))
      .catch(() => resolveOwnerName(null));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      resolveOwnerName(session?.user ?? null);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col font-sans text-slate-800">
      {/* Welcome — matches landing: green accent, serif headline, soft card */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#6DBE45]/12 via-white to-slate-50/80"
          aria-hidden
        />
        <div className="relative px-5 py-6 sm:px-8 sm:py-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#6DBE45]">
            Overview
          </p>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Welcome back{ownerName ? `, ${ownerName}` : ""}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
            Manage your restaurant, menu, and live orders in one place—same look
            and feel as your public site.
          </p>
        </div>
      </div>

      {isOffline && (
        <motion.div
          className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-900"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          role="status"
        >
          You&apos;re offline. Live updates may pause until you reconnect.
        </motion.div>
      )}

      <div className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white py-20 shadow-sm">
            <div
              className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-[#6DBE45]"
              aria-hidden
            />
            <p className="mt-4 text-sm text-slate-500">Loading orders…</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            Failed to load dashboard: {error}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <LiveOrders />
          </motion.div>
        )}
      </div>
    </div>
  );
}
