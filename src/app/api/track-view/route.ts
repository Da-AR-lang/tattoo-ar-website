import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? '0.0.0.0'
}

function hashIp(ip: string): string {
  // Salt with the service role key so the hash isn't reversible by guessing IPs.
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  return crypto.createHash('sha256').update(salt + '|' + ip).digest('hex')
}

export async function POST(req: NextRequest) {
  let body: { tattoo_id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const tattoo_id = body.tattoo_id
  if (!tattoo_id || !UUID_RE.test(tattoo_id)) {
    return NextResponse.json({ error: 'invalid tattoo_id' }, { status: 400 })
  }

  const ip_hash = hashIp(getClientIp(req))
  const supabase = createAdminClient()
  const { error } = await supabase.rpc(
    'record_tattoo_view',
    { tattoo_id, ip_hash } as never
  )
  if (error) {
    console.error('[track-view]', error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
