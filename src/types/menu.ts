export type MenuCategory = string;

export interface MenuItem {
  id: string | number;
  restaurant_id: string;
  name: string;
  description: string;
  price: number;
  category?: string;
  is_veg?: boolean;
  photo_url?: string;
  available: boolean;
  created_at?: string;
  updated_at?: string;
}
