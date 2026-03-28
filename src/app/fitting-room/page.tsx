'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, X, Camera, Trash2 } from 'lucide-react'
import { useFittingRoomCtx } from '@/context/FittingRoomContext'

export default function FittingRoomPage() {
  const { items, remove, clear } = useFittingRoomCtx()

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3 flex-1">
          <ShoppingBag className="text-[#c9a84c]" size={28} />
          <div>
            <h1 className="text-2xl font-bold">試衣間</h1>
            <p className="text-gray-500 text-sm">{items.length} 件作品</p>
          </div>
        </div>
        {items.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={clear}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-400 transition-colors"
            >
              <Trash2 size={15} /> 清空
            </button>
            <Link
              href="/ar"
              className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#a07830] text-black font-semibold px-5 py-2.5 rounded-full transition-colors text-sm"
            >
              <Camera size={16} /> 開始 AR 試穿
            </Link>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
          <ShoppingBag size={48} className="text-gray-700" />
          <p className="text-gray-400">試衣間是空的</p>
          <p className="text-gray-600 text-sm">在作品集點擊刺青圖片，加入試衣間後即可在 AR 中試穿</p>
          <Link
            href="/gallery"
            className="mt-2 text-[#c9a84c] hover:underline text-sm"
          >
            前往作品集 →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((tattoo) => (
            <div
              key={tattoo.id}
              className="group relative bg-white border border-[#2a2a2a] rounded-xl overflow-hidden"
            >
              <div className="relative aspect-square">
                <Image
                  src={tattoo.image_url}
                  alt={tattoo.title || '刺青'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />
              </div>
              {tattoo.title && (
                <div className="px-3 py-2">
                  <p className="text-xs text-gray-600 truncate">{tattoo.title}</p>
                </div>
              )}
              <button
                onClick={() => remove(tattoo.id)}
                className="absolute top-2 right-2 bg-black/70 hover:bg-red-500 text-white rounded-full p-1.5 transition-colors opacity-0 group-hover:opacity-100"
                title="移除"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
