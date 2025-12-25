'use client'
import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'
import { LinkItem } from '../types'

interface Props {
  links: LinkItem[]
  mode: string
  onAdd: (link: { title: string; url: string }) => void
  onDelete: (id: string) => void
}

export default function LinksWidget({ links, mode, onAdd, onDelete }: Props) {
  const [newLink, setNewLink] = useState({ title: '', url: '' })

  const handleAdd = () => {
    if (!newLink.title || !newLink.url) return
    onAdd(newLink)
    setNewLink({ title: '', url: '' })
  }

  // Filter link berdasarkan mode (work/life) dilakukan di Parent atau di sini
  // Kita filter di sini saja biar parent bersih
  const activeLinks = links.filter((l) => l.type === mode)

  return (
    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
      <h2 className="text-sm font-bold mb-3 flex items-center gap-2 opacity-70">🔗 Quick Links</h2>
      <div className="space-y-2 mb-3">
        {activeLinks.map((l) => (
          <div key={l.id} className="flex justify-between items-center group">
            <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-300 hover:underline truncate">
              {l.title}
            </a>
            <button onClick={() => onDelete(l.id)} className="opacity-0 group-hover:opacity-100 text-red-400">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        {activeLinks.length === 0 && <p className="text-xs opacity-30">Kosong.</p>}
      </div>
      <div className="flex gap-2">
        <input
          placeholder="Name"
          className="bg-black/20 w-1/3 px-2 py-1 text-xs rounded outline-none"
          value={newLink.title}
          onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
        />
        <input
          placeholder="https://"
          className="bg-black/20 flex-1 px-2 py-1 text-xs rounded outline-none"
          value={newLink.url}
          onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
        />
        <button onClick={handleAdd} className="bg-blue-600/50 hover:bg-blue-600 px-2 rounded">
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}