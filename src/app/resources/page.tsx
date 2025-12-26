/* eslint-disable react-hooks/set-state-in-effect */
'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '../../utils/supabase/client'
import { Plus, Trash2, Copy, Link as LinkIcon, Code, ExternalLink, Loader2, Globe } from 'lucide-react'

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
  
  // State Input
  const [newLink, setNewLink] = useState({ title: '', url: '' })
  const [newSnippet, setNewSnippet] = useState({ title: '', code: '' })
  const [loading, setLoading] = useState(true)

  // Fetch Data
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

  // --- ACTIONS ---
  const addLink = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !newLink.title) return

    // Auto-fix URL jika lupa pakai http
    let finalUrl = newLink.url
    if (!finalUrl.startsWith('http')) {
      finalUrl = `https://${finalUrl}`
    }

    await supabase.from('dynamic_items').insert({ 
      title: newLink.title, 
      url: finalUrl, 
      type: 'general', 
      user_id: user.id 
    })
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
    // Bisa tambah toast notification disini
  }

  const deleteLink = async (id: string) => {
    await supabase.from('dynamic_items').delete().eq('id', id)
    fetchData()
  }

  const deleteSnippet = async (id: string) => {
    await supabase.from('snippets').delete().eq('id', id)
    fetchData()
  }

  // --- HELPER: Get Favicon URL ---
  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch (e) {
      return null; // Return null jika URL tidak valid
    }
  }

  // --- HELPER: Get Clean Domain Name ---
  const getDomainName = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch (e) {
      return url;
    }
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

          {/* --- SECTION: LINKS (CHROME STYLE) --- */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-blue-400">
              <LinkIcon size={20} /> Saved Bookmarks
            </h2>
            
            {/* Input Form */}
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5 space-y-3">
              <div className="flex flex-col gap-2">
                <input 
                  placeholder="Link Title (e.g. Next.js Docs)" 
                  className="bg-slate-900 px-4 py-2.5 rounded-xl text-sm w-full outline-none border border-white/5 focus:border-blue-500 transition" 
                  value={newLink.title} 
                  onChange={e => setNewLink({ ...newLink, title: e.target.value })} 
                />
                <div className="flex gap-2">
                  <input 
                    placeholder="https://example.com" 
                    className="bg-slate-900 px-4 py-2.5 rounded-xl text-sm flex-1 outline-none border border-white/5 focus:border-blue-500 transition" 
                    value={newLink.url} 
                    onChange={e => setNewLink({ ...newLink, url: e.target.value })} 
                  />
                  <button onClick={addLink} className="bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-500 text-white font-bold transition">
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Links List - Chrome Style */}
            <div className="space-y-3">
              {links.map(link => {
                const faviconUrl = getFavicon(link.url);
                return (
                  <div key={link.id} className="group flex items-center gap-3 bg-slate-800/40 p-3 rounded-2xl border border-white/5 hover:bg-slate-700/50 hover:border-white/10 transition-all duration-200">
                    
                    {/* Clickable Area (Icon + Text) */}
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex-1 flex items-center gap-4 min-w-0 cursor-pointer"
                    >
                      {/* Logo / Favicon Container */}
                      <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center border border-white/5 shadow-sm group-hover:scale-105 transition-transform">
                        {faviconUrl ? (
                           /* eslint-disable-next-line @next/next/no-img-element */
                          <img 
                            src={faviconUrl} 
                            alt="icon" 
                            className="w-7 h-7 object-contain"
                            onError={(e) => {
                                // Fallback jika gambar gagal load
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                         {/* Fallback Icon (Hidden by default, shown on error) */}
                         <Globe className={`text-slate-500 w-6 h-6 ${faviconUrl ? 'hidden' : ''}`} />
                      </div>

                      {/* Text Content */}
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-200 truncate group-hover:text-blue-400 transition-colors">
                            {link.title}
                        </h3>
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                            <LinkIcon size={10} />
                            {getDomainName(link.url)}
                        </p>
                      </div>
                    </a>

                    {/* Delete Action (Terpisah supaya tidak trigger klik link) */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // Mencegah link terbuka saat hapus
                        deleteLink(link.id);
                      }} 
                      className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove link"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )
              })}
              
              {links.length === 0 && (
                <div className="text-center py-10 text-slate-600 border-2 border-dashed border-slate-800 rounded-2xl">
                    <LinkIcon className="mx-auto mb-2 opacity-50" size={32}/>
                    <p className="text-sm">No links saved yet</p>
                </div>
              )}
            </div>
          </div>

          {/* --- SECTION: SNIPPETS --- */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-purple-400"><Code size={20} /> Code Snippets</h2>
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5 space-y-3">
              <input placeholder="Snippet Title" className="bg-slate-900 w-full px-4 py-2 rounded-xl text-sm outline-none border border-white/5 focus:border-purple-500 transition" value={newSnippet.title} onChange={e => setNewSnippet({ ...newSnippet, title: e.target.value })} />
              <textarea placeholder="Paste code here..." className="bg-slate-900 w-full px-4 py-2 rounded-xl text-sm h-32 outline-none border border-white/5 font-mono focus:border-purple-500 transition resize-none" value={newSnippet.code} onChange={e => setNewSnippet({ ...newSnippet, code: e.target.value })} />
              <button onClick={addSnippet} className="w-full bg-purple-600/90 p-2 rounded-xl font-bold hover:bg-purple-500 text-white transition shadow-lg shadow-purple-900/20">Save Snippet</button>
            </div>
            
            <div className="space-y-4">
              {snippets.map(s => (
                <div key={s.id} className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden group hover:border-purple-500/30 transition-all">
                  <div className="bg-white/5 px-4 py-3 flex justify-between items-center">
                    <span className="font-bold text-sm text-purple-300 flex items-center gap-2">
                        <Code size={14}/> {s.title}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => copyCode(s.code)} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition" title="Copy"><Copy size={14} /></button>
                      <button onClick={() => deleteSnippet(s.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition" title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <pre className="p-4 text-[11px] font-mono text-slate-300 overflow-x-auto bg-black/20 custom-scrollbar">
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