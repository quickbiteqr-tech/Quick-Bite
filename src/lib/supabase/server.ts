// src/lib/supabase/server.ts
import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function  createServerClient() {
  const cookieStore = await cookies() // ✅ must await

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Safe to ignore if you have middleware refreshing sessions
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Safe to ignore if you have middleware refreshing sessions
          }
        },
      },
      // OPTIMIZATION (H-03): Enable keepalive to prevent TCP connection exhaustion 
      // when connecting to PostgREST in a high-concurrency serverless environment.
      // Note: If you eventually migrate to direct PostgreSQL queries (e.g. Prisma/pg), 
      // use process.env.SUPABASE_POOLER_URL instead of the REST API.
      global: {
        fetch: (url, init) => fetch(url, { ...init, keepalive: true }),
      }
    }
  )
}
