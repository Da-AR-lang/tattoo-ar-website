import { createClient } from '@/lib/supabase/server'
import GalleryClient from './GalleryClient'
import type { Artist, Style } from '@/lib/types'
import type { Metadata } from 'next'
import { fetchTattoos } from './actions'

export const revalidate = 300

const PAGE_SIZE = 30

export const metadata: Metadata = {
  title: '作品集',
  description: '瀏覽數百件精選刺青作品，依風格與藝術家搜尋你的理想圖案',
}

export default async function GalleryPage() {
  const supabase = await createClient()

  const [initialTattoos, { data: artists }, { data: styles }, { count }] = await Promise.all([
    fetchTattoos({ limit: PAGE_SIZE }),
    supabase.from('artists').select('id, name'),
    supabase.from('styles').select('*').eq('is_hidden', false).order('name'),
    supabase.from('tattoos').select('*', { count: 'exact', head: true }),
  ])

  return (
    <GalleryClient
      initialTattoos={initialTattoos}
      totalCount={count ?? initialTattoos.length}
      artists={(artists as Pick<Artist, 'id' | 'name'>[]) ?? []}
      styles={(styles as Style[]) ?? []}
      pageSize={PAGE_SIZE}
    />
  )
}
