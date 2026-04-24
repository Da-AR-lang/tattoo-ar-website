'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw, LayoutDashboard } from 'lucide-react'

export default function AdminError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error('[admin error]', error)
  }, [error])

  return (
    <div className="max-w-lg py-16">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mb-4">
        <AlertTriangle size={22} className="text-red-400" />
      </div>
      <h1 className="text-xl font-bold mb-2">後台載入失敗</h1>
      <p className="text-gray-400 text-sm mb-2">
        這個頁面發生錯誤。可以先重試，或回到後台首頁。
      </p>
      {error.digest && (
        <p className="text-gray-600 text-xs font-mono mb-6">
          錯誤代碼：{error.digest}
        </p>
      )}
      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={() => unstable_retry()}
          className="inline-flex items-center gap-2 bg-[#c9a84c] hover:bg-[#a07830] text-black font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <RotateCcw size={14} /> 重試
        </button>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 border border-[#2a2a2a] hover:border-white/30 text-gray-400 hover:text-white px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <LayoutDashboard size={14} /> 後台首頁
        </Link>
      </div>
    </div>
  )
}
