"use client";

import React, { useState } from 'react';
import { Shield, Key, Smartphone, Laptop, AlertTriangle, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function SecurityPage() {
  const [isRevoking, setIsRevoking] = useState(false);

  const handleRevokeAll = () => {
    setIsRevoking(true);
    setTimeout(() => {
      toast.success('All other devices have been signed out.');
      setIsRevoking(false);
    }, 1000);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 font-sans pb-24 lg:pb-12">
      <div className="px-4 md:px-6 lg:px-8 pt-8 mb-8 border-b border-slate-200/60 pb-8 sticky top-0 bg-white/50 backdrop-blur-md z-20">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Security & Devices</h1>
        <p className="text-sm font-medium text-slate-500 mt-2">Manage your password and active sessions.</p>
      </div>

      <div className="px-4 md:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* PASSWORD CARD */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500"><Key size={20} /></div>
            <h2 className="text-xl font-black text-slate-900">Change Password</h2>
          </div>
          
          <div className="space-y-5 flex-1">
             <div>
               <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Current Password</label>
               <input 
                 type="password"
                 className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
               />
             </div>
             <div>
               <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">New Password</label>
               <input 
                 type="password"
                 className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
               />
             </div>
          </div>
          <button className="mt-6 w-full py-4 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-md">
            Update Password
          </button>
        </div>

        {/* ACTIVE SESSIONS / COMMAND CENTER */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500"><Shield size={20} /></div>
               <h2 className="text-xl font-black text-slate-900">Active Sessions</h2>
             </div>
          </div>
          
          <div className="flex-1 space-y-4">
             {/* Current Device */}
             <div className="p-4 rounded-2xl border border-[#6DBE45]/30 bg-[#6DBE45]/5 flex items-center gap-4">
                <Laptop className="text-[#4A8F2F] shrink-0" size={24} />
                <div className="flex-1">
                   <h4 className="font-bold text-slate-900">MacBook Pro (Current)</h4>
                   <p className="text-xs font-semibold text-slate-500 mt-0.5">Chrome • New Delhi, India</p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#6DBE45] bg-white px-2 py-1 rounded-md shadow-sm">Active</span>
             </div>

             {/* Other Devices */}
             <div className="p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors flex items-center gap-4">
                <Smartphone className="text-slate-400 shrink-0" size={24} />
                <div className="flex-1">
                   <h4 className="font-bold text-slate-900">Counter iPad</h4>
                   <p className="text-xs font-semibold text-slate-400 mt-0.5">Safari • Mumbai, India</p>
                </div>
             </div>
             
             <div className="p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors flex items-center gap-4">
                <Smartphone className="text-slate-400 shrink-0" size={24} />
                <div className="flex-1">
                   <h4 className="font-bold text-slate-900">Manager's iPhone</h4>
                   <p className="text-xs font-semibold text-slate-400 mt-0.5">App • New Delhi, India</p>
                </div>
             </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
             <div className="flex items-start gap-3 p-4 bg-rose-50 rounded-2xl mb-4 text-rose-600">
               <AlertTriangle className="shrink-0 mt-0.5" size={18} />
               <p className="text-xs font-semibold leading-relaxed">Signing out will immediately revoke access to all other POS and mobile devices logged into this account.</p>
             </div>
             <button 
               onClick={handleRevokeAll}
               disabled={isRevoking}
               className="w-full py-4 rounded-xl font-bold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
             >
               <LogOut size={18} />
               {isRevoking ? 'Revoking...' : 'Sign Out All Other Devices'}
             </button>
          </div>
        </div>

      </div>
    </div>
  );
}
