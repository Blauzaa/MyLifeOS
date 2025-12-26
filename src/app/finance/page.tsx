'use client'
import { useState, useMemo } from 'react'
import { Trash2, TrendingUp, TrendingDown, Plus, DollarSign, Wallet } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TransactionItem } from '../../types' // Pastikan path import benar
import { useModal } from '../../context/ModalContext'

interface Props {
  transactions: TransactionItem[]
  onAdd: (data: { title: string; amount: number; type: 'income' | 'expense' }) => void
  onDelete: (id: string) => void
}

export default function FinanceWidget({ transactions, onAdd, onDelete }: Props) {
  const { showModal } = useModal()
  const [newTrans, setNewTrans] = useState<{ title: string; amount: string; type: 'income' | 'expense' }>({
    title: '',
    amount: '',
    type: 'expense' // Default expense
  })

  // --- Helpers ---
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num)
  }

  // --- Derived State (Hitung Saldo Real-time) ---
  const stats = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, curr) => acc + Number(curr.amount), 0)
    
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => acc + Number(curr.amount), 0)

    return {
      income,
      expense,
      balance: income - expense
    }
  }, [transactions])

  // --- Handlers ---
  const handleAdd = () => {
    if (!newTrans.title || !newTrans.amount) return
    
    onAdd({
      title: newTrans.title,
      amount: parseFloat(newTrans.amount),
      type: newTrans.type
    })
    
    setNewTrans({ title: '', amount: '', type: 'expense' })
  }

  const handleDeleteClick = (id: string) => {
    showModal({
      title: 'Hapus Transaksi?',
      message: 'Saldo Anda akan dikalkulasi ulang.',
      type: 'danger',
      onConfirm: () => onDelete(id)
    })
  }

  return (
    <div className="h-full flex flex-col gap-6">
      
      {/* --- SUMMARY CARDS --- */}
      <div className="grid grid-cols-3 gap-3">
        {/* Balance Card */}
        <div className="col-span-3 bg-gradient-to-br from-blue-600 to-blue-800 p-5 rounded-2xl shadow-lg shadow-blue-900/20 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={64}/></div>
           <p className="text-blue-200 text-xs font-medium mb-1">Total Balance</p>
           <h3 className="text-2xl font-bold tracking-tight">{formatRupiah(stats.balance)}</h3>
        </div>

        {/* Income Stat */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex flex-col justify-center">
           <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
              <TrendingUp size={14} /> <span className="text-[10px] font-bold uppercase">Income</span>
           </div>
           <p className="text-sm font-bold text-emerald-300 truncate">{formatRupiah(stats.income)}</p>
        </div>

        {/* Expense Stat */}
        <div className="col-span-2 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex flex-col justify-center">
           <div className="flex items-center gap-1.5 text-rose-400 mb-1">
              <TrendingDown size={14} /> <span className="text-[10px] font-bold uppercase">Expenses</span>
           </div>
           <p className="text-sm font-bold text-rose-300 truncate">{formatRupiah(stats.expense)}</p>
        </div>
      </div>

      {/* --- TRANSACTION LIST (Scrollable) --- */}
      <div className="flex-1 bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 overflow-hidden flex flex-col">
        <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider sticky top-0">Recent Activity</h4>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
          {transactions.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-60">
                <DollarSign size={32} className="mb-2"/>
                <p className="text-xs">No transactions yet.</p>
             </div>
          ) : (
            <AnimatePresence mode='popLayout'>
              {transactions.slice().reverse().map((t) => ( // Show newest first
                <motion.div 
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  key={t.id} 
                  className="group flex justify-between items-center p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-transparent hover:border-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                       {t.type === 'income' ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                    </div>
                    <div>
                       <p className="text-sm font-medium text-slate-200">{t.title}</p>
                       <p className="text-[10px] text-slate-500 capitalize">{t.category || t.type}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                     <span className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.type === 'income' ? '+' : '-'} {formatRupiah(t.amount)}
                     </span>
                     <button 
                        onClick={() => handleDeleteClick(t.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 transition"
                     >
                        <Trash2 size={14} />
                     </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* --- ADD NEW FORM --- */}
      <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
         <div className="flex gap-2 mb-2">
            <button 
              onClick={() => setNewTrans({...newTrans, type: 'expense'})}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${newTrans.type === 'expense' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              Expense
            </button>
            <button 
              onClick={() => setNewTrans({...newTrans, type: 'income'})}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${newTrans.type === 'income' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              Income
            </button>
         </div>
         
         <div className="flex gap-2">
            <input
              placeholder="Title (e.g. Coffee)"
              className="flex-[2] bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500/50 transition"
              value={newTrans.title}
              onChange={(e) => setNewTrans({ ...newTrans, title: e.target.value })}
            />
            <input
              type="number"
              placeholder="Amount"
              className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500/50 transition"
              value={newTrans.amount}
              onChange={(e) => setNewTrans({ ...newTrans, amount: e.target.value })}
            />
            <button 
               onClick={handleAdd}
               disabled={!newTrans.title || !newTrans.amount}
               className={`w-10 rounded-xl flex items-center justify-center text-white shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${newTrans.type === 'income' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'}`}
            >
               <Plus size={18} strokeWidth={3}/>
            </button>
         </div>
      </div>

    </div>
  )
}