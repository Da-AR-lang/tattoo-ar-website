'use server'

import { createClient } from '@/lib/supabase/server'
import type { Tattoo } from '@/lib/types'

export interface FetchTattoosParams {
  query?: string
  style?: string
  artistId?: string
  cursor?: string | null
  limit?: number
}

export async function fetchTattoos(params: FetchTattoosParams): Promise<Tattoo[]> {
  const supabase = await createClient()
  let q = supabase
    .from('tattoos')
    .select('*, artist:artists(id, name, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(params.limit ?? 30)

  if (params.cursor) q = q.lt('created_at', params.cursor)
  if (params.style) q = q.eq('style', params.style)
  if (params.artistId) q = q.eq('artist_id', params.artistId)
  if (params.query) {
    const safe = params.query.replace(/[%,()]/g, '').trim()
    if (safe) q = q.ilike('title', `%${safe}%`)
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data as Tattoo[]) ?? []
}
