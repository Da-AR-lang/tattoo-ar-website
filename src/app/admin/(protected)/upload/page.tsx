'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Upload, X, Check, ImageIcon, Copy, ExternalLink, Wand2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Artist, Style } from '@/lib/types'
import { backfillDimensions, countMissingDimensions } from './actions'

export default function UploadPage() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [styles, setStyles] = useState<Style[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [success, setSuccess] = useState(false)
  const [newTattooId, setNewTattooId] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    artist_id: '',
    image_url: '',
    width: 0,
    height: 0,
    title: '',
    alt_text: '',
    style: '',
    tags: '',
  })

  const [missingDims, setMissingDims] = useState<number | null>(null)
  const [backfillRunning, setBackfillRunning] = useState(false)
  const [backfillMsg, setBackfillMsg] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('artists').select('id, name').order('name'),
      supabase.from('styles').select('*').order('name'),
    ]).then(([{ data: a }, { data: s }]) => {
      setArtists((a as Artist[]) ?? [])
      setStyles((s as Style[]) ?? [])
    })
    countMissingDimensions().then(setMissingDims).catch(() => setMissingDims(null))
  }, [])

  const runBackfill = async () => {
    setBackfillRunning(true)
    setBackfillMsg(null)
    try {
      let totalUpdated = 0
      let totalFailed = 0
      while (true) {
        const res = await backfillDimensions(20)
        totalUpdated += res.updated
        totalFailed += res.failed
        setMissingDims(res.remaining)
        setBackfillMsg(`處理中… 已更新 ${totalUpdated}，跳過 ${totalFailed}，剩餘 ${res.remaining}`)
        if (res.processed === 0 || res.remaining === 0) break
      }
      setBackfillMsg(`完成。更新 ${totalUpdated} 筆，跳過 ${totalFailed} 筆。`)
    } catch (e) {
      setBackfillMsg('回填失敗：' + (e instanceof Error ? e.message : '未知錯誤'))
    } finally {
      setBackfillRunning(false)
    }
  }

  const uploadImageToCloudinary = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('請選擇圖片檔案（JPG、PNG、WebP 等）')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('圖片大小不能超過 10MB')
      return
    }

    setUploadingImage(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()

    if (!res.ok) {
      setError('圖片上傳失敗：' + (data.error ?? '未知錯誤'))
    } else {
      setForm((prev) => ({
        ...prev,
        image_url: data.url,
        width: data.width ?? 0,
        height: data.height ?? 0,
      }))
    }
    setUploadingImage(false)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadImageToCloudinary(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadImageToCloudinary(file)
  }

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    if (!form.image_url.trim() || !form.artist_id) {
      setError('請先上傳圖片並選擇刺青師')
      return
    }

    setUploading(true)
    setError(null)

    const supabase = createClient()
    const tags = form.tags
      .split(/[,，\s]+/)
      .map((t) => t.trim())
      .filter(Boolean)

    const { data: inserted, error } = await supabase.from('tattoos').insert({
      artist_id: form.artist_id,
      image_url: form.image_url.trim(),
      width: form.width || null,
      height: form.height || null,
      title: form.title.trim() || null,
      alt_text: form.alt_text.trim() || null,
      style: form.style || null,
      tags,
    }).select('id').single()

    if (error) {
      setError('儲存失敗：' + error.message)
    } else {
      setSuccess(true)
      setNewTattooId(inserted?.id ?? null)
      setForm({ artist_id: form.artist_id, image_url: '', width: 0, height: 0, title: '', alt_text: '', style: form.style, tags: '' })
    }
    setUploading(false)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">上傳作品</h1>

      {missingDims !== null && missingDims > 0 && (
        <div className="max-w-2xl mb-6 bg-[#111111] border border-[#2a2a2a] rounded-2xl p-4 flex items-center gap-3">
          <Wand2 size={18} className="text-[#c9a84c] flex-shrink-0" />
          <div className="flex-1 text-sm">
            <p className="text-white">
              有 <span className="text-[#c9a84c] font-semibold">{missingDims}</span> 件舊作品缺少尺寸資訊
            </p>
            {backfillMsg && <p className="text-gray-400 text-xs mt-0.5">{backfillMsg}</p>}
          </div>
          <button
            type="button"
            onClick={runBackfill}
            disabled={backfillRunning}
            className="bg-[#c9a84c] hover:bg-[#a07830] text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {backfillRunning ? '回填中…' : '一鍵回填'}
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl bg-[#111111] border border-[#2a2a2a] rounded-2xl p-8 flex flex-col gap-5"
      >
        {/* 刺青師 */}
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">所屬刺青師 *</label>
          <select
            value={form.artist_id}
            onChange={(e) => setForm({ ...form, artist_id: e.target.value })}
            required
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a84c]/50"
          >
            <option value="">選擇刺青師</option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        {/* Image Upload Area */}
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">刺青圖片 *</label>

          {form.image_url ? (
            /* Preview */
            <div className="relative rounded-xl overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.image_url}
                alt="preview"
                className="w-full max-h-64 object-contain"
              />
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, image_url: '', width: 0, height: 0 }))}
                className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white rounded-full p-1.5 transition-colors"
              >
                <X size={16} />
              </button>
              <div className="absolute bottom-2 left-2 bg-black/70 text-green-400 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Check size={12} /> 上傳成功
              </div>
            </div>
          ) : (
            /* Drop zone */
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-[#c9a84c] bg-[#c9a84c]/5'
                  : 'border-[#2a2a2a] hover:border-[#c9a84c]/40 hover:bg-[#1a1a1a]'
              }`}
            >
              {uploadingImage ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-400 text-sm">上傳至 Cloudinary 中...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <ImageIcon className="text-gray-500" size={36} />
                  <div>
                    <p className="text-white text-sm font-medium">點擊選擇圖片，或拖曳至此</p>
                    <p className="text-gray-500 text-xs mt-1">支援 JPG、PNG、WebP，最大 10MB</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Title */}
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">作品標題</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a84c]/50"
            placeholder="作品名稱（選填）"
          />
        </div>

        {/* Style */}
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">風格分類</label>
          <select
            value={form.style}
            onChange={(e) => setForm({ ...form, style: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a84c]/50"
          >
            <option value="">選擇風格（選填）</option>
            {styles.map((s) => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">標籤（逗號分隔）</label>
          <input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a84c]/50"
            placeholder="龍, 傳統, 黑白..."
          />
        </div>

        {/* Alt Text */}
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">圖片 Alt 文字（SEO）</label>
          <input
            value={form.alt_text}
            onChange={(e) => setForm({ ...form, alt_text: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a84c]/50"
            placeholder="台北刺青 黑灰寫實龍 Tattoo Artist Taiwan"
          />
          <p className="text-xs text-gray-600 mt-1">留空則自動使用作品標題。建議加入風格、部位、台北刺青等關鍵字。</p>
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-lg">{error}</p>
        )}
        {success && newTattooId && (
          <div className="flex flex-col gap-2 bg-green-400/10 border border-green-400/20 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <Check size={16} /> 新增成功！
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-gray-400 bg-[#0a0a0a] px-3 py-1.5 rounded-lg truncate">
                {typeof window !== 'undefined' ? `${window.location.origin}/gallery/${newTattooId}` : `/gallery/${newTattooId}`}
              </code>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(`${window.location.origin}/gallery/${newTattooId}`)
                  setLinkCopied(true)
                  setTimeout(() => setLinkCopied(false), 2000)
                }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white border border-[#2a2a2a] px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0"
              >
                {linkCopied ? <><Check size={12} className="text-green-400" /> 已複製</> : <><Copy size={12} /> 複製</>}
              </button>
              <a
                href={`/gallery/${newTattooId}`}
                target="_blank"
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white border border-[#2a2a2a] px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0"
              >
                <ExternalLink size={12} /> 開啟
              </a>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || uploadingImage || !form.image_url}
          className="flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#a07830] text-black font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
        >
          <Upload size={16} />
          {uploading ? '儲存中...' : '新增作品'}
        </button>
      </form>
    </div>
  )
}
