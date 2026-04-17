import { createClient } from '@/lib/supabase/server'
import AnalyticsClient from './AnalyticsClient'

const VALID_RANGES = [7, 30, 90, 365] as const
type Range = typeof VALID_RANGES[number]

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const { range: rangeParam } = await searchParams
  const days: Range = VALID_RANGES.includes(Number(rangeParam) as Range)
    ? (Number(rangeParam) as Range)
    : 30

  const supabase = await createClient()
  const since = new Date()
  since.setDate(since.getDate() - days)

  const [{ data: topTattoos }, { data: recentViews }, { data: styleStats }] = await Promise.all([
    supabase
      .from('tattoos')
      .select('id, title, image_url, view_count, style, artist:artists(name)')
      .order('view_count', { ascending: false })
      .limit(20),
    supabase
      .from('views')
      .select('viewed_at')
      .gte('viewed_at', since.toISOString())
      .order('viewed_at', { ascending: true }),
    supabase
      .from('tattoos')
      .select('style, view_count'),
  ])

  // Aggregate views by day
  const now = new Date()
  const dailyViews: Record<string, number> = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    dailyViews[d.toISOString().split('T')[0]] = 0
  }
  recentViews?.forEach((v) => {
    const day = v.viewed_at.split('T')[0]
    if (day in dailyViews) dailyViews[day]++
  })

  // Style stats
  const styleMap: Record<string, number> = {}
  styleStats?.forEach((t) => {
    if (t.style) styleMap[t.style] = (styleMap[t.style] || 0) + (t.view_count || 0)
  })

  const dailyData = Object.entries(dailyViews).map(([date, count]) => ({
    date: days <= 30 ? date.slice(5) : date.slice(2), // MM-DD or YY-MM-DD
    views: count,
  }))

  const styleData = Object.entries(styleMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, views]) => ({ name, views }))

  return (
    <AnalyticsClient
      topTattoos={(topTattoos as unknown[]) ?? []}
      dailyData={dailyData}
      styleData={styleData}
      days={days}
    />
  )
}
