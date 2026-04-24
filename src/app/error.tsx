'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error('[app error]', error)
  }, [error])

  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-6">
        <AlertTriangle size={28} className="text-red-400" />
      </div>
      <h1 className="text-2xl font-bold mb-3">發生了一點錯誤</h1>
      <p className="text-gray-400 text-sm mb-2">
        頁面無法正常載入，可以嘗試重新整理。
      </p>
      {error.digest && (
        <p className="text-gray-600 text-xs font-mono mb-8">
          錯誤代碼：{error.digest}
        </p>
      )}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => unstable_retry()}
          className="inline-flex items-center gap-2 bg-[#c9a84c] hover:bg-[#a07830] text-black font-semibold px-5 py-2.5 rounded-full transition-colors text-sm"
        >
          <RotateCcw size={14} /> 重試
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 border border-[#2a2a2a] hover:border-white/30 text-gray-400 hover:text-white px-5 py-2.5 rounded-full transition-colors text-sm"
        >
          <Home size={14} /> 回首頁
        </Link>
      </div>
    </div>
  )
}
