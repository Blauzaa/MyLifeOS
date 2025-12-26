/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../utils/supabase/client'
import {
    Wallet, Link as LinkIcon,
    Calendar, Clock, Zap, Plus, ArrowRight,
    Sun, Moon, CloudSun, CheckCircle2, Loader2, X
} from 'lucide-react'
import { User } from '@supabase/supabase-js'

// --- INTERFACES ---
interface TodayEvent {
    id: string
    title: string
    start_time: string
    end_time: string
}

interface Stats {
    tasks: number
    links: number
    balance: number
}

// --- COMPONENTS: CUSTOM MODAL & TOAST ---
const QuickModal = ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl transform transition-all scale-100 animate-in zoom-in-95 duration-200 overflow-hidden">
                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
                    <h3 className="font-bold text-lg text-white">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X size={18} /></button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    )
}

const Toast = ({ message, show }: { message: string, show: boolean }) => {
    if (!show) return null
    return (
        <div className="fixed top-6 right-6 z-[70] animate-in slide-in-from-right-10 fade-in duration-300">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl bg-emerald-950/90 border border-emerald-500/30 text-emerald-400 backdrop-blur-md">
                <CheckCircle2 size={18} />
                <span className="text-sm font-semibold">{message}</span>
            </div>
        </div>
    )
}

// --- SKELETON LOADER COMPONENT ---
const DashboardSkeleton = () => (
    <div className="space-y-8 animate-pulse">
        <div className="h-48 bg-slate-800/50 rounded-[2.5rem]"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-800/50 rounded-2xl"></div>)}
                </div>
                <div className="h-32 bg-slate-800/50 rounded-3xl"></div>
            </div>
            <div className="h-64 bg-slate-800/50 rounded-3xl"></div>
        </div>
    </div>
)

