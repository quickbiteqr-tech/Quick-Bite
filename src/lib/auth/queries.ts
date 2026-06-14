import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Get details of the restaurant for the current authenticated user.
 */
export async function getRestaurantDetails() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieStore }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error('Auth error:', authError.message);
    return null;
  }
  if (!user) return null;

  // FIX ✅ : Match restaurant by user_id (not restaurant.id)
  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching restaurant:', error.message);
    return null;
  }

  return restaurant;
}
