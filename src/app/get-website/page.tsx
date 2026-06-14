'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, Phone, X, LogIn, UserPlus } from 'lucide-react';

type WebsiteForm = {
  restaurant_name: string;
  phone: string;
  address: string;
  venue_type: string;
  cuisine: string;
  logo_url: string;
  maps_url: string;
};

const emptyForm: WebsiteForm = {
  restaurant_name: '',
  phone: '',
  address: '',
  venue_type: 'restaurant',
  cuisine: '',
  logo_url: '',
  maps_url: '',
};

/** Keep users on this page after login/signup from header links */
const RETURN_PATH = '/get-website';
const AUTH_NEXT_QUERY = `?next=${encodeURIComponent(RETURN_PATH)}`;
const FORM_DRAFT_KEY = 'qb:get-website-form-draft';
const AUTH_MODAL_REDIRECT_MS = 5000;
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';
const WEB3FORMS_ACCESS_KEY = 'd7f21426-ce19-496a-9fb1-af327fa46bd9';

export default function GetWebsitePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<WebsiteForm>(emptyForm);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authSecondsLeft, setAuthSecondsLeft] = useState(Math.ceil(AUTH_MODAL_REDIRECT_MS / 1000));
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    // Restore local draft (so users can fill, then log in/sign up, and come back)
    try {
      const raw =
        typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(FORM_DRAFT_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<WebsiteForm>;
        setForm({
          ...emptyForm,
          restaurant_name: typeof parsed.restaurant_name === 'string' ? parsed.restaurant_name : '',
          phone: typeof parsed.phone === 'string' ? parsed.phone : '',
          address: typeof parsed.address === 'string' ? parsed.address : '',
          venue_type:
            parsed.venue_type === 'cafe' ||
            parsed.venue_type === 'restaurant' ||
            parsed.venue_type === 'cloud_kitchen'
              ? parsed.venue_type
              : 'restaurant',
          cuisine: typeof parsed.cuisine === 'string' ? parsed.cuisine : '',
          logo_url: typeof parsed.logo_url === 'string' ? parsed.logo_url : '',
          maps_url: typeof parsed.maps_url === 'string' ? parsed.maps_url : '',
        });
      }
    } catch {
      /* ignore bad draft */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        sessionStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(form));
      } catch {
        /* storage full or disabled */
      }
    }, 400);
    return () => window.clearTimeout(id);
  }, [form]);

  const setField = (key: keyof WebsiteForm, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setMessage(null);
  };

  useEffect(() => {
    if (!authModalOpen) return;
    setAuthSecondsLeft(Math.ceil(AUTH_MODAL_REDIRECT_MS / 1000));

    const interval = window.setInterval(() => {
      setAuthSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);

    const t = window.setTimeout(() => {
      router.push(`/signup${AUTH_NEXT_QUERY}`);
    }, AUTH_MODAL_REDIRECT_MS);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(t);
    };
  }, [authModalOpen, router]);

  const openAuthModal = () => {
    setAuthModalOpen(true);
  };

  useEffect(() => {
    let active = true;

    const syncAuthState = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          if (active) setIsAuthed(true);
          return;
        }

        const { data: userData } = await supabase.auth.getUser();
        if (active) setIsAuthed(Boolean(userData.user));
      } catch {
        if (active) setIsAuthed(false);
      }
    };

    syncAuthState();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setIsAuthed(Boolean(session?.user));
      if (session?.user) {
        setAuthModalOpen(false);
      }
    });

    return () => {
      active = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.restaurant_name.trim() || !form.phone.trim() || !form.address.trim()) {
      setMessage({ type: 'err', text: 'Please add your business name, phone, and address.' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `Get Website Request - ${form.restaurant_name.trim()}`,
          from_name: 'QuickBite Get Website Form',
          restaurant_name: form.restaurant_name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          venue_type: form.venue_type || '',
          cuisine: form.cuisine.trim(),
          logo_url: form.logo_url.trim(),
          maps_url: form.maps_url.trim(),
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | { success?: boolean; message?: string }
        | null;

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'Could not submit. Please try again in a moment.');
      }
      try {
        sessionStorage.removeItem(FORM_DRAFT_KEY);
      } catch {
        /* ignore */
      }
      setMessage({ type: 'ok', text: 'Submitted! We’ll contact you soon.' });
    } catch (err) {
      setMessage({
        type: 'err',
        text: err instanceof Error ? err.message : 'Save failed.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f9ec]/80 via-white to-slate-50 font-sans text-slate-800 selection:bg-[#6DBE45] selection:text-white">
      <header className="sticky top-0 z-30 border-b border-slate-100/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center">
            <Image
              src="/quickbitelogo.png"
              alt="QuickBiteQR logo"
              width={180}
              height={48}
              priority
              className="h-9 w-auto"
            />
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            {isAuthed ? (
              <Link
                href="/dashboard"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#6DBE45]/40 hover:text-[#6DBE45]"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={openAuthModal}
                  className="text-sm font-medium text-slate-600 hover:text-[#6DBE45]"
                >
                  Login
                </button>
                <Link
                  href={`/signup${AUTH_NEXT_QUERY}`}
                  className="rounded-full bg-[#6DBE45] px-4 py-2 text-sm font-bold text-white shadow-md shadow-[#6DBE45]/30 hover:bg-[#5aa337]"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-lg px-4 pb-28 pt-8 sm:px-6 sm:pb-12 sm:pt-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex items-center justify-center">
          <Image
            src="/quickbitelogo.png"
            alt="QuickBiteQR logo"
            width={360}
            height={96}
            className="h-14 w-auto sm:h-16"
          />
        </div>
          <h1 className="font-serif text-[clamp(1.5rem,5vw,2rem)] font-bold leading-tight tracking-tight text-slate-900">
            Your venue in one quick form
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
            Name, phone, and address are enough to get started. Everything else is optional.
          </p>
        </div>

        <form id="get-website-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
            <div className="bg-gradient-to-r from-[#6DBE45] to-[#5aa337] px-5 py-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/90">Essentials</p>
              <p className="text-sm font-medium text-white/95">What we need to list you correctly</p>
            </div>
            <div className="space-y-5 p-5 sm:p-6">
              <div className="space-y-2">
                <Label htmlFor="restaurant_name">Business name</Label>
                <Input
                  id="restaurant_name"
                  value={form.restaurant_name}
                  onChange={(e) => setField('restaurant_name', e.target.value)}
                  placeholder="Your restaurant or cafe name"
                  className="h-12 rounded-xl border-slate-200 text-base"
                  autoComplete="organization"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-[#6DBE45]" aria-hidden />
                  Phone number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="h-12 rounded-xl border-slate-200 text-base"
                  autoComplete="tel"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  Full address <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="address"
                  value={form.address}
                  onChange={(e) => setField('address', e.target.value)}
                  placeholder="Street, area, city, PIN"
                  rows={3}
                  className="rounded-xl border-slate-200 text-base"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="venue_type">Type</Label>
                  <select
                    id="venue_type"
                    value={form.venue_type}
                    onChange={(e) => setField('venue_type', e.target.value)}
                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6DBE45]/30"
                  >
                    <option value="cafe">Cafe</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="cloud_kitchen">Cloud kitchen</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuisine">Cuisine (optional)</Label>
                  <Input
                    id="cuisine"
                    value={form.cuisine}
                    onChange={(e) => setField('cuisine', e.target.value)}
                    placeholder="e.g. Indian, Chinese"
                    className="h-12 rounded-xl border-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Optional</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo image URL</Label>
                <Input
                  id="logo_url"
                  type="url"
                  value={form.logo_url}
                  onChange={(e) => setField('logo_url', e.target.value)}
                  placeholder="https://… (PNG or JPG link)"
                  className="h-11 rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maps_url">Google Maps link</Label>
                <Input
                  id="maps_url"
                  type="url"
                  value={form.maps_url}
                  onChange={(e) => setField('maps_url', e.target.value)}
                  placeholder="Link to your place on Maps"
                  className="h-11 rounded-xl border-slate-200"
                />
              </div>
            </div>
          </div>

          {message && (
            <Alert
              className={
                message.type === 'ok'
                  ? 'border-[#6DBE45]/30 bg-[#6DBE45]/10 text-slate-900'
                  : 'border-red-200 bg-red-50 text-red-900'
              }
            >
              {message.type === 'ok' ? (
                <CheckCircle2 className="h-4 w-4 text-[#3d8a2e]" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Desktop / tablet: inline submit */}
          <div className="hidden sm:block">
            <Button
              type="submit"
              disabled={saving}
              className="h-14 w-full rounded-2xl bg-[#6DBE45] text-base font-bold text-white shadow-lg shadow-[#6DBE45]/30 hover:bg-[#5aa337] disabled:opacity-70"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving…
                </>
              ) : (
                'Submit details'
              )}
            </Button>
            <p className="mt-3 text-center text-xs text-slate-500">
              We’ll reach out using the details you provide.
            </p>
          </div>
        </form>
      </main>

      {/* Mobile: fixed submit bar — always visible */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/95 p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md sm:hidden pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button
          type="submit"
          form="get-website-form"
          disabled={saving}
          className="h-14 w-full rounded-2xl bg-[#6DBE45] text-base font-bold text-white shadow-lg shadow-[#6DBE45]/35 hover:bg-[#5aa337] disabled:opacity-70"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Saving…
            </>
          ) : (
            'Submit details'
          )}
        </Button>
      </div>

      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[3px]"
            aria-label="Close"
            onClick={() => setAuthModalOpen(false)}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setAuthModalOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-xl border border-white/60 bg-white/80 p-2 text-slate-600 shadow-sm backdrop-blur hover:bg-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#6DBE45]/20 via-white to-white" />
              <div className="relative p-6 pb-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6DBE45] shadow-sm shadow-[#6DBE45]/30 ring-4 ring-[#6DBE45]/15">
                    <UserPlus className="h-6 w-6 text-white" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl font-bold tracking-tight text-slate-900">
                      Please log in
                    </div>
                    <div className="mt-1 text-sm leading-relaxed text-slate-600">
                      Create an account or sign in to submit your website request.
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-[#6DBE45]/20 bg-white/70 p-3 text-xs text-slate-600">
                  Redirecting to sign up in{' '}
                  <span className="font-semibold tabular-nums text-slate-900">{authSecondsLeft}</span>s.
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 pt-2">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  className="w-full bg-[#6DBE45] text-white shadow-md shadow-[#6DBE45]/30 hover:bg-[#5aa337] sm:w-auto sm:flex-1"
                  size="lg"
                >
                  <Link href={`/signup${AUTH_NEXT_QUERY}`} onClick={() => setAuthModalOpen(false)}>
                    <UserPlus className="h-4 w-4" />
                    Create account
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-slate-200 bg-white sm:w-auto sm:flex-1"
                  size="lg"
                >
                  <Link href={`/login${AUTH_NEXT_QUERY}`} onClick={() => setAuthModalOpen(false)}>
                    <LogIn className="h-4 w-4" />
                    Log in
                  </Link>
                </Button>
              </div>

              <div className="mt-4 text-center text-xs text-slate-500">
                You can close this and fill the form, but you’ll need an account to submit.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
