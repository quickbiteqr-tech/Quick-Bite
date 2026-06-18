// src/components/admin/types.ts
// Shared TypeScript interfaces for the Admin Panel

export interface AdminProfile {
  id: string;
  role: 'ADMIN' | 'USER';
  created_at: string;
}

export interface GlobalMenuItem {
  id: string;
  name: string;
  category: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export type RestaurantStatus = 'active' | 'blacklisted';

export interface AdminRestaurant {
  id: string;
  restaurant_name: string;
  slug: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string | null;
  banner_url?: string;
  is_active?: boolean;
  owner_name?: string;
  status: RestaurantStatus;
}

export const MENU_CATEGORIES = [
  'Starters',
  'Main Course',
  'Desserts',
  'Beverages',
  'Snacks',
  'Sides',
  'Salads',
  'Soups',
  'Breads',
  'Combos',
] as const;

export type MenuCategory = (typeof MENU_CATEGORIES)[number];
