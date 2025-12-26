/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../utils/supabase/client'
import { 
  Wallet, CheckCircle2, Link as LinkIcon, 
  Calendar, Clock, Zap, Plus, ArrowRight 
} from 'lucide-react'
import { User } from '@supabase/supabase-js'

// Interface khusus untuk Overview
interface TodayEvent {
    id: string
    title: string
    start_time: string
    end_time: string
}

const QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Productivity is being able to do things that you were never able to do before.", author: "Franz Kafka" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" }
]

export default function DashboardOverview() {
  const supabase = createClient()
  const router = useRouter()

  const [stats, setStats] = useState({ tasks: 0, links: 0, balance: 0 })
  const [todayEvents, setTodayEvents] = useState<TodayEvent[]>([]) 
  const [user, setUser] = useState<User | null>(null)
  const [quote, setQuote] = useState(QUOTES[0])

  // Helper Format Tanggal Hari Ini
  const todayDate = new Date()
  const todayStr = todayDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })
  // Format YYYY-MM-DD untuk query database
  const todayISODate = todayDate.toISOString().split('T')[0] 

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)])

    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        // 1. Stats Logic
        const { count: taskCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'todo')
        const { count: linkCount } = await supabase.from('dynamic_items').select('*', { count: 'exact', head: true })
        const { data: trans } = await supabase.from('transactions').select('amount, type')
        let bal = 0; 
        trans?.forEach((t: { amount: number, type: string }) => t.type === 'income' ? bal += Number(t.amount) : bal -= Number(t.amount))
        setStats({ tasks: taskCount || 0, links: linkCount || 0, balance: bal })

        // 2. FETCH EVENT HARI INI DARI TABEL 'EVENTS'
        const { data: events } = await supabase
            .from('events')
            .select('id, title, start_time, end_time')
            .eq('user_id', user.id)
            .eq('event_date', todayISODate) // Filter tanggal hari ini
            .order('start_time', { ascending: true })
            .limit(4)
        
        if (events) setTodayEvents(events as TodayEvent[])
      }
    }
    getData()
  }, [])

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
         <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-6">
            <div>
                <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs mb-2 backdrop-blur-md border border-white/10">
                    <Calendar size={12}/> {todayStr}
                </div>
                <h1 className="text-3xl font-bold">Welcome back, {user?.email?.split('@')[0]}!</h1>
                <p className="text-blue-100/80 text-sm mt-1 opacity-80">"{quote.text}"</p>
            </div>
            <div className="flex gap-3">
                 <button onClick={() => router.push('/calendar')} className="bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2">
                    <Calendar size={16}/> View Calendar
                 </button>
                 <button onClick={() => router.push('/focus')} className="bg-white text-blue-700 px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:scale-105 transition flex items-center gap-2">
                    <Zap size={16}/> Focus Mode
                 </button>
            </div>
         </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* KOLOM KIRI: Stats & Shortcuts */}
          <div className="lg:col-span-2 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4">
                  <div onClick={() => router.push('/tasks')} className="bg-slate-800/50 p-4 rounded-2xl border border-white/5 hover:bg-slate-800 transition cursor-pointer group">
                      <h3 className="text-2xl font-bold text-white group-hover:scale-105 transition">{stats.tasks}</h3>
                      <p className="text-xs text-slate-400">Pending Tasks</p>
                  </div>
                  <div onClick={() => router.push('/finance')} className="bg-slate-800/50 p-4 rounded-2xl border border-white/5 hover:bg-slate-800 transition cursor-pointer group">
                      <h3 className={`text-2xl font-bold group-hover:scale-105 transition ${stats.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(stats.balance)}
                      </h3>
                      <p className="text-xs text-slate-400">Balance</p>
                  </div>
                  <div onClick={() => router.push('/resources')} className="bg-slate-800/50 p-4 rounded-2xl border border-white/5 hover:bg-slate-800 transition cursor-pointer group">
                      <h3 className="text-2xl font-bold text-white group-hover:scale-105 transition">{stats.links}</h3>
                      <p className="text-xs text-slate-400">Saved Links</p>
                  </div>
              </div>

              {/* Quick Shortcuts */}
              <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl">
                  <h3 className="text-slate-400 font-bold text-sm mb-4 uppercase tracking-wider">Quick Actions</h3>
                  <div className="flex flex-wrap gap-3">
                      <button onClick={() => router.push('/tasks')} className="flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-4 py-3 rounded-xl border border-blue-500/20 transition text-sm font-bold">
                          <Plus size={16}/> New Task
                      </button>
                      <button onClick={() => router.push('/resources')} className="flex items-center gap-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 px-4 py-3 rounded-xl border border-purple-500/20 transition text-sm font-bold">
                          <LinkIcon size={16}/> Save Link
                      </button>
                      <button onClick={() => router.push('/calendar')} className="flex items-center gap-2 bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 px-4 py-3 rounded-xl border border-orange-500/20 transition text-sm font-bold">
                          <Calendar size={16}/> Add Event
                      </button>
                  </div>
              </div>
          </div>

          {/* KANAN: Today's Agenda Widget */}
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 h-fit min-h-[300px]">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold flex items-center gap-2 text-white"><Clock size={18} className="text-orange-400"/> Today's Agenda</h3>
                  <button onClick={() => router.push('/calendar')} className="text-xs text-slate-500 hover:text-white transition flex items-center gap-1">View all <ArrowRight size={12}/></button>
              </div>

              <div className="space-y-4">
                  {todayEvents.length > 0 ? (
                      todayEvents.map((ev) => (
                          <div key={ev.id} className="flex gap-3 relative pl-4 border-l-2 border-slate-800 hover:border-orange-500 transition-colors pb-2 last:pb-0 group cursor-pointer" onClick={() => router.push('/calendar')}>
                              <div>
                                  <p className="text-[10px] font-mono text-orange-400 mb-0.5 bg-orange-400/10 w-fit px-1 rounded">{ev.start_time.slice(0,5)} - {ev.end_time.slice(0,5)}</p>
                                  <p className="text-sm font-bold text-slate-200 group-hover:text-white leading-tight">{ev.title}</p>
                              </div>
                          </div>
                      ))
                  ) : (
                      <div className="text-center py-8 opacity-50">
                          <div className="bg-white/5 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Calendar size={20} className="text-slate-400"/>
                          </div>
                          <p className="text-xs text-slate-400">No events for today.</p>
                          <button onClick={() => router.push('/calendar')} className="text-orange-400 text-xs font-bold mt-2 hover:underline">Add one?</button>
                      </div>
                  )}
              </div>
          </div>

      </div>
    </div>
  )
}