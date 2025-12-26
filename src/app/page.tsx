/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation' // <--- 1. Import Router
import { createClient } from '../utils/supabase/client'
import { 
  Wallet, CheckCircle2, Link as LinkIcon, 
  ArrowUpRight, Calendar, Activity, Zap, TrendingUp, Plus 
} from 'lucide-react'
import { User } from '@supabase/supabase-js'

// Import Context Modal (Pastikan path import sesuai dengan struktur foldermu)
import { useModal } from '../context/ModalContext' 

const QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Productivity is being able to do things that you were never able to do before.", author: "Franz Kafka" },
  { text: "It’s not that I’m so smart, it’s just that I stay with problems longer.", author: "Albert Einstein" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" }
]

export default function DashboardOverview() {
  const supabase = createClient()
  const router = useRouter() // <--- 2. Init Router
  
  // Ambil fungsi openModal dari context (sesuaikan nama fungsinya dengan yang ada di ModalContext.tsx kamu)
  // Biasanya namanya openModal, setIsOpen, atau toggleModal
  const { showModal } = useModal()

  const [stats, setStats] = useState({ tasks: 0, links: 0, balance: 0, income: 0, expense: 0 })
  const [user, setUser] = useState<User | null>(null)
  const [quote, setQuote] = useState(QUOTES[0])

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)])

    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { count: taskCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'todo')
        const { count: linkCount } = await supabase.from('dynamic_items').select('*', { count: 'exact', head: true })
        const { data: trans } = await supabase.from('transactions').select('amount, type')
        
        let income = 0, expense = 0
        trans?.forEach((t: { amount: number, type: string }) => 
          t.type === 'income' ? income += Number(t.amount) : expense += Number(t.amount)
        )

        setStats({ tasks: taskCount || 0, links: linkCount || 0, balance: income - expense, income, expense })
      }
    }
    getData()
  }, [])

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })
  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num)

  // --- ACTIONS HANDLER ---
  const handleStartFocus = () => {
    router.push('/focus')
  }

