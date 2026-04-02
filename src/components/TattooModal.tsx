'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { X, Eye, Camera, ShoppingBag, Check } from 'lucide-react'
import type { Tattoo } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useFittingRoomCtx } from '@/context/FittingRoomContext'

interface Props {
  tattoo: Tattoo
  onClose: () => void
}

export default function TattooModal({ tattoo, onClose }: Props) {
  const { has, add, remove } = useFittingRoomCtx()
  const inRoom = has(tattoo.id)
  const router = useRouter()

  const handleARClick = () => {
    if (!inRoom) add(tattoo)
    router.push('/ar')
  }

  // Increment view count and record daily view on open
  useEffect(() => {
    const supabase = createClient()
    supabase.rpc('increment_view_count', { tattoo_id: tattoo.id })
    supabase.from('views').insert({ tattoo_id: tattoo.id, viewed_at: new Date().toISOString() })
  }, [tattoo.id])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#111111] border border-[#2a2a2a] rounded-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative flex-1 min-h-0 overflow-hidden bg-white">
          <Image
            src={tattoo.image_url}
            alt={tattoo.title || '刺青作品'}
            width={800}
            height={600}
            className="w-full h-auto max-h-[65vh] object-contain"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Info */}
        <div className="p-6 border-t border-[#2a2a2a]">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-3">
            <div className="flex-1 min-w-0">
              {tattoo.title && (
                <h3 className="text-lg font-semibold mb-1">{tattoo.title}</h3>
              )}
              <div className="flex items-center gap-3 flex-wrap">
                {tattoo.style && (
                  <span className="text-xs bg-[#c9a84c]/20 text-[#c9a84c] px-2 py-0.5 rounded-full">
                    {tattoo.style}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Eye size={12} /> {tattoo.view_count} 次瀏覽
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => inRoom ? remove(tattoo.id) : add(tattoo)}
                className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-full transition-colors border ${
                  inRoom
                    ? 'bg-[#c9a84c]/20 border-[#c9a84c] text-[#c9a84c]'
                    : 'border-[#2a2a2a] text-gray-400 hover:border-[#c9a84c]/50 hover:text-white'
                }`}
              >
                {inRoom ? <Check size={14} /> : <ShoppingBag size={14} />}
                {inRoom ? '已加入' : '試衣間'}
              </button>
              <button
                onClick={handleARClick}
                className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#a07830] text-black text-sm font-semibold px-4 py-2 rounded-full transition-colors"
              >
                <Camera size={14} /> AR 試穿
              </button>
            </div>
          </div>

          {tattoo.tags && tattoo.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {tattoo.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-[#1a1a1a] text-gray-400 px-2 py-0.5 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
