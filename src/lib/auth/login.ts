import { supabase } from '../supabase/client';

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login failed:', error.message);

      // Map Supabase errors to user-friendly messages
      if (error.message.toLowerCase().includes('invalid login')) {
        return { data: null, error: 'Invalid email or password. Please try again.' };
      }

      if (error.message.toLowerCase().includes('email')) {
        return { data: null, error: 'Email not found. Please sign up first.' };
      }

      return { data: null, error: 'Login failed. Please try again later.' };
    }

    return { data, error: null };
  } catch (err: unknown) {
    console.error('Unexpected login error:', err);
    return { data: null, error: 'An unexpected error occurred. Please try again.' };
  }
};
