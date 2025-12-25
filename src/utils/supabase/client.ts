import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // createBrowserClient bersifat sinkron (langsung jalan, tidak butuh await)
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}