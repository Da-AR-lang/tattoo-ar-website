import { createClient } from '@/lib/supabase/server'
import GalleryClient from './GalleryClient'
import type { Artist, Style, Tattoo } from '@/lib/types'

export const revalidate = 60

export default async function GalleryPage() {
  const supabase = await createClient()

  const [{ data: tattoos }, { data: artists }, { data: styles }] = await Promise.all([
    supabase
      .from('tattoos')
      .select('*, artist:artists(id, name, avatar_url)')
      .order('created_at', { ascending: false }),
    supabase.from('artists').select('id, name'),
    supabase.from('styles').select('*').order('name'),
  ])

  return (
    <GalleryClient
      tattoos={(tattoos as Tattoo[]) ?? []}
      artists={(artists as Pick<Artist, 'id' | 'name'>[]) ?? []}
      styles={(styles as Style[]) ?? []}
    />
  )
}
