'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMenuItems } from '@/lib/hooks/useMenuItems';
import MenuItemForm from '@/components/menu/MenuItemForm';
import { getMyRestaurant } from '@/lib/api/restaurants';
import { Loader2 } from 'lucide-react';

export default function AddMenuItemPage() {
  const router = useRouter();
  const { addMenuItem } = useMenuItems();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRestaurant = async () => {
      const restaurant = await getMyRestaurant();
      if (restaurant) {
        setRestaurantId(restaurant.id);
      } else {
        console.error('No restaurant found for this user.');
      }
      setIsLoading(false);
    };
    loadRestaurant();
  }, []);

  const handleSubmit = async (data: {
    name: string;
    description: string;
    price: number;
    category?: string;
    is_veg?: boolean;
    photo_url?: string;
    available?: boolean;
  }) => {
    if (!restaurantId) {
      alert('Error: Could not find your restaurant ID. Please try logging in again.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newItemData = {
        ...data,
        category: data.category || 'mains',
        available: data.available ?? true,
      };

      await addMenuItem(newItemData, restaurantId);
      router.push('/dashboard/menu');
    } catch (error) {
      console.error('Failed to add menu item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#6DBE45]" aria-hidden />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl font-sans text-slate-800 selection:bg-[#6DBE45] selection:text-white">
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#6DBE45]/12 via-white to-slate-50/80"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:border-[#6DBE45]/40 hover:text-[#6DBE45]"
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6DBE45]">New item</p>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900">Add menu item</h1>
            <p className="mt-1 text-sm text-slate-500">Details show on your customer-facing menu.</p>
          </div>
        </div>
      </div>

      <MenuItemForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        onCancel={() => router.push('/dashboard/menu')}
      />
    </div>
  );
}
