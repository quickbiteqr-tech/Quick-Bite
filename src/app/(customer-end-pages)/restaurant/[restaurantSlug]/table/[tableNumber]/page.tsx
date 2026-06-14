'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getCustomerMenuBundle } from '@/lib/api/public';
import CustomerMenuItemCard from '@/app/(customer-end-pages)/PublicPagesComponents/CustomerMenuItemCard';
import RestaurantLogoCircle from '@/app/(customer-end-pages)/PublicPagesComponents/RestaurantLogoCircle';
import Cart from '@/app/(customer-end-pages)/PublicPagesComponents/Cart';
import { useCartStore } from '@/app/(customer-end-pages)/store/cartStore';
import { MenuItem as BaseMenuItem } from '@/types/menu';
import {
  ShoppingCart,
  Search,
  Loader2,
  AlertTriangle,
  UserCircle2,
  X,
  ChevronDown,
  MapPin,
  Mail,
  User,
} from 'lucide-react';

interface RestaurantDetails {
  id: string;
  restaurant_name: string;
  logo_url?: string | null;
  owner_name?: string | null;
  email?: string | null;
  address?: string | null;
  description?: string | null;
}
interface MenuItem extends BaseMenuItem {
  category?: string;
}
const toCategorySlug = (category: string) =>
  category
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');

