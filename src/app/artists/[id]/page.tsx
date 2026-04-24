import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import type { Artist, Tattoo } from '@/lib/types'
import TattooGrid from '@/components/TattooGrid'

export const revalidate = 60

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('artists')
    .select('name, bio, avatar_url')
    .eq('id', id)
    .single()
  if (!data) return { title: '刺青師不存在' }
  const a = data as Pick<Artist, 'name' | 'bio' | 'avatar_url'>
  const title = a.name
  const description = a.bio?.slice(0, 160) || `認識刺青師 ${a.name} 的作品風格`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: a.avatar_url ? [a.avatar_url] : undefined,
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: a.avatar_url ? [a.avatar_url] : undefined,
    },
  }
}

export default async function ArtistDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: artist }, { data: tattoos }] = await Promise.all([
    supabase.from('artists').select('*').eq('id', id).single(),
    supabase
      .from('tattoos')
      .select('*')
      .eq('artist_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!artist) notFound()

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <Link
        href="/artists"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-10 text-sm"
      >
        <ArrowLeft size={16} /> 返回刺青師列表
      </Link>

      {/* Artist Header */}
      <div className="flex flex-col sm:flex-row gap-8 mb-16 items-start">
        {/* Avatar */}
        <div className="relative w-36 h-36 rounded-full overflow-hidden bg-[#1a1a1a] flex-shrink-0 border-2 border-[#c9a84c]/30">
          {(artist as Artist).avatar_url ? (
            <Image
              src={(artist as Artist).avatar_url!}
              alt={(artist as Artist).name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-[#c9a84c]">
                {(artist as Artist).name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-3">
            <h1 className="text-4xl font-bold">{(artist as Artist).name}</h1>
            {(artist as Artist).instagram && (
              <a
                href={`https://instagram.com/${(artist as Artist).instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#c9a84c] transition-colors"
              >
                <ExternalLink size={22} />
              </a>
            )}
          </div>

          {(artist as Artist).bio && (
            <p className="text-gray-300 leading-relaxed max-w-2xl">{(artist as Artist).bio}</p>
          )}

          <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
            <span>{tattoos?.length ?? 0} 件作品</span>
          </div>
        </div>
      </div>

      {/* Tattoo Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-8">作品集</h2>
        {!tattoos || tattoos.length === 0 ? (
          <div className="text-center py-24 text-gray-500">暫無作品</div>
        ) : (
          <TattooGrid tattoos={tattoos as Tattoo[]} />
        )}
      </div>
    </div>
  )
}
