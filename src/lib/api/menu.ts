import { MenuItem } from "@/types/menu";

export type NewMenuItem = Omit<MenuItem, "id" | "created_at" | "updated_at">;

export async function getMenuItems(): Promise<MenuItem[]> {
  const res = await fetch("/api/menus");
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getMenuItem(id: string | number): Promise<MenuItem> {
  const res = await fetch(`/api/menu/${id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function addMenuItem(item: NewMenuItem): Promise<MenuItem> {
  const res = await fetch("/api/menu", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateMenuItem(
  id: string | number,
  updates: Partial<MenuItem>
): Promise<MenuItem> {
  const safeUpdates: Partial<MenuItem> = { ...updates };
  delete (safeUpdates as Partial<MenuItem> & { updated_at?: string }).updated_at;
  delete (safeUpdates as Partial<MenuItem> & { created_at?: string }).created_at;
  delete (safeUpdates as Partial<MenuItem> & { id?: string | number }).id;
  delete (safeUpdates as Partial<MenuItem> & { restaurant_id?: string }).restaurant_id;

  const res = await fetch(`/api/menu/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(safeUpdates),
  });
  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage = `Failed to update menu item (${res.status})`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorMessage;
      console.error("Update error details:", errorJson);
      if (errorJson.code) {
        console.error("Supabase error code:", errorJson.code);
      }
      if (errorJson.details) {
        console.error("Supabase error details:", errorJson.details);
      }
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

export async function deleteMenuItem(id: string | number): Promise<void> {
  const res = await fetch(`/api/menu/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage = `Failed to delete menu item (${res.status})`;
    let debugInfo: {
      orderItemsCount?: number;
      orderItems?: Array<{ id: string; order_id: string; menu_item: string | number }>;
      orders?: Array<{ id: string; track_code: string; status: string; created_at: string }>;
    } | null = null;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorMessage;
      debugInfo = errorJson.debug || null;
      
      // Log debug info to console if available
      if (debugInfo) {
        console.log("🔍 Debug info from server:", debugInfo);
        console.log(`Found ${debugInfo.orderItemsCount} order items using this menu item`);
        if (debugInfo.orders && debugInfo.orders.length > 0) {
          console.log("Orders using this menu item:", debugInfo.orders);
        }
      }
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }
}
