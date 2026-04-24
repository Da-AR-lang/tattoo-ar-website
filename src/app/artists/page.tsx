import { createClient } from '@/lib/supabase/server'
import type { Artist } from '@/lib/types'
import type { Metadata } from 'next'
import ArtistCard from './ArtistCard'

export const revalidate = 300

export const metadata: Metadata = {
  title: '刺青師',
  description: '認識我們的頂尖刺青藝術家，找到最適合你的刺青師',
}

export default async function ArtistsPage() {
  const supabase = await createClient()
  const { data: artists } = await supabase
    .from('artists')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">刺青師</h1>
        <p className="text-gray-400">認識我們的頂尖刺青藝術家</p>
      </div>

      {!artists || artists.length === 0 ? (
        <div className="text-center py-24 text-gray-500">
          <p className="text-lg">暫無刺青師資料</p>
          <p className="text-sm mt-2">請 Admin 先新增刺青師</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {(artists as Artist[]).map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      )}
    </div>
  )
}
