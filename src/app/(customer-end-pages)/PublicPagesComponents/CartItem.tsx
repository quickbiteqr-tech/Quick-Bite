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
    <div className="flex items-center gap-4 py-4">
      <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-gray-100">
        {item.photo_url ? (
          <Image src={item.photo_url} alt={item.name} layout="fill" objectFit="cover" />
        ) : (
          <div className="bg-gray-200 h-full w-full"></div>
        )}
      </div>
      <div className="flex-grow">
        <p className="font-semibold text-gray-800">{item.name}</p>
        <p className="text-sm text-gray-600">{formatPrice(item.price)}</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => removeItem(item.id)} className="rounded-full bg-gray-100 p-1.5 text-gray-700 transition hover:bg-gray-200">
          {item.quantity > 1 ? <Minus size={14} /> : <X size={14} />}
        </button>
        <span className="font-bold w-6 text-center">{item.quantity}</span>
        <button onClick={() => addItem(item)} className="rounded-full bg-orange-50 p-1.5 text-[#FF6B00] transition hover:bg-[#FF6B00] hover:text-white">
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}