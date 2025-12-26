/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState, useCallback } from 'react'
import { 
  Plus, 
  Trash2, 
  Loader2, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft,
  Calendar,
  CreditCard,
  AlertCircle,
  X,
  Link as LinkIcon,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react'

// --- MOCK SUPABASE CLIENT (Agar jalan di preview) ---
const supabaseMock = {
  from: () => ({
    select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
    insert: (data: any) => Promise.resolve({ data: data, error: null }),
    delete: () => ({ eq: () => Promise.resolve({ error: null }) })
  }),
  auth: {
    getUser: () => Promise.resolve({ data: { user: { id: 'mock-id' } } })
  }
};
const supabase = (typeof window !== 'undefined' && (window as any).supabaseClient) || supabaseMock;

// --- TYPES ---
interface Transaction {
  id: string
  title: string
  amount: number
  type: 'income' | 'expense'
  category: string
  receipt_url?: string // Field baru untuk menyimpan link gambar
  created_at: string
}

// --- COMPONENTS: CUSTOM MODAL & TOAST ---

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }: any) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl transform transition-all scale-100 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 text-rose-500 mb-4">
          <div className="bg-rose-500/10 p-2 rounded-full"><AlertCircle size={24} /></div>
          <h3 className="font-bold text-lg text-white">{title}</h3>
        </div>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition font-medium text-sm">
            Batal
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/20 transition font-medium text-sm">
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  )
}

