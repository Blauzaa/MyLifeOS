'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '../utils/supabase/supabaseClient'
import { Briefcase, Coffee, Loader2 } from 'lucide-react'

// Import Components & Types
import { LinkItem, TaskItem, EventItem, SnippetItem } from '../types'
import AgendaWidget from '../components/AgendaWidget'
import LinksWidget from '../components/LinksWidget'
import KanbanBoard from '../components/KanbanBoard'
import SnippetVault from '../components/SnippetVault'

export default function Home() {
  const supabase = createClient()

  // STATE
  const [mode, setMode] = useState<'work' | 'life'>('work')
  const [activeTab, setActiveTab] = useState<'dashboard' | 'snippets'>('dashboard')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // DATA
  const [links, setLinks] = useState<LinkItem[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [events, setEvents] = useState<EventItem[]>([])
  const [snippets, setSnippets] = useState<SnippetItem[]>([])

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const [l, t, e, s] = await Promise.all([
          supabase.from('dynamic_items').select('*').order('created_at', { ascending: true }),
          supabase.from('tasks').select('*').order('created_at', { ascending: false }),
          supabase.from('events').select('*').order('time', { ascending: true }),
          supabase.from('snippets').select('*').order('created_at', { ascending: false }),
        ])
        if (l.data) setLinks(l.data as LinkItem[])
        if (t.data) setTasks(t.data as TaskItem[])
        if (e.data) setEvents(e.data as EventItem[])
        if (s.data) setSnippets(s.data as SnippetItem[])
      }
      setLoading(false)
    }
    initData()
  }, [supabase])

  // --- HANDLERS (LOGIC) ---
  const checkLogin = () => {
    if (!user) {
      alert('Login dulu!')
      return false
    }
    return true
  }

  // 1. Agenda Handlers
  const addEvent = async (event: Omit<EventItem, 'id'>) => {
    if (!checkLogin()) return
    const { data } = await supabase.from('events').insert({ ...event, user_id: user!.id }).select().single()
    if (data) setEvents([...events, data])
  }
  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (!error) setEvents(events.filter((i) => i.id !== id))
  }

  // 2. Link Handlers
  const addLink = async (link: { title: string; url: string }) => {
    if (!checkLogin()) return
    const { data } = await supabase.from('dynamic_items').insert({ ...link, type: mode, user_id: user!.id }).select().single()
    if (data) setLinks([...links, data])
  }
  const deleteLink = async (id: string) => {
    const { error } = await supabase.from('dynamic_items').delete().eq('id', id)
    if (!error) setLinks(links.filter((i) => i.id !== id))
  }

  // 3. Task Handlers
  const addTask = async (title: string) => {
    if (!checkLogin()) return
    const { data } = await supabase.from('tasks').insert({ title, status: 'todo', category: mode, user_id: user!.id }).select().single()
    if (data) setTasks([data, ...tasks])
  }
  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (!error) setTasks(tasks.filter((i) => i.id !== id))
  }
  const moveTask = async (id: string, currentStatus: string) => {
    const next = currentStatus === 'doing' ? 'done' : 'doing'
    setTasks(tasks.map((t) => (t.id === id ? { ...t, status: next } : t)))
    await supabase.from('tasks').update({ status: next }).eq('id', id)
  }

  // 4. Snippet Handlers
  const addSnippet = async (snippet: { title: string; code: string }) => {
    if (!checkLogin()) return
    const { data } = await supabase.from('snippets').insert({ ...snippet, user_id: user!.id }).select().single()
    if (data) setSnippets([data, ...snippets])
  }
  const deleteSnippet = async (id: string) => {
    const { error } = await supabase.from('snippets').delete().eq('id', id)
    if (!error) setSnippets(snippets.filter((i) => i.id !== id))
  }

  // --- RENDER ---
  return (
    <main className={`min-h-screen transition-colors duration-500 ${mode === 'work' ? 'bg-slate-950 text-slate-100' : 'bg-stone-900 text-stone-100'} p-4 md:p-8 font-sans`}>
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight">LifeOS v3.1</h1>
            <div className="flex bg-white/5 rounded-lg p-1">
              <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-1 text-xs rounded ${activeTab === 'dashboard' ? 'bg-white/20' : 'opacity-50'}`}>Dashboard</button>
              <button onClick={() => setActiveTab('snippets')} className={`px-3 py-1 text-xs rounded ${activeTab === 'snippets' ? 'bg-white/20' : 'opacity-50'}`}>Snippets</button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-1 rounded-lg flex">
              <button onClick={() => setMode('work')} className={`px-3 py-1.5 rounded text-xs flex items-center gap-2 ${mode === 'work' ? 'bg-blue-600' : 'opacity-50'}`}><Briefcase size={14}/> Work</button>
              <button onClick={() => setMode('life')} className={`px-3 py-1.5 rounded text-xs flex items-center gap-2 ${mode === 'life' ? 'bg-emerald-600' : 'opacity-50'}`}><Coffee size={14}/> Life</button>
            </div>
            {!user && <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'github' })} className="bg-gray-800 px-3 py-1.5 rounded text-xs border border-gray-700">Login</button>}
          </div>
        </div>

        {loading ? <div className="flex justify-center"><Loader2 className="animate-spin" /></div> : (
          <>
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="space-y-6">
                  {/* COMPONENT: AGENDA */}
                  <AgendaWidget events={events} onAdd={addEvent} onDelete={deleteEvent} />
                  {/* COMPONENT: LINKS */}
                  <LinksWidget links={links} mode={mode} onAdd={addLink} onDelete={deleteLink} />
                </div>

                <div className="lg:col-span-3">
                   {/* COMPONENT: KANBAN */}
                   <KanbanBoard tasks={tasks} mode={mode} onAdd={addTask} onDelete={deleteTask} onMove={moveTask} />
                </div>
              </div>
            )}

            {activeTab === 'snippets' && (
               /* COMPONENT: SNIPPETS */
               <SnippetVault snippets={snippets} onAdd={addSnippet} onDelete={deleteSnippet} />
            )}
          </>
        )}
      </div>
    </main>
  )
}