'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink, ArrowRight } from 'lucide-react'
import type { Artist } from '@/lib/types'

export default function ArtistCard({ artist }: { artist: Artist }) {
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
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
