'use client';

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MenuItem } from '@/types/menu';
import { Minus, Plus, Trash2, X } from 'lucide-react';
// CORRECTED: Import from the new co-located path
import { useCartStore } from '../store/cartStore'; 

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(price);
};

interface CustomerMenuItemCardProps {
  item: MenuItem;
}

export default function CustomerMenuItemCard({ item }: CustomerMenuItemCardProps) {
  const { addItem, removeItem, items } = useCartStore();
  const isVeg = 'is_veg' in item ? Boolean((item as MenuItem & { is_veg?: boolean }).is_veg) : false;
  const quantity = items.find((cartItem) => String(cartItem.id) === String(item.id))?.quantity ?? 0;
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  return (
    <>
    <div
      className="group flex cursor-pointer items-center justify-between gap-3 border-b border-dashed border-gray-200 bg-white py-4"
      onClick={() => setIsDetailOpen(true)}
    >
      <div className="min-w-0 flex flex-1 items-start gap-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-gray-200 bg-gray-100 shadow-sm">
          {item.photo_url ? (
            <Image
              src={item.photo_url}
              alt={item.name}
              fill
              className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
              sizes="80px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-gray-400">
              No Image
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className={isVeg ? 'veg-icon' : 'non-veg-icon'}>
            <span className={isVeg ? 'veg-dot' : 'non-veg-dot'} />
          </span>
        </div>
        <h3 className="line-clamp-2 text-[21px] font-semibold leading-snug text-[#1f2937]">{item.name}</h3>
        <p className="mt-1 text-[18px] font-medium text-[#111827]">{formatPrice(item.price)}</p>
        </div>
      </div>
      <div className="shrink-0">
        {quantity > 0 ? (
          <div className="inline-flex items-center rounded-md border border-orange-200 bg-white p-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeItem(item.id);
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded text-[#FF6B00] transition hover:bg-orange-50"
              aria-label="Decrease quantity"
            >
              {quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
            </button>
            <span className="min-w-7 px-1 text-center text-sm font-semibold text-[#2D3436]">{quantity}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                addItem(item);
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded bg-[#FF6B00] text-white transition hover:bg-[#e86100]"
              aria-label="Increase quantity"
            >
              <Plus size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              addItem(item);
            }}
            className="inline-flex h-8 items-center rounded-md border border-orange-300 bg-white px-6 text-xs font-semibold text-[#FF6B00] transition hover:bg-orange-50"
          >
            + Add
          </button>
        )}
      </div>
    </div>
    <div
      className={`fixed inset-0 z-[1300] bg-black/45 transition-opacity ${isDetailOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      onClick={() => setIsDetailOpen(false)}
    />
    <div
      className={`fixed bottom-0 left-0 right-0 z-[1310] mx-auto w-full max-w-md transform overflow-hidden rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ${isDetailOpen ? 'translate-y-0' : 'translate-y-full'}`}
    >
      <div className="relative h-72 w-full bg-gray-100">
        {item.photo_url ? (
          <Image src={item.photo_url} alt={item.name} fill className="object-cover" sizes="100vw" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">No Image</div>
        )}
        <span className={isVeg ? 'veg-icon absolute left-3 top-3' : 'non-veg-icon absolute left-3 top-3'}>
          <span className={isVeg ? 'veg-dot' : 'non-veg-dot'} />
        </span>
        <button
          type="button"
          onClick={() => setIsDetailOpen(false)}
          className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm"
          aria-label="Close item details"
        >
          <X size={18} />
        </button>
      </div>
      <div className="space-y-3 p-4">
        <h3 className="text-3xl font-semibold text-[#1f2937]">{item.name}</h3>
        <p className="text-sm text-gray-600">{item.description}</p>
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <p className="text-3xl font-bold text-[#2D3436]">{formatPrice(item.price)}</p>
          {quantity > 0 ? (
            <div className="inline-flex items-center rounded-md border border-orange-200 bg-white p-1">
              <button
                onClick={() => removeItem(item.id)}
                className="inline-flex h-8 w-8 items-center justify-center rounded text-[#FF6B00] transition hover:bg-orange-50"
                aria-label="Decrease quantity"
              >
                {quantity === 1 ? <Trash2 size={15} /> : <Minus size={15} />}
              </button>
              <span className="min-w-8 px-2 text-center text-base font-semibold text-[#2D3436]">{quantity}</span>
              <button
                onClick={() => addItem(item)}
                className="inline-flex h-8 w-8 items-center justify-center rounded bg-[#FF6B00] text-white transition hover:bg-[#e86100]"
                aria-label="Increase quantity"
              >
                <Plus size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addItem(item)}
              className="inline-flex h-10 items-center rounded-xl bg-[#FF6B00] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#e86100]"
            >
              ADD TO ORDER
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  );
}