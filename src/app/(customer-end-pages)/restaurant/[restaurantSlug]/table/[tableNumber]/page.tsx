'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getCustomerMenuBundle } from '@/lib/api/public';
import CustomerMenuItemCard from '@/app/(customer-end-pages)/PublicPagesComponents/CustomerMenuItemCard';
import RestaurantLogoCircle from '@/app/(customer-end-pages)/PublicPagesComponents/RestaurantLogoCircle';
import Cart from '@/app/(customer-end-pages)/PublicPagesComponents/Cart';
import WaiterBell from '@/app/(customer-end-pages)/PublicPagesComponents/WaiterBell';
import ActiveBillFloatingBar from '@/app/(customer-end-pages)/PublicPagesComponents/ActiveBillFloatingBar';
import CheckoutSheet from '@/app/(customer-end-pages)/PublicPagesComponents/CheckoutSheet';
import { useCartStore } from '@/app/(customer-end-pages)/store/cartStore';
import { useCheckoutStore } from '@/lib/store/useCheckoutStore';
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
  UtensilsCrossed,
} from 'lucide-react';

interface RestaurantDetails {
  id: string;
  restaurant_name: string;
  logo_url?: string | null;
  owner_name?: string | null;
  email?: string | null;
  address?: string | null;
  description?: string | null;
  upi_id?: string | null;
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
  const [activeDietaryTag, setActiveDietaryTag] = useState<string | null>(null);
  const [isProfileSidebarOpen, setIsProfileSidebarOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isReadOnly, setIsReadOnly] = useState(false);
  const dietaryOptions = ['Veg', 'Non-Veg', 'Egg', 'Vegan', 'Jain', 'Gluten-Free'];

  const { totalItems, items } = useCartStore();
  const totalPrice = items.reduce((sum, cartItem) => sum + ((cartItem.unitPrice || cartItem.price) * cartItem.quantity), 0);

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
        useCheckoutStore.getState().setRestaurantDetails(details.upi_id || '', details.restaurant_name || '');
        setMenuItems(items || []);

