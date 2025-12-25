/* eslint-disable react-hooks/set-state-in-effect */
'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '../../utils/supabase/supabaseClient'
import { Plus, Trash2, Copy, Link as LinkIcon, Code, ExternalLink, Loader2 } from 'lucide-react'

const supabase = createClient()

interface LinkItem {
  id: string
  title: string
  url: string
  created_at: string
  type: string
  user_id: string
}

interface SnippetItem {
  id: string
  title: string
  code: string
  created_at: string
  user_id: string
}

export default function ResourcesPage() {
  const [links, setLinks] = useState<LinkItem[]>([])
  const [snippets, setSnippets] = useState<SnippetItem[]>([])
  const [newLink, setNewLink] = useState({ title: '', url: '' })
  const [newSnippet, setNewSnippet] = useState({ title: '', code: '' })
  const [loading, setLoading] = useState(true)

  // Fix: Wrap in useCallback to make it a stable dependency
  const fetchData = useCallback(async () => {
    setLoading(true)
    const [l, s] = await Promise.all([
      supabase.from('dynamic_items').select('*').order('created_at', { ascending: false }),
      supabase.from('snippets').select('*').order('created_at', { ascending: false })
    ])
    if (l.data) setLinks(l.data as LinkItem[])
    if (s.data) setSnippets(s.data as SnippetItem[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const addLink = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !newLink.title) return
    await supabase.from('dynamic_items').insert({ ...newLink, type: 'general', user_id: user.id })
    setNewLink({ title: '', url: '' })
    fetchData()
  }

  const addSnippet = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !newSnippet.title) return
    await supabase.from('snippets').insert({ ...newSnippet, user_id: user.id })
    setNewSnippet({ title: '', code: '' })
    fetchData()
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    alert("Copied to clipboard!")
  }

  const deleteLink = async (id: string) => {
    await supabase.from('dynamic_items').delete().eq('id', id)
    fetchData()
  }

  const deleteSnippet = async (id: string) => {
    await supabase.from('snippets').delete().eq('id', id)
    fetchData()
  }

  return (
    <div className="space-y-10 pb-20">
      <h1 className="text-3xl font-bold flex items-center gap-3">📚 Knowledge Base</h1>

      {loading ? (
        <div className="flex justify-center pt-20">
          <Loader2 className="animate-spin text-blue-500" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* --- SECTION: LINKS --- */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-blue-400"><LinkIcon size={20} /> Saved Links</h2>
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5 space-y-3">
              <div className="flex gap-2">
                <input placeholder="Judul" className="bg-slate-900 px-4 py-2 rounded-xl text-sm flex-1 outline-none border border-white/5 focus:border-blue-500" value={newLink.title} onChange={e => setNewLink({ ...newLink, title: e.target.value })} />
                <input placeholder="https://..." className="bg-slate-900 px-4 py-2 rounded-xl text-sm flex-1 outline-none border border-white/5 focus:border-blue-500" value={newLink.url} onChange={e => setNewLink({ ...newLink, url: e.target.value })} />
                <button onClick={addLink} className="bg-blue-600 p-2 rounded-xl hover:bg-blue-500"><Plus /></button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {links.map(link => (
                <div key={link.id} className="group bg-slate-800/30 p-4 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/5 transition">
                  <div className="flex items-center gap-3 truncate">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><ExternalLink size={16} /></div>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline truncate">{link.title}</a>
                  </div>
                  <button onClick={() => deleteLink(link.id)} className="text-slate-600 hover:text-red-400 p-2 transition"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* --- SECTION: SNIPPETS --- */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-purple-400"><Code size={20} /> Code Snippets</h2>
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5 space-y-3">
              <input placeholder="Judul Snippet (e.g. Docker Compose)" className="bg-slate-900 w-full px-4 py-2 rounded-xl text-sm outline-none border border-white/5 focus:border-purple-500" value={newSnippet.title} onChange={e => setNewSnippet({ ...newSnippet, title: e.target.value })} />
              <textarea placeholder="Paste code here..." className="bg-slate-900 w-full px-4 py-2 rounded-xl text-sm h-32 outline-none border border-white/5 font-mono" value={newSnippet.code} onChange={e => setNewSnippet({ ...newSnippet, code: e.target.value })} />
              <button onClick={addSnippet} className="w-full bg-purple-600 p-2 rounded-xl font-bold hover:bg-purple-500 transition">Save Snippet</button>
            </div>
            <div className="space-y-4">
              {snippets.map(s => (
                <div key={s.id} className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
                  <div className="bg-white/5 px-4 py-3 flex justify-between items-center">
                    <span className="font-bold text-sm text-purple-300">{s.title}</span>
                    <div className="flex gap-2">
                      <button onClick={() => copyCode(s.code)} className="p-2 text-slate-400 hover:text-white"><Copy size={16} /></button>
                      <button onClick={() => deleteSnippet(s.id)} className="p-2 text-slate-400 hover:text-red-400"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <pre className="p-4 text-[12px] font-mono text-slate-400 overflow-x-auto bg-black/20">
                    <code>{s.code}</code>
                  </pre>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}