'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MenuItem, SelectedModifier } from '@/types/menu';
import { Minus, Plus, Trash2, X } from 'lucide-react';
import { useCartStore } from '../store/cartStore'; 
import ModifierSelectionSheet from './ModifierSelectionSheet';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(price);
};

interface CustomerMenuItemCardProps {
  item: MenuItem;
  isReadOnly?: boolean;
}

export default function CustomerMenuItemCard({ item, isReadOnly = false }: CustomerMenuItemCardProps) {
  const { addItem, removeItem, items } = useCartStore();
  const isVeg = 'dietary_tags' in item 
    ? item.dietary_tags?.includes('veg') 
    : ('is_veg' in item ? Boolean((item as MenuItem & { is_veg?: boolean }).is_veg) : false);
    
  // Sum up all quantities of this item, regardless of variants
  const totalQuantity = items.reduce((sum, cartItem) => {
    return String(cartItem.id) === String(item.id) ? sum + cartItem.quantity : sum;
  }, 0);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isModifierSheetOpen, setIsModifierSheetOpen] = useState(false);

  const hasCustomizations = (item.variants && item.variants.length > 0) || (item.modifier_groups && item.modifier_groups.length > 0);

  // Use base price or lowest variant price as starting price
  const displayPrice = item.variants && item.variants.length > 0 
    ? Math.min(...item.variants.map(v => Number(v.price)))
    : item.price;

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasCustomizations) {
      setIsModifierSheetOpen(true);
    } else {
      addItem({ ...item, unitPrice: item.price });
    }
  };

  const handleAddToCartFromSheet = (
    itemData: MenuItem,
    variantId?: string,
    variantLabel?: string,
    variantPrice?: number,
    selectedModifiers?: SelectedModifier[],
    unitPrice?: number
  ) => {
    addItem({
      ...itemData,
      selectedVariantId: variantId,
      selectedVariantLabel: variantLabel,
      variantPrice,
      selectedModifiers,
      unitPrice: unitPrice || itemData.price
    });
  };

  // For non-customizable items, removing is easy.
  // For customizable items, we direct them to the cart to remove specific variants.
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasCustomizations) {
      // Find the specific cartLineId for this simple item
      const cartLineId = String(item.id);
      removeItem(cartLineId);
    }
  };

  return (
    <>
    <div
      className="group flex items-start justify-between gap-4 border-b border-slate-100 bg-white p-4"
      onClick={() => setIsDetailOpen(true)}
    >
      {/* Left Column - 70% */}
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-2">
          {/* FSSAI Standard Dietary Icon */}
          <span className={`flex h-4 w-4 items-center justify-center rounded-sm border ${isVeg ? 'border-green-600' : 'border-red-600'}`}>
            <span className={`h-2 w-2 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
          </span>
        </div>
        
        <h3 className="mt-1 text-base font-bold text-slate-800 line-clamp-2">{item.name}</h3>
        <p className="mt-1 text-sm font-semibold text-slate-700">
          {hasCustomizations && <span className="text-xs text-slate-500 font-normal mr-1">from</span>}
          {formatPrice(displayPrice)}
        </p>
        
        {item.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">{item.description}</p>
        )}
      </div>

      {/* Right Column - 30% */}
      <div className="relative shrink-0 flex flex-col items-center pb-4">
        <div className="relative h-28 w-28 overflow-hidden rounded-xl bg-slate-50 shadow-sm border border-slate-100">
          {item.photo_url ? (
            <Image
              src={item.photo_url}
              alt={item.name}
              fill
              className="object-cover w-full h-full"
              sizes="112px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-slate-400">
              No Image
            </div>
          )}
        </div>

        {/* Overlapping ADD Button */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-10">
          {!hasCustomizations && totalQuantity > 0 ? (
            <div className={`flex items-center h-8 rounded-lg border border-slate-100 bg-white shadow-md w-24 ${isReadOnly ? 'opacity-50 pointer-events-none' : ''}`}>
              <button
                onClick={handleRemoveClick}
                disabled={isReadOnly}
                className="flex-1 flex items-center justify-center text-[#6DBE45] transition hover:bg-slate-50 h-full rounded-l-lg"
              >
                {totalQuantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
              </button>
              <span className="w-8 text-center text-sm font-extrabold text-[#6DBE45]">{totalQuantity}</span>
              <button
                onClick={handleAddClick}
                disabled={isReadOnly}
                className="flex-1 flex items-center justify-center text-[#6DBE45] transition hover:bg-slate-50 h-full rounded-r-lg"
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={handleAddClick}
                disabled={isReadOnly}
                className={`bg-white text-[#6DBE45] font-extrabold text-sm px-6 py-1.5 rounded-lg shadow-md border border-slate-100 uppercase tracking-wide whitespace-nowrap ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}`}
              >
                ADD
              </button>
              {totalQuantity > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#6DBE45] text-[10px] font-bold text-white shadow-sm border border-white">
                  {totalQuantity}
                </span>
              )}
            </div>
          )}
        </div>
        
        {hasCustomizations && (
          <span className="absolute -bottom-5 text-[9px] font-medium text-slate-400 whitespace-nowrap left-1/2 -translate-x-1/2">
            Customizable
          </span>
        )}
      </div>
    </div>
    <div
      className={`fixed inset-0 z-[1300] bg-black/40 backdrop-blur-sm transition-opacity ${isDetailOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      onClick={() => setIsDetailOpen(false)}
    />
    <div
      className={`fixed bottom-0 left-0 right-0 z-[1310] mx-auto w-full max-w-md transform overflow-hidden rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 ${isDetailOpen ? 'translate-y-0' : 'translate-y-full'}`}
    >
      <div className="relative h-64 w-full bg-slate-100">
        {item.photo_url ? (
          <Image src={item.photo_url} alt={item.name} fill className="object-cover" sizes="100vw" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">No Image</div>
        )}
        <span className={isVeg ? 'veg-icon absolute left-4 top-4 shadow-md' : 'non-veg-icon absolute left-4 top-4 shadow-md'}>
          <span className={isVeg ? 'veg-dot' : 'non-veg-dot'} />
        </span>
        <button
          type="button"
          onClick={() => setIsDetailOpen(false)}
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur transition-colors hover:bg-white"
          aria-label="Close item details"
        >
          <X size={18} />
        </button>
      </div>
      <div className="p-5 pb-8 space-y-4">
        <h3 className="text-2xl font-bold text-slate-900">{item.name}</h3>
        {item.description && <p className="text-sm text-slate-600">{item.description}</p>}
        
        <div className="flex items-center justify-between border-t border-slate-100 pt-5">
          <div>
            <p className="text-2xl font-bold text-slate-900">{formatPrice(displayPrice)}</p>
            {hasCustomizations && <p className="text-xs text-slate-500">Customization available</p>}
          </div>
          
          {!hasCustomizations && totalQuantity > 0 ? (
            <div className={`inline-flex h-12 items-center rounded-xl border border-[#6DBE45]/30 bg-white p-1.5 shadow-sm ${isReadOnly ? 'opacity-50 pointer-events-none' : ''}`}>
              <button
                onClick={handleRemoveClick}
                disabled={isReadOnly}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#6DBE45] transition hover:bg-[#6DBE45]/10"
              >
                {totalQuantity === 1 ? <Trash2 size={16} /> : <Minus size={16} />}
              </button>
              <span className="min-w-10 px-2 text-center text-lg font-bold text-slate-800">{totalQuantity}</span>
              <button
                onClick={handleAddClick}
                disabled={isReadOnly}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#6DBE45] text-white shadow-sm transition hover:bg-[#5aa337]"
              >
                <Plus size={16} />
              </button>
            </div>
          ) : (
            <button
              disabled={isReadOnly}
              onClick={() => {
                setIsDetailOpen(false);
                handleAddClick({ stopPropagation: () => {} } as React.MouseEvent);
              }}
              className={`inline-flex h-12 items-center rounded-xl px-8 text-sm font-bold text-white shadow-[0_8px_20px_rgba(109,190,69,0.25)] transition ${isReadOnly ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-[#6DBE45] hover:bg-[#5aa337]'}`}
            >
              {totalQuantity > 0 && hasCustomizations ? 'ADD ANOTHER' : 'ADD TO ORDER'}
            </button>
          )}
        </div>
      </div>
    </div>

    {/* The new Relational Menu Modifier Sheet */}
    <ModifierSelectionSheet
      item={item}
      isOpen={isModifierSheetOpen}
      onClose={() => setIsModifierSheetOpen(false)}
      onAddToCart={handleAddToCartFromSheet}
    />
    </>
  );
}