        // Verify session for Read-Only mode
        try {
          const res = await fetch('/api/sessions/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ restaurantId: details.id, tableNumber })
          });
          const sessionData = await res.json();
          if (!sessionData.valid) {
            setIsReadOnly(true);
          }
        } catch (e) {
          console.error('Failed to verify session', e);
        }

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
    
    if (activeDietaryTag) {
      const lowerFilter = activeDietaryTag.toLowerCase();
      // Safe check for dietary_tags property since it might not be in the strict MenuItem type yet
      const tags = ('dietary_tags' in item ? (item as any).dietary_tags : []) || [];
      
      if (lowerFilter === 'veg') {
        if (item.is_veg !== true && !tags.includes('veg')) return false;
      } else if (lowerFilter === 'non-veg') {
        if (item.is_veg !== false && !tags.includes('non-veg')) return false;
      } else {
        if (!tags.includes(lowerFilter)) return false;
      }
    }
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

  // Scroll Spy Logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace('section-', '');
            setActiveCategory(id);
          }
        });
      },
      { rootMargin: '-120px 0px -60% 0px' }
    );

    visibleCategories.forEach((cat) => {
      const el = document.getElementById(`section-${cat}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [visibleCategories]);

  const activeCategories = categoryOrder.filter((category) => groupedMenu[category] && groupedMenu[category].length > 0);

  const scrollToCategory = (category: string) => {
    setActiveCategory(category);
    const element = document.getElementById(`section-${category}`);
    if (element) {
      const headerOffset = 160; // Offset for sticky nav
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

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
    <div className="min-h-screen bg-[#f4f4f5] font-sans pb-28">
      <div className="mx-auto min-h-screen max-w-2xl bg-white lg:border-x lg:border-gray-100 shadow-sm relative">
        
        {isReadOnly && (
          <div className="bg-slate-900 text-white px-4 py-2.5 text-center text-sm font-bold shadow-sm relative z-50 flex items-center justify-center gap-2">
            <AlertTriangle size={16} className="text-red-400" />
            Session Expired. Please scan the QR code on your table again.
          </div>
        )}

        <header className="sticky top-0 z-40 bg-white px-3 pt-3 shadow-sm sm:px-5 sm:pt-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <RestaurantLogoCircle
                logoUrl={restaurantDetails?.logo_url}
                restaurantName={restaurantDetails?.restaurant_name}
              />
              <h1 className="line-clamp-2 text-lg font-bold text-[#2D3436] sm:text-xl">
                {restaurantDetails ? restaurantDetails.restaurant_name : 'Menu'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-800">
                🍽 {tableNumber}
              </span>
              <button
                className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
                aria-label="Profile"
                onClick={() => setIsProfileSidebarOpen(true)}
              >
                <UserCircle2 size={20} />
              </button>
            </div>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
            />
          </div>
          <div className="-mx-3 px-3 sm:-mx-5 sm:px-5 mb-2 overflow-x-auto touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center gap-2 pb-1">
              {dietaryOptions.map((tag) => {
                const isActive = activeDietaryTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setActiveDietaryTag(isActive ? null : tag)}
                    className={`inline-flex h-8 shrink-0 items-center rounded-md border px-3 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-colors ${
                      isActive 
                        ? 'border-[#6DBE45] bg-[#6DBE45]/10 text-[#6DBE45]' 
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Zomato/Swiggy Sticky Category Nav */}
          <div className="-mx-3 px-3 sm:-mx-5 sm:px-5 border-t border-slate-100">
            <div className="flex items-center overflow-x-auto touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {activeCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => scrollToCategory(category)}
                  className={`shrink-0 px-4 py-3 text-sm transition-all whitespace-nowrap capitalize ${
                    activeCategory === category 
                      ? 'text-[#6DBE45] font-bold border-b-2 border-[#6DBE45]' 
                      : 'text-slate-500 font-medium'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="bg-slate-50 min-h-screen">
          {!restaurantDetails || menuItems.length === 0 ? (
            <div className="text-center mt-20 p-6">
              <p className="text-lg text-slate-500 font-medium">This restaurant&apos;s menu is not available right now.</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-32 px-6 text-center animate-in fade-in duration-500">
               <div className="h-24 w-24 mb-6 rounded-full bg-white flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 text-slate-300">
                 <UtensilsCrossed size={40} strokeWidth={1.5} />
               </div>
               <h3 className="text-[22px] font-bold text-slate-800 mb-3 tracking-tight">Not Serving This Currently</h3>
               <p className="text-[15px] text-slate-500 max-w-sm mb-8 leading-relaxed">
                 We couldn't find any dishes matching your exact preference. Try clearing your filters to explore our full curated menu.
               </p>
               <button
                 onClick={() => {
                   setSearchQuery('');
                   setActiveDietaryTag(null);
                 }}
                 className="px-8 py-3.5 bg-slate-900 text-white text-[13px] font-bold uppercase tracking-wider rounded-xl shadow-[0_8px_20px_rgba(15,23,42,0.2)] hover:bg-slate-800 hover:-translate-y-0.5 transition-all active:scale-[0.98]"
               >
                 Clear Filters
               </button>
            </div>
          ) : (
            <div className="space-y-4">
              {(activeCategory ? [activeCategory] : categoryOrder).map(
                (category) =>
                  groupedMenu[category] && groupedMenu[category].length > 0 && (
                    <section key={category} id={`section-${category}`} className="bg-white scroll-mt-36 pb-2">
                      <div className="px-4 py-4 border-b border-slate-100">
                        <h2 className="text-lg font-bold capitalize text-slate-800 flex items-center justify-between">
                          {category} 
                          <span className="text-sm font-medium text-slate-400">({groupedMenu[category].length})</span>
                        </h2>
                      </div>
                      <div className="flex flex-col">
                        {groupedMenu[category].map((item) => (
                          <CustomerMenuItemCard key={item.id} item={item} isReadOnly={isReadOnly} />
                        ))}
                      </div>
                    </section>
                  )
              )}
            </div>
          )}
        </main>
      </div>

      {/* Floating Zomato/Swiggy Style Cart Bar */}
      {!isReadOnly && totalItems() > 0 && (
        <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex w-full max-w-2xl items-center justify-between rounded-xl bg-[#6DBE45] px-4 py-3.5 text-white shadow-xl transition active:scale-[0.98] pointer-events-auto"
          >
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/90">
                {totalItems()} {totalItems() === 1 ? 'Item' : 'Items'} Added
              </span>
              <span className="mt-0.5 flex items-center gap-1 text-base font-bold">
                View Cart <ShoppingCart size={14} className="opacity-80" />
              </span>
            </div>
            <span className="text-lg font-extrabold tracking-tight">
              ₹{totalPrice.toFixed(2)} &rarr;
            </span>
          </button>
        </div>
      )}

      {!isReadOnly && restaurantDetails && restaurantDetails.id && tableNumber && restaurantSlug && (
        <Cart
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          restaurantId={restaurantDetails.id}
          tableNumber={tableNumber}
          restaurantSlug={restaurantSlug}
        />
      )}

      {!isReadOnly && restaurantDetails && restaurantDetails.id && tableNumber && (
        <WaiterBell
          restaurantId={restaurantDetails.id}
          tableNumber={tableNumber}
        />
      )}

      {!isReadOnly && (
        <>
          <ActiveBillFloatingBar />
          <CheckoutSheet />
        </>
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