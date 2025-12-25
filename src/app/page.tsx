'use client'

import { useEffect, useState } from 'react'
// FIX 1: Import tipe data User dari library Supabase
import { User } from '@supabase/supabase-js'
// FIX 2: Path menggunakan titik dua (..) sesuai struktur folder Anda
import { createClient } from '../utils/supabase/supabaseClient' 
import { Plus, Trash2, ArrowRight, CheckCircle, Briefcase, Coffee, Loader2 } from 'lucide-react'

// --- Tipe Data Custom ---
interface LinkItem {
  id: string
  title: string
  url: string
  type: string // 'work' | 'life'
}

interface TaskItem {
  id: string
  title: string
  status: string // 'todo' | 'doing' | 'done'
  category: string // 'work' | 'life'
}

export default function Home() {
  const supabase = createClient()
  
  // --- STATE ---
  const [mode, setMode] = useState<'work' | 'life'>('work')
  
  // FIX 3: Ganti <any> dengan <User | null>
  const [user, setUser] = useState<User | null>(null)
  
  const [loading, setLoading] = useState(true)

  // Data
  const [links, setLinks] = useState<LinkItem[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])

  // Input Forms
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')

  // --- 1. LOAD DATA ---
  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user) // Sekarang aman karena tipenya sudah cocok

      if (user) {
        // Ambil Links
        const { data: linkData } = await supabase
          .from('dynamic_items')
          .select('*')
          .order('created_at', { ascending: true })
        if (linkData) setLinks(linkData as LinkItem[])

        // Ambil Tasks
        const { data: taskData } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false })
        if (taskData) setTasks(taskData as TaskItem[])
      }
      setLoading(false)
    }
    initData()
  }, [supabase])

  // --- 2. ACTIONS: LINKS ---
  const addLink = async () => {
    if (!newLinkTitle || !newLinkUrl) return
    if (!user) return alert("Login dulu!")

    const { data, error } = await supabase.from('dynamic_items').insert({
      title: newLinkTitle, url: newLinkUrl, type: mode, user_id: user.id
    }).select().single()

    if (data && !error) {
      setLinks([...links, data as LinkItem]) 
      setNewLinkTitle(''); setNewLinkUrl('')
    }
  }

  const deleteLink = async (id: string) => {
    const { error } = await supabase.from('dynamic_items').delete().eq('id', id)
    if (!error) setLinks(links.filter(l => l.id !== id))
  }

  // --- 3. ACTIONS: TASKS ---
  const addTask = async () => {
    if (!newTaskTitle) return
    if (!user) return alert("Login dulu!")

    const { data, error } = await supabase.from('tasks').insert({
      title: newTaskTitle, status: 'todo', category: mode, user_id: user.id
    }).select().single()

    if (data && !error) {
      setTasks([data as TaskItem, ...tasks])
      setNewTaskTitle('')
    }
  }

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (!error) setTasks(tasks.filter(t => t.id !== id))
  }

  const moveTask = async (id: string, currentStatus: string) => {
    let nextStatus = 'doing'
    if (currentStatus === 'doing') nextStatus = 'done'
    
    // Optimistic Update
    setTasks(tasks.map(t => t.id === id ? { ...t, status: nextStatus } : t))

    // Update DB
    await supabase.from('tasks').update({ status: nextStatus }).eq('id', id)
  }

  // --- 4. FILTERING ---
  const activeLinks = links.filter(l => l.type === mode)
  const activeTasks = tasks.filter(t => t.category === mode)

  const todos = activeTasks.filter(t => t.status === 'todo')
  const doings = activeTasks.filter(t => t.status === 'doing')
  const dones = activeTasks.filter(t => t.status === 'done')

  // --- RENDER UI ---
  return (
    <main className={`min-h-screen transition-colors duration-500 ${mode === 'work' ? 'bg-slate-950 text-slate-100' : 'bg-stone-900 text-stone-100'} p-4 md:p-8 font-sans`}>
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER & LOGIN */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              {mode === 'work' ? '🚀 Work OS' : '🏡 Life OS'}
            </h1>
            <p className="text-sm opacity-60">Welcome back, {user?.email || 'Guest'}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Mode Toggle */}
            <div className="bg-white/10 p-1 rounded-lg flex">
              <button 
                onClick={() => setMode('work')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm transition ${mode === 'work' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white/5 opacity-50'}`}
              >
                <Briefcase size={16} /> Work
              </button>
              <button 
                onClick={() => setMode('life')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm transition ${mode === 'life' ? 'bg-emerald-600 text-white shadow-lg' : 'hover:bg-white/5 opacity-50'}`}
              >
                <Coffee size={16} /> Life
              </button>
            </div>
            
            {!user && (
              <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'github' })} className="bg-gray-800 px-4 py-2 rounded text-sm border border-gray-700">
                Login
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center mt-20"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* --- KOLOM KIRI: LINKS --- */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 opacity-80">
                  🔗 Quick Links
                </h2>
                
                <div className="space-y-3">
                  {activeLinks.map(link => (
                    <div key={link.id} className="group flex items-center justify-between bg-black/20 hover:bg-black/40 p-3 rounded-xl border border-white/5 transition">
                      <a href={link.url} target="_blank" className="flex-1 truncate text-sm font-medium text-blue-300 hover:underline">
                        {link.title}
                      </a>
                      <button onClick={() => deleteLink(link.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-500/20 p-2 rounded transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {activeLinks.length === 0 && <p className="text-xs opacity-40 italic">Belum ada link.</p>}
                </div>

                {/* Add Link Form */}
                <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2">
                  <input 
                    value={newLinkTitle} onChange={e => setNewLinkTitle(e.target.value)}
                    placeholder="Nama Link" className="bg-black/30 px-3 py-2 rounded text-sm border border-transparent focus:border-blue-500 outline-none"
                  />
                  <div className="flex gap-2">
                    <input 
                      value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)}
                      placeholder="URL..." className="bg-black/30 px-3 py-2 rounded text-sm flex-1 border border-transparent focus:border-blue-500 outline-none"
                    />
                    <button onClick={addLink} className="bg-blue-600 hover:bg-blue-500 px-3 rounded flex items-center justify-center">
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* --- KOLOM KANAN: TASKS --- */}
            <div className="lg:col-span-8">
              {/* Input Task Baru */}
              <div className="mb-6 flex gap-2">
                <input 
                  value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder={`Apa target ${mode} hari ini?`} 
                  className="bg-white/5 w-full px-4 py-3 rounded-xl border border-white/10 focus:border-blue-500 outline-none text-lg"
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                />
                <button onClick={addTask} className="bg-white/10 hover:bg-white/20 px-6 rounded-xl font-medium transition">
                  Add
                </button>
              </div>

              {/* Kanban Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. TO DO */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider opacity-50 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-500"></span> To Do ({todos.length})
                  </h3>
                  {todos.map(t => (
                    <div key={t.id} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/20 group transition">
                      <p className="mb-3 font-medium">{t.title}</p>
                      <div className="flex justify-between items-center">
                        <button onClick={() => deleteTask(t.id)} className="text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-900/30 p-1.5 rounded transition"><Trash2 size={14} /></button>
                        <button onClick={() => moveTask(t.id, 'todo')} className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded hover:bg-blue-500/40 flex items-center gap-1">
                          Start <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 2. DOING */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider opacity-50 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Doing ({doings.length})
                  </h3>
                  {doings.map(t => (
                    <div key={t.id} className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/30 relative">
                      <div className="absolute -left-1 top-4 w-1 h-8 bg-blue-500 rounded-r"></div>
                      <p className="mb-3 font-medium text-blue-100">{t.title}</p>
                      <div className="flex justify-end items-center">
                        <button onClick={() => moveTask(t.id, 'doing')} className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded hover:bg-emerald-500/40 flex items-center gap-1">
                          Done <CheckCircle size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 3. DONE */}
                <div className="space-y-3 opacity-60 hover:opacity-100 transition">
                  <h3 className="text-xs font-bold uppercase tracking-wider opacity-50 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Done ({dones.length})
                  </h3>
                  {dones.map(t => (
                    <div key={t.id} className="bg-white/5 p-3 rounded-lg border border-white/5 flex justify-between items-center group">
                      <p className="text-sm line-through decoration-white/30">{t.title}</p>
                      <button onClick={() => deleteTask(t.id)} className="text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>

              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  )
}