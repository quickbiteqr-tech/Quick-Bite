import { supabase } from '@/lib/supabase/client';

/**
 * Fetches the restaurant record for the currently logged-in user.
 * @returns A promise that resolves to an object with the restaurant's id and slug, or null if not found.
 */
export const getMyRestaurant = async (): Promise<{ id: string; slug: string } | null> => {
  // 1. Get the current user's session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    console.error("No user session found.");
    return null;
  }

  // 2. Use the user's ID to find their restaurant and select both id and slug
  const { data, error } = await supabase
    .from('restaurants')
    .select('id, slug') // Fetch both the id and the new slug column
    .eq('user_id', session.user.id)
    .single(); // We expect only one restaurant per user

  if (error) {
    console.error('Error fetching restaurant:', error.message);
    return null;
  }

  return data;
};