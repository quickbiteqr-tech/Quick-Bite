'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMenuItems } from '@/lib/hooks/useMenuItems';
import MenuItemForm from '@/components/menu/MenuItemForm';
import { Loader2 } from 'lucide-react';
import { MenuItem } from '@/types/menu';
import { toast } from 'sonner';

export default function EditMenuItemPage() {
  const params = useParams();
  const router = useRouter();
  const { menuItems, updateMenuItem, loading: menuItemsLoading } = useMenuItems();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const itemId = params.id as string;

  useEffect(() => {
    if (!menuItemsLoading && menuItems.length > 0) {
      const itemToEdit = menuItems.find((item) => String(item.id) === String(itemId));
      if (itemToEdit) {
        setMenuItem(itemToEdit);
      }
      setIsPageLoading(false);
    } else if (!menuItemsLoading) {
      setIsPageLoading(false);
    }
  }, [menuItems, itemId, menuItemsLoading]);

  const handleSubmit = async (data: Omit<MenuItem, 'id' | 'restaurant_id' | 'created_at'>) => {
    if (!menuItem) return;

    setIsSubmitting(true);
    try {
      await updateMenuItem(menuItem.id, data);
      toast.success('Menu item updated successfully.');
      router.push('/dashboard/menu');
    } catch (error) {
      console.error('Failed to update menu item:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update menu item.');
      setIsSubmitting(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#6DBE45]" aria-hidden />
      </div>
    );
  }

  if (!menuItem) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
        <p className="font-serif text-lg font-semibold text-slate-900">Item not found</p>
        <p className="mt-2 text-sm text-slate-500">It may have been removed.</p>
        <button
          type="button"
          onClick={() => router.push('/dashboard/menu')}
          className="mt-6 rounded-xl bg-[#6DBE45] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#5aa337]"
        >
          Back to menu
        </button>
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
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6DBE45]">Edit</p>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900">Edit item</h1>
            <p className="mt-1 truncate text-sm text-slate-500">{menuItem.name}</p>
          </div>
        </div>
      </div>

      <MenuItemForm
        initialData={menuItem}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        onCancel={() => router.push('/dashboard/menu')}
      />
    </div>
  );
}
