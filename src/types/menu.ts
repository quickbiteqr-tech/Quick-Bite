export type MenuCategory = string;

export interface MenuItemVariant {
  id: string;
  menu_item_id: string;
  label: string;
  price: number;
  sort_order?: number;
  is_default?: boolean;
}

export interface ModifierOption {
  id: string;
  modifier_group_id: string;
  name: string;
  price: number;
  is_default?: boolean;
  sort_order?: number;
}

export interface ModifierGroup {
  id: string;
  menu_item_id: string;
  name: string;
  min_selection?: number;
  max_selection?: number;
  is_required?: boolean;
  sort_order?: number;
  options?: ModifierOption[];
}

export interface MenuItem {
  id: string | number;
  restaurant_id: string;
  name: string;
  description: string;
  price: number;
  category?: string;
  is_veg?: boolean;
  dietary_tags?: string[];
  photo_url?: string;
  available: boolean;
  created_at?: string;
  updated_at?: string;
  variants?: MenuItemVariant[];
  modifier_groups?: ModifierGroup[];
}

export interface SelectedModifier {
  id: string;
  name: string;
  price: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
  selectedVariantId?: string;
  selectedVariantLabel?: string;
  variantPrice?: number;
  selectedModifiers?: SelectedModifier[];
  unitPrice?: number; // Pre-calculated: variant_price + Σ modifier_prices
}
