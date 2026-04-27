import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin-auth'
import crypto from 'crypto'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: '未授權' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: '未提供檔案' }, { status: 400 })
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: '僅支援 JPEG / PNG / WebP / AVIF 圖檔' },
      { status: 400 }
    )
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: '檔案過大（上限 10MB）' },
      { status: 400 }
    )
  }

  // Build signed Cloudinary upload request
  const timestamp = Math.round(Date.now() / 1000)
  const paramsToSign = `timestamp=${timestamp}`
  const signature = crypto
    .createHash('sha1')
    .update(paramsToSign + process.env.CLOUDINARY_API_SECRET!)
    .digest('hex')

  const cloudinaryForm = new FormData()
  cloudinaryForm.append('file', file)
  cloudinaryForm.append('api_key', process.env.CLOUDINARY_API_KEY!)
  cloudinaryForm.append('timestamp', String(timestamp))
  cloudinaryForm.append('signature', signature)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: cloudinaryForm }
  )

  const data = await response.json()

  if (!response.ok) {
    return NextResponse.json(
      { error: data.error?.message ?? '上傳失敗' },
      { status: 400 }
    )
  }

  return NextResponse.json({
    url: data.secure_url,
    width: data.width,
    height: data.height,
  })
}
