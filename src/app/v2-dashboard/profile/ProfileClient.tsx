'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, Save, UploadCloud, Smartphone, MapPin, Phone, CreditCard, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { updateProfile } from '@/lib/api/profile';
import { useUploadThing } from '@/lib/uploadthing';
import { compressImage } from '@/lib/utils/image-compressor';
import { invalidateCustomerMenuBundleCache } from '@/lib/api/public';
import { toast } from 'sonner';
import type { Restaurant } from '@/types/restaurant';

export type ProfileRestaurantInitial = {
  restaurant_name: string | null;
  logo_url: string | null;
  phone: string | null;
  address: string | null;
  description: string | null;
  upi_id?: string | null;
  slug?: string | null;
};

type Props = {
  userEmail: string | null;
  displayName: string;
  restaurant: ProfileRestaurantInitial | null;
  restaurantSlug?: string | null;
  signupRestaurantName?: string;
  signupPhone?: string;
  signupAddress?: string;
};

export function ProfileClient({
  userEmail,
  displayName,
  restaurant,
  restaurantSlug = null,
  signupRestaurantName = '',
  signupPhone = '',
  signupAddress = '',
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingLogoRemoval = useRef(false);

  // Exact state from V1
  const [name, setName] = useState(displayName);
  const [restaurantName, setRestaurantName] = useState(restaurant?.restaurant_name ?? signupRestaurantName ?? '');
  const [logoUrl, setLogoUrl] = useState(restaurant?.logo_url ?? '');
  const [phone, setPhone] = useState(restaurant?.phone ?? signupPhone ?? '');
  const [address, setAddress] = useState(restaurant?.address ?? signupAddress ?? '');
  const [description, setDescription] = useState(restaurant?.description ?? '');
  const [upiId, setUpiId] = useState(restaurant?.upi_id ?? '');
  const [saving, setSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const fileUrlFromUploadResult = (res: unknown): string | null => {
    if (!Array.isArray(res) || res.length === 0) return null;
    const f = res[0] as { url?: string; ufsUrl?: string };
    const u = f?.url ?? f?.ufsUrl;
    return typeof u === 'string' && u.trim().length > 0 ? u.trim() : null;
  };

  useEffect(() => {
    if (pendingLogoRemoval.current) return;
    const fromServer = restaurant?.logo_url?.trim() ?? '';
    if (!fromServer) return;
    setLogoUrl((prev) => (prev.trim() === '' ? fromServer : prev));
  }, [restaurant?.logo_url]);

  const { startUpload } = useUploadThing('restaurantLogo', {
    onClientUploadComplete: (res) => {
      setIsUploadingLogo(false);
      const url = fileUrlFromUploadResult(res);
      if (url) {
        pendingLogoRemoval.current = false;
        setLogoUrl(url);
        toast.success('Logo ready — save your profile to keep it.');
      } else {
        toast.error('Upload finished but no file URL was returned.');
      }
    },
    onUploadError: (error: Error) => {
      setIsUploadingLogo(false);
      toast.error(error?.message || 'Logo upload failed.');
    },
  });

  const displayLogoSrc = (() => {
    const t = logoUrl.trim();
    if (!t) return null;
    if (/^https?:\/\//i.test(t)) return t;
    try {
      const u = new URL(t);
      return u.protocol === 'http:' || u.protocol === 'https:' ? t : null;
    } catch {
      return null;
    }
  })();

  const isLikelyImageFile = (file: File) => {
    const t = file.type.trim().toLowerCase();
    if (t.startsWith('image/')) return true;
    if (!t || t === 'application/octet-stream') {
      return /\.(png|jpe?g|gif|webp|avif|svg|bmp|ico|heic|heif)$/i.test(file.name);
    }
    return false;
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!isLikelyImageFile(file)) {
      toast.error('Please choose an image file.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Image must be 4MB or smaller.');
      return;
    }
    setIsUploadingLogo(true);
    try {
      const compressed = await compressImage(file);
      await startUpload([compressed]);
    } catch (err) {
      setIsUploadingLogo(false);
      toast.error(err instanceof Error ? err.message : 'Upload failed.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const trimmedName = name.trim();
      if (trimmedName.length >= 2) {
        const { error: authErr } = await supabase.auth.updateUser({ data: { full_name: trimmedName } });
        if (authErr) throw authErr;
      }

      const trimmedLogo = logoUrl.trim();
      const profilePayload: Partial<Restaurant & { upi_id?: string }> = {
        restaurant_name: restaurantName.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        description: description.trim() || undefined,
        upi_id: upiId.trim() || undefined,
      };
      
      if (trimmedLogo) {
        profilePayload.logo_url = trimmedLogo;
      } else if (pendingLogoRemoval.current) {
        profilePayload.logo_url = null;
      }

      const updated = await updateProfile(profilePayload);
      pendingLogoRemoval.current = false;
      setLogoUrl(typeof updated.logo_url === 'string' ? updated.logo_url.trim() : '');

      const slugForCache = updated.slug ?? restaurantSlug ?? '';
      if (slugForCache) invalidateCustomerMenuBundleCache(slugForCache);

      toast.success('Profile updated.');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 font-sans pb-24 lg:pb-12">
      <div className="px-4 md:px-6 lg:px-8 pt-8 mb-8 border-b border-slate-200/60 pb-8 sticky top-0 bg-white/50 backdrop-blur-md z-20 flex justify-between items-end">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Brand & Operations</h1>
          <p className="text-sm font-medium text-slate-500 mt-2">Manage your public identity and contact details.</p>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={saving || isUploadingLogo || restaurantName.trim().length < 2}
          className="hidden md:flex items-center justify-center gap-2 rounded-xl bg-[#6DBE45] px-6 py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(109,190,69,0.3)] transition-all hover:bg-[#5aa337] disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      <div className="px-4 md:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: FORMS */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* CARD 1: PUBLIC BRAND */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-6">
            <h2 className="text-lg font-black text-slate-900">Public Brand</h2>
            
            <div className="flex flex-col sm:flex-row gap-6">
               <div className="shrink-0 flex flex-col items-center">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-[#6DBE45]/50 flex items-center justify-center cursor-pointer overflow-hidden relative group transition-colors focus-visible:ring-2 focus-visible:ring-[#6DBE45]/30"
                  >
                     {displayLogoSrc ? (
                        <img src={displayLogoSrc} alt="Logo" className="w-full h-full object-cover" />
                     ) : (
                        <div className="flex flex-col items-center text-slate-400 group-hover:text-[#6DBE45] transition-colors">
                           <UploadCloud size={24} className="mb-2" />
                           <span className="text-[10px] font-bold uppercase tracking-wider">Upload Logo</span>
                        </div>
                     )}
                     {isUploadingLogo && (
                       <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm">
                         <Loader2 className="w-6 h-6 animate-spin text-[#6DBE45]" />
                       </div>
                     )}
                  </div>
                  {displayLogoSrc && !isUploadingLogo && (
                    <button onClick={() => { pendingLogoRemoval.current = true; setLogoUrl(''); }} className="mt-2 text-xs font-bold text-rose-500 hover:text-rose-600">Remove</button>
                  )}
               </div>

               <div className="flex-1 space-y-4">
                 <div>
                   <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Restaurant Name</label>
                   <input 
                     type="text" 
                     value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6DBE45]/30 focus:border-[#6DBE45] transition-all"
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Short Description</label>
                   <textarea 
                     rows={2}
                     value={description} onChange={(e) => setDescription(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6DBE45]/30 focus:border-[#6DBE45] transition-all resize-none"
                   />
                 </div>
               </div>
            </div>
          </div>

          {/* CARD 2: FINANCIAL & CONTACT */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-6">
            <h2 className="text-lg font-black text-slate-900">Financial & Contact</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div>
                 <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Owner Name</label>
                 <input 
                   type="text" 
                   value={name} onChange={(e) => setName(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6DBE45]/30 focus:border-[#6DBE45] transition-all"
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">UPI ID</label>
                 <input 
                   type="text" 
                   value={upiId} onChange={(e) => setUpiId(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6DBE45]/30 focus:border-[#6DBE45] transition-all"
                 />
               </div>
               <div className="sm:col-span-2">
                 <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Phone Number</label>
                 <input 
                   type="tel" 
                   value={phone} onChange={(e) => setPhone(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6DBE45]/30 focus:border-[#6DBE45] transition-all"
                 />
               </div>
               <div className="sm:col-span-2">
                 <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Physical Address</label>
                 <textarea 
                   rows={2}
                   value={address} onChange={(e) => setAddress(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6DBE45]/30 focus:border-[#6DBE45] transition-all resize-none"
                 />
               </div>
            </div>
          </div>
          
          <button 
            onClick={handleSubmit}
            disabled={saving || isUploadingLogo || restaurantName.trim().length < 2}
            className="md:hidden w-full flex items-center justify-center gap-2 rounded-xl bg-[#6DBE45] px-6 py-4 text-sm font-bold text-white shadow-[0_4px_14px_rgba(109,190,69,0.3)] transition-all hover:bg-[#5aa337] disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        {/* RIGHT COLUMN: PREVIEW */}
        <div className="lg:col-span-4 hidden lg:flex justify-center">
           <div className="sticky top-32 w-[300px] h-[600px] bg-slate-900 rounded-[2.5rem] p-2 shadow-2xl relative">
              <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-20">
                 <div className="w-20 h-5 bg-slate-900 rounded-b-xl" />
              </div>
              <div className="w-full h-full bg-slate-50 rounded-[2rem] overflow-hidden flex flex-col relative">
                 <div className="h-40 bg-slate-200 relative">
                    <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover opacity-80" alt="Cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-3">
                       <div className="w-12 h-12 bg-white rounded-xl p-0.5 shadow-lg flex items-center justify-center overflow-hidden">
                          {displayLogoSrc ? (
                            <img src={displayLogoSrc} className="w-full h-full object-cover rounded-lg" alt="Logo" />
                          ) : (
                            <Camera size={16} className="text-slate-300"/>
                          )}
                       </div>
                       <div>
                         <h2 className="text-lg font-black text-white leading-tight">{restaurantName || 'Your Restaurant'}</h2>
                         <p className="text-[9px] font-bold text-[#6DBE45] uppercase tracking-wider">Live Preview</p>
                       </div>
                    </div>
                 </div>
                 <div className="p-4 flex flex-col gap-4 overflow-y-auto h-[400px] pb-10 custom-scrollbar">
                    {/* Description */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100/50">
                       <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5"><Info size={12}/> About</h3>
                       <p className="text-xs font-medium text-slate-700 leading-relaxed">
                         {description || 'No description provided.'}
                       </p>
                    </div>

                    {/* Contact & Location */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100/50 space-y-3">
                       <div>
                         <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5"><Phone size={12}/> Phone</h3>
                         <p className="text-xs font-bold text-slate-800">{phone || 'Not provided'}</p>
                       </div>
                       <div className="h-px w-full bg-slate-50" />
                       <div>
                         <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5"><MapPin size={12}/> Address</h3>
                         <p className="text-xs font-medium text-slate-700 line-clamp-3 leading-snug">{address || 'Not provided'}</p>
                       </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-[#6DBE45]/5 rounded-2xl p-4 border border-[#6DBE45]/20 flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-[#6DBE45]/10 flex items-center justify-center text-[#6DBE45] shrink-0">
                          <CreditCard size={14} />
                       </div>
                       <div className="overflow-hidden">
                          <p className="text-[10px] font-black uppercase tracking-wider text-[#6DBE45]">UPI Payment</p>
                          <p className="text-xs font-bold text-slate-800 truncate">{upiId || 'Not setup'}</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