const handleNewTask = () => {
  showModal({
    title: 'Create New Task',
    message: 'Do you want to create a new task?',
    type: 'info',
    confirmText: 'Create',
    onConfirm: () => {
      router.push('/tasks')
    }
  })
}

  const handleAddLink = () => {
    router.push('/resources')
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* --- HERO BANNER --- */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 md:p-10 shadow-2xl shadow-indigo-900/20 text-white border border-white/10 group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-all duration-1000"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-200 font-medium mb-2 bg-white/10 w-fit px-3 py-1 rounded-full text-xs backdrop-blur-md border border-white/10">
              <Calendar size={14} /> {today}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-2">
              Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-pink-200">{user?.email?.split('@')[0]}</span>
            </h1>
            <p className="text-blue-100/80 text-lg max-w-xl">
              &quot;{quote.text}&quot; <span className="opacity-60 text-sm">— {quote.author}</span>
            </p>
          </div>
          
          {/* TOMBOL START FOCUS */}
          <div className="hidden md:block">
             <button 
                onClick={handleStartFocus} 
                className="bg-white text-blue-700 px-6 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
             >
               <Zap size={20} className="fill-blue-700"/> Start Focus
             </button>
          </div>
        </div>
      </div>

      {/* --- STATS GRID (Klik Card juga bisa navigasi) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card: TASKS (Klik -> Tasks) */}
        <div onClick={() => router.push('/tasks')} className="group cursor-pointer bg-slate-800/40 backdrop-blur-xl p-6 rounded-3xl border border-white/5 hover:border-blue-500/30 hover:bg-slate-800/60 transition-all duration-300 relative overflow-hidden">
           <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle2 size={24} />
              </div>
              <span className="text-xs font-bold bg-blue-500/10 text-blue-300 px-2 py-1 rounded-lg border border-blue-500/20">Todo</span>
           </div>
           <div>
              <h2 className="text-4xl font-bold text-white mb-1 group-hover:translate-x-1 transition-transform">{stats.tasks}</h2>
              <p className="text-slate-400 text-sm font-medium">Pending Tasks</p>
           </div>
        </div>

        {/* Card: FINANCE (Klik -> Finance) */}
        <div onClick={() => router.push('/finance')} className="group cursor-pointer bg-slate-800/40 backdrop-blur-xl p-6 rounded-3xl border border-white/5 hover:border-emerald-500/30 hover:bg-slate-800/60 transition-all duration-300 relative overflow-hidden">
           <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                <Wallet size={24} />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg border flex items-center gap-1 ${stats.balance >= 0 ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-red-500/10 text-red-300 border-red-500/20'}`}>
                <TrendingUp size={12}/> {stats.balance >= 0 ? 'Healthy' : 'Deficit'}
              </span>
           </div>
           <div>
              <h2 className="text-3xl font-bold text-white mb-1 tracking-tight truncate group-hover:translate-x-1 transition-transform">
                {formatRupiah(stats.balance)}
              </h2>
              <p className="text-slate-400 text-sm font-medium">Net Balance</p>
           </div>
        </div>

        {/* Card: RESOURCES (Klik -> Resources) */}
        <div onClick={() => router.push('/resources')} className="group cursor-pointer bg-slate-800/40 backdrop-blur-xl p-6 rounded-3xl border border-white/5 hover:border-purple-500/30 hover:bg-slate-800/60 transition-all duration-300 relative overflow-hidden">
           <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-500/20 rounded-2xl text-purple-400 group-hover:scale-110 transition-transform duration-300">
                <LinkIcon size={24} />
              </div>
              <ArrowUpRight size={16} className="text-slate-500 group-hover:text-purple-400 transition-colors"/>
           </div>
           <div>
              <h2 className="text-4xl font-bold text-white mb-1 group-hover:translate-x-1 transition-transform">{stats.links}</h2>
              <p className="text-slate-400 text-sm font-medium">Saved Resources</p>
           </div>
        </div>

      </div>

      {/* --- QUICK ACTIONS ROW --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Income vs Expense Mini Bar */}
          <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
             <h3 className="text-slate-400 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity size={16}/> Cash Flow
             </h3>
             <div className="space-y-4">
                <div>
                   <div className="flex justify-between text-sm mb-1">
                      <span className="text-emerald-400 font-bold">Income</span>
                      <span className="text-white">{formatRupiah(stats.income)}</span>
                   </div>
                   <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: stats.income + stats.expense > 0 ? `${(stats.income / (stats.income + stats.expense)) * 100}%` : '0%' }}></div>
                   </div>
                </div>
                <div>
                   <div className="flex justify-between text-sm mb-1">
                      <span className="text-red-400 font-bold">Expense</span>
                      <span className="text-white">{formatRupiah(stats.expense)}</span>
                   </div>
                   <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: stats.income + stats.expense > 0 ? `${(stats.expense / (stats.income + stats.expense)) * 100}%` : '0%' }}></div>
                   </div>
                </div>
             </div>
          </div>

          {/* Shortcut Box */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl border border-white/5 flex flex-col justify-center items-center text-center">
             <p className="text-slate-400 text-sm mb-4">Ready to be productive?</p>
             <div className="flex gap-3">
                {/* TOMBOL NEW TASK */}
                <button 
                  onClick={handleNewTask}
                  className="bg-white/5 hover:bg-blue-600 hover:text-white hover:border-blue-500 text-white px-5 py-3 rounded-xl text-sm font-bold border border-white/10 transition flex items-center gap-2"
                >
                   <Plus size={16}/> New Task
                </button>
                
                {/* TOMBOL ADD LINK */}
                <button 
                  onClick={handleAddLink}
                  className="bg-white/5 hover:bg-purple-600 hover:text-white hover:border-purple-500 text-white px-5 py-3 rounded-xl text-sm font-bold border border-white/10 transition flex items-center gap-2"
                >
                   <LinkIcon size={16}/> Add Link
                </button>
             </div>
          </div>
      </div>
      
      {!user && (
        <div className="text-center py-10">
           <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'github' })} className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-xl font-bold transition shadow-lg shadow-blue-900/50">
             Login with GitHub
           </button>
        </div>
      )}
    </div>
  )
}