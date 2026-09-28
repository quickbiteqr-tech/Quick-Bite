"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut, UserCircle2, Shield, Receipt } from "lucide-react";
import { logout } from "@/lib/auth/logout";

export function SlimSidebar() {
  const pathname = usePathname();
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

  const primaryLinks = [
    { name: "Floor", href: "/v2-dashboard", icon: <Receipt /> },
    { name: "Queue", href: "/v2-dashboard/queue", icon: "/order-food.png" },
    { name: "Menu", href: "/v2-dashboard/menu", icon: "/fork.png" },
  ];

  const secondaryLinks = [
    { name: "Analytics", href: "/v2-dashboard/analytics", icon: "/monitor.png" },
    { name: "Tables", href: "/v2-dashboard/tables", icon: "/dinner-table.png" },
    { name: "Profile", href: "/v2-dashboard/profile", icon: <UserCircle2 /> },
    { name: "Security", href: "/v2-dashboard/security", icon: <Shield /> },
  ];

  const NavItem = ({ href, icon, label }: { href: string; icon: any; label: string }) => {
    const isActive = href === "/v2-dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

    return (
      <Link
        href={href}
        className={`group relative flex items-center gap-3 rounded-xl p-2 transition-all duration-300 ${
          isActive
            ? "bg-[#6DBE45]/15 text-[#4A8F2F]"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
        }`}
        title={label}
      >
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
            isActive
              ? "bg-[#6DBE45] shadow-sm text-white"
              : "bg-transparent text-slate-500"
          }`}
        >
          {typeof icon === "string" ? (
            <Image
              src={icon}
              alt={label}
              width={22}
              height={22}
              className={`h-5 w-5 transition-all duration-300 ${
                isActive ? "brightness-0 invert" : "brightness-0 opacity-60"
              }`}
            />
          ) : (
            React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "h-5 w-5" })
          )}
        </div>
        <span className="whitespace-nowrap font-medium text-sm overflow-hidden transition-all duration-300 max-w-0 opacity-0 group-hover/sidebar:max-w-[200px] group-hover/sidebar:opacity-100 group-hover/sidebar:ml-1">
          {label}
        </span>
      </Link>
    );
  };

  return (
    <aside className="group/sidebar hidden lg:flex flex-col bg-white border-r border-slate-200 h-screen w-20 hover:w-64 transition-all duration-300 z-50 overflow-hidden sticky top-0 left-0 shadow-sm">
      {/* Brand / Logo Area */}
      <div className="flex items-center gap-3 p-4 shrink-0 border-b border-slate-100">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 shadow-sm text-white">
          <Image
            src="/scanner.png"
            alt="Logo"
            width={22}
            height={22}
            className="h-5 w-5 brightness-0 invert"
          />
        </div>
        <span className="whitespace-nowrap font-bold text-lg text-slate-800 overflow-hidden transition-all duration-300 max-w-0 opacity-0 group-hover/sidebar:max-w-[200px] group-hover/sidebar:opacity-100 group-hover/sidebar:ml-1">
          QuickBite
        </span>
      </div>

      <div className="flex flex-col flex-1 px-3 py-6 overflow-y-auto gap-8 overflow-x-hidden no-scrollbar">
        {/* Primary Links */}
        <div className="flex flex-col gap-2">
          <div className="opacity-0 max-w-0 h-0 text-xs font-semibold text-slate-400 uppercase tracking-wider pl-3 transition-all duration-300 overflow-hidden group-hover/sidebar:max-w-[200px] group-hover/sidebar:opacity-100 group-hover/sidebar:h-auto group-hover/sidebar:mb-2">
            Main Menu
          </div>
          {primaryLinks.map((link) => (
            <NavItem key={link.href} {...link} label={link.name} />
          ))}
        </div>

        {/* Secondary Links */}
        <div className="flex flex-col gap-2 mt-auto">
          <div className="opacity-0 max-w-0 h-0 text-xs font-semibold text-slate-400 uppercase tracking-wider pl-3 transition-all duration-300 overflow-hidden group-hover/sidebar:max-w-[200px] group-hover/sidebar:opacity-100 group-hover/sidebar:h-auto group-hover/sidebar:mb-2">
            Settings
          </div>
          {secondaryLinks.map((link) => (
            <NavItem key={link.href} {...link} label={link.name} />
          ))}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={loading}
            className="group relative flex items-center gap-3 rounded-xl p-2 transition-all duration-300 text-red-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            title="Logout"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-transparent text-red-500 transition-all duration-300">
              <LogOut className="h-5 w-5" />
            </div>
            <span className="whitespace-nowrap font-medium text-sm overflow-hidden transition-all duration-300 max-w-0 opacity-0 group-hover/sidebar:max-w-[200px] group-hover/sidebar:opacity-100 group-hover/sidebar:ml-1 text-left">
              {loading ? "Logging out..." : "Logout"}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
