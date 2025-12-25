'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  CheckSquare, 
  Wallet, 
  Layers, 
  LogOut,
  Zap,
  Tv,
  FileText // Tambahkan icon baru untuk Notes
} from 'lucide-react'
import { createClient } from '../utils/supabase/client'

// Definisi menu yang sesuai dengan folder di src/app
const menus = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Finance', href: '/finance', icon: Wallet },
  { name: 'Notes', href: '/notes', icon: FileText }, // Tambahkan ini
  { name: 'Focus Mode', href: '/focus', icon: Zap },
  { name: 'Watch List', href: '/watchlist', icon: Tv },
  { name: 'Resources', href: '/resources', icon: Layers },
]

export default function Sidebar() {
  const pathname = usePathname()
  const supabase = createClient()

  // Fungsi untuk mengecek apakah menu sedang aktif
  const isActive = (path: string) => pathname === path

  const handleLogout = async () => {
    const confirmLogout = confirm("Yakin ingin keluar?");
    if (confirmLogout) {
      await supabase.auth.signOut();
      window.location.href = "/"; 
    }
  }

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-950 border-r border-white/10 h-screen fixed left-0 top-0 z-50">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            LifeOS v4
          </h1>
          <p className="text-[10px] text-slate-500 font-mono mt-1 tracking-tighter uppercase">Command Center</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          {menus.map((menu) => (
            <Link 
              key={menu.href} 
              href={menu.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                isActive(menu.href) 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <menu.icon 
                size={20} 
                className={isActive(menu.href) ? 'text-white' : 'group-hover:text-blue-400 transition-colors'} 
              />
              <span className="font-medium text-sm">{menu.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/10 rounded-xl w-full transition group"
          >
            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* --- MOBILE BOTTOM NAV --- */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-xl border-t border-white/10 z-50 px-2 py-3 flex justify-around items-center overflow-x-auto no-scrollbar">
        {menus.map((menu) => (
          <Link 
            key={menu.href} 
            href={menu.href}
            className={`flex flex-col items-center gap-1 min-w-[60px] transition-colors ${
              isActive(menu.href) ? 'text-blue-400' : 'text-slate-500'
            }`}
          >
            <menu.icon size={20} />
            <span className="text-[9px] font-semibold tracking-tight">
                {menu.name.split(' ')[0]}
            </span>
          </Link>
        ))}
        <button 
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 text-slate-500 active:text-red-400 min-w-[60px]"
        >
          <LogOut size={20} />
          <span className="text-[9px] font-semibold tracking-tight">Exit</span>
        </button>
      </nav>
    </>
  )
}