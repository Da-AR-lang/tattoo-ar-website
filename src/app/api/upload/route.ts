import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  // Verify admin is logged in
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '未授權' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: '未提供檔案' }, { status: 400 })
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

  return NextResponse.json({ url: data.secure_url })
}
