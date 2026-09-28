import React from "react";
import { SlimSidebar } from "@/components/v2/SlimSidebar";
import { BottomNavBar } from "@/components/v2/BottomNavBar";

export default function V2DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-900 font-sans">
      <SlimSidebar />
      
      <main className="flex-1 flex flex-col h-full relative overflow-y-auto pb-20 lg:pb-0 scroll-smooth">
        <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>

      <BottomNavBar />
    </div>
  );
}
