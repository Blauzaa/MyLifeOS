'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
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
  Calendar
} from 'lucide-react'
import { createClient } from '../utils/supabase/client'
import { User } from '@supabase/supabase-js'

// Import Agenda Widget
import AgendaWidget, { EventItem } from './AgendaWidget' 

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
  
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // STATE UNTUK AGENDA
  const [events, setEvents] = useState<EventItem[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)

  // 1. Fetch User & Events
  const fetchEvents = useCallback(async (userId: string) => {
    setLoadingEvents(true)
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }) // Urutkan berdasarkan waktu buat (atau bisa ganti field jam)
    
    if (data) setEvents(data)
    setLoadingEvents(false)
  }, [supabase])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) fetchEvents(user.id)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchEvents(session.user.id)
      else setEvents([]) // Clear events if logout
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase, fetchEvents])

  // --- LOGIC AGENDA ---
  const handleAddEvent = async (title: string, time: string) => {
    if (!user) return
    
    // Optimistic Update (Biar UI kerasa cepet)
    const tempId = Math.random().toString()
    const newEvent = { id: tempId, title, time, user_id: user.id }
    setEvents([...events, newEvent])

    // Save to DB
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({ title, time, user_id: user.id })
      .select()
      .single()

    if (error) {
        // Revert jika gagal
        setEvents(events.filter(e => e.id !== tempId))
        alert('Gagal menyimpan event')
    } else {
        // Update ID asli dari DB
        setEvents(prev => prev.map(e => e.id === tempId ? data : e))
    }
  }

  const handleDeleteEvent = async (id: string) => {
    // Optimistic Update
    const prevEvents = [...events]
    setEvents(events.filter(e => e.id !== id))

    const { error } = await supabase.from('calendar_events').delete().eq('id', id)
    if (error) {
        setEvents(prevEvents) // Revert
        alert('Gagal menghapus event')
    }
  }

  // --- LOGIC AUTH ---
  const isActive = (path: string) => pathname === path

  const handleLogout = async () => {
    const confirmLogout = confirm("Yakin ingin keluar?");
    if (confirmLogout) {
      await supabase.auth.signOut();
      router.push('/') 
    }
  }

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  if (loading) return <aside className="hidden md:flex w-64 bg-slate-950 border-r border-white/10 h-screen" />

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-950 border-r border-white/10 h-screen fixed left-0 top-0 z-50">
        <div className="p-6 border-b border-white/10 shrink-0">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            LifeOS v4
          </h1>
          <p className="text-[10px] text-slate-500 font-mono mt-1 tracking-tighter uppercase">Command Center</p>
        </div>
        
        {/* Navigation - Kasih flex-1 agar mengisi ruang, tapi overflow auto */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar flex flex-col">
          {user ? (
            <>
                <div className="space-y-1 mb-2">
                    {menus.map((menu) => (
                    <Link 
                        key={menu.href} 
                        href={menu.href}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group ${
                        isActive(menu.href) 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        <menu.icon 
                        size={18} 
                        className={isActive(menu.href) ? 'text-white' : 'group-hover:text-blue-400 transition-colors'} 
                        />
                        <span className="font-medium text-sm">{menu.name}</span>
                    </Link>
                    ))}
                </div>

                {/* ✅ INSERT AGENDA WIDGET HERE */}
                {/* Spacer auto agar widget terdorong ke bawah jika menu sedikit, tapi tetap scrollable jika menu banyak */}
                <div className="mt-auto pt-2">
                   <AgendaWidget 
                      events={events} 
                      onAdd={handleAddEvent} 
                      onDelete={handleDeleteEvent} 
                      loading={loadingEvents}
                   />
                </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center px-4 space-y-2 opacity-50">
               <div className="p-3 bg-white/5 rounded-full">
                  <Github size={24} />
               </div>
               <p className="text-xs text-slate-400">Please login to access menu</p>
            </div>
          )}
        </nav>

        {/* Footer (User/Logout) */}
        <div className="p-4 border-t border-white/10 shrink-0 bg-slate-950">
          {user ? (
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/10 rounded-xl w-full transition group"
            >
              <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
              <span className="font-medium text-sm">Logout</span>
            </button>
          ) : (
            <button 
              onClick={handleLogin}
              className="flex items-center justify-center gap-3 px-4 py-3 bg-white text-slate-900 hover:bg-slate-200 rounded-xl w-full transition group font-bold shadow-lg"
            >
              <Github size={20} />
              <span className="text-sm">Login with GitHub</span>
            </button>
          )}
        </div>
      </aside>

      {/* --- MOBILE BOTTOM NAV --- */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-xl border-t border-white/10 z-50 px-2 py-3 flex justify-around items-center overflow-x-auto no-scrollbar">
        {user ? (
          <>
            {menus.slice(0, 5).map((menu) => ( // Batasi menu di mobile biar ga penuh
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
            {/* Tombol Logout Mobile */}
             <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-slate-500 active:text-red-400 min-w-[60px]">
                <LogOut size={20} />
                <span className="text-[9px] font-semibold tracking-tight">Exit</span>
              </button>
          </>
        ) : (
           <button onClick={handleLogin} className="flex items-center justify-center gap-2 text-white w-full py-1">
              <Github size={24} />
              <span className="text-xs font-bold">Login with GitHub</span>
            </button>
        )}
      </nav>
    </>
  )
}