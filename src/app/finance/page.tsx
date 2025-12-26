'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '../../utils/supabase/client' // Sesuaikan path utils kamu
import FinanceWidget from '../../components/FinanceWidget' // Sesuaikan path component
import { TransactionItem } from '../../types'
import { Wallet } from 'lucide-react'

export default function FinancePage() {
  const supabase = createClient()
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [loading, setLoading] = useState(true)

  // 1. Ambil Data dari Supabase
  const fetchTransactions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('finances') // Pastikan nama tabel di Supabase 'finances'
        .select('*')
        .order('created_at', { ascending: false }) // Urutkan dari yang terbaru

      if (error) throw error
      if (data) setTransactions(data as TransactionItem[])
    } catch (error) {
      console.error('Error fetching finance:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Panggil fetch saat halaman dibuka
  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // 2. Fungsi Tambah Data
  const handleAdd = async (newItem: { title: string; amount: number; type: 'income' | 'expense' }) => {
    try {
      // Ambil user saat ini agar data tersimpan ke akun yang benar
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return alert('Please login first')

      const { error } = await supabase
        .from('finances')
        .insert([{
          title: newItem.title,
          amount: newItem.amount,
          type: newItem.type,
          user_id: user.id // Penting: Supabase butuh ini jika RLS aktif
        }])

      if (error) throw error

      // Refresh data setelah berhasil nambah
      fetchTransactions() 
    } catch (error) {
      console.error('Error adding transaction:', error)
      alert('Gagal menyimpan data')
    }
  }

  // 3. Fungsi Hapus Data
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('finances')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Refresh data setelah dihapus
      fetchTransactions()
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert('Gagal menghapus data')
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header Halaman */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-900/40">
            <Wallet size={32} />
          </div>
          Financial Overview
        </h1>
        <p className="text-slate-400 mt-2 ml-1">Track your income and expenses efficiently.</p>
      </div>

      {/* Konten Utama */}
      <div className="h-[calc(100vh-200px)]"> 
        {loading ? (
          // Loading State sederhana
          <div className="flex items-center justify-center h-full text-slate-500 animate-pulse">
            Loading financial data...
          </div>
        ) : (
          // Panggil Widget UI di sini
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