/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState, useCallback } from 'react'
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Trash2, 
  Loader2, 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Calendar,
  CreditCard,
  AlertCircle
} from 'lucide-react'

/**
 * NOTE: Karena lingkungan Canvas tidak memiliki akses ke file eksternal '../../utils/supabase/supabaseClient',
 * kita menggunakan mock client atau asumsi penggunaan window.supabase agar kode dapat di-render 
 * di preview tanpa error 'Module Not Found'.
 * * Untuk penggunaan di project lokal Anda, silakan ganti bagian inisialisasi ini kembali ke:
 * import { createClient } from '../../utils/supabase/supabaseClient'
 * const supabase = createClient()
 */

// Mock logic untuk keperluan Preview agar tidak error build
const supabaseMock = {
  from: () => ({
    select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
    insert: () => Promise.resolve({ error: null }),
    delete: () => ({ eq: () => Promise.resolve({ error: null }) })
  }),
  auth: {
    getUser: () => Promise.resolve({ data: { user: { id: 'mock-id' } } })
  }
};

// Gunakan supabaseMock jika createClient tidak tersedia
const supabase = (typeof window !== 'undefined' && (window as any).supabaseClient) || supabaseMock;

interface Transaction {
  id: string
  title: string
  amount: number
  type: string
  category: string
  created_at: string
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [form, setForm] = useState({ title: '', amount: '', type: 'expense', category: 'umum' })
  const [loading, setLoading] = useState(true)

  // Fungsi fetch data dari Supabase (SQL Table: transactions)
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      if (data) setTransactions(data)
    } catch (err) {
      console.error("Gagal mengambil data dari Supabase:", err)
    } finally {
      setLoading(false)
    }
  }, []) 

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Fungsi tambah transaksi (Sesuai skema SQL Anda)
  const addTransaction = async () => {
    if (!form.title || !form.amount) return
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert("Silakan login terlebih dahulu!")

    const { error } = await supabase.from('transactions').insert({
      title: form.title,
      amount: parseFloat(form.amount),
      type: form.type, 
      category: form.category,
      user_id: user.id
    })
    
    if (error) {
      alert("Gagal menambah transaksi: " + error.message)
    } else {
      setForm({ title: '', amount: '', type: 'expense', category: 'umum' }) 
      fetchTransactions() 
    }
  }

  const deleteTrans = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) {
      alert("Gagal menghapus data")
    } else {
      setTransactions(prev => prev.filter(t => t.id !== id))
    }
  }

  const totals = transactions.reduce((acc, curr) => {
    const amt = Number(curr.amount)
    if (curr.type === 'income') acc.income += amt
    else acc.expense += amt
    acc.balance = acc.income - acc.expense
    return acc
  }, { income: 0, expense: 0, balance: 0 })

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 p-4 min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <div className="animate-in fade-in duration-700">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent flex items-center gap-3">
          <Wallet className="text-emerald-500" /> Finance Manager
        </h1>
        <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-semibold opacity-70">Supabase SQL Database Active</p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 space-y-2 backdrop-blur-md">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Saldo</span>
          <p className={`text-2xl font-bold font-mono ${totals.balance >= 0 ? 'text-white' : 'text-rose-400'}`}>
            Rp {totals.balance.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 space-y-2 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider">Pemasukan</span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-400">
            + Rp {totals.income.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 space-y-2 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-rose-500 text-xs font-bold uppercase tracking-wider">Pengeluaran</span>
            <TrendingDown size={16} className="text-rose-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-rose-400">
            - Rp {totals.expense.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-slate-900/80 p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
          <Plus size={16} /> Catat Baru
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input 
            placeholder="Keterangan (misal: Gaji)" 
            className="md:col-span-2 bg-slate-800/50 text-white px-4 py-3 rounded-2xl outline-none border border-white/5 focus:border-blue-500/50 transition-all placeholder:text-slate-600 font-medium"
            value={form.title} onChange={e => setForm({...form, title: e.target.value})}
          />
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="number" placeholder="Amount" 
              className="w-full bg-slate-800/50 text-white px-4 py-3 pl-10 rounded-2xl outline-none border border-white/5 focus:border-blue-500/50 transition-all placeholder:text-slate-600 font-mono"
              value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
            />
          </div>
          <div className="flex gap-2">
            <select 
              className="bg-slate-800/50 text-white px-4 py-3 rounded-2xl outline-none border border-white/5 cursor-pointer hover:bg-slate-700/50 transition-colors"
              value={form.type} onChange={e => setForm({...form, type: e.target.value})}
            >
              <option value="expense">📉 Keluar</option>
              <option value="income">📈 Masuk</option>
            </select>
            <button 
              onClick={addTransaction} 
              className="bg-blue-600 hover:bg-blue-500 p-3 rounded-2xl flex-1 flex items-center justify-center text-white transition-all shadow-lg shadow-blue-900/20 active:scale-95"
            >
              <Plus />
            </button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-slate-900/40 rounded-3xl border border-white/5 overflow-hidden shadow-xl animate-in fade-in duration-1000">
        <div className="p-5 border-b border-white/5 bg-slate-900/60 backdrop-blur-md">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Riwayat Transaksi</h2>
        </div>
        {loading ? (
          <div className="p-20 flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="animate-spin text-blue-500" size={32}/>
            <p className="text-sm font-medium tracking-wide">Menghubungkan ke Supabase...</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {transactions.map(t => (
              <div key={t.id} className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {t.type === 'income' ? <ArrowUpCircle size={22} /> : <ArrowDownCircle size={22} />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-100">{t.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                      <Calendar size={12} /> {new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className={`font-bold font-mono text-sm ${t.type === 'income' ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {t.type === 'income' ? '+' : '-'} Rp {Number(t.amount).toLocaleString('id-ID')}
                  </span>
                  <button onClick={() => deleteTrans(t.id)} className="text-slate-700 hover:text-rose-400 p-2 opacity-0 group-hover:opacity-100 transition-all active:scale-90">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {transactions.length === 0 && !loading && (
              <div className="p-20 text-center flex flex-col items-center gap-4">
                <div className="p-4 bg-slate-800/50 rounded-full text-slate-600">
                   <AlertCircle size={32} />
                </div>
                <p className="text-slate-600 italic text-sm max-w-[200px]">
                  Database Supabase kosong. Silakan catat transaksi pertama Anda melalui aplikasi lokal.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}