'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { updateProfile } from '@/lib/api/profile';
import { useUploadThing } from '@/lib/uploadthing';
import { compressImage } from '@/lib/utils/image-compressor';
import { invalidateCustomerMenuBundleCache } from '@/lib/api/public';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { Restaurant } from '@/types/restaurant';

export type ProfileRestaurantInitial = {
  restaurant_name: string | null;
  logo_url: string | null;
  phone: string | null;
  address: string | null;
  description: string | null;
  slug?: string | null;
};

type Props = {
  userEmail: string | null;
  displayName: string;
  restaurant: ProfileRestaurantInitial | null;
  /** Public menu URL slug — used to refresh customer menu cache after save. */
  restaurantSlug?: string | null;
  signupRestaurantName?: string;
  signupPhone?: string;
  signupAddress?: string;
};

export function ProfileEditForm({
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
  /** When true, next save sends `logo_url: null`. Otherwise an empty field omits logo_url so we don't wipe the DB by mistake. */
  const pendingLogoRemoval = useRef(false);
  const [name, setName] = useState(displayName);
  const [restaurantName, setRestaurantName] = useState(
    restaurant?.restaurant_name ?? signupRestaurantName ?? ''
  );
  const [logoUrl, setLogoUrl] = useState(restaurant?.logo_url ?? '');
  const [phone, setPhone] = useState(restaurant?.phone ?? signupPhone ?? '');
  const [address, setAddress] = useState(restaurant?.address ?? signupAddress ?? '');
  const [description, setDescription] = useState(restaurant?.description ?? '');
  const [saving, setSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  /** UploadThing v7 may expose `url` and/or `ufsUrl` on the file object. */
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
        toast.error('Upload finished but no file URL was returned. Try again.');
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
  const initialLetter = restaurantName.trim().charAt(0).toUpperCase() || 'R';

  const handlePickLogo = () => fileInputRef.current?.click();

  /** Match server: allow image/*, HEIC, or missing MIME when filename looks like an image. */
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
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      toast.error(msg);
    }
  };

  const clearLogo = () => {
    pendingLogoRemoval.current = true;
    setLogoUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const trimmedName = name.trim();
      if (trimmedName.length >= 2) {
        const { error: authErr } = await supabase.auth.updateUser({
          data: { full_name: trimmedName },
        });
        if (authErr) throw authErr;
      }

      const trimmedLogo = logoUrl.trim();
      const profilePayload: Partial<Restaurant> = {
        restaurant_name: restaurantName.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        description: description.trim() || undefined,
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
      const msg = err instanceof Error ? err.message : 'Could not save.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Your account</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              value={userEmail ?? ''}
              disabled
              className="bg-slate-50"
            />
            <p className="text-xs text-slate-500">Sign-in email cannot be changed here.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="display-name">Your name</Label>
            <Input
              id="display-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Restaurant</h2>

        <div className="mb-6 flex flex-col items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-hidden
            onChange={handleLogoChange}
          />
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
            Restaurant logo
          </p>
          <button
            type="button"
            onClick={handlePickLogo}
            disabled={isUploadingLogo || saving}
            className="group relative flex h-28 w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 shadow-inner transition hover:border-[#6DBE45]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6DBE45]/40 disabled:pointer-events-none disabled:opacity-60"
            aria-label="Upload restaurant logo"
          >
            {displayLogoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayLogoSrc}
                alt=""
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <span className="text-3xl font-bold text-[#6DBE45]">{initialLetter}</span>
            )}
            {isUploadingLogo ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </span>
            ) : (
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/35">
                <Camera className="h-8 w-8 text-white opacity-0 drop-shadow-md transition group-hover:opacity-100" />
              </span>
            )}
          </button>
          <p className="mt-2 text-center text-xs text-slate-500">
            Tap to upload · Same as menu photos (UploadThing) · max 4MB
          </p>
          <p className="mt-1 max-w-sm text-center text-xs text-slate-400">
            Shown on your customer menu header. Click Save changes to store the link in your profile.
          </p>
          {displayLogoSrc && !isUploadingLogo ? (
            <button
              type="button"
              onClick={clearLogo}
              className="mt-2 text-xs font-medium text-slate-500 underline hover:text-slate-800"
            >
              Remove logo
            </button>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="restaurant-name">Restaurant name</Label>
            <Input
              id="restaurant-name"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="Restaurant name"
              required
              minLength={2}
            />
            {!restaurant?.restaurant_name && signupRestaurantName ? (
              <p className="text-xs text-slate-500">
                Pre-filled from your signup details.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 …"
              type="tel"
              autoComplete="tel"
            />
            {!restaurant?.phone && signupPhone ? (
              <p className="text-xs text-slate-500">
                Pre-filled from your signup details.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Restaurant address"
              rows={2}
              className="resize-y min-h-[70px]"
            />
            {!restaurant?.address && signupAddress ? (
              <p className="text-xs text-slate-500">
                Pre-filled from your signup details.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Short description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A line or two about your place…"
              rows={3}
              className="resize-y min-h-[80px]"
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={saving || isUploadingLogo || restaurantName.trim().length < 2}
          className="rounded-xl bg-[#6DBE45] text-white hover:bg-[#5aa337]"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
