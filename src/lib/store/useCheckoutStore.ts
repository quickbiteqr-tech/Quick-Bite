import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';

export interface OrderItem {
  quantity: number;
  price: number;
  variant_label?: string | null;
  modifiers?: any[] | null;
  menu_items: {
    name: string;
    image_url?: string | null;
  };
}

export interface ActiveOrder {
  id: string;
  track_code: string;
  status: string;
  total_amount: number;
  estimated_time?: number | null;
  created_at: string;
  updated_at?: string;
  order_items: OrderItem[];
}

interface CheckoutState {
  activeOrders: ActiveOrder[];
  aggregatedTotal: number;
  isCheckoutSheetOpen: boolean;
  splitWays: number;
  isLoadingSession: boolean;
  hasActiveOrders: boolean;
  restaurantId: string | null;
  restaurantUpiId?: string | null;
  restaurantName?: string | null;

  tableId: string | null;

  setCheckoutSheetOpen: (isOpen: boolean) => void;
  setSplitWays: (ways: number) => void;
  fetchActiveSession: () => Promise<void>;
  clearSession: () => void;
  setRestaurantDetails: (upiId: string, name: string) => void;
  subscribeToOrderUpdates: (tableId: string) => void;
  unsubscribeFromOrderUpdates: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set, get) => ({
  activeOrders: [],
  aggregatedTotal: 0,
  isCheckoutSheetOpen: false,
  splitWays: 1,
  isLoadingSession: true,
  hasActiveOrders: false,
  restaurantId: null,
  restaurantUpiId: null,
  restaurantName: null,
  tableId: null,

  setCheckoutSheetOpen: (isOpen) => set({ isCheckoutSheetOpen: isOpen }),
  
  setSplitWays: (ways) => set({ splitWays: Math.max(1, ways) }),

  fetchActiveSession: async () => {
    set({ isLoadingSession: true });
    try {
      const res = await fetch('/api/orders/me');
      if (!res.ok) throw new Error('Failed to fetch session');
      
      const data = await res.json();
      set({
        activeOrders: data.orders || [],
        aggregatedTotal: data.aggregatedTotal || 0,
        hasActiveOrders: data.hasActiveOrders || false,
        restaurantId: data.restaurantId || null,
        tableId: data.tableId || null,
        isLoadingSession: false,
      });

      if (data.tableId) {
        get().subscribeToOrderUpdates(data.tableId);
      }
    } catch (error) {
      console.error('Session fetch error:', error);
      set({ isLoadingSession: false });
    }
  },

  clearSession: () => set({
    activeOrders: [],
    aggregatedTotal: 0,
    hasActiveOrders: false,
    isCheckoutSheetOpen: false,
    splitWays: 1,
    restaurantId: null,
  }),

  setRestaurantDetails: (upiId, name) => set({ restaurantUpiId: upiId, restaurantName: name }),

  subscribeToOrderUpdates: (tableId: string) => {
    // Unsubscribe if already subscribed to prevent duplicates
    const currentChannel = (get() as any)._channel;
    if (currentChannel) {
      supabase.removeChannel(currentChannel);
    }

    const channel = supabase
      .channel(`public:orders:${tableId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `table_id=eq.${tableId}`,
        },
        (payload) => {
          // If status changed to completed/cancelled, we should refetch session to remove it
          if (['completed', 'cancelled'].includes(payload.new.status)) {
            get().fetchActiveSession();
          } else {
            // Optimistically update the status
            set((state) => {
              const updatedOrders = state.activeOrders.map((order) => {
                if (order.id === payload.new.id) {
                  return { ...order, status: payload.new.status };
                }
                return order;
              });
              return { activeOrders: updatedOrders };
            });
          }
        }
      )
      .subscribe();

    set({ _channel: channel } as any);
  },

  unsubscribeFromOrderUpdates: () => {
    const channel = (get() as any)._channel;
    if (channel) {
      supabase.removeChannel(channel);
      set({ _channel: undefined } as any);
    }
  },
}));
