// @/lib/types/types.ts

export interface Restaurant {
  id: string;
  owner_name: string;
  restaurant_name: string;
  email: string;
  phone: string;
  address: string;
  logo_url: string | null;
  created_at: string;
}

export interface ValidationErrors {
  owner_name?: string;
  restaurant_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo_url?: string;
}

export interface RestaurantUpdateData {
  owner_name: string;
  restaurant_name: string;
  email: string;
  phone: string;
  address: string;
  logo_url: string | null;
}

export interface RestaurantProfileProps {
  restaurant: Restaurant;
  onUpdate?: (data: RestaurantUpdateData) => Promise<void>;
}