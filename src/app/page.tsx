import Link from 'next/link'
import { ArrowRight, Camera, ImageIcon, Users } from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: <Camera className="w-8 h-8 text-[#c9a84c]" />,
      title: 'AR 虛擬試穿',
      desc: '開啟相機，即時將刺青圖案投射到你的手臂，隨手勢即時變化',
      href: '/ar',
    },
    {
      icon: <ImageIcon className="w-8 h-8 text-[#c9a84c]" />,
      title: '作品展示',
      desc: '瀏覽數百件精選刺青作品，依風格與藝術家搜尋你的理想圖案',
      href: '/gallery',
    },
    {
      icon: <Users className="w-8 h-8 text-[#c9a84c]" />,
      title: '刺青師介紹',
      desc: '認識每位藝術家的風格與故事，找到最適合你的刺青師',
      href: '/artists',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#1a1205]" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, #c9a84c22 0%, transparent 50%), radial-gradient(circle at 80% 20%, #c9a84c11 0%, transparent 40%)',
          }}
        />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="mb-6 inline-block">
            <span className="text-[#c9a84c] text-sm tracking-[0.4em] uppercase border border-[#c9a84c]/30 px-4 py-1 rounded-full">
              虛擬試穿 · 刺青藝術
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold mb-6 leading-tight">
            找到你的
            <span className="text-[#c9a84c]"> 刺青故事</span>
          </h1>

          <p className="text-gray-400 text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            透過 AR 擴增實境，在刺青前先虛擬試穿。
            探索頂尖刺青師作品，找到屬於你的藝術。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/ar"
              className="inline-flex items-center gap-2 bg-[#c9a84c] hover:bg-[#a07830] text-black font-semibold px-8 py-4 rounded-full transition-all duration-300 text-sm tracking-wider"
            >
              開始 AR 試穿
              <Camera size={18} />
            </Link>
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 border border-[#2a2a2a] hover:border-[#c9a84c]/50 text-white px-8 py-4 rounded-full transition-all duration-300 text-sm tracking-wider"
            >
              瀏覽作品集
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">我們提供什麼</h2>
          <p className="text-gray-400">從靈感到實現，陪伴你的刺青旅程</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="group bg-[#111111] border border-[#2a2a2a] rounded-2xl p-8 hover:border-[#c9a84c]/40 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3 group-hover:text-[#c9a84c] transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              <div className="mt-6 flex items-center gap-2 text-[#c9a84c] text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                了解更多 <ArrowRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-[#1a1205] to-[#111111] border border-[#c9a84c]/20 rounded-3xl p-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">準備好了嗎？</h2>
          <p className="text-gray-400 mb-8">開啟相機，讓 AR 技術帶你感受刺青的可能</p>
          <Link
            href="/ar"
            className="inline-flex items-center gap-2 bg-[#c9a84c] hover:bg-[#a07830] text-black font-semibold px-8 py-4 rounded-full transition-all duration-300"
          >
            立即試穿 <Camera size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}
