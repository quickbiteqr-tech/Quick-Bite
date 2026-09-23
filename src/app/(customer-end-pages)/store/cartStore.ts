import { create } from 'zustand';
import { MenuItem, SelectedModifier } from '@/types/menu';

export interface CartItem extends MenuItem {
  cartLineId: string;
  quantity: number;
  selectedVariantId?: string;
  selectedVariantLabel?: string;
  variantPrice?: number;
  selectedModifiers?: SelectedModifier[];
  unitPrice: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity' | 'cartLineId'>) => void;
  removeItem: (cartLineId: string) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

const generateCartLineId = (
  itemId: string | number,
  variantId?: string,
  modifiers?: SelectedModifier[]
) => {
  let id = String(itemId);
  if (variantId) id += `-${variantId}`;
  if (modifiers && modifiers.length > 0) {
    const sortedModIds = [...modifiers].map(m => m.id).sort().join('_');
    id += `-[${sortedModIds}]`;
  }
  return id;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (itemData) => {
    const currentItems = get().items;
    const cartLineId = generateCartLineId(
      itemData.id,
      itemData.selectedVariantId,
      itemData.selectedModifiers
    );
    
    const existingItemIndex = currentItems.findIndex(
      (cartItem) => cartItem.cartLineId === cartLineId
    );

    if (existingItemIndex >= 0) {
      const updatedItems = [...currentItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + 1
      };
      set({ items: updatedItems });
    } else {
      set({ items: [...currentItems, { ...itemData, cartLineId, quantity: 1 }] });
    }
  },
  removeItem: (cartLineId) => {
    const currentItems = get().items;
    const existingItemIndex = currentItems.findIndex(
      (cartItem) => cartItem.cartLineId === cartLineId
    );
    
    if (existingItemIndex >= 0) {
      const existingItem = currentItems[existingItemIndex];
      if (existingItem.quantity > 1) {
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity - 1
        };
        set({ items: updatedItems });
      } else {
        set({ items: currentItems.filter((cartItem) => cartItem.cartLineId !== cartLineId) });
      }
    }
  },
  clearCart: () => set({ items: [] }),
  totalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
  totalPrice: () => get().items.reduce((total, item) => total + (item.unitPrice * item.quantity), 0),
}));