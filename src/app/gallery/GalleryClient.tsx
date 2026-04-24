'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import type { Artist, Style, Tattoo } from '@/lib/types'
import TattooGrid from '@/components/TattooGrid'
import { fetchTattoos } from './actions'

interface Props {
  initialTattoos: Tattoo[]
  totalCount: number
  artists: Pick<Artist, 'id' | 'name'>[]
  styles: Style[]
  pageSize: number
}

export default function GalleryClient({
  initialTattoos,
  totalCount,
  artists,
  styles,
  pageSize,
}: Props) {
  const [tattoos, setTattoos] = useState<Tattoo[]>(initialTattoos)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('')
  const [selectedArtist, setSelectedArtist] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialTattoos.length >= pageSize)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const reqTokenRef = useRef(0)
  const firstLoadRef = useRef(true)

  // Debounce text query (300ms) so typing doesn't hammer Supabase
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(t)
  }, [query])

  // Reset list when any filter changes (skip the initial mount)
  useEffect(() => {
    if (firstLoadRef.current) {
      firstLoadRef.current = false
      return
    }
    const token = ++reqTokenRef.current
    setLoading(true)
    fetchTattoos({
      query: debouncedQuery || undefined,
      style: selectedStyle || undefined,
      artistId: selectedArtist || undefined,
      limit: pageSize,
    })
      .then((data) => {
        if (token !== reqTokenRef.current) return
        setTattoos(data)
        setHasMore(data.length >= pageSize)
      })
      .catch(console.error)
      .finally(() => {
        if (token === reqTokenRef.current) setLoading(false)
      })
  }, [debouncedQuery, selectedStyle, selectedArtist, pageSize])

  // Append next page when sentinel enters viewport
  const loadMore = useCallback(async () => {
    if (loading || !hasMore || tattoos.length === 0) return
    const last = tattoos[tattoos.length - 1]
    const token = ++reqTokenRef.current
    setLoading(true)
    try {
      const more = await fetchTattoos({
        query: debouncedQuery || undefined,
        style: selectedStyle || undefined,
        artistId: selectedArtist || undefined,
        cursor: last.created_at,
        limit: pageSize,
      })
      if (token !== reqTokenRef.current) return
      setTattoos((prev) => [...prev, ...more])
      setHasMore(more.length >= pageSize)
    } catch (e) {
      console.error(e)
    } finally {
      if (token === reqTokenRef.current) setLoading(false)
    }
  }, [loading, hasMore, tattoos, debouncedQuery, selectedStyle, selectedArtist, pageSize])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: '400px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  const hasFilters = query || selectedStyle || selectedArtist
  const clearFilters = () => {
    setQuery('')
    setSelectedStyle('')
    setSelectedArtist('')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">作品集</h1>
        <p className="text-gray-400">探索 {totalCount} 件精選刺青作品</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-5 mb-10 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            placeholder="搜尋作品名稱..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
          />
        </div>

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
      <p className="text-sm text-gray-500 mb-6">已載入 {tattoos.length} 件</p>

      {/* Grid */}
      {tattoos.length === 0 && !loading ? (
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
        <>
          <TattooGrid tattoos={tattoos} />
          <div
            ref={sentinelRef}
            className="h-20 flex items-center justify-center mt-8"
          >
            {loading && (
              <div className="text-gray-500 text-sm animate-pulse">載入中...</div>
            )}
            {!loading && !hasMore && tattoos.length > 0 && (
              <div className="text-gray-600 text-xs">— 已顯示全部 —</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
