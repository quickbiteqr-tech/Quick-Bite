// src/lib/api/orders.ts
import { CartItem } from '@/app/(customer-end-pages)/store/cartStore';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'complete' | 'cancelled';
export type CustomerOrderStatus = 'Pending' | 'Confirmed' | 'Preparing' | 'Serve' |'Complete' | 'Cancelled';

async function putJson(url: string, body: object) {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    // credentials: include is usually not necessary for same-origin, but harmless and explicit
    credentials: "include",
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    let parsed;
    try { parsed = JSON.parse(errBody); } catch { parsed = { text: errBody }; }
    const message = parsed?.error || parsed?.message || parsed?.text || `HTTP ${res.status}`;
    const e = new Error(message) as Error & { status: number; body: unknown };
    e.status = res.status;
    e.body = parsed;
    throw e;
  }
  return res.json();
}

export type OrderRow = {
  id: string;
  restaurant_id: string;
  track_code: string;
  table_id: number | null;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  estimated_time: number | null;
  status_updated_at?: string | null;
};

/**
 * Submits a new order via the backend API.
 */
export async function submitOrder(
  cartItems: CartItem[],
  restaurantId: string,
  tableId: string,
  totalAmount: number
): Promise<{ success: boolean; trackCode: string; restaurantSlug: string }> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cartItems, restaurantId, tableId, totalAmount }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Could not create order.');
  }

  return res.json();
}

/**
 * Get order details from backend.
 */
export async function getOrderById(orderId: string): Promise<OrderRow | null> {
  const res = await fetch(`/api/orders/${orderId}`);
  if (!res.ok) return null;
  return res.json();
}

/**
 * Update order status (and optional ETA) via backend.
 */
export async function setOrderStatus(
  orderId: string,
  status: CustomerOrderStatus | OrderStatus,
  etaMinutes?: number | null
): Promise<OrderRow> {
  // Use putJson helper so we get rich error objects when something goes wrong
  return putJson(`/api/orders/${orderId}/status`, { status, etaMinutes });
}

/**
 * Convenience wrapper to update only ETA.
 */
export async function setOrderEta(orderId: string, etaMinutes: number | null): Promise<boolean> {
  try {
    await putJson(`/api/orders/${orderId}/eta`, { etaMinutes });
    return true;
  } catch {
    return false;
  }
}
