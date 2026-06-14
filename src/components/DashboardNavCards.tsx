// src->components->DashboardNavCards.tsx - "use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut, UserCircle2 } from "lucide-react";
import { logout } from "@/lib/auth/logout";

interface DashboardNavCardsProps {
  onClose?: () => void;
}

export function DashboardNavCards({ onClose }: DashboardNavCardsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout(); 
      router.push("/login"); 
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const navItemClass =
    "group flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 text-left shadow-sm transition-all duration-200 hover:border-[#6DBE45]/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6DBE45]/30";

  const iconWrapClass =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#6DBE45] shadow-sm";

  return (
    <div className="flex h-full w-64 flex-col gap-2 border-r border-slate-100 bg-white p-3 sm:p-4">
      {/* Home / Brand */}
      <Link
        href="/dashboard"
        onClick={handleLinkClick}
        className={`${navItemClass} ring-1 ring-[#6DBE45]/20`}
      >
        <div className={iconWrapClass}>
          <Image src="/scanner.png" alt="" width={22} height={22} className="h-5 w-5 brightness-0 invert" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-slate-500">Dashboard</div>
        </div>
      </Link>

      <Link href="/dashboard/menu" onClick={handleLinkClick} className={navItemClass}>
        <div className={iconWrapClass}>
          <Image src="/fork.png" alt="" width={22} height={22} className="h-5 w-5 brightness-0 invert" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-800">Menu</div>
          <div className="text-xs text-slate-500">Items & categories</div>
        </div>
      </Link>

      <Link href="/dashboard/tables" onClick={handleLinkClick} className={navItemClass}>
        <div className={iconWrapClass}>
          <Image src="/dinner-table.png" alt="" width={22} height={22} className="h-5 w-5 brightness-0 invert" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-800">Tables</div>
          <div className="text-xs text-slate-500">QR codes</div>
        </div>
      </Link>

      <Link href="/dashboard/orders" onClick={handleLinkClick} className={navItemClass}>
        <div className={iconWrapClass}>
          <Image src="/order-food.png" alt="" width={22} height={22} className="h-5 w-5 brightness-0 invert" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-800">Orders</div>
          <div className="text-xs text-slate-500">Live queue</div>
        </div>
      </Link>

      <Link href="/dashboard/analytics" onClick={handleLinkClick} className={navItemClass}>
        <div className={iconWrapClass}>
          <Image src="/monitor.png" alt="" width={22} height={22} className="h-5 w-5 brightness-0 invert" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-800">Analytics</div>
          <div className="text-xs text-slate-500">Insights</div>
        </div>
      </Link>

      <Link href="/dashboard/profile" onClick={handleLinkClick} className={navItemClass}>
        <div className={iconWrapClass}>
          <UserCircle2 className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-800">Profile</div>
          <div className="text-xs text-slate-500">Account details</div>
        </div>
      </Link>

      <Link href="/get-website" onClick={handleLinkClick} className={navItemClass}>
        <div className={iconWrapClass}>
          <Image src="/globe.svg" alt="" width={22} height={22} className="h-5 w-5 brightness-0 invert" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-800">Get a website</div>
          <div className="text-xs text-slate-500">Venue &amp; contact</div>
        </div>
      </Link>

      <div className="mt-auto pt-4">
        <button
          onClick={handleLogout}
          disabled={loading}
          className="flex w-full items-center gap-3 rounded-xl border border-red-100 bg-red-50/80 p-3 text-left transition-colors hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm">
            <LogOut className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-800">
              {loading ? "Logging out…" : "Logout"}
            </div>
            <div className="text-xs text-slate-500">End session</div>
          </div>
        </button>
      </div>
    </div>
  );
}