const Toast = ({ message, type, isVisible }: any) => {
  if (!isVisible) return null
  return (
    <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right-10 fade-in duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border ${type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-400' : 'bg-rose-950/90 border-rose-500/30 text-rose-400'} backdrop-blur-md`}>
        {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
        <span className="text-sm font-semibold">{message}</span>
      </div>
    </div>
  )
}

// --- MAIN PAGE ---

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  
  // Form State
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense') // Default pengeluaran
  const [receiptUrl, setReceiptUrl] = useState('') // State untuk link gambar

  // UI State
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  // --- ACTIONS ---

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000)
  }

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      if (data) setTransactions(data as Transaction[])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, []) 

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const handleAdd = async () => {
    if (!title || !amount) {
      showToast("Mohon isi judul dan nominal!", "error")
      return
    }
    
    // Simulasi loading UI agar terasa responsif
    const tempId = Math.random().toString()
    const optimisticData: Transaction = {
        id: tempId,
        title,
        amount: parseFloat(amount),
        type,
        category: 'general',
        receipt_url: receiptUrl,
        created_at: new Date().toISOString()
    }

    // Optimistic Update (Langsung tampil di UI sebelum server respond)
    setTransactions(prev => [optimisticData, ...prev])
    setTitle(''); setAmount(''); setReceiptUrl('')

    const { data: { user } } = await supabase.auth.getUser()
    
    // Insert ke Supabase
    const { error } = await supabase.from('transactions').insert({
      ...optimisticData,
      user_id: user?.id || 'mock-id'
    })
    
    if (error) {
      setTransactions(prev => prev.filter(t => t.id !== tempId)) // Revert jika error
      showToast("Gagal menyimpan data", "error")
    } else {
      showToast("Transaksi berhasil disimpan!", "success")
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    
    const { error } = await supabase.from('transactions').delete().eq('id', deleteId)
    
    if (error) {
      showToast("Gagal menghapus", "error")
    } else {
      setTransactions(prev => prev.filter(t => t.id !== deleteId))
      showToast("Data berhasil dihapus", "success")
    }
    setDeleteId(null)
  }

  // --- CALCULATIONS ---
  const totals = transactions.reduce((acc, curr) => {
    const amt = Number(curr.amount)
    if (curr.type === 'income') acc.income += amt
    else acc.expense += amt
    acc.balance = acc.income - acc.expense
    return acc
  }, { income: 0, expense: 0, balance: 0 })

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 selection:bg-blue-500/30">
      
      {/* Toast & Modal */}
      <Toast isVisible={toast.show} message={toast.message} type={toast.type} />
      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={confirmDelete}
        title="Hapus Transaksi?"
        message="Data yang dihapus tidak dapat dikembalikan lagi. Anda yakin?"
      />

      <div className="max-w-3xl mx-auto p-6 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in slide-in-from-top-4 duration-500">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="bg-blue-600/20 p-2 rounded-xl text-blue-500 border border-blue-500/20">
                <Wallet size={24} /> 
              </div>
              Dompet Digital
            </h1>
            <p className="text-slate-500 text-sm mt-1 ml-1">Kelola keuangan Anda dengan bijak</p>
          </div>
          <div className="bg-slate-900 border border-white/10 px-4 py-2 rounded-full flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-500'}`}></div>
            <span className="text-xs font-mono text-slate-400">{loading ? 'Syncing...' : 'Connected'}</span>
          </div>
        </div>

        {/* Balance Card (Glassmorphism) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-[2rem] border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-700">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <p className="text-slate-400 font-medium mb-1">Total Saldo Saat Ini</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-8">
            Rp {totals.balance.toLocaleString('id-ID')}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950/40 backdrop-blur-sm p-4 rounded-2xl border border-white/5 flex items-center gap-3 hover:bg-slate-950/60 transition-colors">
              <div className="bg-emerald-500/20 p-2 rounded-full text-emerald-400"><ArrowDownLeft size={20} /></div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Pemasukan</p>
                <p className="text-lg font-bold text-emerald-400">Rp {totals.income.toLocaleString('id-ID')}</p>
              </div>
            </div>
            <div className="bg-slate-950/40 backdrop-blur-sm p-4 rounded-2xl border border-white/5 flex items-center gap-3 hover:bg-slate-950/60 transition-colors">
              <div className="bg-rose-500/20 p-2 rounded-full text-rose-400"><ArrowUpRight size={20} /></div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Pengeluaran</p>
                <p className="text-lg font-bold text-rose-400">Rp {totals.expense.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Input Form Area */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-3xl border border-white/5 p-1 shadow-lg animate-in slide-in-from-bottom-4 duration-700 delay-100">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950/50 rounded-t-[1.3rem] rounded-b-xl mb-4 mx-1 mt-1">
             <button 
                onClick={() => setType('expense')}
                className={`py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${type === 'expense' ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
             >
                <ArrowUpRight size={16} /> Pengeluaran
             </button>
             <button 
                onClick={() => setType('income')}
                className={`py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${type === 'income' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
             >
                <ArrowDownLeft size={16} /> Pemasukan
             </button>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Judul</label>
                 <input 
                    placeholder="Contoh: Beli Kopi, Gaji Bulanan" 
                    className="w-full bg-slate-950 border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                    value={title} onChange={e => setTitle(e.target.value)}
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Nominal (Rp)</label>
                 <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</span>
                    <input 
                        type="number" placeholder="0" 
                        className="w-full bg-slate-950 border border-white/10 text-white px-4 py-3 pl-10 rounded-xl outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono"
                        value={amount} onChange={e => setAmount(e.target.value)}
                    />
                 </div>
               </div>
            </div>

            {/* Image Link Input (Sesuai request no. 10) */}
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-1 uppercase flex items-center gap-1">
                    <LinkIcon size={12}/> Link Bukti / Resi (Opsional)
                </label>
                <input 
                    placeholder="https://google.drive/..." 
                    className="w-full bg-slate-950 border border-white/10 text-slate-300 px-4 py-3 rounded-xl outline-none focus:border-blue-500/50 text-sm transition-all placeholder:text-slate-700"
                    value={receiptUrl} onChange={e => setReceiptUrl(e.target.value)}
                />
                <p className="text-[10px] text-slate-600 ml-1">*Simpan gambar di Drive/Cloudinary, lalu tempel link di sini.</p>
            </div>

            <button 
              onClick={handleAdd}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${type === 'expense' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'}`}
            >
              <Plus size={20} /> Simpan Transaksi
            </button>
          </div>
        </div>

        {/* Transaction List */}
        <div className="space-y-4">
            <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest pl-2">Riwayat Terkini</h3>
            
            {loading && transactions.length === 0 ? (
                <div className="space-y-3">
                    {[1,2,3].map(i => (
                        <div key={i} className="h-20 bg-slate-900/50 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : transactions.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-3xl opacity-50">
                    <div className="inline-flex bg-slate-800 p-4 rounded-full mb-3 text-slate-500"><CreditCard size={24}/></div>
                    <p className="text-slate-500 font-medium">Belum ada transaksi</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {transactions.map((t, idx) => (
                        <div 
                            key={t.id} 
                            style={{ animationDelay: `${idx * 50}ms` }}
                            className="group bg-slate-900/40 hover:bg-slate-900 border border-white/5 hover:border-white/10 p-4 rounded-2xl flex items-center justify-between transition-all duration-300 hover:scale-[1.01] hover:shadow-lg animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl transition-colors ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-500 group-hover:bg-rose-500/20'}`}>
                                    {t.type === 'income' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-200 group-hover:text-white transition-colors">{t.title}</h4>
                                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                        <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(t.created_at).toLocaleDateString('id-ID')}</span>
                                        {/* Tampilkan icon gambar jika ada link */}
                                        {t.receipt_url && (
                                            <a href={t.receipt_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline z-10">
                                                <ImageIcon size={10} /> Bukti
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 md:gap-6">
                                <span className={`font-mono font-bold text-sm md:text-base ${t.type === 'income' ? 'text-emerald-400' : 'text-slate-300'}`}>
                                    {t.type === 'income' ? '+' : '-'} {Number(t.amount).toLocaleString('id-ID')}
                                </span>
                                <button 
                                    onClick={() => setDeleteId(t.id)}
                                    className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 md:-translate-x-2 md:group-hover:translate-x-0"
                                    title="Hapus"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

      </div>
    </div>
  )
}