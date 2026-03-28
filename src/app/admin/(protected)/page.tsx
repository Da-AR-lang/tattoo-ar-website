import { createClient } from '@/lib/supabase/server'
import { Users, ImageIcon, Eye, TrendingUp } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: artistCount },
    { count: tattooCount },
    { data: topTattoos },
    { data: recentViews },
  ] = await Promise.all([
    supabase.from('artists').select('*', { count: 'exact', head: true }),
    supabase.from('tattoos').select('*', { count: 'exact', head: true }),
    supabase
      .from('tattoos')
      .select('id, title, image_url, view_count')
      .order('view_count', { ascending: false })
      .limit(5),
    supabase
      .from('views')
      .select('viewed_at')
      .gte('viewed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  const totalViews = recentViews?.length ?? 0

  const stats = [
    { label: '刺青師', value: artistCount ?? 0, icon: <Users size={24} />, color: 'text-blue-400' },
    { label: '作品數', value: tattooCount ?? 0, icon: <ImageIcon size={24} />, color: 'text-green-400' },
    { label: '近7天瀏覽', value: totalViews, icon: <Eye size={24} />, color: 'text-[#c9a84c]' },
    { label: '總瀏覽次數', value: topTattoos?.reduce((s, t) => s + (t.view_count || 0), 0) ?? 0, icon: <TrendingUp size={24} />, color: 'text-purple-400' },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">後台總覽</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-6">
            <div className={`mb-3 ${stat.color}`}>{stat.icon}</div>
            <div className="text-3xl font-bold mb-1">{stat.value.toLocaleString()}</div>
            <div className="text-gray-500 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Top Tattoos */}
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-6">最熱門作品</h2>
        {!topTattoos || topTattoos.length === 0 ? (
          <p className="text-gray-500 text-sm">暫無資料</p>
        ) : (
          <div className="flex flex-col gap-3">
            {topTattoos.map((tattoo, index) => (
              <div key={tattoo.id} className="flex items-center gap-4">
                <span className="text-gray-600 text-sm w-5">{index + 1}</span>
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#1a1a1a] flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={tattoo.image_url} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tattoo.title || '無標題'}</p>
                </div>
                <div className="flex items-center gap-1 text-gray-400 text-sm flex-shrink-0">
                  <Eye size={14} /> {tattoo.view_count}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
