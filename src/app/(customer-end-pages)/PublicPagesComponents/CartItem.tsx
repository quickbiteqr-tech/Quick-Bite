'use client';

import Image from 'next/image';
import { useCartStore, CartItem as CartItemType } from '@/app/(customer-end-pages)/store/cartStore';
import { Plus, Minus, X } from 'lucide-react';

interface CartItemProps {
  item: CartItemType;
}

const formatPrice = (price: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(price);

export default function CartItem({ item }: CartItemProps) {
  const { addItem, removeItem } = useCartStore();

  return (
    <div className="flex items-start gap-4 py-4">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-100">
        {item.photo_url ? (
          <Image src={item.photo_url} alt={item.name} fill className="object-cover" />
        ) : (
          <div className="bg-gray-50 flex h-full w-full items-center justify-center text-[10px] text-gray-400">No Img</div>
        )}
      </div>
      <div className="flex-grow min-w-0">
        <p className="font-semibold text-gray-800 line-clamp-2">{item.name}</p>
        
        {/* Render Variant and Modifiers if they exist */}
        {(item.selectedVariantLabel || (item.selectedModifiers && item.selectedModifiers.length > 0)) && (
          <div className="mt-1 text-xs text-gray-500">
            {item.selectedVariantLabel && <p className="font-medium text-gray-700">Size: {item.selectedVariantLabel}</p>}
            {item.selectedModifiers && item.selectedModifiers.length > 0 && (
              <p className="line-clamp-2">Adds: {item.selectedModifiers.map(m => m.name).join(', ')}</p>
            )}
          </div>
        )}

        <p className="mt-1 text-sm font-bold text-gray-900">{formatPrice(item.unitPrice)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button onClick={() => removeItem(item.cartLineId)} className="rounded-full bg-gray-100 p-1.5 text-gray-700 transition hover:bg-gray-200">
          {item.quantity > 1 ? <Minus size={14} /> : <X size={14} />}
        </button>
        <span className="font-bold w-6 text-center">{item.quantity}</span>
        <button onClick={() => addItem(item)} className="rounded-full bg-[#6DBE45]/10 p-1.5 text-[#6DBE45] transition hover:bg-[#6DBE45] hover:text-white">
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}