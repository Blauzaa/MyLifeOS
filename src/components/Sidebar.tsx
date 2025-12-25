'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, CheckSquare, Wallet, Layers, LogOut } from 'lucide-react'
import { createClient } from '../utils/supabase/supabaseClient'

const menus = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Finance', href: '/finance', icon: Wallet },
  { name: 'Resources', href: '/resources', icon: Layers },
]

export default function Sidebar() {
  const pathname = usePathname()
  const supabase = createClient()

  const isActive = (path: string) => pathname === path

  return (
    <>
      {/* --- DESKTOP SIDEBAR (Kiri) --- */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-950 border-r border-white/10 h-screen fixed left-0 top-0 z-50">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            LifeOS v4
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {menus.map((menu) => (
            <Link 
              key={menu.href} 
              href={menu.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive(menu.href) 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <menu.icon size={20} />
              <span className="font-medium">{menu.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
            className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/10 rounded-xl w-full transition"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* --- MOBILE BOTTOM NAV (Bawah) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-950 border-t border-white/10 z-50 px-6 py-3 flex justify-between items-center">
        {menus.map((menu) => (
          <Link 
            key={menu.href} 
            href={menu.href}
            className={`flex flex-col items-center gap-1 ${
              isActive(menu.href) ? 'text-blue-400' : 'text-slate-500'
            }`}
          >
            <menu.icon size={24} />
            <span className="text-[10px] font-medium">{menu.name}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}