import 'server-only'
import { createClient } from '@supabase/supabase-js'

let cached: ReturnType<typeof createClient> | null = null

export function createAdminClient() {
  if (cached) return cached
  cached = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
  return cached
}
