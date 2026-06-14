import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  // Use console.warn instead of console.error to avoid Next.js error handling
  console.warn(
    `⚠️ Missing Supabase environment variables: ${missingVars.join(', ')}\n\n` +
    `Please check your .env.local file in the project root and ensure these variables are set:\n` +
    `NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url\n` +
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key\n\n` +
    `IMPORTANT: After adding/updating variables, you MUST restart your dev server:\n` +
    `1. Stop the server (Ctrl+C)\n` +
    `2. Run: npm run dev\n\n` +
    `You can find these values in your Supabase dashboard:\n` +
    `https://supabase.com/dashboard/project/_/settings/api`
  );
}

// Create client with fallback values to prevent app crash
// Note: This won't work for actual Supabase operations, but allows the app to load
export const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
