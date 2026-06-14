import { supabase } from "@/lib/supabase/client";
import { MenuItem } from "@/types/menu";
import { Restaurant } from "@/types/restaurant";

type CustomerMenuBundleCache = {
  details: Restaurant | null;
  items: MenuItem[];
  fetchedAt: number;
};

const customerMenuBundleCache = new Map<string, CustomerMenuBundleCache>();
const CUSTOMER_BUNDLE_TTL_MS = 60_000;

/**
 * Fetch basic restaurant details by slug (client-side)
 */
export async function getRestaurantBySlug(
  slug: string
): Promise<{ id: string; restaurant_name: string; slug: string } | null> {
  
  // Check if Supabase environment variables are available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn("Supabase environment variables not configured");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("restaurants")
      .select("id, restaurant_name, slug")
      .eq("slug", slug)
      // FIX: Use .maybeSingle() to prevent errors if multiple rows are found
      .maybeSingle();

    if (error) {
      console.error("Error fetching restaurant by slug:", error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error creating Supabase client:", error);
    return null;
  }
}

/**
 * Get all details for the cart and page header (client-side).
 */
export async function getRestaurantDetails(slug: string): Promise<Restaurant | null> {
    // Check if Supabase environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn("Supabase environment variables not configured");
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('restaurants')
            .select('*') // Select all details
            .eq('slug', slug)
            // FIX: Use .maybeSingle() here as well for consistency and safety
            .maybeSingle();

        if (error) {
            console.error("Error fetching full restaurant details:", error.message);
            return null;
        }
        return data;
    } catch (error) {
        console.error("Error creating Supabase client:", error);
        return null;
    }
}


/**
 * Fetch available menu items for a restaurant by slug (client-side)
 */
export async function getPublicMenuItems(slug: string): Promise<MenuItem[]> {
  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) return [];

  // Check if Supabase environment variables are available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn("Supabase environment variables not configured");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .eq("available", true);

    if (error) {
      console.error("Error fetching public menu items:", error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error creating Supabase client:", error);
    return [];
  }
}

export async function getCustomerMenuBundle(slug: string): Promise<{ details: Restaurant | null; items: MenuItem[] }> {
  const now = Date.now();
  const cached = customerMenuBundleCache.get(slug);
  if (cached && now - cached.fetchedAt < CUSTOMER_BUNDLE_TTL_MS) {
    return { details: cached.details, items: cached.items };
  }

  const [details, items] = await Promise.all([getRestaurantDetails(slug), getPublicMenuItems(slug)]);
  customerMenuBundleCache.set(slug, {
    details,
    items,
    fetchedAt: now,
  });

  return { details, items };
}

/** Clears cached menu bundle so customer pages pick up profile changes (e.g. new logo) immediately. */
export function invalidateCustomerMenuBundleCache(slug: string) {
  if (!slug) return;
  customerMenuBundleCache.delete(slug);
}