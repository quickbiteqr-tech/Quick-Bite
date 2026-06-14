import { create } from 'zustand';
import { MenuItem } from '@/types/menu';

export interface CartItem extends MenuItem {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: MenuItem) => void;
  removeItem: (itemId: string | number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (item) => {
    const currentItems = get().items;
    const existingItem = currentItems.find((cartItem) => cartItem.id === item.id);
    if (existingItem) {
      const updatedItems = currentItems.map((cartItem) =>
        cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
      );
      set({ items: updatedItems });
    } else {
      set({ items: [...currentItems, { ...item, quantity: 1 }] });
    }
  },
  removeItem: (itemId) => {
    const currentItems = get().items;
    const existingItem = currentItems.find((cartItem) => String(cartItem.id) === String(itemId));
    if (existingItem && existingItem.quantity > 1) {
      const updatedItems = currentItems.map((cartItem) =>
        String(cartItem.id) === String(itemId) ? { ...cartItem, quantity: cartItem.quantity - 1 } : cartItem
      );
      set({ items: updatedItems });
    } else {
      set({ items: currentItems.filter((cartItem) => String(cartItem.id) !== String(itemId)) });
    }
  },
  clearCart: () => set({ items: [] }),
  totalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
  totalPrice: () => get().items.reduce((total, item) => total + item.price * item.quantity, 0),
}));