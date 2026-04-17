'use client'

import { useState } from 'react'
import { Share2, Check, Copy } from 'lucide-react'

interface Props {
  tattooId: string
  title: string | null
}

export default function ShareButton({ tattooId, title }: Props) {
  const [copied, setCopied] = useState(false)

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/gallery/${tattooId}`
    : ''

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: title ?? '刺青作品', url })
        return
      } catch {
        // user cancelled or not supported, fallback to copy
      }
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white border border-[#2a2a2a] hover:border-white/30 px-3 py-1.5 rounded-xl transition-colors flex-shrink-0"
    >
      {copied ? <><Check size={14} className="text-green-400" /> 已複製</> : <><Share2 size={14} /> 分享</>}
    </button>
  )
}
