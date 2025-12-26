/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */
'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '../../utils/supabase/client'
import {
    Plus, Trash2, Copy, Link as LinkIcon, Code,
    ExternalLink, Loader2, Globe, Check, Save
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useModal } from '../../context/ModalContext'

const supabase = createClient()

// --- TYPES ---
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

    // UI States
    const [loading, setLoading] = useState(true)
    const [submittingLink, setSubmittingLink] = useState(false)
    const [submittingSnippet, setSubmittingSnippet] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const { showModal } = useModal()

    // --- FETCH DATA ---
    const fetchData = useCallback(async () => {
        // setLoading(true) // Optional: Jangan set loading full screen kalau cuma refresh data
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

    // --- ACTIONS: LINKS ---
    const addLink = async () => {
        if (!newLink.title || !newLink.url) return
        setSubmittingLink(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        let finalUrl = newLink.url
        if (!finalUrl.startsWith('http')) finalUrl = `https://${finalUrl}`

        await supabase.from('dynamic_items').insert({
            title: newLink.title,
            url: finalUrl,
            type: 'link',
            user_id: user.id
        })

        setNewLink({ title: '', url: '' })
        await fetchData()
        setSubmittingLink(false)
    }

    const handleDeleteLink = (id: string) => {
        showModal({
            title: 'Delete Bookmark?',
            message: 'Are you sure you want to remove this link?',
            type: 'danger',
            onConfirm: async () => {
                await supabase.from('dynamic_items').delete().eq('id', id)
                setLinks(prev => prev.filter(item => item.id !== id))
            }
        })
    }

    // --- ACTIONS: SNIPPETS ---
    const addSnippet = async () => {
        if (!newSnippet.title || !newSnippet.code) return
        setSubmittingSnippet(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase.from('snippets').insert({ ...newSnippet, user_id: user.id })
        setNewSnippet({ title: '', code: '' })
        await fetchData()
        setSubmittingSnippet(false)
    }

    const handleDeleteSnippet = (id: string) => {
        showModal({
            title: 'Delete Snippet?',
            message: 'This code snippet will be lost forever.',
            type: 'danger',
            onConfirm: async () => {
                await supabase.from('snippets').delete().eq('id', id)
                setSnippets(prev => prev.filter(item => item.id !== id))
            }
        })
    }

    const copyCode = (id: string, code: string) => {
        navigator.clipboard.writeText(code)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    // --- HELPERS ---
    const getFavicon = (url: string) => {
        try {
            const domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        } catch { return null; }
    }

    const getDomainName = (url: string) => {
        try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-200 pb-40 animate-in fade-in duration-700">
            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-10">

                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Knowledge Base</h1>
                    <p className="text-slate-500">Kumpulan link penting dan code snippets.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

                        {/* --- LEFT COLUMN: BOOKMARKS --- */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-blue-400 border-b border-white/5 pb-4">
                                <div className="p-2 bg-blue-500/10 rounded-lg"><LinkIcon size={20} /></div>
                                <h2 className="text-xl font-bold text-white">Bookmarks</h2>
                            </div>

                            {/* Input Link */}
                            <div className="bg-slate-900/50 p-5 rounded-3xl border border-white/10 shadow-xl space-y-4 backdrop-blur-sm">
                                <div className="space-y-3">
                                    <input
                                        placeholder="Judul Website..."
                                        className="bg-slate-950 w-full px-4 py-3 rounded-xl text-sm outline-none border border-white/5 focus:border-blue-500/50 transition"
                                        value={newLink.title} onChange={e => setNewLink({ ...newLink, title: e.target.value })}
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            placeholder="https://..."
                                            className="bg-slate-950 flex-1 px-4 py-3 rounded-xl text-sm outline-none border border-white/5 focus:border-blue-500/50 transition font-mono text-slate-400"
                                            value={newLink.url} onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                                        />
                                        <button
                                            onClick={addLink} disabled={submittingLink || !newLink.title}
                                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl transition shadow-lg shadow-blue-900/20"
                                        >
                                            {submittingLink ? <Loader2 className="animate-spin" /> : <Plus size={24} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* List Links */}
                            <motion.div layout className="space-y-3">
                                <AnimatePresence mode='popLayout'>
                                    {links.map((link) => (
                                        <motion.div
                                            layout
                                            key={link.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="group relative"
                                        >
                                            <a
                                                href={link.url} target="_blank" rel="noopener noreferrer"
                                                className="block bg-slate-800/40 hover:bg-slate-800 border border-white/5 hover:border-blue-500/30 rounded-2xl p-3 transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-slate-950 rounded-xl flex items-center justify-center border border-white/5 shrink-0">
                                                        <img
                                                            src={getFavicon(link.url) || ''}
                                                            alt="icon" className="w-6 h-6 object-contain"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                            }}
                                                        />
                                                        <Globe className="text-slate-600 w-5 h-5 hidden" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="font-bold text-slate-200 truncate pr-8 group-hover:text-blue-400 transition-colors">{link.title}</h3>
                                                        <p className="text-xs text-slate-500 truncate flex items-center gap-1 font-mono">
                                                            <ExternalLink size={10} /> {getDomainName(link.url)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </a>
                                            <button
                                                onClick={() => handleDeleteLink(link.id)}
                                                className="absolute top-1/2 -translate-y-1/2 right-3 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {links.length === 0 && (
                                    <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl bg-slate-900/20">
                                        <p className="text-slate-500 text-sm">Belum ada link tersimpan.</p>
                                    </div>
                                )}
                            </motion.div>
                        </div>

                        {/* --- RIGHT COLUMN: SNIPPETS --- */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-purple-400 border-b border-white/5 pb-4">
                                <div className="p-2 bg-purple-500/10 rounded-lg"><Code size={20} /></div>
                                <h2 className="text-xl font-bold text-white">Snippets</h2>
                            </div>

                            {/* Input Snippet */}
                            <div className="bg-slate-900/50 p-5 rounded-3xl border border-white/10 shadow-xl space-y-4 backdrop-blur-sm">
                                <input
                                    placeholder="Snippet Title (e.g. React UseEffect)"
                                    className="bg-slate-950 w-full px-4 py-3 rounded-xl text-sm outline-none border border-white/5 focus:border-purple-500/50 transition"
                                    value={newSnippet.title} onChange={e => setNewSnippet({ ...newSnippet, title: e.target.value })}
                                />
                                <textarea
                                    placeholder="// Paste your code here..."
                                    className="bg-slate-950 w-full px-4 py-3 rounded-xl text-xs font-mono h-32 outline-none border border-white/5 focus:border-purple-500/50 transition resize-none custom-scrollbar"
                                    value={newSnippet.code} onChange={e => setNewSnippet({ ...newSnippet, code: e.target.value })}
                                />
                                <button
                                    onClick={addSnippet} disabled={submittingSnippet || !newSnippet.title}
                                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20"
                                >
                                    {submittingSnippet ? <Loader2 className="animate-spin" /> : <Save size={18} />} Save Snippet
                                </button>
                            </div>

                            {/* List Snippets */}
                            <motion.div layout className="space-y-4">
                                <AnimatePresence mode='popLayout'>
                                    {snippets.map((s) => (
                                        <motion.div
                                            layout
                                            key={s.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="bg-slate-900/80 rounded-2xl border border-white/5 overflow-hidden group hover:border-purple-500/30 transition-all shadow-lg"
                                        >
                                            <div className="bg-white/5 px-4 py-3 flex justify-between items-center border-b border-white/5">
                                                <span className="font-bold text-sm text-purple-300 flex items-center gap-2 font-mono">
                                                    <Code size={14} className="text-purple-500" /> {s.title}
                                                </span>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => copyCode(s.id, s.code)}
                                                        className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition relative"
                                                        title="Copy"
                                                    >
                                                        {copiedId === s.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSnippet(s.id)}
                                                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="relative group/code">
                                                <pre className="p-4 text-[11px] font-mono text-slate-300 overflow-x-auto bg-black/40 custom-scrollbar max-h-60">
                                                    <code>{s.code}</code>
                                                </pre>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {snippets.length === 0 && (
                                    <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl bg-slate-900/20">
                                        <p className="text-slate-500 text-sm">Belum ada snippet tersimpan.</p>
                                    </div>
                                )}
                            </motion.div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    )
}