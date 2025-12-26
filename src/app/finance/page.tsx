'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '../../utils/supabase/client'
import FinanceWidget from '../../components/FinanceWidget'
import Sidebar from '../../components/Sidebar' // Pastikan import Sidebar jika belum ada di Layout Global
import { TransactionItem } from '../../types'
import { Wallet, RefreshCw } from 'lucide-react'

export default function FinancePage() {
  const supabase = createClient()
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTransactions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('finances')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setTransactions(data as TransactionItem[])
    } catch (error) {
      console.error('Error fetching finance:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const handleAdd = async (newItem: { title: string; amount: number; type: 'income' | 'expense' }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('finances')
        .insert([{
          title: newItem.title,
          amount: newItem.amount,
          type: newItem.type,
          user_id: user.id
        }])

      if (error) throw error
      fetchTransactions()
    } catch (error) {
      alert('Gagal menyimpan.')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('finances').delete().eq('id', id)
      if (error) throw error
      fetchTransactions()
    } catch (error) {
      alert('Gagal menghapus.')
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* OPSIONAL: Jika Sidebar belum ada di layout.tsx, nyalakan baris di bawah ini.
        Jika sudah ada di layout global, biarkan komentar atau hapus.
      */}
      {/* <Sidebar /> */}

      {/* PERBAIKAN UTAMA DI SINI:
         Gunakan 'md:ml-64' (Margin Left), BUKAN Padding Left.
         Ini akan memaksa konten mulai SETELAH sidebar, bukan 'di dalam' padding.
      */}
      <main className="flex-1 md:ml-64 transition-all duration-300 ease-in-out">
        
        {/* Container Utama dengan Max-Width agar tidak terlalu lebar di layar besar */}
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
          
          {/* --- Header Area --- */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
                Financial Overview
              </h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Manage your cashflow & expenses
              </p>
            </div>
            
            <button 
              onClick={() => { setRefreshing(true); fetchTransactions(); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 hover:border-white/20 text-slate-400 hover:text-white transition-all text-xs font-bold ${refreshing ? 'opacity-70 cursor-wait' : ''}`}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span>Sync Data</span>
            </button>
          </header>

          {/* --- Widget Area --- */}
          <div className="min-h-[500px]">
            {loading ? (
               <div className="space-y-4 animate-pulse">
                  <div className="h-48 bg-slate-900/50 rounded-2xl border border-white/5"></div>
                  <div className="h-96 bg-slate-900/50 rounded-2xl border border-white/5"></div>
               </div>
            ) : (
               <FinanceWidget 
                 transactions={transactions} 
                 onAdd={handleAdd} 
                 onDelete={handleDelete} 
               />
            )}
          </div>
          
        </div>
      </main>
    </div>
  )
}