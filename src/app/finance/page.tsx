'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '../../utils/supabase/client'
import FinanceWidget from '../../components/FinanceWidget'
import { TransactionItem } from '../../types'
import { RefreshCw } from 'lucide-react'

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
    <div className="h-[calc(100vh-100px)] flex flex-col pb-6 space-y-6">

      {/* Header Section */}
      <header className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            Financial Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">Realtime Cashflow Management</p>
        </div>

        <button
          onClick={() => { setRefreshing(true); fetchTransactions(); }}
          className={`p-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-800 transition shadow-lg ${refreshing ? 'animate-spin' : ''}`}
          title="Refresh Data"
        >
          <RefreshCw size={20} />
        </button>
      </header>

      {/* Content Section */}
      <div className="w-full mx-auto space-y-8 flex-1 overflow-y-auto custom-scrollbar pr-2">
        {loading ? (
          <div className="flex flex-col gap-6 animate-pulse">
            <div className="h-40 bg-slate-900 rounded-3xl w-full"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-[500px] bg-slate-900 rounded-3xl lg:col-span-2"></div>
              <div className="h-[400px] bg-slate-900 rounded-3xl"></div>
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
    </div>
  )
}