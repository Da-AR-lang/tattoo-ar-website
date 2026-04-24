import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/siteUrl'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl()
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/gallery`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/artists`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/ar`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ]

  try {
    const supabase = await createClient()
    const [{ data: tattoos }, { data: artists }] = await Promise.all([
      supabase.from('tattoos').select('id, created_at').order('created_at', { ascending: false }).limit(5000),
      supabase.from('artists').select('id, created_at').order('created_at', { ascending: false }).limit(1000),
    ])

    const tattooRoutes: MetadataRoute.Sitemap = (tattoos ?? []).map((t) => ({
      url: `${base}/gallery/${t.id}`,
      lastModified: t.created_at ? new Date(t.created_at) : now,
      changeFrequency: 'monthly',
      priority: 0.6,
    }))

    const artistRoutes: MetadataRoute.Sitemap = (artists ?? []).map((a) => ({
      url: `${base}/artists/${a.id}`,
      lastModified: a.created_at ? new Date(a.created_at) : now,
      changeFrequency: 'monthly',
      priority: 0.7,
    }))

    return [...staticRoutes, ...tattooRoutes, ...artistRoutes]
  } catch {
    return staticRoutes
  }
}
