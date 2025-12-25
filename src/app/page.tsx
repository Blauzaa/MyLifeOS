'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../utils/supabase/client'
import { Wallet, CheckCircle, Link as LinkIcon } from 'lucide-react' // Hapus arrow yang ga kepake
import { User } from '@supabase/supabase-js' // Import tipe User

export default function DashboardOverview() {
  const supabase = createClient()
  const [stats, setStats] = useState({ tasks: 0, links: 0, balance: 0 })
  // FIX 1: Ganti any dengan User | null
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        // Hitung total task
        const { count: taskCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'todo')
        // Hitung total link
        const { count: linkCount } = await supabase.from('dynamic_items').select('*', { count: 'exact', head: true })
        // Hitung Keuangan
        const { data: trans } = await supabase.from('transactions').select('amount, type')
        
        let income = 0, expense = 0
        // FIX 2: Kasih tahu TypeScript kalau t itu punya structure tertentu
        trans?.forEach((t: { amount: number, type: string }) => 
          t.type === 'income' ? income += Number(t.amount) : expense += Number(t.amount)
        )

        setStats({ tasks: taskCount || 0, links: linkCount || 0, balance: income - expense })
      }
    }
    getData()
  }, [supabase]) // FIX 3: Tambahkan supabase ke dependency

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-8 rounded-3xl border border-white/5">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">👋 Welcome back, {user?.email?.split('@')[0]}!</h1>
        {/* FIX 4: Ganti what's dengan what&apos;s */}
        <p className="text-blue-200/60">Here is what&apos;s happening in your life today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Task */}
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm mb-1">Pending Tasks</p>
            <h2 className="text-3xl font-bold">{stats.tasks}</h2>
          </div>
          <div className="bg-blue-500/20 p-3 rounded-xl text-blue-400"><CheckCircle /></div>
        </div>

        {/* Card 2: Finance */}
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm mb-1">Current Balance</p>
            <h2 className={`text-3xl font-bold ${stats.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              Rp {stats.balance.toLocaleString()}
            </h2>
          </div>
          <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-400"><Wallet /></div>
        </div>

        {/* Card 3: Resources */}
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm mb-1">Saved Links</p>
            <h2 className="text-3xl font-bold">{stats.links}</h2>
          </div>
          <div className="bg-purple-500/20 p-3 rounded-xl text-purple-400"><LinkIcon /></div>
        </div>
      </div>
      
      {!user && (
        <div className="text-center py-10">
           <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'github' })} className="bg-blue-600 px-6 py-3 rounded-xl font-bold">Login to Start</button>
        </div>
      )}
    </div>
  )
}