export default function CustomerMenuPage() {
  const params = useParams<{ restaurantSlug: string; tableNumber: string }>();
  const { restaurantSlug, tableNumber } = params;

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [restaurantDetails, setRestaurantDetails] = useState<RestaurantDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [isProfileSidebarOpen, setIsProfileSidebarOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const { totalItems } = useCartStore();

  useEffect(() => {
    if (!restaurantSlug || !tableNumber) {
        setError("Missing restaurant or table information in the URL.");
        setIsLoading(false);
        return;
    }
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { details, items } = await getCustomerMenuBundle(restaurantSlug);
        if (!details) {
          throw new Error(`Could not find a restaurant with the slug: "${restaurantSlug}"`);
        }
        setRestaurantDetails(details);
        setMenuItems(items || []);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred while loading the menu.";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [restaurantSlug, tableNumber]);
  
  const filteredItems = menuItems.filter((item) => {
    if (!item.name || !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (isVegOnly && item.is_veg !== true) return false;
    return true;
  });

  const groupedMenu = filteredItems.reduce((acc, item) => {
    const category = (item.category || 'mains').toLowerCase();
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const categoryOrder = Object.keys(groupedMenu);
  const visibleCategories = categoryOrder.length > 0 ? categoryOrder : ['mains'];
  useEffect(() => {
    if (activeCategory === 'all' && visibleCategories.length > 0) setActiveCategory(visibleCategories[0]);
    if (activeCategory !== 'all' && !visibleCategories.includes(activeCategory)) setActiveCategory(visibleCategories[0]);
  }, [activeCategory, visibleCategories]);
  const activeCategories = categoryOrder.filter((category) => groupedMenu[category] && groupedMenu[category].length > 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }
  
  if (error) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-xl font-bold text-red-700">Error Loading Page</h1>
                <p className="text-gray-700 mt-2">{error}</p>
            </div>
        </div>
    );
  }

  const aboutSidebarText =
    restaurantDetails?.description?.trim() ||
    `Welcome to ${restaurantDetails?.restaurant_name?.trim() || 'us'}. We're glad you're here—enjoy browsing the menu and let us know if you need anything.`;

  return (
    <div className="min-h-screen bg-[#e2e8df] font-sans pb-28">
      <div className="mx-auto min-h-screen max-w-5xl bg-white lg:border-x lg:border-gray-100">
        <header className="sticky top-0 z-50 border-b border-gray-100 bg-[#f4f4f4] px-3 py-3 shadow-sm backdrop-blur-md sm:px-5 sm:py-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <RestaurantLogoCircle
                logoUrl={restaurantDetails?.logo_url}
                restaurantName={restaurantDetails?.restaurant_name}
              />
              <h1 className="line-clamp-2 text-lg font-semibold text-[#2D3436] sm:text-xl">
                {restaurantDetails ? restaurantDetails.restaurant_name : 'Menu'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm">
                🍽 {tableNumber}
              </span>
              <button
                className="rounded-full border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition hover:bg-gray-50 hover:shadow"
                aria-label="Profile"
                onClick={() => setIsProfileSidebarOpen(true)}
              >
                <UserCircle2 size={18} />
              </button>
            </div>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search item"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:ring-4 focus:ring-orange-100 sm:text-base"
            />
          </div>
          <div className="mb-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsVegOnly((prev) => !prev)}
              className="inline-flex h-10 shrink-0 min-w-fit items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <span className="whitespace-nowrap">Veg Mode</span>
              <span className={`relative h-[26px] w-[52px] rounded-[26px] transition ${isVegOnly ? 'bg-[#2ecc71]' : 'bg-[#222]'}`}>
                <span
                  className={`absolute top-[3px] h-5 w-5 rounded-full bg-white transition ${
                    isVegOnly ? 'left-[26px]' : 'left-[3px]'
                  }`}
                />
                <span
                  className={`absolute top-[9px] h-[8px] w-[8px] bg-green-600 transition ${
                    isVegOnly ? 'left-[33px]' : 'left-[8px]'
                  }`}
                  style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
                />
              </span>
            </button>
          </div>
          <div className="mt-1 rounded-2xl border border-gray-200 bg-white p-2">
          <div className="flex items-center gap-2 pb-1">
            <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-3 overflow-x-auto">
              {activeCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className="group min-w-[78px]"
                >
                  <div className={`mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-xl border ${activeCategory === category ? 'border-[#FF6B00] bg-orange-50' : 'border-gray-200 bg-gray-50'}`}>
                    <span className="text-xl">🍽</span>
                  </div>
                  <p className={`line-clamp-2 text-center text-xs font-medium capitalize ${activeCategory === category ? 'text-[#FF6B00]' : 'text-gray-700'}`}>{category}</p>
                  <div className={`mx-auto mt-1 h-0.5 w-12 rounded ${activeCategory === category ? 'bg-[#FF6B00]' : 'bg-transparent'}`} />
                </button>
              ))}
            </div>
          </div>
          </div>
        </header>
        <main className="p-3 sm:p-5">
          {!restaurantDetails || menuItems.length === 0 ? (
            <div className="text-center mt-20">
              <p className="text-xl text-gray-600">This restaurant&apos;s menu is not available right now.</p>
            </div>
          ) : (
            <div className="space-y-10 sm:space-y-12">
              {(activeCategory ? [activeCategory] : categoryOrder).map(
                (category) =>
                  groupedMenu[category] && groupedMenu[category].length > 0 && (
                    <section key={category} id={`section-${category}`} className="rounded-2xl bg-white p-1">
                      <h2 className="mb-4 flex items-center justify-between text-2xl font-semibold capitalize text-[#2D3436]">{category} ({groupedMenu[category].length}) <ChevronDown className="h-5 w-5 text-gray-700" /></h2>
                      <div className="space-y-1">
                        {groupedMenu[category].map((item) => <CustomerMenuItemCard key={item.id} item={item} />)}
                      </div>
                    </section>
                  )
              )}
            </div>
          )}
        </main>
      </div>

      <button
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-5 left-1/2 z-[1100] flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 items-center justify-between rounded-xl bg-[#2D3436] px-4 py-3 text-white shadow-xl transition hover:bg-[#1f2425]"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <ShoppingCart size={16} />
          {totalItems()} {totalItems() === 1 ? 'item' : 'items'}
        </span>
        <span className="text-sm font-semibold">View Cart</span>
      </button>

      {restaurantDetails && restaurantDetails.id && tableNumber && restaurantSlug && (
        <Cart
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          restaurantId={restaurantDetails.id}
          tableNumber={tableNumber}
          restaurantSlug={restaurantSlug}
        />
      )}

      <div
        className={`fixed inset-0 z-[1205] bg-black/40 transition-opacity ${isProfileSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setIsProfileSidebarOpen(false)}
      />
      <aside
        className={`fixed right-0 top-0 z-[1210] h-full w-full max-w-sm transform border-l border-slate-200/90 bg-[#fafaf8] shadow-2xl transition-transform duration-300 ease-out ${isProfileSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
        aria-hidden={!isProfileSidebarOpen}
      >
        <div className="flex h-full flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
            <h3 className="font-serif text-xl font-bold tracking-tight text-slate-900">About this place</h3>
            <button
              type="button"
              onClick={() => setIsProfileSidebarOpen(false)}
              className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              aria-label="Close details sidebar"
            >
              <X size={20} strokeWidth={2} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6">
            <div className="flex flex-col items-center text-center">
              <RestaurantLogoCircle
                logoUrl={restaurantDetails?.logo_url}
                restaurantName={restaurantDetails?.restaurant_name}
                className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-slate-200 bg-white text-3xl font-bold text-[#b11c1c] shadow-md ring-4 ring-white"
              />
              <h2 className="mt-4 max-w-[280px] font-serif text-2xl font-bold leading-tight text-slate-900">
                {restaurantDetails?.restaurant_name ?? 'Restaurant'}
              </h2>
            </div>

            <section className="mt-8">
              <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                About
              </p>
              <p className="text-center text-[15px] leading-relaxed text-slate-700">{aboutSidebarText}</p>
            </section>

            <ul className="mt-8 space-y-5 border-t border-slate-200/80 pt-8">
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#c2410c]">
                  <MapPin size={20} strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Location</p>
                  <p className="mt-1 text-[15px] font-medium leading-snug text-slate-900">
                    {restaurantDetails?.address?.trim() || (
                      <span className="font-normal text-slate-400">Not shared yet</span>
                    )}
                  </p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                  <Mail size={20} strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Email</p>
                  {restaurantDetails?.email?.trim() ? (
                    <a
                      href={`mailto:${restaurantDetails.email.trim()}`}
                      className="mt-1 block break-all text-[15px] font-medium text-[#c2410c] underline decoration-[#c2410c]/30 underline-offset-2 transition hover:decoration-[#c2410c]"
                    >
                      {restaurantDetails.email.trim()}
                    </a>
                  ) : (
                    <p className="mt-1 text-[15px] font-normal text-slate-400">Not shared yet</p>
                  )}
                </div>
              </li>

              <li className="flex gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                  <User size={20} strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Owner</p>
                  <p className="mt-1 text-[15px] font-semibold text-slate-900">
                    {restaurantDetails?.owner_name?.trim() || (
                      <span className="font-normal text-slate-400">Not shared yet</span>
                    )}
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}