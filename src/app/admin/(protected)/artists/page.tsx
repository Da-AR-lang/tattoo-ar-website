import { createClient } from '@/lib/supabase/server'
import ArtistsAdmin from './ArtistsAdmin'
import type { Artist } from '@/lib/types'

export default async function AdminArtistsPage() {
  const supabase = await createClient()
  const { data: artists } = await supabase
    .from('artists')
    .select('*')
    .order('created_at', { ascending: false })

  return <ArtistsAdmin artists={(artists as Artist[]) ?? []} />
}
