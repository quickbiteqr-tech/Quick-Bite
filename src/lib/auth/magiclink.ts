import { supabase } from '../supabase/client';

/**
 * Sends a magic link login email.
 * If the user doesn’t exist, Supabase will create one automatically
 * (since we enabled `shouldCreateUser: true`).
 */
export const sendMagicLink = async (email: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      console.error('Magic link error:', error.message);

      // Map Supabase errors to user-friendly messages
      if (error.message.toLowerCase().includes('invalid')) {
        return { data: null, error: 'Please enter a valid email address.' };
      }

      if (error.message.toLowerCase().includes('rate limit')) {
        return { data: null, error: 'Too many requests. Please wait a moment before trying again.' };
      }

      return { data: null, error: 'Failed to send login link. Please try again later.' };
    }

    return { data, error: null };
  } catch (err: unknown) {
    console.error('Unexpected magic link error:', err);
    return { data: null, error: 'An unexpected error occurred. Please try again.' };
  }
};
