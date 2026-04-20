'use client'

import { useState } from 'react'
import { Plus, Eye, EyeOff, Trash2, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Style } from '@/lib/types'

interface Props {
  styles: Style[]
}

export default function StylesAdmin({ styles: initial }: Props) {
  const [styles, setStyles] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const slugify = (str: string) =>
    str.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')

  const generateUniqueSlug = (str: string) => {
    let slug = slugify(str)
    if (!slug) slug = Date.now().toString()
    const existingSlugs = styles.map((s) => s.slug)
    if (existingSlugs.includes(slug)) {
      let counter = 2
      while (existingSlugs.includes(`${slug}-${counter}`)) counter++
      slug = `${slug}-${counter}`
    }
    return slug
  }

  const handleAdd = async () => {
    if (!name.trim()) { setError('風格名稱為必填'); return }
    setSaving(true)
    setError(null)
    const slug = generateUniqueSlug(name)
    const { data, error } = await supabase
      .from('styles')
      .insert({ name: name.trim(), slug, is_hidden: false })
      .select()
      .single()

    if (error) {
      setError('新增失敗：' + error.message)
    } else {
      setStyles((prev) => [...prev, data as Style].sort((a, b) => a.name.localeCompare(b.name)))
      setName('')
      setShowForm(false)
    }
    setSaving(false)
  }

  const toggleHidden = async (style: Style) => {
    const { error } = await supabase
      .from('styles')
      .update({ is_hidden: !style.is_hidden })
      .eq('id', style.id)
    if (!error) {
      setStyles((prev) => prev.map((s) => s.id === style.id ? { ...s, is_hidden: !s.is_hidden } : s))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此風格？')) return
    const { error } = await supabase.from('styles').delete().eq('id', id)
    if (!error) setStyles((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold flex-1">風格管理</h1>
        <button
          onClick={() => { setShowForm(true); setError(null); setName('') }}
          className="self-start sm:self-auto flex items-center gap-2 bg-[#c9a84c] hover:bg-[#a07830] text-black font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          <Plus size={16} /> 新增風格
        </button>
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl w-full max-w-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">新增風格</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">風格名稱 *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a84c]/50"
                  placeholder="例：黑灰寫實、日式傳統..."
                  autoFocus
                />
              </div>
              {error && <p className="text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-[#2a2a2a] text-gray-400 hover:text-white py-2.5 rounded-xl transition-colors text-sm"
                >
                  取消
                </button>
                <button
                  onClick={handleAdd}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#a07830] text-black font-semibold py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50"
                >
                  <Check size={16} /> {saving ? '新增中...' : '新增'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styles List */}
      {styles.length === 0 ? (
        <div className="text-center py-24 text-gray-500">
          <p>尚無風格，點擊右上角新增</p>
        </div>
      ) : (
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left px-6 py-4 text-sm text-gray-400 font-medium">風格名稱</th>
                <th className="text-left px-6 py-4 text-sm text-gray-400 font-medium hidden sm:table-cell">Slug</th>
                <th className="text-left px-6 py-4 text-sm text-gray-400 font-medium">狀態</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {styles.map((style) => (
                <tr key={style.id} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-6 py-4">
                    <span className={`font-medium text-sm ${style.is_hidden ? 'text-gray-500 line-through' : 'text-white'}`}>
                      {style.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">{style.slug}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${
                      style.is_hidden
                        ? 'bg-gray-500/20 text-gray-500'
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {style.is_hidden ? '已隱藏' : '顯示中'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => toggleHidden(style)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
                        title={style.is_hidden ? '取消隱藏' : '隱藏'}
                      >
                        {style.is_hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button
                        onClick={() => handleDelete(style.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="刪除"
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
