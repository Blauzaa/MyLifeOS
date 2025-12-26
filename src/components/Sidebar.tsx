'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  LayoutDashboard, 
  CheckSquare, 
  Wallet, 
  Layers, 
  LogOut,
  Zap,
  Tv,
  FileText,
  Github,
  Calendar,
  Settings,
  User as UserIcon,
  MoreHorizontal
} from 'lucide-react'
import { createClient } from '../utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'
import { useModal } from '../context/ModalContext' // Import Custom Modal

const menus = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Finance', href: '/finance', icon: Wallet },
  { name: 'Notes', href: '/notes', icon: FileText },
  { name: 'Focus Mode', href: '/focus', icon: Zap },
  { name: 'Watch List', href: '/watchlist', icon: Tv },
  { name: 'Resources', href: '/resources', icon: Layers },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { showModal } = useModal()
  
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const isActive = (path: string) => pathname === path

  const handleLogoutClick = () => {
    showModal({
      title: 'Sign Out',
      message: 'Are you sure you want to log out of LifeOS?',
      type: 'danger',
      confirmText: 'Log Out',
      onConfirm: async () => {
        await supabase.auth.signOut()
        router.push('/')
      }
    })
  }

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
  }

  // --- SKELETON LOADER ---
  if (loading) return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-950 border-r border-white/5 h-screen p-6 gap-6">
       <div className="h-8 w-32 bg-slate-800 rounded-lg animate-pulse" />
       <div className="space-y-3 flex-1">
          {[...Array(6)].map((_, i) => (
             <div key={i} className="h-10 w-full bg-slate-900 rounded-xl animate-pulse" />
          ))}
       </div>
       <div className="h-14 w-full bg-slate-900 rounded-xl animate-pulse" />
    </aside>
  )

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-950/80 backdrop-blur-xl border-r border-white/5 h-screen fixed left-0 top-0 z-40 shadow-2xl">
        {/* Header Logo */}
        <div className="p-6 pb-2">
          <div className="flex items-center gap-2 mb-1">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/40">
                L
             </div>
             <h1 className="text-xl font-bold text-white tracking-tight">
               LifeOS <span className="text-blue-500 text-xs align-top">v4</span>
             </h1>
          </div>
          <p className="text-[10px] text-slate-500 font-mono ml-10 tracking-widest uppercase opacity-60">
            Personal Command
          </p>
        </div>
        
        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {user ? (
            menus.map((menu) => {
              const active = isActive(menu.href)
              return (
                <Link 
                  key={menu.href} 
                  href={menu.href}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                    active ? 'text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {/* Active Background Animation */}
                  {active && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute inset-0 bg-blue-600 shadow-lg shadow-blue-900/20 rounded-xl z-0"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  {/* Hover Background (Non-active only) */}
                  {!active && (
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity z-0" />
                  )}

                  <span className="relative z-10 flex items-center gap-3">
                     <menu.icon size={18} className={active ? 'text-white' : 'group-hover:text-blue-300 transition-colors'} />
                     <span className="font-medium text-sm">{menu.name}</span>
                  </span>
                </Link>
              )
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6 space-y-4 border border-dashed border-white/5 rounded-2xl mx-2 bg-white/5">
               <div className="p-3 bg-slate-900 rounded-full shadow-inner">
                  <UserIcon size={24} className="text-slate-500" />
               </div>
               <div className="space-y-1">
                 <p className="text-sm text-slate-300 font-bold">Guest Access</p>
                 <p className="text-xs text-slate-500">Log in to sync your data</p>
               </div>
            </div>
          )}
        </nav>

        {/* User Profile & Logout Section */}
        <div className="p-4 border-t border-white/5 bg-black/20">
          {user ? (
            <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5 group relative overflow-hidden">
               
               {/* Profile Info */}
               <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                        {user.user_metadata?.full_name || 'User'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                  </div>
               </div>

               {/* Logout Button */}
               <button 
                 onClick={handleLogoutClick}
                 className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 text-xs font-medium transition-colors border border-transparent hover:border-red-500/20"
               >
                 <LogOut size={14} /> Sign Out
               </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-slate-950 hover:bg-slate-200 rounded-xl w-full transition font-bold shadow-lg shadow-white/5 active:scale-95"
            >
              <Github size={18} />
              <span className="text-xs">Connect GitHub</span>
            </button>
          )}
        </div>
      </aside>

      {/* --- MOBILE BOTTOM NAV (Floating Island Style) --- */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 bg-slate-900/90 backdrop-blur-2xl border border-white/10 z-50 rounded-2xl shadow-2xl shadow-black/50">
        <div className="flex justify-between items-center px-2 py-2 overflow-x-auto no-scrollbar gap-1">
          {user ? (
            <>
              {menus.map((menu) => {
                 const active = isActive(menu.href)
                 return (
                  <Link 
                    key={menu.href} 
                    href={menu.href}
                    className={`flex flex-col items-center justify-center min-w-[60px] h-[55px] rounded-xl transition-all relative ${
                      active ? 'text-blue-400' : 'text-slate-500 hover:bg-white/5'
                    }`}
                  >
                    {/* Active Indicator Dot */}
                    {active && <span className="absolute top-1 w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>}
                    
                    <menu.icon size={20} strokeWidth={active ? 2.5 : 2} className="mb-1 transition-transform active:scale-90"/>
                    <span className="text-[9px] font-medium tracking-tight">
                      {menu.name.split(' ')[0]}
                    </span>
                  </Link>
                 )
              })}
              
              {/* Divider */}
              <div className="w-[1px] h-8 bg-white/10 mx-1 shrink-0"></div>

              {/* Logout Mobile */}
              <button 
                onClick={handleLogoutClick} 
                className="flex flex-col items-center justify-center min-w-[50px] h-[55px] text-slate-500 active:text-red-400 rounded-xl hover:bg-white/5"
              >
                <LogOut size={18} />
                <span className="text-[8px] mt-1 font-bold">Exit</span>
              </button>
            </>
          ) : (
             <button onClick={handleLogin} className="flex items-center justify-center gap-2 text-white w-full py-3 font-bold">
               <Github size={20} />
               <span className="text-sm">Login to LifeOS</span>
             </button>
          )}
        </div>
      </nav>
    </>
  )
}