"use client";

import React, { useState, useEffect } from 'react';
import { Camera, Save, Loader2, UploadCloud } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function ProfilePage() {
  const [restaurantName, setRestaurantName] = useState('My Restaurant');
  const [ownerName, setOwnerName] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('restaurants').select('*').eq('user_id', user.id).single();
      if (data) {
        setRestaurantName(data.restaurant_name || '');
        setOwnerName(data.owner_name || '');
        setLogoPreview(data.logo_url || null);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setTimeout(() => {
      toast.success('Brand profile updated successfully.');
      setIsSaving(false);
    }, 800);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 font-sans pb-24 lg:pb-12">
      <div className="px-4 md:px-6 lg:px-8 pt-8 mb-8 border-b border-slate-200/60 pb-8 sticky top-0 bg-white/50 backdrop-blur-md z-20">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Brand Profile</h1>
        <p className="text-sm font-medium text-slate-500 mt-2">Manage your restaurant's digital identity.</p>
      </div>

      <div className="px-4 md:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* LEFT: EDIT FORM */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 mb-6">Identity Details</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Restaurant Name</label>
                <input 
                  type="text" 
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/30 focus:border-[#6DBE45] transition-all"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Owner Name</label>
                <input 
                  type="text" 
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/30 focus:border-[#6DBE45] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Restaurant Logo</label>
                <div className="w-full border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group flex flex-col items-center justify-center py-10 relative overflow-hidden">
                   {logoPreview ? (
                     <div className="flex flex-col items-center gap-4">
                       <img src={logoPreview} alt="Logo" className="w-24 h-24 rounded-2xl object-cover shadow-sm" />
                       <span className="text-xs font-bold text-slate-500 group-hover:text-[#6DBE45]">Click to change logo</span>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center gap-3">
                       <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-[#6DBE45]">
                         <UploadCloud size={24} />
                       </div>
                       <p className="text-sm font-bold text-slate-600">Drag & drop or click to upload</p>
                       <p className="text-xs font-semibold text-slate-400">PNG, JPG up to 2MB</p>
                     </div>
                   )}
                </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-4 rounded-xl font-bold text-white bg-[#6DBE45] hover:bg-[#5aa337] transition-all shadow-[0_4px_14px_rgba(109,190,69,0.3)] flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                Save Brand Profile
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: LIVE MOBILE PREVIEW */}
        <div className="hidden lg:flex items-center justify-center sticky top-32 h-[calc(100vh-10rem)]">
           <div className="w-[320px] h-[650px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl relative">
              {/* Notch */}
              <div className="absolute top-0 inset-x-0 h-7 flex justify-center z-20">
                 <div className="w-24 h-6 bg-slate-900 rounded-b-xl" />
              </div>
              {/* Screen */}
              <div className="w-full h-full bg-white rounded-[2.25rem] overflow-hidden flex flex-col relative">
                 {/* Mock Diner Header */}
                 <div className="h-48 bg-slate-100 relative">
                    <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover opacity-80" alt="Cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                    
                    <div className="absolute bottom-6 left-6 flex items-center gap-4">
                       <div className="w-14 h-14 bg-white rounded-2xl p-1 shadow-lg">
                          {logoPreview ? (
                            <img src={logoPreview} className="w-full h-full object-cover rounded-xl" alt="Logo" />
                          ) : (
                            <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-slate-300"><Camera size={20}/></div>
                          )}
                       </div>
                       <div>
                         <h2 className="text-xl font-black text-white">{restaurantName || 'Your Restaurant'}</h2>
                         <p className="text-[10px] font-bold text-[#6DBE45] uppercase tracking-wider mt-1">Live Preview</p>
                       </div>
                    </div>
                 </div>
                 {/* Mock Menu List */}
                 <div className="p-6 space-y-4">
                    <div className="h-6 w-1/3 bg-slate-200 rounded-lg animate-pulse" />
                    <div className="h-20 w-full bg-slate-100 rounded-2xl animate-pulse" />
                    <div className="h-20 w-full bg-slate-100 rounded-2xl animate-pulse" />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
