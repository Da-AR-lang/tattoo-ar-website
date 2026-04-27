'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'

export default function UnauthorizedPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    if (countdown === 0) {
      router.replace('/admin/login')
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, router])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <ShieldAlert size={36} className="text-red-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">無權限</h1>
        <p className="text-gray-400 text-sm mb-8">請以管理員帳號登入</p>

        <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-6 mb-6">
          <p className="text-gray-500 text-sm mb-3">自動跳轉登入頁面</p>
          <div className="flex items-center justify-center gap-1">
            <span className="text-5xl font-bold text-[#c9a84c] tabular-nums">{countdown}</span>
            <span className="text-gray-500 text-lg ml-1">秒</span>
          </div>
          <div className="mt-4 h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#c9a84c] rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 3) * 100}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => router.replace('/admin/login')}
          className="w-full bg-[#c9a84c] hover:bg-[#a07830] text-black font-semibold py-3 rounded-xl transition-colors"
        >
          立即前往登入
        </button>
      </div>
    </div>
  )
}
