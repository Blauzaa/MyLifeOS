'use client'
import { useState } from 'react'
import { Trash2, Copy, Code } from 'lucide-react'
import { SnippetItem } from '../types'

interface Props {
  snippets: SnippetItem[]
  onAdd: (snippet: { title: string; code: string }) => void
  onDelete: (id: string) => void
}

export default function SnippetVault({ snippets, onAdd, onDelete }: Props) {
  const [newSnippet, setNewSnippet] = useState({ title: '', code: '' })

  const handleAdd = () => {
    if (!newSnippet.title || !newSnippet.code) return
    onAdd(newSnippet)
    setNewSnippet({ title: '', code: '' })
  }

  const copySnippet = (code: string) => {
    navigator.clipboard.writeText(code)
    alert('Code copied!')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white/5 p-6 rounded-xl h-fit">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <Code size={18} /> New Snippet
        </h2>
        <input
          className="w-full bg-black/20 px-3 py-2 rounded mb-2 text-sm outline-none"
          placeholder="Title (e.g. Fetch API)"
          value={newSnippet.title}
          onChange={(e) => setNewSnippet({ ...newSnippet, title: e.target.value })}
        />
        <textarea
          className="w-full bg-black/20 px-3 py-2 rounded mb-2 text-sm font-mono h-32 outline-none"
          placeholder="Paste code here..."
          value={newSnippet.code}
          onChange={(e) => setNewSnippet({ ...newSnippet, code: e.target.value })}
        />
        <button
          onClick={handleAdd}
          className="w-full bg-purple-600 hover:bg-purple-500 py-2 rounded text-sm font-medium"
        >
          Save Snippet
        </button>
      </div>

      <div className="lg:col-span-2 grid grid-cols-1 gap-4">
        {snippets.map((s) => (
          <div key={s.id} className="bg-black/30 border border-white/10 rounded-xl overflow-hidden">
            <div className="bg-white/5 px-4 py-2 flex justify-between items-center border-b border-white/5">
              <span className="font-medium text-sm text-purple-300">{s.title}</span>
              <div className="flex gap-2">
                <button onClick={() => copySnippet(s.code)} className="text-white/50 hover:text-white p-1">
                  <Copy size={14} />
                </button>
                <button onClick={() => onDelete(s.id)} className="text-red-400/50 hover:text-red-400 p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <pre className="p-4 text-xs font-mono text-gray-400 overflow-x-auto">
              <code>{s.code}</code>
            </pre>
          </div>
        ))}
        {snippets.length === 0 && <div className="text-center opacity-30 py-10">No snippets yet.</div>}
      </div>
    </div>
  )
}