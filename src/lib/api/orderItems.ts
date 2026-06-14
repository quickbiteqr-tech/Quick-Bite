// src/lib/api/orderItems.ts
// import { supabase } from "@/lib/supabase/client";

export type OrderItemStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled';

export interface OrderItemUpdate {
  status: OrderItemStatus;
  etaMinutes?: number;
  notes?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item: {
    id: string;
    name: string;
    description?: string;
    photo_url?: string;
  } | null;
  quantity: number;
  price: number;
  status: OrderItemStatus;
  estimated_time?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderWithItems {
  order: {
    id: string;
    track_code: string;
    status: string;
    total_amount: number;
    created_at: string;
    is_prepaid?: boolean;
    estimated_time?: number | null;
    table_id?: number | null;
    restaurant_id?: string;
    table: {
      table_number: string;
    } | null;
    restaurant: {
      id: string;
      restaurant_name: string;
      user_id?: string;
    };
  };
  items: OrderItem[];
  stats: {
    totalItems: number;
    statusCounts: Record<string, number>;
    allItemsReady: boolean;
    allItemsServed: boolean;
    hasPreparingItems: boolean;
  };
}

/**
 * Update the status of a specific order item
 */
export async function updateOrderItemStatus(
  orderId: string,
  itemId: string,
  update: OrderItemUpdate
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/orders/${orderId}/items/${itemId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(update),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to update order item status' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating order item status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Get order details with all items and their statuses
 */
export async function getOrderWithItems(orderId: string): Promise<{ 
  success: boolean; 
  data?: OrderWithItems; 
  error?: string 
}> {
  try {
    const response = await fetch(`/api/orders/${orderId}/items`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to fetch order items' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching order items:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Get all orders for the current restaurant with item details (paginated)
 */
export async function getRestaurantOrders(page: number = 1, limit: number = 10): Promise<{ 
  success: boolean; 
  data?: OrderWithItems[]; 
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  error?: string 
}> {
  try {
    const url = `/api/orders/enhanced?page=${page}&limit=${limit}`;
    console.log('[getRestaurantOrders] Calling', url);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('[getRestaurantOrders] Response status:', response.status, response.statusText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      console.error('[getRestaurantOrders] Error response:', errorData);
      return { success: false, error: errorData.error || 'Failed to fetch orders' };
    }

    const result = await response.json();
    
    // Handle both old format (array) and new format (object with data and pagination)
    if (Array.isArray(result)) {
      // Legacy format - return as is
      console.log('[getRestaurantOrders] Success, received', result.length, 'orders (legacy format)');
      return { success: true, data: result };
    } else if (result.data && Array.isArray(result.data)) {
      // New paginated format
      console.log('[getRestaurantOrders] Success, received', result.data.length, 'orders (page', result.pagination?.page, 'of', result.pagination?.totalPages, ')');
      return { 
        success: true, 
        data: result.data,
        pagination: result.pagination
      };
    } else {
      console.error('[getRestaurantOrders] Unexpected response format:', result);
      return { success: false, error: 'Unexpected response format' };
    }
  } catch (error) {
    console.error('[getRestaurantOrders] Exception:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Get status color for UI display
 */
export function getStatusColor(status: OrderItemStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'preparing':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'ready':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'served':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Get status icon for UI display
 */
export function getStatusIcon(status: OrderItemStatus): string {
  switch (status) {
    case 'pending':
      return '⏳';
    case 'confirmed':
      return '✅';
    case 'preparing':
      return '👨‍🍳';
    case 'ready':
      return '🍽️';
    case 'served':
      return '✓';
    case 'cancelled':
      return '❌';
    default:
      return '❓';
  }
}
