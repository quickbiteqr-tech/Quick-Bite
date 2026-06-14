import { createServerClient } from "@/lib/supabase/server";
import { MenuItem } from "@/types/menu";
import { Restaurant } from "@/types/restaurant";

/**
 * Fetch basic restaurant details by slug (server-side)
 */
export async function getRestaurantBySlugServer(
  slug: string
): Promise<{ id: string; restaurant_name: string; slug: string } | null> {
  
  // Check if Supabase environment variables are available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn("Supabase environment variables not configured");
    return null;
  }

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("restaurants")
      .select("id, restaurant_name, slug")
      .eq("slug", slug)
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
 * Get all details for the cart and page header (server-side).
 */
export async function getRestaurantDetailsServer(slug: string): Promise<Restaurant | null> {
    // Check if Supabase environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn("Supabase environment variables not configured");
        return null;
    }

    try {
        const supabase = await createServerClient();
        const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .eq('slug', slug)
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
 * Fetch available menu items for a restaurant by slug (server-side)
 */
export async function getPublicMenuItemsServer(slug: string): Promise<MenuItem[]> {
  const restaurant = await getRestaurantBySlugServer(slug);
  if (!restaurant) return [];

  // Check if Supabase environment variables are available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn("Supabase environment variables not configured");
    return [];
  }

  try {
    const supabase = await createServerClient();
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
