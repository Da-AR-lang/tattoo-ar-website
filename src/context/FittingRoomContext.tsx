'use client'

import { createContext, useContext } from 'react'
import { useFittingRoom } from '@/hooks/useFittingRoom'
import type { Tattoo } from '@/lib/types'

interface FittingRoomCtx {
  items: Tattoo[]
  add: (t: Tattoo) => void
  remove: (id: string) => void
  has: (id: string) => boolean
  clear: () => void
  count: number
}

const FittingRoomContext = createContext<FittingRoomCtx>({
  items: [], add: () => {}, remove: () => {}, has: () => false, clear: () => {}, count: 0,
})

export function FittingRoomProvider({ children }: { children: React.ReactNode }) {
  const room = useFittingRoom()
  return (
    <FittingRoomContext.Provider value={room}>
      {children}
    </FittingRoomContext.Provider>
  )
}

export const useFittingRoomCtx = () => useContext(FittingRoomContext)
