'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Menu, X, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { useFittingRoomCtx } from '@/context/FittingRoomContext'

const navLinks = [
  { href: '/', label: '首頁' },
  { href: '/artists', label: '刺青師' },
  { href: '/gallery', label: '作品集' },
  { href: '/ar', label: 'AR 試穿' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { count } = useFittingRoomCtx()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#2a2a2a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-[#c9a84c] font-bold text-xl tracking-widest">INK</span>
            <span className="text-white font-light text-xl tracking-widest">AR</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm tracking-wider transition-colors duration-200',
                  pathname === link.href
                    ? 'text-[#c9a84c]'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Fitting room icon */}
          <Link href="/fitting-room" className="relative text-gray-400 hover:text-white transition-colors" title="試衣間">
            <ShoppingBag size={22} />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#c9a84c] text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#2a2a2a] bg-[#0a0a0a]">
          <div className="px-4 py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'text-sm tracking-wider py-2 transition-colors',
                  pathname === link.href
                    ? 'text-[#c9a84c]'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/fitting-room"
              onClick={() => setMobileOpen(false)}
              className={cn(
                'text-sm tracking-wider py-2 transition-colors flex items-center gap-2',
                pathname === '/fitting-room' ? 'text-[#c9a84c]' : 'text-gray-400 hover:text-white'
              )}
            >
              <ShoppingBag size={15} /> 試衣間 {count > 0 && <span className="bg-[#c9a84c] text-black text-[10px] font-bold px-1.5 rounded-full">{count}</span>}
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
