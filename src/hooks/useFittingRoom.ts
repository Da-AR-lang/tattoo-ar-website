'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Tattoo } from '@/lib/types'

const STORAGE_KEY = 'ink-ar-fitting-room'

export function useFittingRoom() {
  const [items, setItems] = useState<Tattoo[]>([])
  const [loaded, setLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch (_) {}
    setLoaded(true)
  }, [])

  // Persist to localStorage on change
  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, loaded])

  const add = useCallback((tattoo: Tattoo) => {
    setItems(prev =>
      prev.find(t => t.id === tattoo.id) ? prev : [...prev, tattoo]
    )
  }, [])

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(t => t.id !== id))
  }, [])

  const has = useCallback((id: string) => items.some(t => t.id === id), [items])

  const clear = useCallback(() => setItems([]), [])

  return useMemo(
    () => ({ items, add, remove, has, clear, count: items.length }),
    [items, add, remove, has, clear]
  )
}
