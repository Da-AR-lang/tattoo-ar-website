'use client'

import { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Pencil, Trash2, X, Check, Search, AlertTriangle, Link2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Tattoo, Artist, Style } from '@/lib/types'

interface Props {
  initialTattoos: Tattoo[]
  artists: Artist[]
  styles: Style[]
}

interface EditForm {
  title: string
  artist_id: string
  style: string
  tags: string
}

export default function TattoosAdmin({ initialTattoos, artists, styles }: Props) {
  const [tattoos, setTattoos] = useState<Tattoo[]>(initialTattoos)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ title: '', artist_id: '', style: '', tags: '' })
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/gallery/${id}`)
    setCopiedId(id)
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    copyTimerRef.current = setTimeout(() => setCopiedId(null), 2000)
  }

  const filtered = tattoos.filter(t => {
    const q = search.toLowerCase()
    return (
      (t.title ?? '').toLowerCase().includes(q) ||
      (t.style ?? '').toLowerCase().includes(q) ||
      (t.artist as unknown as Artist)?.name?.toLowerCase().includes(q) ||
      t.tags?.some(tag => tag.toLowerCase().includes(q))
    )
  })

  const startEdit = (tattoo: Tattoo) => {
    setEditingId(tattoo.id)
    setEditForm({
      title: tattoo.title ?? '',
      artist_id: tattoo.artist_id,
      style: tattoo.style ?? '',
      tags: tattoo.tags?.join(', ') ?? '',
    })
    setError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setError(null)
  }

  const saveEdit = useCallback(async (id: string) => {
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const tags = editForm.tags
      .split(/[,，\s]+/)
      .map(t => t.trim())
      .filter(Boolean)

    const { error } = await supabase
      .from('tattoos')
      .update({
        title: editForm.title.trim() || null,
        artist_id: editForm.artist_id,
        style: editForm.style || null,
        tags,
      })
      .eq('id', id)

    if (error) {
      setError('儲存失敗：' + error.message)
    } else {
      setTattoos(prev =>
        prev.map(t =>
          t.id === id
            ? {
                ...t,
                title: editForm.title.trim(),
                artist_id: editForm.artist_id,
                style: editForm.style,
                tags,
                artist: artists.find(a => a.id === editForm.artist_id) as unknown as Artist,
              }
            : t
        )
      )
      setEditingId(null)
    }
    setSaving(false)
  }, [editForm, artists])

  const confirmDelete = async (id: string) => {
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.from('tattoos').delete().eq('id', id)
    if (error) {
      setError('刪除失敗：' + error.message)
    } else {
      setTattoos(prev => prev.filter(t => t.id !== id))
      setDeletingId(null)
    }
    setSaving(false)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">作品管理</h1>
          <p className="text-gray-500 text-sm mt-1">共 {tattoos.length} 件作品</p>
        </div>
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜尋標題、風格、刺青師..."
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#c9a84c]/50"
          />
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-lg mb-4">{error}</p>
      )}

      <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-sm">
            {search ? '找不到符合的作品' : '尚無作品'}
          </div>
        ) : (
          <>
            {/* ── Mobile card list (< md) ── */}
            <div className="md:hidden divide-y divide-[#1a1a1a]">
              {filtered.map(tattoo => (
                <div key={tattoo.id} className="p-4">
                  {editingId === tattoo.id ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-white flex-shrink-0">
                          <Image src={tattoo.image_url} alt={tattoo.title || ''} width={56} height={56} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-gray-500 text-xs">編輯中...</span>
                      </div>
                      <input
                        value={editForm.title}
                        onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                        className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a84c]/50"
                        placeholder="作品標題"
                      />
                      <select
                        value={editForm.artist_id}
                        onChange={e => setEditForm(f => ({ ...f, artist_id: e.target.value }))}
                        className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a84c]/50"
                      >
                        {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                      <select
                        value={editForm.style}
                        onChange={e => setEditForm(f => ({ ...f, style: e.target.value }))}
                        className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a84c]/50"
                      >
                        <option value="">無風格</option>
                        {styles.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                      <input
                        value={editForm.tags}
                        onChange={e => setEditForm(f => ({ ...f, tags: e.target.value }))}
                        className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c9a84c]/50"
                        placeholder="標籤（逗號分隔）"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(tattoo.id)}
                          disabled={saving}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-[#c9a84c] hover:bg-[#a07830] text-black font-semibold py-2 rounded-lg text-sm disabled:opacity-50 transition-colors"
                        >
                          <Check size={15} /> 儲存
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 border border-[#2a2a2a] hover:border-white/30 text-gray-400 hover:text-white py-2 rounded-lg text-sm transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-white flex-shrink-0">
                        <Image src={tattoo.image_url} alt={tattoo.title || ''} width={56} height={56} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {tattoo.title || <span className="text-gray-600">無標題</span>}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {(tattoo.artist as unknown as Artist)?.name ?? '—'}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {tattoo.style && (
                            <span className="text-xs bg-[#c9a84c]/20 text-[#c9a84c] px-2 py-0.5 rounded-full">
                              {tattoo.style}
                            </span>
                          )}
                          {tattoo.tags?.slice(0, 2).map(tag => (
                            <span key={tag} className="text-xs bg-[#1a1a1a] text-gray-400 px-2 py-0.5 rounded-full">#{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => copyLink(tattoo.id)}
                          className="text-gray-400 hover:text-blue-400 p-2 rounded-lg hover:bg-blue-400/10 transition-colors"
                          title="複製連結"
                        >
                          {copiedId === tattoo.id ? <Check size={15} className="text-green-400" /> : <Link2 size={15} />}
                        </button>
                        <button
                          onClick={() => startEdit(tattoo)}
                          className="text-gray-400 hover:text-[#c9a84c] p-2 rounded-lg hover:bg-[#c9a84c]/10 transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeletingId(tattoo.id)}
                          className="text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-red-400/10 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ── Desktop table (md+) ── */}
            <table className="hidden md:table w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a] text-gray-500 text-xs">
                  <th className="text-left px-5 py-3 w-16">圖片</th>
                  <th className="text-left px-4 py-3">標題</th>
                  <th className="text-left px-4 py-3">刺青師</th>
                  <th className="text-left px-4 py-3">風格</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">標籤</th>
                  <th className="text-left px-4 py-3 w-24 hidden lg:table-cell">瀏覽</th>
                  <th className="px-4 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tattoo => (
                  <tr
                    key={tattoo.id}
                    className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#1a1a1a]/50 transition-colors"
                  >
                    {/* Thumbnail */}
                    <td className="px-5 py-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white flex-shrink-0">
                        <Image
                          src={tattoo.image_url}
                          alt={tattoo.title || ''}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>

                    {/* Editable fields */}
                    {editingId === tattoo.id ? (
                      <>
                        <td className="px-4 py-3">
                          <input
                            value={editForm.title}
                            onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                            className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#c9a84c]/50"
                            placeholder="作品標題"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={editForm.artist_id}
                            onChange={e => setEditForm(f => ({ ...f, artist_id: e.target.value }))}
                            className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#c9a84c]/50"
                          >
                            {artists.map(a => (
                              <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={editForm.style}
                            onChange={e => setEditForm(f => ({ ...f, style: e.target.value }))}
                            className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#c9a84c]/50"
                          >
                            <option value="">無</option>
                            {styles.map(s => (
                              <option key={s.id} value={s.name}>{s.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <input
                            value={editForm.tags}
                            onChange={e => setEditForm(f => ({ ...f, tags: e.target.value }))}
                            className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#c9a84c]/50"
                            placeholder="標籤（逗號分隔）"
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{tattoo.view_count}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => saveEdit(tattoo.id)}
                              disabled={saving}
                              className="bg-[#c9a84c] hover:bg-[#a07830] text-black p-1.5 rounded-lg transition-colors disabled:opacity-50"
                              title="儲存"
                            >
                              <Check size={15} />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="border border-[#2a2a2a] hover:border-white/30 text-gray-400 hover:text-white p-1.5 rounded-lg transition-colors"
                              title="取消"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-white">{tattoo.title || <span className="text-gray-600">無標題</span>}</td>
                        <td className="px-4 py-3 text-gray-300">
                          {(tattoo.artist as unknown as Artist)?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          {tattoo.style ? (
                            <span className="text-xs bg-[#c9a84c]/20 text-[#c9a84c] px-2 py-0.5 rounded-full">
                              {tattoo.style}
                            </span>
                          ) : <span className="text-gray-600">—</span>}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {tattoo.tags?.slice(0, 3).map(tag => (
                              <span key={tag} className="text-xs bg-[#1a1a1a] text-gray-400 px-2 py-0.5 rounded-full">
                                #{tag}
                              </span>
                            ))}
                            {(tattoo.tags?.length ?? 0) > 3 && (
                              <span className="text-xs text-gray-600">+{tattoo.tags.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{tattoo.view_count}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => copyLink(tattoo.id)}
                              className="text-gray-400 hover:text-blue-400 p-1.5 rounded-lg hover:bg-blue-400/10 transition-colors"
                              title="複製連結"
                            >
                              {copiedId === tattoo.id ? <Check size={15} className="text-green-400" /> : <Link2 size={15} />}
                            </button>
                            <button
                              onClick={() => startEdit(tattoo)}
                              className="text-gray-400 hover:text-[#c9a84c] p-1.5 rounded-lg hover:bg-[#c9a84c]/10 transition-colors"
                              title="編輯"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => setDeletingId(tattoo.id)}
                              className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-colors"
                              title="刪除"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Delete confirm dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-400/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold">確認刪除</h3>
                <p className="text-gray-500 text-sm mt-0.5">此操作無法復原</p>
              </div>
            </div>
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => { setDeletingId(null); setError(null) }}
                className="flex-1 border border-[#2a2a2a] hover:border-white/30 text-gray-400 hover:text-white py-2.5 rounded-xl transition-colors text-sm"
              >
                取消
              </button>
              <button
                onClick={() => confirmDelete(deletingId)}
                disabled={saving}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50"
              >
                {saving ? '刪除中...' : '確認刪除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
