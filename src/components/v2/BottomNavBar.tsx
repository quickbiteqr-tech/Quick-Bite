"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, UserCircle2, Shield, Receipt, Menu as MenuIcon, X } from "lucide-react";
import { logout } from "@/lib/auth/logout";

export function BottomNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
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
    { name: "Floor", href: "/dashboard", icon: <Receipt /> },
    { name: "Queue", href: "/dashboard/queue", icon: "/order-food.png" },
    { name: "Menu", href: "/dashboard/menu", icon: "/fork.png" },
  ];

  const secondaryLinks = [
    { name: "Analytics", href: "/dashboard/analytics", icon: "/monitor.png" },
    { name: "Tables", href: "/dashboard/tables", icon: "/dinner-table.png" },
    { name: "Profile", href: "/dashboard/profile", icon: <UserCircle2 /> },
    { name: "Security", href: "/dashboard/security", icon: <Shield /> },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 z-50 pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {primaryLinks.map((link) => {
            const isActive = link.href === "/dashboard"
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center justify-center w-full h-full gap-1"
                onClick={() => setIsMoreOpen(false)}
              >
                <div
                  className={`flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? "h-8 w-14 bg-[#6DBE45] shadow-sm rounded-full text-white"
                      : "h-8 w-14 text-slate-500"
                  }`}
                >
                  {typeof link.icon === "string" ? (
                    <Image
                      src={link.icon}
                      alt={link.name}
                      width={20}
                      height={20}
                      className={`h-5 w-5 transition-all duration-300 ${
                        isActive ? "brightness-0 invert" : "brightness-0 opacity-60"
                      }`}
                    />
                  ) : (
                    React.cloneElement(link.icon as React.ReactElement<{ className?: string }>, {
                      className: `h-5 w-5 ${isActive ? "text-white" : "text-slate-500"}`,
                    })
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium ${
                    isActive ? "text-[#4A8F2F]" : "text-slate-500"
                  }`}
                >
                  {link.name}
                </span>
              </Link>
            );
          })}

          <button
            onClick={() => setIsMoreOpen(true)}
            className="flex flex-col items-center justify-center w-full h-full gap-1"
          >
            <div
              className={`flex items-center justify-center h-8 w-14 text-slate-500 transition-all duration-300 ${
                isMoreOpen ? "bg-slate-100 rounded-full" : ""
              }`}
            >
              <MenuIcon className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium text-slate-500">More</span>
          </button>
        </div>
      </nav>

      {/* Framer Motion Bottom Sheet */}
      <AnimatePresence>
        {isMoreOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreOpen(false)}
              className="fixed inset-0 bg-black/40 z-[60] lg:hidden"
            />
            
            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 w-full bg-white rounded-t-3xl shadow-2xl z-[70] lg:hidden pb-[env(safe-area-inset-bottom)]"
            >
              <div className="flex flex-col p-5">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />

                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-800">More Options</h3>
                  <button
                    onClick={() => setIsMoreOpen(false)}
                    className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-6">
                  {secondaryLinks.map((link) => {
                    const isActive = link.href === "/dashboard"
                      ? pathname === link.href
                      : pathname === link.href || pathname.startsWith(`${link.href}/`);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsMoreOpen(false)}
                        className="flex flex-col items-center gap-2 group"
                      >
                        <div
                          className={`flex items-center justify-center h-16 w-16 rounded-2xl transition-all duration-300 ${
                            isActive
                              ? "bg-[#6DBE45] shadow-md text-white"
                              : "bg-slate-50 border border-slate-100 text-slate-500 group-hover:bg-slate-100 group-hover:border-slate-200"
                          }`}
                        >
                          {typeof link.icon === "string" ? (
                            <Image
                              src={link.icon}
                              alt={link.name}
                              width={24}
                              height={24}
                              className={`h-6 w-6 transition-all duration-300 ${
                                isActive ? "brightness-0 invert" : "brightness-0 opacity-60"
                              }`}
                            />
                          ) : (
                            React.cloneElement(link.icon as React.ReactElement<{ className?: string }>, {
                              className: `h-6 w-6 ${isActive ? "text-white" : "text-slate-500"}`,
                            })
                          )}
                        </div>
                        <span
                          className={`text-xs font-medium text-center ${
                            isActive ? "text-[#4A8F2F]" : "text-slate-600"
                          }`}
                        >
                          {link.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-2 pt-4 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-50 p-4 text-red-600 font-semibold transition-colors hover:bg-red-100 disabled:opacity-50"
                  >
                    <LogOut className="h-5 w-5" />
                    {loading ? "Logging out..." : "Logout"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
