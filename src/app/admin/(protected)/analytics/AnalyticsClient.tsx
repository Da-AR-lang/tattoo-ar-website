'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Eye } from 'lucide-react'

interface TopTattoo {
  id: string
  title: string | null
  image_url: string
  view_count: number
  style: string | null
  artist: { name: string } | null
}

interface Props {
  topTattoos: unknown[]
  dailyData: { date: string; views: number }[]
  styleData: { name: string; views: number }[]
}

export default function AnalyticsClient({ topTattoos, dailyData, styleData }: Props) {
  const tattoos = topTattoos as TopTattoo[]
  const totalViews = dailyData.reduce((s, d) => s + d.views, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">統計分析</h1>
        <p className="text-gray-500 text-sm">近 30 天數據</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-6">
          <p className="text-gray-400 text-sm mb-1">近30天總瀏覽</p>
          <p className="text-3xl font-bold text-[#c9a84c]">{totalViews.toLocaleString()}</p>
        </div>
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-6">
          <p className="text-gray-400 text-sm mb-1">熱門作品數</p>
          <p className="text-3xl font-bold">{tattoos.length}</p>
        </div>
      </div>

      {/* Daily views chart */}
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-6 mb-6">
        <h2 className="font-semibold mb-6">每日瀏覽趨勢</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              interval={4}
            />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 8 }}
              labelStyle={{ color: '#9ca3af' }}
              itemStyle={{ color: '#c9a84c' }}
            />
            <Line
              type="monotone"
              dataKey="views"
              stroke="#c9a84c"
              strokeWidth={2}
              dot={false}
              name="瀏覽次數"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Style chart */}
        {styleData.length > 0 && (
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-6">
            <h2 className="font-semibold mb-6">風格瀏覽分佈</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={styleData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: 11 }} width={50} />
                <Tooltip
                  contentStyle={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 8 }}
                  itemStyle={{ color: '#c9a84c' }}
                />
                <Bar dataKey="views" fill="#c9a84c" radius={[0, 4, 4, 0]} name="瀏覽數" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top tattoos */}
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-6">
          <h2 className="font-semibold mb-6">熱門作品排行</h2>
          {tattoos.length === 0 ? (
            <p className="text-gray-500 text-sm">暫無資料</p>
          ) : (
            <div className="flex flex-col gap-3">
              {tattoos.slice(0, 8).map((tattoo, i) => (
                <div key={tattoo.id} className="flex items-center gap-3">
                  <span className="text-gray-600 text-sm w-5 flex-shrink-0">{i + 1}</span>
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#1a1a1a] flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={tattoo.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tattoo.title || '無標題'}</p>
                    <p className="text-gray-500 text-xs">{tattoo.artist?.name ?? '-'}</p>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400 text-sm flex-shrink-0">
                    <Eye size={12} /> {tattoo.view_count}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
