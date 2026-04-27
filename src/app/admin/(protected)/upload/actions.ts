'use server'

import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin-auth'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    throw new Error('未授權')
  }
}

interface BackfillResult {
  processed: number
  updated: number
  failed: number
  remaining: number
}

interface MissingRow {
  id: string
  image_url: string
}

interface CloudinaryInfo {
  input?: { width?: number; height?: number }
}

function toGetInfoUrl(url: string): string | null {
  const marker = '/image/upload/'
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.slice(0, idx + marker.length) + 'fl_getinfo/' + url.slice(idx + marker.length)
}

async function probeDimensions(url: string): Promise<{ width: number; height: number } | null> {
  const probeUrl = toGetInfoUrl(url)
  if (!probeUrl) return null
  try {
    const res = await fetch(probeUrl, { cache: 'no-store' })
    if (!res.ok) return null
    const data = (await res.json()) as CloudinaryInfo
    const w = data.input?.width
    const h = data.input?.height
    if (!w || !h) return null
    return { width: w, height: h }
  } catch {
    return null
  }
}

export async function countMissingDimensions(): Promise<number> {
  await assertAdmin()
  const supabase = await createClient()
  const { count } = await supabase
    .from('tattoos')
    .select('id', { count: 'exact', head: true })
    .or('width.is.null,height.is.null')
  return count ?? 0
}

export async function backfillDimensions(batchSize = 20): Promise<BackfillResult> {
  await assertAdmin()
  const supabase = await createClient()

  const { data } = await supabase
    .from('tattoos')
    .select('id, image_url')
    .or('width.is.null,height.is.null')
    .limit(batchSize)

  const rows = (data as MissingRow[] | null) ?? []
  let updated = 0
  let failed = 0

  for (const row of rows) {
    const dims = await probeDimensions(row.image_url)
    if (!dims) { failed++; continue }
    const { error } = await supabase
      .from('tattoos')
      .update({ width: dims.width, height: dims.height })
      .eq('id', row.id)
    if (error) failed++
    else updated++
  }

  const remaining = await countMissingDimensions()
  return { processed: rows.length, updated, failed, remaining }
}
