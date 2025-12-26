'use client'
import { useState, useMemo } from 'react'
import { 
  Wallet, TrendingUp, TrendingDown, Plus, Trash2, 
  ArrowUpRight, ArrowDownLeft
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
      
      {/* --- SECTION 1: STATS CARDS (Perfectly Symmetrical 3 Columns) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Balance */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden group h-40 flex flex-col justify-between">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Wallet size={100} />
            </div>
            <p className="text-blue-200 font-medium text-sm">Total Balance</p>
            <h2 className="text-3xl font-bold tracking-tight z-10">{formatRupiah(balance)}</h2>
            <div className="flex items-center gap-2 text-xs bg-blue-900/30 w-fit px-2 py-1 rounded-full border border-white/10">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
               <span>Active</span>
            </div>
        </div>

        {/* Income */}
        <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl hover:border-emerald-500/30 transition duration-300 h-40 flex flex-col justify-between group">
            <div className="flex justify-between items-start">
               <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:bg-emerald-500 group-hover:text-emerald-950 transition-colors">
                  <TrendingUp size={20} />
               </div>
               <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">IN</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">{formatRupiah(income)}</h3>
              <p className="text-slate-500 text-xs">Total Earnings</p>
            </div>
        </div>

        {/* Expense */}
        <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl hover:border-rose-500/30 transition duration-300 h-40 flex flex-col justify-between group">
            <div className="flex justify-between items-start">
               <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400 group-hover:bg-rose-500 group-hover:text-rose-950 transition-colors">
                  <TrendingDown size={20} />
               </div>
               <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md">OUT</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">{formatRupiah(expense)}</h3>
              <p className="text-slate-500 text-xs">Total Spending</p>
            </div>
        </div>
      </div>

      {/* --- SECTION 2: MAIN GRID (Balanced Layout) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT: Recent Transactions (Takes 2/3 Width) */}
          <div className="lg:col-span-2 bg-slate-900 border border-white/5 rounded-3xl flex flex-col h-[600px] shadow-sm overflow-hidden">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
                  <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                  <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-white/5">
                    {transactions.length} Transactions
                  </span>
              </div>
              
              <div className="overflow-y-auto flex-1 p-4 space-y-2 custom-scrollbar">
                  {transactions.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                          <Wallet size={40} className="mb-3"/>
                          <p className="text-sm">No transactions found</p>
                      </div>
                  ) : (
                      transactions.map((t) => (
                          <div key={t.id} className="group flex items-center justify-between p-3 rounded-2xl bg-slate-950/40 border border-transparent hover:border-white/5 hover:bg-slate-800/80 transition-all duration-200">
                              <div className="flex items-center gap-4">
                                  <div className={`p-3 rounded-xl flex-shrink-0 ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                      {t.type === 'income' ? <ArrowUpRight size={18}/> : <ArrowDownLeft size={18}/>}
                                  </div>
                                  <div className="min-w-0">
                                      <p className="font-semibold text-white truncate text-sm md:text-base group-hover:text-blue-200 transition">{t.title}</p>
                                      <p className="text-xs text-slate-500">{new Date(t.created_at || '').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                  </div>
                              </div>
                              <div className="text-right flex items-center gap-3 pl-2">
                                  <span className={`font-mono font-bold text-sm md:text-base whitespace-nowrap ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {t.type === 'income' ? '+' : '-'} {formatRupiah(t.amount)}
                                  </span>
                                  <button 
                                      onClick={() => onDelete(t.id)}
                                      className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                                      title="Delete"
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>

          {/* RIGHT: Input Form (Takes 1/3 Width - Sticky) */}
          <div className="lg:col-span-1 sticky top-28">
              <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-white mb-5">Add New</h3>
                  
                  <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Toggle Type */}
                      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-xl border border-white/5">
                          <button
                            type="button"
                            onClick={() => setType('income')}
                            className={`py-2 rounded-lg text-sm font-bold transition-all duration-300 ${type === 'income' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-500 hover:text-white'}`}
                          >
                            Income
                          </button>
                          <button
                            type="button"
                            onClick={() => setType('expense')}
                            className={`py-2 rounded-lg text-sm font-bold transition-all duration-300 ${type === 'expense' ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/20' : 'text-slate-500 hover:text-white'}`}
                          >
                            Expense
                          </button>
                      </div>

                      {/* Inputs */}
                      <div className="space-y-4">
                          <div className="group">
                             <label className="text-xs text-slate-500 ml-1 mb-1 block group-focus-within:text-blue-400 transition-colors">Title</label>
                             <input 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Salary, Coffee, etc."
                                className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition text-sm"
                             />
                          </div>
                          <div className="group">
                             <label className="text-xs text-slate-500 ml-1 mb-1 block group-focus-within:text-blue-400 transition-colors">Amount (IDR)</label>
                             <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-sm">Rp</span>
                                <input 
                                   type="number"
                                   value={amount}
                                   onChange={(e) => setAmount(e.target.value)}
                                   placeholder="0"
                                   className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition font-mono text-sm"
                                />
                             </div>
                          </div>
                      </div>

                      <button 
                        type="submit"
                        className={`w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all hover:translate-y-[-2px] active:scale-95 shadow-lg ${
                            type === 'income' 
                            ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30' 
                            : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/30'
                        }`}
                      >
                          <Plus size={18} />
                          <span>{type === 'income' ? 'Save Income' : 'Save Expense'}</span>
                      </button>
                  </form>
              </div>
          </div>

      </div>
    </div>
  )
}