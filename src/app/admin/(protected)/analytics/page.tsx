import { createClient } from '@/lib/supabase/server'
import AnalyticsClient from './AnalyticsClient'

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const [{ data: topTattoos }, { data: recentViews }, { data: styleStats }] = await Promise.all([
    supabase
      .from('tattoos')
      .select('id, title, image_url, view_count, style, artist:artists(name)')
      .order('view_count', { ascending: false })
      .limit(20),
    supabase
      .from('views')
      .select('viewed_at')
      .order('viewed_at', { ascending: false })
      .limit(1000),
    supabase
      .from('tattoos')
      .select('style, view_count'),
  ])

  // Aggregate views by day (last 30 days)
  const now = new Date()
  const dailyViews: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    dailyViews[key] = 0
  }
  recentViews?.forEach((v) => {
    const day = v.viewed_at.split('T')[0]
    if (day in dailyViews) dailyViews[day]++
  })

  // Style stats
  const styleMap: Record<string, number> = {}
  styleStats?.forEach((t) => {
    if (t.style) {
      styleMap[t.style] = (styleMap[t.style] || 0) + (t.view_count || 0)
    }
  })

  const dailyData = Object.entries(dailyViews).map(([date, count]) => ({
    date: date.slice(5), // MM-DD
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
    />
  )
}
