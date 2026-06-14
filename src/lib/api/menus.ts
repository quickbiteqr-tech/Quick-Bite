// src/lib/api/menus.ts
export type Menu = {
  id: number;
  name: string;
  description: string | null;
  category: 'Main Menu' | 'Special Menu' | 'Seasonal Menu' | 'Bar Menu';
  status: 'Active' | 'Inactive' | 'Draft';
  image: string | null;
  item_count?: number; // Optional, from a DB view or join
  avg_price?: number; // Optional
};

export async function getMenus(): Promise<Menu[]> {
  const res = await fetch('/api/menus');
  if (!res.ok) {
    throw new Error('Failed to fetch menus');
  }
  return res.json();
}