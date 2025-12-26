'use client'
import { useState } from 'react'
import { Trash2, Plus, Link as LinkIcon, ExternalLink, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { LinkItem } from '../types'
import { useModal } from '../context/ModalContext' // Pastikan path import sesuai

interface Props {
  links: LinkItem[]
  mode: string
  onAdd: (link: { title: string; url: string }) => void
  onDelete: (id: string) => void
}

export default function LinksWidget({ links, mode, onAdd, onDelete }: Props) {
  const [newLink, setNewLink] = useState({ title: '', url: '' })
  const { showModal } = useModal()

  // Filter link berdasarkan mode
  const activeLinks = links.filter((l) => l.type === mode)

  const handleAdd = () => {
    if (!newLink.title || !newLink.url) return
    
    // Simple UX: Pastikan URL memiliki protocol agar tidak dianggap relative path
    let formattedUrl = newLink.url
    if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`
    }

    onAdd({ title: newLink.title, url: formattedUrl })
    setNewLink({ title: '', url: '' })
  }

  const handleDeleteClick = (id: string) => {
    showModal({
      title: 'Remove Link?',
      message: 'Are you sure you want to remove this shortcut?',
      type: 'danger',
      onConfirm: () => onDelete(id)
    })
  }

  // Helper untuk mengambil favicon dari Google API
  const getFavicon = (url: string) => {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch (e) {
        return null;
    }
  }

  return (
    <div className="bg-slate-900/50 p-5 rounded-2xl border border-white/5 backdrop-blur-sm shadow-xl flex flex-col h-full">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 uppercase tracking-wider">
            <LinkIcon size={14} className="text-blue-400" /> Quick Links
        </h2>
        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-slate-400 border border-white/5">
            {mode} mode
        </span>
      </div>
      
      {/* Links List */}
      <div className="space-y-2 mb-4 flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-[100px]">
        {activeLinks.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-slate-600 border border-dashed border-white/5 rounded-xl bg-black/10 py-6">
              <Globe size={24} className="mb-2 opacity-50"/>
              <p className="text-[10px]">No links added yet.</p>
           </div>
        ) : (
          <AnimatePresence mode='popLayout'>
            {activeLinks.map((l) => (
              <motion.div 
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={l.id} 
                className="group flex justify-between items-center p-2.5 rounded-xl bg-slate-800/40 border border-transparent hover:border-white/10 hover:bg-slate-800 transition-all"
              >
                <a 
                    href={l.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-3 flex-1 min-w-0"
                >
                  {/* Auto Favicon Image */}
                  <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center border border-white/5 overflow-hidden shrink-0">
                     <img 
                        src={getFavicon(l.url) || ''} 
                        alt="icon"
                        className="w-4 h-4 object-contain opacity-80 group-hover:opacity-100 transition"
                        onError={(e) => {
                            // Fallback jika gambar gagal load
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-500"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'
                        }}
                     />
                  </div>
                  
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-medium text-slate-200 group-hover:text-blue-300 transition truncate">
                        {l.title}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                        {new URL(l.url).hostname.replace('www.', '')} <ExternalLink size={8}/>
                    </span>
                  </div>
                </a>

                <button 
                    onClick={() => handleDeleteClick(l.id)} 
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Remove Link"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Input Form */}
      <div className="flex flex-col gap-2 pt-3 border-t border-white/5">
        <div className="flex gap-2">
            <div className="relative flex-1">
                <input
                    placeholder="Title (e.g. Gmail)"
                    className="w-full bg-black/30 px-3 py-2 text-[10px] rounded-lg outline-none border border-white/5 focus:border-blue-500/50 text-slate-300 transition"
                    value={newLink.title}
                    onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                />
            </div>
            <div className="relative flex-[1.5]">
                <input
                    placeholder="example.com"
                    className="w-full bg-black/30 px-3 py-2 text-[10px] rounded-lg outline-none border border-white/5 focus:border-blue-500/50 text-slate-300 transition"
                    value={newLink.url}
                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
            </div>
        </div>
        <button 
            onClick={handleAdd} 
            disabled={!newLink.title || !newLink.url}
            className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/20 px-2 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={12} strokeWidth={3} /> Add Shortcut
        </button>
      </div>
    </div>
  )
}