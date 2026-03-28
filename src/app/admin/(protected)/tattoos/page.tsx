import { createClient } from '@/lib/supabase/server'
import TattoosAdmin from './TattoosAdmin'
import type { Tattoo, Artist, Style } from '@/lib/types'

export default async function TattoosAdminPage() {
  const supabase = await createClient()

  const [
    { data: tattoos },
    { data: artists },
    { data: styles },
  ] = await Promise.all([
    supabase
      .from('tattoos')
      .select('*, artist:artists(id, name)')
      .order('created_at', { ascending: false }),
    supabase.from('artists').select('id, name').order('name'),
    supabase.from('styles').select('*').order('name'),
  ])

  return (
    <TattoosAdmin
      initialTattoos={(tattoos as Tattoo[]) ?? []}
      artists={(artists as Artist[]) ?? []}
      styles={(styles as Style[]) ?? []}
    />
  )
}
