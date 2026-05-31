'use client'
import { useEffect, useState, useCallback } from 'react'
import { collection, query, where, orderBy, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../../utils/firebase/client'
import { onAuthStateChanged, User } from 'firebase/auth'
import FinanceWidget from '../../components/FinanceWidget'
import { TransactionItem } from '../../types'
import { RefreshCw } from 'lucide-react'

export default function FinancePage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTransactions = useCallback(async (userArg?: User) => {
    try {
      const user = userArg || auth.currentUser;
      if (!user) {
        setLoading(false)
        setRefreshing(false)
        return
      }

      const q = query(
        collection(db, 'finances'),
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate ? doc.data().created_at.toDate().toISOString() : new Date().toISOString()
      }));

      setTransactions(data as TransactionItem[])
    } catch (error) {
      console.error('Error fetching finance:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchTransactions(user)
      } else {
        setTransactions([])
        setLoading(false)
      }
    })
    return () => unsubscribe()
  }, [fetchTransactions])

  const handleAdd = async (newItem: { title: string; amount: number; type: 'income' | 'expense' }) => {
    try {
      const user = auth.currentUser
      if (!user) return

      await addDoc(collection(db, 'finances'), {
        title: newItem.title,
        amount: Number(newItem.amount),
        type: newItem.type,
        user_id: user.uid,
        created_at: serverTimestamp()
      })

      fetchTransactions(user)
    } catch (error) {
      alert('Gagal menyimpan.')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'finances', id))
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