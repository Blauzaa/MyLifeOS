'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '../../utils/supabase/client'
import FinanceWidget from '../../components/FinanceWidget' // <--- Ini memanggil UI Bagus tadi
import { TransactionItem } from '../../types'
import { Wallet, RefreshCw } from 'lucide-react'

export default function FinancePage() {
  const supabase = createClient()
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // 1. Ambil Data (Fetch)
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

  // 2. Tambah Data
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
      fetchTransactions() // Refresh otomatis
    } catch (error) {
      alert('Gagal menyimpan.')
    }
  }

  // 3. Hapus Data
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('finances')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchTransactions() // Refresh otomatis
    } catch (error) {
      alert('Gagal menghapus.')
    }
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200">
      {/* Padding-left (md:pl-64) ditambahkan agar konten tidak tertutup Sidebar 
         di layar desktop.
      */}
      <div className="md:pl-64 flex-1 flex flex-col overflow-hidden">
        
        {/* --- Header Area --- */}
        <header className="px-8 py-6 border-b border-white/5 bg-slate-950/50 backdrop-blur-sm flex justify-between items-center z-10">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              Financial Overview
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-1 uppercase tracking-wider">
              Realtime Cashflow Tracker
            </p>
          </div>
          
          <button 
            onClick={() => { setRefreshing(true); fetchTransactions(); }}
            className={`p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition ${refreshing ? 'animate-spin' : ''}`}
            title="Refresh Data"
          >
            <RefreshCw size={18} />
          </button>
        </header>

        {/* --- Main Content Area --- */}
        <main className="flex-1 overflow-hidden p-4 md:p-8">
          <div className="max-w-5xl mx-auto h-full">
            {loading ? (
               // Skeleton Loading sederhana biar rapi
               <div className="h-full flex flex-col gap-6 animate-pulse">
                  <div className="h-40 bg-slate-900 rounded-2xl w-full"></div>
                  <div className="flex-1 bg-slate-900 rounded-2xl w-full"></div>
               </div>
            ) : (
               // DISINI KITA PANGGIL WIDGET KEREN TADI
               <FinanceWidget 
                 transactions={transactions} 
                 onAdd={handleAdd} 
                 onDelete={handleDelete} 
               />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}