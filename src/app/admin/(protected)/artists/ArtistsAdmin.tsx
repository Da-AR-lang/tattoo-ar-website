'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Plus, Edit2, Trash2, X, Check, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Artist } from '@/lib/types'

interface Props {
  artists: Artist[]
}

interface ArtistForm {
  name: string
  bio: string
  avatar_url: string
  instagram: string
}

const emptyForm: ArtistForm = { name: '', bio: '', avatar_url: '', instagram: '' }

export default function ArtistsAdmin({ artists: initial }: Props) {
  const [artists, setArtists] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<ArtistForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const uploadAvatar = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('請選擇圖片檔案'); return }
    setUploadingAvatar(true)
    setError(null)
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) {
      setError('上傳失敗：' + (data.error ?? '未知錯誤'))
    } else {
      setForm(f => ({ ...f, avatar_url: data.url }))
    }
    setUploadingAvatar(false)
  }

  const supabase = createClient()

  const openCreate = () => {
    setForm(emptyForm)
    setEditId(null)
    setShowForm(true)
    setError(null)
  }

  const openEdit = (artist: Artist) => {
    setForm({
      name: artist.name,
      bio: artist.bio || '',
      avatar_url: artist.avatar_url || '',
      instagram: artist.instagram || '',
    })
    setEditId(artist.id)
    setShowForm(true)
    setError(null)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('刺青師姓名為必填')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      name: form.name.trim(),
      bio: form.bio.trim() || null,
      avatar_url: form.avatar_url.trim() || null,
      instagram: form.instagram.trim() || null,
    }

    if (editId) {
      const { data, error } = await supabase
        .from('artists')
        .update(payload)
        .eq('id', editId)
        .select()
        .single()

      if (error) {
        setError('儲存失敗：' + error.message)
      } else {
        setArtists((prev) => prev.map((a) => (a.id === editId ? (data as Artist) : a)))
        setShowForm(false)
      }
    } else {
      const { data, error } = await supabase
        .from('artists')
        .insert(payload)
        .select()
        .single()

      if (error) {
        setError('新增失敗：' + error.message)
      } else {
        setArtists((prev) => [data as Artist, ...prev])
        setShowForm(false)
      }
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此刺青師？相關作品也會一併刪除。')) return
    const { error } = await supabase.from('artists').delete().eq('id', id)
    if (!error) setArtists((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold flex-1">刺青師管理</h1>
        <button
          onClick={openCreate}
          className="self-start sm:self-auto flex items-center gap-2 bg-[#c9a84c] hover:bg-[#a07830] text-black font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          <Plus size={16} /> 新增刺青師
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl w-full max-w-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">{editId ? '編輯刺青師' : '新增刺青師'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">姓名 *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a84c]/50"
                  placeholder="刺青師姓名"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">個人介紹</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a84c]/50 resize-none"
                  placeholder="刺青師簡介..."
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">頭像圖片</label>
                <div className="flex items-center gap-3">
                  {/* Preview */}
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-[#2a2a2a] flex-shrink-0 flex items-center justify-center">
                    {form.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.avatar_url} alt="預覽" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[#c9a84c] font-bold text-xl">{form.name.charAt(0) || '?'}</span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="flex items-center gap-2 text-sm border border-[#2a2a2a] hover:border-[#c9a84c]/50 text-gray-400 hover:text-white px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {uploadingAvatar
                        ? <><div className="w-4 h-4 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" /> 上傳中...</>
                        : <><Upload size={14} /> 上傳頭像圖片</>}
                    </button>
                    {form.avatar_url && (
                      <button type="button" onClick={() => setForm(f => ({ ...f, avatar_url: '' }))} className="text-xs text-gray-500 hover:text-red-400 transition-colors text-left">
                        移除圖片
                      </button>
                    )}
                  </div>
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f) }} />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Instagram 帳號</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
                  <input
                    value={form.instagram}
                    onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-8 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a84c]/50"
                    placeholder="username"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-lg">{error}</p>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-[#2a2a2a] text-gray-400 hover:text-white py-2.5 rounded-xl transition-colors text-sm"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#a07830] text-black font-semibold py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50"
                >
                  <Check size={16} /> {saving ? '儲存中...' : '儲存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Artists Table */}
      {artists.length === 0 ? (
        <div className="text-center py-24 text-gray-500">
          <p>尚無刺青師，點擊右上角新增</p>
        </div>
      ) : (
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left px-6 py-4 text-sm text-gray-400 font-medium">刺青師</th>
                <th className="text-left px-6 py-4 text-sm text-gray-400 font-medium hidden sm:table-cell">Instagram</th>
                <th className="text-left px-6 py-4 text-sm text-gray-400 font-medium hidden md:table-cell">加入日期</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {artists.map((artist) => (
                <tr key={artist.id} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-[#2a2a2a] flex-shrink-0">
                        {artist.avatar_url ? (
                          <Image src={artist.avatar_url} alt={artist.name} width={40} height={40} className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#c9a84c] font-bold text-sm">
                            {artist.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{artist.name}</p>
                        {artist.bio && <p className="text-gray-500 text-xs truncate max-w-40">{artist.bio}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400 hidden sm:table-cell">
                    {artist.instagram ? `@${artist.instagram}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400 hidden md:table-cell">
                    {new Date(artist.created_at).toLocaleDateString('zh-TW')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => openEdit(artist)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(artist.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
