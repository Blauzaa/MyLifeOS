'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '../../utils/supabase/client'
import FinanceWidget from '../../components/FinanceWidget'
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
    <div className="flex min-h-screen bg-slate-950 text-slate-200 font-sans">
      
      {/* LOGIC RESPONSIF:
        - Mobile: ml-0 (Sidebar biasanya hidden/hamburger)
        - Desktop (md ke atas): ml-64 (Untuk memberi ruang Sidebar LifeOS kamu)
      */}
      <main className="flex-1 w-full md:ml-64 transition-all duration-300 ease-in-out">
        
        {/* Header Section */}
        <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              Financial Overview
            </h1>
            <p className="text-xs text-slate-500 mt-1">Realtime Cashflow Management</p>
          </div>
          
          <button 
            onClick={() => { setRefreshing(true); fetchTransactions(); }}
            className={`p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition ${refreshing ? 'animate-spin' : ''}`}
            title="Refresh Data"
          >
            <RefreshCw size={18} />
          </button>
        </header>

        {/* Content Section - MENGISI PENUH LAYAR */}
        <div className="p-4 md:p-8 w-full max-w-[1920px] mx-auto">
            {loading ? (
               <div className="flex flex-col gap-6 animate-pulse">
                  <div className="h-48 bg-slate-900 rounded-2xl w-full"></div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="h-96 bg-slate-900 rounded-2xl lg:col-span-2"></div>
                      <div className="h-96 bg-slate-900 rounded-2xl"></div>
                  </div>
               </div>
            ) : (
               <FinanceWidget 
                 transactions={transactions} 
                 onAdd={handleAdd} 
                 onDelete={handleDelete} 
               />
            )}
        </div>
      </main>
    </div>
  )
}