const QUOTES = [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Productivity is being able to do things that you were never able to do before.", author: "Franz Kafka" },
    { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" }
]

export default function DashboardOverview() {
    const supabase = createClient()
    const router = useRouter()

    // State Data
    const [stats, setStats] = useState<Stats>({ tasks: 0, links: 0, balance: 0 })
    const [todayEvents, setTodayEvents] = useState<TodayEvent[]>([])
    const [user, setUser] = useState<User | null>(null)
    const [quote, setQuote] = useState(QUOTES[0])
    const [greeting, setGreeting] = useState({ text: 'Good Morning', icon: Sun })

    // UI State
    const [loading, setLoading] = useState(true)
    const [modalType, setModalType] = useState<'task' | 'link' | null>(null)
    const [modalInput, setModalInput] = useState({ title: '', value: '' })
    const [toast, setToast] = useState({ show: false, message: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Helper Format Tanggal
    const todayDate = new Date()
    const todayISODate = todayDate.toISOString().split('T')[0]

    // --- LOGIC ---
    const determineGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) setGreeting({ text: 'Good Morning', icon: Sun })
        else if (hour < 18) setGreeting({ text: 'Good Afternoon', icon: CloudSun })
        else setGreeting({ text: 'Good Evening', icon: Moon })
    }

    const showToast = (msg: string) => {
        setToast({ show: true, message: msg })
        setTimeout(() => setToast({ show: false, message: '' }), 3000)
    }

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            if (user) {
                // Parallel Fetching
                const [tasks, links, financeData, events] = await Promise.all([
                    // Hitung Task
                    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'todo'),

                    // Hitung Links
                    supabase.from('dynamic_items').select('*', { count: 'exact', head: true }).eq('type', 'link'),

                    // PERBAIKAN DI SINI: Menggunakan tabel 'finances', bukan 'transactions'
                    supabase.from('finances').select('amount, type'),

                    // Ambil Event Hari Ini
                    supabase.from('events').select('id, title, start_time, end_time')
                        .eq('user_id', user.id).eq('event_date', todayISODate)
                        .order('start_time', { ascending: true }).limit(4)
                ])

                // Kalkulasi Saldo (Income - Expense)
                let bal = 0;
                if (financeData.data) {
                    financeData.data.forEach((t: { amount: number, type: string }) => {
                        // Pastikan tipe data number agar kalkulasi benar
                        const amount = Number(t.amount)
                        if (t.type === 'income') {
                            bal += amount
                        } else {
                            bal -= amount
                        }
                    })
                }

                setStats({
                    tasks: tasks.count || 0,
                    links: links.count || 0,
                    balance: bal
                })

                if (events.data) setTodayEvents(events.data as TodayEvent[])
            }
        } catch (error) {
            console.error("Dashboard Fetch Error:", error)
            // Optional: showToast('Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)])
        determineGreeting()
        fetchData()
    }, [])

    // --- HANDLERS FOR QUICK ACTIONS ---
    const handleQuickAdd = async () => {
        if (!modalInput.title) return
        setIsSubmitting(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            if (modalType === 'task') {
                await supabase.from('tasks').insert({
                    title: modalInput.title,
                    status: 'todo',
                    priority: 'medium',
                    user_id: user.id
                })
                showToast('Task added successfully!')
                setStats(prev => ({ ...prev, tasks: prev.tasks + 1 }))

            } else if (modalType === 'link') {
                await supabase.from('dynamic_items').insert({
                    title: modalInput.title,
                    content: modalInput.value,
                    type: 'link',
                    user_id: user.id
                })
                showToast('Link saved successfully!')
                setStats(prev => ({ ...prev, links: prev.links + 1 }))
            }
        }
        setIsSubmitting(false)
        setModalType(null)
        setModalInput({ title: '', value: '' })
    }

    if (loading) return <DashboardSkeleton />

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-24">
            <Toast show={toast.show} message={toast.message} />

            {/* QUICK ADD MODAL */}
            <QuickModal
                isOpen={!!modalType}
                onClose={() => setModalType(null)}
                title={modalType === 'task' ? 'Quick Add Task' : 'Save New Resource'}
            >
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-1">Title</label>
                        <input
                            autoFocus
                            placeholder={modalType === 'task' ? "What needs to be done?" : "Resource Title"}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition text-white"
                            value={modalInput.title}
                            onChange={e => setModalInput({ ...modalInput, title: e.target.value })}
                        />
                    </div>
                    {modalType === 'link' && (
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-1">URL / Link</label>
                            <input
                                placeholder="https://..."
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition text-white"
                                value={modalInput.value}
                                onChange={e => setModalInput({ ...modalInput, value: e.target.value })}
                            />
                        </div>
                    )}
                    <button
                        onClick={handleQuickAdd}
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                        {modalType === 'task' ? 'Add Task' : 'Save Link'}
                    </button>
                </div>
            </QuickModal>

            {/* --- HERO SECTION --- */}
            <div className="bg-gradient-to-br from-blue-700 via-indigo-800 to-purple-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/15 transition-all duration-1000"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 overflow-hidden shadow-inner flex items-center justify-center">
                            {user?.user_metadata?.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl font-bold">{user?.email?.[0].toUpperCase()}</span>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 text-blue-200 mb-1">
                                <greeting.icon size={16} />
                                <span className="text-xs font-bold tracking-widest uppercase opacity-80">{greeting.text}</span>
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                Hi, {user?.email?.split('@')[0]}
                            </h1>
                            <p className="text-blue-100/70 text-sm mt-1 max-w-md italic">"{quote.text}"</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => router.push('/calendar')} className="bg-white/10 hover:bg-white/20 border border-white/10 px-5 py-3 rounded-2xl text-sm font-bold transition flex items-center gap-2 backdrop-blur-md">
                            <Calendar size={18} /> Calendar
                        </button>
                        <button onClick={() => router.push('/focus')} className="bg-white text-indigo-900 px-5 py-3 rounded-2xl text-sm font-bold shadow-xl shadow-indigo-900/20 hover:scale-105 transition flex items-center gap-2">
                            <Zap size={18} fill="currentColor" /> Focus Mode
                        </button>
                    </div>
                </div>
            </div>

            {/* --- GRID LAYOUT --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT COLUMN */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Pending Tasks', val: stats.tasks, icon: CheckCircle2, path: '/tasks', color: 'text-blue-400' },
                            {
                                label: 'Total Balance',
                                // Format ke IDR Rupiah
                                val: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(stats.balance),
                                icon: Wallet,
                                path: '/finance',
                                color: stats.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            },
                            { label: 'Saved Links', val: stats.links, icon: LinkIcon, path: '/resources', color: 'text-purple-400' }
                        ].map((item, idx) => (
                            <div
                                key={idx}
                                onClick={() => router.push(item.path)}
                                className="bg-slate-900/50 backdrop-blur-sm p-5 rounded-[1.5rem] border border-white/5 hover:bg-slate-800 hover:border-white/10 transition cursor-pointer group relative overflow-hidden"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className={`absolute top-4 right-4 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 ${item.color}`}>
                                    <item.icon size={24} />
                                </div>
                                <div className="mt-8">
                                    <h3 className={`text-xl lg:text-2xl font-bold text-white group-hover:translate-x-1 transition-transform truncate ${item.color === 'text-rose-400' || item.color === 'text-emerald-400' ? item.color : ''}`}>
                                        {item.val}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">{item.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Shortcuts */}
                    <div className="bg-gradient-to-r from-slate-900 to-slate-900/50 border border-white/5 p-6 rounded-[2rem] animate-in slide-in-from-bottom-5 duration-700 delay-300">
                        <h3 className="text-slate-400 font-bold text-xs mb-4 uppercase tracking-widest flex items-center gap-2">
                            <Zap size={14} className="text-yellow-500" /> Quick Actions
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            <button onClick={() => setModalType('task')} className="flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-5 py-3 rounded-xl border border-blue-500/20 transition text-sm font-bold hover:scale-105 active:scale-95">
                                <Plus size={16} /> New Task
                            </button>
                            <button onClick={() => setModalType('link')} className="flex items-center gap-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 px-5 py-3 rounded-xl border border-purple-500/20 transition text-sm font-bold hover:scale-105 active:scale-95">
                                <LinkIcon size={16} /> Save Link
                            </button>
                            <button onClick={() => router.push('/calendar')} className="flex items-center gap-2 bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 px-5 py-3 rounded-xl border border-orange-500/20 transition text-sm font-bold hover:scale-105 active:scale-95">
                                <Calendar size={16} /> Add Event
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Today's Agenda Widget */}
                <div className="bg-slate-900 border border-white/10 rounded-[2rem] p-6 h-full min-h-[300px] flex flex-col animate-in slide-in-from-right-5 duration-700 delay-500">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold flex items-center gap-2 text-white"><Clock size={18} className="text-orange-400" /> Today's Agenda</h3>
                        <button onClick={() => router.push('/calendar')} className="text-xs text-slate-500 hover:text-white transition flex items-center gap-1 group">
                            View all <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                        {todayEvents.length > 0 ? (
                            todayEvents.map((ev, i) => (
                                <div
                                    key={ev.id}
                                    onClick={() => router.push('/calendar')}
                                    className="flex gap-3 relative pl-4 border-l-2 border-slate-800 hover:border-orange-500 transition-all pb-4 last:pb-0 group cursor-pointer hover:bg-white/[0.02] rounded-r-xl p-2"
                                    style={{ animationDelay: `${i * 150}ms` }}
                                >
                                    <div className="w-full">
                                        <div className="flex justify-between items-start">
                                            <p className="text-[10px] font-bold font-mono text-orange-400 mb-1 bg-orange-400/10 w-fit px-1.5 py-0.5 rounded">
                                                {ev.start_time.slice(0, 5)} - {ev.end_time.slice(0, 5)}
                                            </p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-300 group-hover:text-white leading-tight transition-colors">{ev.title}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-3 pb-8">
                                <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center border border-white/5">
                                    <Calendar size={28} className="text-slate-500" />
                                </div>
                                <p className="text-xs text-slate-400 font-medium">No events scheduled.</p>
                                <button onClick={() => router.push('/calendar')} className="text-orange-400 text-xs font-bold hover:underline">
                                    Schedule something?
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}