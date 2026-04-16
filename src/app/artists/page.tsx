import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink, ArrowRight } from 'lucide-react'
import type { Artist } from '@/lib/types'

export const revalidate = 300

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

function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <Link
      href={`/artists/${artist.id}`}
      className="group bg-[#111111] border border-[#2a2a2a] rounded-2xl overflow-hidden hover:border-[#c9a84c]/40 transition-all duration-300 hover:-translate-y-1"
    >
      {/* Avatar */}
      <div className="relative h-64 bg-[#1a1a1a] overflow-hidden">
        {artist.avatar_url ? (
          <Image
            src={artist.avatar_url}
            alt={artist.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-[#2a2a2a] flex items-center justify-center">
              <span className="text-3xl font-bold text-[#c9a84c]">
                {artist.name.charAt(0)}
              </span>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent opacity-60" />
      </div>

      {/* Info */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-xl font-semibold group-hover:text-[#c9a84c] transition-colors">
            {artist.name}
          </h2>
          {artist.instagram && (
            <span
              onClick={(e) => {
                e.preventDefault()
                window.open(`https://instagram.com/${artist.instagram}`, '_blank')
              }}
              className="text-gray-500 hover:text-[#c9a84c] transition-colors cursor-pointer"
            >
              <ExternalLink size={18} />
            </span>
          )}
        </div>

        {artist.bio && (
          <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 mb-4">
            {artist.bio}
          </p>
        )}

        <div className="flex items-center gap-2 text-[#c9a84c] text-sm mt-auto">
          查看作品集 <ArrowRight size={14} />
        </div>
      </div>
    </Link>
  )
}
