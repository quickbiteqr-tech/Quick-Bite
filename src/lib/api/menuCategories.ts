export type MenuCategoryItem = {
  id: number;
  name: string;
  restaurant_id: string;
  created_at?: string;
};

export async function getMenuCategories(): Promise<MenuCategoryItem[]> {
  const res = await fetch("/api/menu-categories");
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createMenuCategory(name: string): Promise<MenuCategoryItem> {
  const res = await fetch("/api/menu-categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const text = await res.text();
    let message = text || "Failed to create category";
    try {
      const parsed = JSON.parse(text);
      message = parsed.error || parsed.message || message;
    } catch {}
    throw new Error(message);
  }
  return res.json();
}

export async function updateMenuCategory(id: number, name: string): Promise<MenuCategoryItem> {
  const res = await fetch(`/api/menu-categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const text = await res.text();
    let message = text || "Failed to update category";
    try {
      const parsed = JSON.parse(text);
      message = parsed.error || parsed.message || message;
    } catch {}
    throw new Error(message);
  }
  return res.json();
}

export async function deleteMenuCategory(id: number): Promise<void> {
  const res = await fetch(`/api/menu-categories/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const text = await res.text();
    let message = text || "Failed to delete category";
    try {
      const parsed = JSON.parse(text);
      message = parsed.error || parsed.message || message;
    } catch {}
    throw new Error(message);
  }
}
