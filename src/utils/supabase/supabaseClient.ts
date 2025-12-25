import { createBrowserClient } from '@supabase/ssr'

// PENTING: Harus ada kata 'export' di depan
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}