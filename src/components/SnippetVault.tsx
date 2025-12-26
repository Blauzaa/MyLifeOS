'use client'
import { useState } from 'react'
import { Trash2, Copy, Code, Check, Terminal, Plus, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SnippetItem } from '../types'
import { useModal } from '../context/ModalContext'

interface Props {
  snippets: SnippetItem[]
  onAdd: (snippet: { title: string; code: string }) => void
  onDelete: (id: string) => void
}

export default function SnippetVault({ snippets, onAdd, onDelete }: Props) {
  const [newSnippet, setNewSnippet] = useState({ title: '', code: '' })
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { showModal } = useModal()

  const handleAdd = () => {
    if (!newSnippet.title || !newSnippet.code) return
    onAdd(newSnippet)
    setNewSnippet({ title: '', code: '' })
  }

  const handleDeleteClick = (id: string) => {
    showModal({
      title: 'Delete Snippet?',
      message: 'This code will be lost forever. Are you sure?',
      type: 'danger',
      onConfirm: () => onDelete(id)
    })
  }

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000) // Reset icon after 2s
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      
      {/* --- LEFT COLUMN: Input Form (Sticky) --- */}
      <div className="lg:col-span-4 xl:col-span-3">
        <div className="bg-slate-900/50 backdrop-blur-md p-5 rounded-2xl border border-white/10 sticky top-6 shadow-xl">
          <h2 className="font-bold mb-4 flex items-center gap-2 text-purple-400">
            <Terminal size={18} /> New Snippet
          </h2>
          
          <div className="space-y-3">
            <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block tracking-wider">Title</label>
                <input
                  className="w-full bg-black/40 border border-white/5 px-3 py-2.5 rounded-xl text-sm outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition text-slate-200 placeholder:text-slate-600"
                  placeholder="e.g. Fetch API Wrapper"
                  value={newSnippet.title}
                  onChange={(e) => setNewSnippet({ ...newSnippet, title: e.target.value })}
                />
            </div>
            
            <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block tracking-wider">Code</label>
                <textarea
                  className="w-full bg-black/40 border border-white/5 px-3 py-2.5 rounded-xl text-xs font-mono h-40 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition text-slate-300 placeholder:text-slate-700 resize-none custom-scrollbar"
                  placeholder="// Paste your code here..."
                  value={newSnippet.code}
                  onChange={(e) => setNewSnippet({ ...newSnippet, code: e.target.value })}
                  spellCheck={false}
                />
            </div>

            <button
              onClick={handleAdd}
              disabled={!newSnippet.title || !newSnippet.code}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-purple-900/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} /> Save to Vault
            </button>
          </div>
        </div>
      </div>

      {/* --- RIGHT COLUMN: Snippets List --- */}
      <div className="lg:col-span-8 xl:col-span-9 space-y-4">
        {snippets.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
              <Code size={40} className="mb-4 opacity-50" />
              <p className="text-sm font-medium">Your vault is empty.</p>
              <p className="text-xs opacity-60">Save useful code snippets here.</p>
           </div>
        ) : (
          <AnimatePresence mode='popLayout'>
            {snippets.map((s) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={s.id} 
                className="bg-[#1e1e1e] border border-white/10 rounded-xl overflow-hidden shadow-lg group"
              >
                {/* Window Header */}
                <div className="bg-[#2d2d2d] px-4 py-2 flex justify-between items-center border-b border-black/50">
                  <div className="flex items-center gap-4">
                      {/* Mac-like dots */}
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                      </div>
                      <span className="font-mono text-xs text-slate-400 font-bold flex items-center gap-2">
                        <Sparkles size={10} className="text-purple-400"/> {s.title}
                      </span>
                  </div>
                  
                  <div className="flex gap-1">
                    <button 
                        onClick={() => handleCopy(s.id, s.code)} 
                        className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10 text-xs text-slate-400 hover:text-white transition"
                    >
                      {copiedId === s.id ? (
                          <>
                            <Check size={14} className="text-green-400" /> 
                            <span className="text-green-400">Copied</span>
                          </>
                      ) : (
                          <>
                            <Copy size={14} /> 
                            <span>Copy</span>
                          </>
                      )}
                    </button>
                    <div className="w-[1px] bg-white/10 my-1 mx-1"></div>
                    <button 
                        onClick={() => handleDeleteClick(s.id)} 
                        className="text-slate-500 hover:text-red-400 hover:bg-red-900/20 p-1.5 rounded transition"
                        title="Delete Snippet"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Code Block */}
                <div className="relative">
                    <pre className="p-4 text-xs font-mono text-[#d4d4d4] overflow-x-auto max-h-[300px] custom-scrollbar selection:bg-purple-500/30">
                    <code>{s.code}</code>
                    </pre>
                    {/* Fade overlay at bottom if long content (optional visual trick) */}
                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#1e1e1e] to-transparent pointer-events-none"></div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}