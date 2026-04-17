import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Eye } from 'lucide-react'
import type { Tattoo, Artist } from '@/lib/types'
import ShareButton from './ShareButton'

export const revalidate = 300

export default async function TattooPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: tattoo } = await supabase
    .from('tattoos')
    .select('*, artist:artists(id, name, avatar_url, instagram)')
    .eq('id', id)
    .single()

  if (!tattoo) notFound()

  const t = tattoo as Tattoo & { artist: Artist }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/gallery" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> 返回作品集
      </Link>

      <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl overflow-hidden">
        <div className="bg-white">
          <Image
            src={t.image_url}
            alt={t.title || '刺青作品'}
            width={800}
            height={600}
            className="w-full h-auto max-h-[70vh] object-contain"
          />
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              {t.title && <h1 className="text-xl font-bold mb-1">{t.title}</h1>}
              <div className="flex items-center gap-3 flex-wrap">
                {t.style && (
                  <span className="text-xs bg-[#c9a84c]/20 text-[#c9a84c] px-2 py-0.5 rounded-full">
                    {t.style}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Eye size={12} /> {t.view_count} 次瀏覽
                </span>
              </div>
            </div>
            <ShareButton tattooId={t.id} title={t.title} />
          </div>

          {t.artist && (
            <div className="flex items-center gap-3 py-4 border-t border-[#2a2a2a]">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#2a2a2a] flex-shrink-0">
                {t.artist.avatar_url ? (
                  <Image src={t.artist.avatar_url} alt={t.artist.name} width={40} height={40} className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#c9a84c] font-bold text-sm">
                    {t.artist.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{t.artist.name}</p>
                {t.artist.instagram && (
                  <p className="text-gray-500 text-xs">@{t.artist.instagram}</p>
                )}
              </div>
            </div>
          )}

          {t.tags && t.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-[#2a2a2a]">
              {t.tags.map((tag) => (
                <span key={tag} className="text-xs bg-[#1a1a1a] text-gray-400 px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <Link
              href="/gallery"
              className="flex-1 text-center border border-[#2a2a2a] hover:border-white/30 text-gray-400 hover:text-white py-2.5 rounded-xl transition-colors text-sm"
            >
              瀏覽更多作品
            </Link>
            <Link
              href="/ar"
              className="flex-1 text-center bg-[#c9a84c] hover:bg-[#a07830] text-black font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              AR 試穿
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
