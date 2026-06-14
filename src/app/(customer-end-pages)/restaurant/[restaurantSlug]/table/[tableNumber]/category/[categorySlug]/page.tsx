'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import { getCustomerMenuBundle } from '@/lib/api/public';
import CustomerMenuItemCard from '@/app/(customer-end-pages)/PublicPagesComponents/CustomerMenuItemCard';
import { MenuItem as BaseMenuItem } from '@/types/menu';

interface RestaurantDetails {
  restaurant_name: string;
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

export default function CategoryPage() {
  const params = useParams<{
    restaurantSlug: string;
    tableNumber: string;
    categorySlug: string;
  }>();

  const { restaurantSlug, tableNumber, categorySlug } = params;
  const [restaurantDetails, setRestaurantDetails] = useState<RestaurantDetails | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { details, items } = await getCustomerMenuBundle(restaurantSlug);
        setRestaurantDetails(details as RestaurantDetails | null);
        setMenuItems((items || []) as MenuItem[]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [restaurantSlug]);

  const categoryItems = useMemo(() => {
    return menuItems.filter((item) => {
      const slug = toCategorySlug(item.category || 'mains');
      if (slug !== categorySlug) return false;
      if (!searchQuery.trim()) return true;
      return (item.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [menuItems, categorySlug, searchQuery]);

  const categoryTitle = useMemo(() => {
    const match = menuItems.find((item) => toCategorySlug(item.category || 'mains') === categorySlug);
    return match?.category || categorySlug.replace(/-/g, ' ');
  }, [menuItems, categorySlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e2e8df]">
        <Loader2 className="h-10 w-10 animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e2e8df] px-3 py-4 sm:px-4 sm:py-6">
      <div className="mx-auto min-h-[calc(100vh-2rem)] max-w-5xl rounded-3xl border border-gray-100 bg-white shadow-sm sm:min-h-[calc(100vh-3rem)]">
        <header className="sticky top-0 z-20 rounded-t-3xl border-b border-gray-100 bg-white/90 px-4 py-4 backdrop-blur-md sm:px-6">
          <div className="mb-4 flex items-center gap-3">
            <Link
              href={`/restaurant/${restaurantSlug}/table/${tableNumber}`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 hover:shadow"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="min-w-0">
              <p className="truncate text-sm text-gray-500">{restaurantDetails?.restaurant_name || 'Restaurant'}</p>
              <div className="flex items-center gap-2">
                <h1 className="truncate text-xl font-bold capitalize text-[#2D3436] sm:text-2xl">{categoryTitle}</h1>
                <span className="rounded-full border border-orange-100 bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                  {categoryItems.length} items
                </span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-2 shadow-inner">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={`Search in ${categoryTitle}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-100 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:ring-4 focus:ring-orange-100 sm:text-base"
            />
          </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-14rem)] p-4 sm:min-h-[calc(100vh-16rem)] sm:p-6">
          {categoryItems.length === 0 ? (
            <div className="flex min-h-[50vh] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
              <div>
                <p className="text-base font-semibold text-slate-700">No items found in this category.</p>
                <p className="mt-1 text-sm text-gray-500">Try another category or clear search.</p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-gradient-to-b from-white to-gray-50/30 p-2 sm:p-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {categoryItems.map((item) => (
                <CustomerMenuItemCard key={item.id} item={item} />
              ))}
            </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
