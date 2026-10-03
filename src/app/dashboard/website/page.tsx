"use client";

import React, { useState } from 'react';
import { ExternalLink, Copy, MapPin, Clock, Globe } from 'lucide-react';
import { toast } from 'sonner';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WebsitePage() {
  const [activeDays, setActiveDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://quickbite.com/my-restaurant');
    toast.success('Public link copied to clipboard!');
  };

  const toggleDay = (day: string) => {
    setActiveDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 font-sans pb-24 lg:pb-12">
      <div className="px-4 md:px-6 lg:px-8 pt-8 mb-8 border-b border-slate-200/60 pb-8 sticky top-0 bg-white/50 backdrop-blur-md z-20 flex justify-between items-end">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Digital Storefront</h1>
          <p className="text-sm font-medium text-slate-500 mt-2">Your public launchpad for the web.</p>
        </div>
        <button 
          onClick={handleCopyLink}
          className="hidden md:flex items-center gap-2 bg-[#6DBE45] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-[0_4px_14px_rgba(109,190,69,0.3)] hover:bg-[#5aa337] transition-all"
        >
          <Copy size={16} /> Copy Public Link
        </button>
      </div>

      <div className="px-4 md:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LIVE LINK CARD */}
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
           <div className="absolute -right-10 -top-10 opacity-10 text-white pointer-events-none">
             <Globe size={200} />
           </div>
           <div className="relative z-10">
             <h2 className="text-xl font-black text-white">Your website is live</h2>
             <p className="text-slate-400 text-sm mt-1">Add this link to your Instagram bio or Google Maps profile.</p>
             <div className="mt-4 flex items-center gap-3 bg-slate-800 rounded-xl p-1 w-full max-w-md">
                <span className="px-4 text-sm font-semibold text-slate-300 truncate">quickbite.com/my-restaurant</span>
                <button onClick={handleCopyLink} className="bg-white text-slate-900 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors whitespace-nowrap">
                  Copy Link
                </button>
             </div>
           </div>
        </div>

        {/* TIMINGS UI */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><Clock size={20} /></div>
            <h2 className="text-xl font-black text-slate-900">Operating Hours</h2>
          </div>
          
          <div className="flex-1 space-y-8">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Active Days</label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => (
                  <button 
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      activeDays.includes(day) ? 'bg-[#6DBE45] text-white shadow-md shadow-[#6DBE45]/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Opening Time</label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 flex justify-between items-center cursor-text">
                  <span>10:00</span>
                  <span className="text-slate-400 text-xs font-black">AM</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Closing Time</label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 flex justify-between items-center cursor-text">
                  <span>11:30</span>
                  <span className="text-slate-400 text-xs font-black">PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LOCATION UI */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500"><MapPin size={20} /></div>
            <h2 className="text-xl font-black text-slate-900">Location</h2>
          </div>
          
          <div className="space-y-6">
             <div>
               <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Physical Address</label>
               <textarea 
                 rows={3}
                 placeholder="123 Main Street..."
                 className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/30 focus:border-[#6DBE45] transition-all resize-none"
               />
             </div>
             <div>
               <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Google Maps Link</label>
               <input 
                 type="url"
                 placeholder="https://maps.google.com/..."
                 className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/30 focus:border-[#6DBE45] transition-all"
               />
             </div>
             
             {/* Map Placeholder */}
             <div className="h-32 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                <MapPin className="text-slate-400 relative z-10" size={32} />
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
