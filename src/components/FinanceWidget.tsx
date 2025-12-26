'use client'
import { useState, useMemo } from 'react'
import { 
  Wallet, TrendingUp, TrendingDown, Plus, Trash2, 
  ArrowUpRight, ArrowDownLeft, DollarSign
} from 'lucide-react'
import { TransactionItem } from '../types'

interface FinanceWidgetProps {
  transactions: TransactionItem[]
  onAdd: (item: { title: string; amount: number; type: 'income' | 'expense' }) => void
  onDelete: (id: string) => void
}

export default function FinanceWidget({ transactions, onAdd, onDelete }: FinanceWidgetProps) {
  const [amount, setAmount] = useState('')
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')

  // Hitung Total Realtime
  const { balance, income, expense } = useMemo(() => {
    let bal = 0, inc = 0, exp = 0
    transactions.forEach(t => {
        const val = Number(t.amount)
        if (t.type === 'income') {
            bal += val
            inc += val
        } else {
            bal -= val
            exp += val
        }
    })
    return { balance: bal, income: inc, expense: exp }
  }, [transactions])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !amount) return
    onAdd({ title, amount: parseFloat(amount), type })
    setTitle('')
    setAmount('')
  }

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num)
  }

  return (
    <div className="space-y-6 w-full">
      
      {/* --- SECTION 1: TOP CARDS (Responsive Grid) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main Balance Card - Full Width on Mobile, 1 col on Desktop */}
        <div className="md:col-span-3 lg:col-span-1 bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Wallet size={120} />
            </div>
            <div className="relative z-10">
                <p className="text-blue-200 font-medium mb-1">Total Balance</p>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{formatRupiah(balance)}</h2>
                <div className="mt-6 flex items-center gap-2 text-sm bg-blue-900/30 w-fit px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                    <span>Wallet Active</span>
                </div>
            </div>
        </div>

        {/* Income Card */}
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-emerald-500/20 hover:border-emerald-500/40 transition group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 group-hover:bg-emerald-500 group-hover:text-emerald-950 transition-colors">
                    <TrendingUp size={24} />
                </div>
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider bg-emerald-500/10 px-2 py-1 rounded-lg">Income</span>
            </div>
            <h3 className="text-2xl font-bold text-white">{formatRupiah(income)}</h3>
            <p className="text-slate-500 text-sm mt-1">Total earnings</p>
        </div>

        {/* Expense Card */}
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-rose-500/20 hover:border-rose-500/40 transition group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-400 group-hover:bg-rose-500 group-hover:text-rose-950 transition-colors">
                    <TrendingDown size={24} />
                </div>
                <span className="text-xs font-bold text-rose-500 uppercase tracking-wider bg-rose-500/10 px-2 py-1 rounded-lg">Expenses</span>
            </div>
            <h3 className="text-2xl font-bold text-white">{formatRupiah(expense)}</h3>
            <p className="text-slate-500 text-sm mt-1">Total spending</p>
        </div>
      </div>

      {/* --- SECTION 2: CONTENT GRID (Sidebar logic for Input) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: Recent Transactions (Takes 2 Columns on Desktop) */}
          <div className="lg:col-span-2 bg-slate-900/50 border border-white/5 rounded-3xl p-6 flex flex-col h-[500px]">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  Recent Activity <span className="text-xs font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{transactions.length}</span>
              </h3>
              
              <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 space-y-3">
                  {transactions.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                          <Wallet size={48} className="mb-4"/>
                          <p>No transactions yet</p>
                      </div>
                  ) : (
                      transactions.map((t) => (
                          <div key={t.id} className="group flex items-center justify-between p-4 rounded-2xl bg-slate-950/50 border border-white/5 hover:border-white/10 hover:bg-slate-800 transition-all">
                              <div className="flex items-center gap-4">
                                  <div className={`p-3 rounded-xl ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                      {t.type === 'income' ? <ArrowUpRight size={20}/> : <ArrowDownLeft size={20}/>}
                                  </div>
                                  <div>
                                      <p className="font-bold text-white group-hover:text-blue-200 transition">{t.title}</p>
                                      <p className="text-xs text-slate-500">{new Date(t.created_at || '').toLocaleDateString()}</p>
                                  </div>
                              </div>
                              <div className="text-right flex items-center gap-4">
                                  <span className={`font-mono font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {t.type === 'income' ? '+' : '-'} {formatRupiah(t.amount)}
                                  </span>
                                  <button 
                                      onClick={() => onDelete(t.id)}
                                      className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition opacity-0 group-hover:opacity-100"
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>

          {/* RIGHT: Input Form (Sticky on Desktop) */}
          <div className="lg:col-span-1">
              <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sticky top-24">
                  <h3 className="text-lg font-bold text-white mb-6">Add Transaction</h3>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Toggle Type */}
                      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-white/5">
                          <button
                            type="button"
                            onClick={() => setType('income')}
                            className={`py-2.5 rounded-lg text-sm font-bold transition-all ${type === 'income' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-500 hover:text-white'}`}
                          >
                            Income
                          </button>
                          <button
                            type="button"
                            onClick={() => setType('expense')}
                            className={`py-2.5 rounded-lg text-sm font-bold transition-all ${type === 'expense' ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/20' : 'text-slate-500 hover:text-white'}`}
                          >
                            Expense
                          </button>
                      </div>

                      {/* Inputs */}
                      <div className="space-y-3">
                          <div className="relative">
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">T</span>
                             <input 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Title (e.g. Salary, Coffee)"
                                className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-blue-500 transition"
                             />
                          </div>
                          <div className="relative">
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">Rp</span>
                             <input 
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-blue-500 transition"
                             />
                          </div>
                      </div>

                      <button 
                        type="submit"
                        className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-xl ${
                            type === 'income' 
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-900/20' 
                            : 'bg-gradient-to-r from-rose-600 to-pink-600 shadow-rose-900/20'
                        }`}
                      >
                          <Plus size={20} />
                          {type === 'income' ? 'Add Income' : 'Add Expense'}
                      </button>
                  </form>
              </div>
          </div>

      </div>
    </div>
  )
}