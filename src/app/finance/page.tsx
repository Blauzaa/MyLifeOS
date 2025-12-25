'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '../../utils/supabase/supabaseClient'
import { Plus, TrendingUp, TrendingDown, Trash2, Loader2 } from 'lucide-react'

// --- FIX 1: Pindahkan inisialisasi ke LUAR komponen ---
// Dengan begini, objek supabase hanya dibuat 1x saat aplikasi jalan, 
// bukan setiap kali halaman di-render.
const supabase = createClient()

interface Transaction {
  id: string
  title: string
  amount: number
  type: string
  created_at: string
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [form, setForm] = useState({ title: '', amount: '', type: 'expense' })
  const [loading, setLoading] = useState(true)

  // --- FIX 2: Gunakan useCallback dengan benar ---
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
      console.error("Gagal mengambil data:", err)
    } finally {
      setLoading(false)
    }
  }, []) 

  // --- FIX 3: useEffect memanggil fungsi yang sudah stabil ---
  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const addTransaction = async () => {
    if (!form.title || !form.amount) return
    
    // Ambil user saat ini
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert("Silakan login terlebih dahulu!")

    const { error } = await supabase.from('transactions').insert({
      title: form.title,
      amount: parseFloat(form.amount), // Pastikan angka
      type: form.type, 
      user_id: user.id
    })
    
    if (error) {
      alert("Gagal menambah transaksi")
    } else {
      setForm({ title: '', amount: '', type: 'expense' }) 
      fetchTransactions() // Refresh data
    }
  }

  const deleteTrans = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) {
      alert("Gagal menghapus")
    } else {
      // Update state lokal (Optimistic Update)
      setTransactions(prev => prev.filter(t => t.id !== id))
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <h1 className="text-3xl font-bold flex items-center gap-3 text-white">💰 Finance Manager</h1>
      
      {/* Input Section */}
      <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 grid grid-cols-1 md:grid-cols-4 gap-4">
        <input 
          placeholder="Nama (misal: Gaji / Nasi Goreng)" 
          className="md:col-span-2 bg-slate-900 text-white px-4 py-3 rounded-xl outline-none border border-white/10 focus:border-blue-500"
          value={form.title} onChange={e => setForm({...form, title: e.target.value})}
        />
        <input 
          type="number" placeholder="Rp Amount" 
          className="bg-slate-900 text-white px-4 py-3 rounded-xl outline-none border border-white/10 focus:border-blue-500"
          value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
        />
        <div className="flex gap-2">
           <select 
             className="bg-slate-900 text-white px-4 py-3 rounded-xl outline-none border border-white/10"
             value={form.type} onChange={e => setForm({...form, type: e.target.value})}
           >
             <option value="expense">Pengeluaran 🔴</option>
             <option value="income">Pemasukan 🟢</option>
           </select>
           <button onClick={addTransaction} className="bg-blue-600 hover:bg-blue-500 p-3 rounded-xl flex-1 flex items-center justify-center text-white transition">
             <Plus />
           </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-slate-800/30 rounded-2xl border border-white/5 overflow-hidden shadow-xl">
        {loading ? (
            <div className="p-20 flex flex-col items-center gap-2 text-slate-400">
                <Loader2 className="animate-spin" size={32}/>
                <p>Memuat data...</p>
            </div>
        ) : (
            <>
                {transactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${t.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {t.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                      </div>
                      <div>
                        <p className="font-medium text-white">{t.title}</p>
                        <p className="text-xs text-slate-500">{new Date(t.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className={`font-bold font-mono ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {t.type === 'income' ? '+' : '-'} Rp {Number(t.amount).toLocaleString('id-ID')}
                      </span>
                      <button onClick={() => deleteTrans(t.id)} className="text-slate-600 hover:text-red-400 p-2 transition">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <div className="p-20 text-center text-slate-500 italic">
                    Belum ada transaksi yang dicatat.
                  </div>
                )}
            </>
        )}
      </div>
    </div>
  )
}