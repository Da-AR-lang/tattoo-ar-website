'use client'

import Masonry from 'react-masonry-css'
import Image from 'next/image'
import { useState } from 'react'
import { Eye } from 'lucide-react'
import type { Tattoo } from '@/lib/types'
import TattooModal from './TattooModal'

const breakpointCols = {
  default: 4,
  1280: 4,
  1024: 3,
  768: 2,
  640: 2,
  480: 1,
}

interface Props {
  tattoos: Tattoo[]
}

export default function TattooGrid({ tattoos }: Props) {
  const [selected, setSelected] = useState<Tattoo | null>(null)

  return (
    <>
      <Masonry
        breakpointCols={breakpointCols}
        className="masonry-grid"
        columnClassName="masonry-grid-column"
      >
        {tattoos.map((tattoo) => (
          <TattooCard
            key={tattoo.id}
            tattoo={tattoo}
            onClick={() => setSelected(tattoo)}
          />
        ))}
      </Masonry>

      {selected && (
        <TattooModal tattoo={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}

function TattooCard({ tattoo, onClick }: { tattoo: Tattoo; onClick: () => void }) {
  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-xl bg-white border border-[#2a2a2a] hover:border-[#c9a84c]/40 transition-all duration-300"
      onClick={onClick}
    >
      <div className="relative">
        <Image
          src={tattoo.image_url}
          alt={tattoo.title || '刺青作品'}
          width={400}
          height={300}
          className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="text-center text-white p-4">
            {tattoo.title && (
              <p className="font-semibold text-sm mb-1">{tattoo.title}</p>
            )}
            {tattoo.style && (
              <span className="text-xs bg-[#c9a84c]/20 text-[#c9a84c] px-2 py-0.5 rounded-full">
                {tattoo.style}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* View count */}
      {tattoo.view_count > 0 && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 text-gray-300 text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <Eye size={10} /> {tattoo.view_count}
        </div>
      )}
    </div>
  )
}
