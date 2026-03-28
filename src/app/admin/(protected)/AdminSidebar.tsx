'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, Upload, BarChart2,
  LogOut, ImageIcon, Menu, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin',            label: '總覽',     Icon: LayoutDashboard },
  { href: '/admin/artists',    label: '刺青師管理', Icon: Users },
  { href: '/admin/upload',     label: '上傳作品',  Icon: Upload },
  { href: '/admin/tattoos',    label: '作品管理',  Icon: ImageIcon },
  { href: '/admin/analytics',  label: '統計分析',  Icon: BarChart2 },
]

interface Props { userEmail: string }

export default function AdminSidebar({ userEmail }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close drawer on route change
  useEffect(() => { setOpen(false) }, [pathname])

  const NavLinks = () => (
    <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
      {navItems.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm',
            pathname === href
              ? 'bg-[#c9a84c]/20 text-[#c9a84c]'
              : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
          )}
        >
          <Icon size={18} />
          {label}
        </Link>
      ))}
    </nav>
  )

  const SignOut = () => (
    <form action="/auth/signout" method="post" className="p-4 border-t border-[#2a2a2a]">
      <button
        type="submit"
        className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all text-sm"
      >
        <LogOut size={18} /> 登出
      </button>
    </form>
  )

  return (
    <>
      {/* ── Mobile top bar ── */}
      <div className="lg:hidden sticky top-0 z-30 bg-[#0f0f0f] border-b border-[#2a2a2a] flex items-center px-4 h-12">
        <button
          onClick={() => setOpen(true)}
          className="text-gray-400 hover:text-white p-1 mr-3"
          aria-label="開啟選單"
        >
          <Menu size={22} />
        </button>
        <span className="text-[#c9a84c] font-bold text-sm">INK AR</span>
        <span className="text-xs bg-[#c9a84c]/20 text-[#c9a84c] px-2 py-0.5 rounded-full ml-2">Admin</span>
        <form action="/auth/signout" method="post" className="ml-auto">
          <button
            type="submit"
            className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 transition-colors text-xs px-3 py-1.5 rounded-lg hover:bg-red-400/10"
          >
            <LogOut size={15} /> 登出
          </button>
        </form>
      </div>

      {/* ── Mobile drawer overlay ── */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-[#0f0f0f] border-r border-[#2a2a2a] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[#c9a84c] font-bold">INK AR</span>
                  <span className="text-xs bg-[#c9a84c]/20 text-[#c9a84c] px-2 py-0.5 rounded-full">Admin</span>
                </div>
                <p className="text-gray-500 text-xs mt-0.5 truncate max-w-44">{userEmail}</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <NavLinks />
            <SignOut />
          </div>
          {/* Backdrop */}
          <div className="flex-1 bg-black/60" onClick={() => setOpen(false)} />
        </div>
      )}

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex w-60 bg-[#0f0f0f] border-r border-[#2a2a2a] flex-col fixed top-0 h-full z-40">
        <div className="p-6 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <span className="text-[#c9a84c] font-bold text-lg">INK AR</span>
            <span className="text-xs bg-[#c9a84c]/20 text-[#c9a84c] px-2 py-0.5 rounded-full">Admin</span>
          </div>
          <p className="text-gray-500 text-xs mt-1 truncate">{userEmail}</p>
        </div>
        <NavLinks />
        <SignOut />
      </aside>
    </>
  )
}
