'use client'

import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import type { Artist, Style, Tattoo } from '@/lib/types'
import TattooGrid from '@/components/TattooGrid'

interface Props {
  tattoos: Tattoo[]
  artists: Pick<Artist, 'id' | 'name'>[]
  styles: Style[]
}

export default function GalleryClient({ tattoos, artists, styles }: Props) {
  const [query, setQuery] = useState('')
  const [selectedStyle, setSelectedStyle] = useState<string>('')
  const [selectedArtist, setSelectedArtist] = useState<string>('')

  const filtered = useMemo(() => {
    return tattoos.filter((t) => {
      const matchQuery =
        !query ||
        t.title?.toLowerCase().includes(query.toLowerCase()) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))

      const matchStyle = !selectedStyle || t.style === selectedStyle
      const matchArtist = !selectedArtist || t.artist_id === selectedArtist

      return matchQuery && matchStyle && matchArtist
    })
  }, [tattoos, query, selectedStyle, selectedArtist])

  const clearFilters = () => {
    setQuery('')
    setSelectedStyle('')
    setSelectedArtist('')
  }

  const hasFilters = query || selectedStyle || selectedArtist

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">作品集</h1>
        <p className="text-gray-400">探索 {tattoos.length} 件精選刺青作品</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-5 mb-10 flex flex-col sm:flex-row gap-4">
        {/* Text Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            placeholder="搜尋作品名稱、標籤..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
          />
        </div>

        {/* Style Filter */}
        <select
          value={selectedStyle}
          onChange={(e) => setSelectedStyle(e.target.value)}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a84c]/50 transition-colors cursor-pointer"
        >
          <option value="">所有風格</option>
          {styles.map((style) => (
            <option key={style.id} value={style.name}>
              {style.name}
            </option>
          ))}
        </select>

        {/* Artist Filter */}
        <select
          value={selectedArtist}
          onChange={(e) => setSelectedArtist(e.target.value)}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a84c]/50 transition-colors cursor-pointer"
        >
          <option value="">所有刺青師</option>
          {artists.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors whitespace-nowrap"
          >
            <X size={14} /> 清除篩選
          </button>
        )}
      </div>

      {/* Style Tags */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSelectedStyle('')}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            !selectedStyle
              ? 'bg-[#c9a84c] text-black border-[#c9a84c]'
              : 'border-[#2a2a2a] text-gray-400 hover:border-[#c9a84c]/40 hover:text-white'
          }`}
        >
          全部
        </button>
        {styles.map((style) => (
          <button
            key={style.id}
            onClick={() =>
              setSelectedStyle(selectedStyle === style.name ? '' : style.name)
            }
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              selectedStyle === style.name
                ? 'bg-[#c9a84c] text-black border-[#c9a84c]'
                : 'border-[#2a2a2a] text-gray-400 hover:border-[#c9a84c]/40 hover:text-white'
            }`}
          >
            {style.name}
          </button>
        ))}
      </div>

      {/* Result count */}
      <p className="text-sm text-gray-500 mb-6">
        顯示 {filtered.length} / {tattoos.length} 件作品
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-500">
          <p className="text-lg">找不到符合條件的作品</p>
          <button
            onClick={clearFilters}
            className="mt-4 text-[#c9a84c] text-sm hover:underline"
          >
            清除篩選
          </button>
        </div>
      ) : (
        <TattooGrid tattoos={filtered} />
      )}
    </div>
  )
}
