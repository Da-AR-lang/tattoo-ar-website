'use client'

import { useRouter } from 'next/navigation'
import { Camera } from 'lucide-react'
import { useFittingRoomCtx } from '@/context/FittingRoomContext'
import type { Tattoo } from '@/lib/types'

export default function ARButton({ tattoo }: { tattoo: Tattoo }) {
  const { has, add } = useFittingRoomCtx()
  const router = useRouter()

  const handleClick = () => {
    if (!has(tattoo.id)) add(tattoo)
    router.push('/ar')
  }

  return (
    <button
      onClick={handleClick}
      className="flex-1 flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#a07830] text-black font-semibold py-2.5 rounded-xl transition-colors text-sm"
    >
      <Camera size={15} /> AR 試穿
    </button>
  )
}
