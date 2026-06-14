import { supabase } from '../supabase/client';

/**
 * Logs the user out of Supabase and clears session.
 */
export const logout = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Logout failed:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
};
