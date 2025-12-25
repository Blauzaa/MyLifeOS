/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
'use client'
import { useState, useEffect } from 'react'
import { Plus, Search, ExternalLink, Trash2, Film, PlayCircle, CheckCircle2, Clock, Image as ImageIcon, X } from 'lucide-react'

interface WatchItem {
  id: string
  title: string
  synopsis: string
  link: string
  posterUrl: string
  status: 'planning' | 'watching' | 'completed'
  category: 'movie' | 'series' | 'anime'
}

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'planning' | 'watching' | 'completed'>('all')

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    synopsis: '',
    link: '',
    posterUrl: '',
    category: 'movie' as const
  })

  // Load data dari localStorage (Bisa diupgrade ke Supabase nanti)
  useEffect(() => {
    const saved = localStorage.getItem('lifeos_watchlist')
    if (saved) setItems(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('lifeos_watchlist', JSON.stringify(items))
  }, [items])

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title) return

    const newItem: WatchItem = {
      id: crypto.randomUUID(),
      ...formData,
      status: 'planning'
    }

    setItems([newItem, ...items])
    setFormData({ title: '', synopsis: '', link: '', posterUrl: '', category: 'movie' })
    setIsModalOpen(false)
  }

  const updateStatus = (id: string, status: WatchItem['status']) => {
    setItems(items.map(item => item.id === id ? { ...item, status } : item))
  }

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === 'all' || item.status === filter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              My Watchlist
            </h1>
            <p className="text-slate-500 text-sm mt-1">Kelola tontonan film, series, dan anime favoritmu.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
          >
            <Plus size={20} />
            Tambah Tontonan
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-900/50 p-4 rounded-2xl border border-white/5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text"
              placeholder="Cari judul..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/50 border border-white/5 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {['all', 'planning', 'watching', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all ${filter === f ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Grid List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="group bg-slate-900 rounded-2xl border border-white/5 overflow-hidden flex flex-col hover:border-blue-500/30 transition-all hover:shadow-2xl hover:shadow-blue-900/10">
              {/* Poster Image */}
              <div className="relative aspect-[2/3] bg-slate-800 overflow-hidden">
                {item.posterUrl ? (
                  <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                    <ImageIcon size={48} />
                    <span className="text-xs mt-2">No Poster</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 flex flex-col gap-2">
                  <button onClick={() => deleteItem(item.id)} className="p-2 bg-red-500/80 backdrop-blur-md text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2">
                  <span className="px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold uppercase tracking-wider text-white border border-white/10">
                    {item.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex-1 flex flex-col space-y-3">
                <h3 className="font-bold text-lg line-clamp-1 text-slate-100">{item.title}</h3>
                <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                  {item.synopsis || 'Tidak ada sinopsis.'}
                </p>

                {item.link && (
                  <a href={item.link} target="_blank" className="flex items-center gap-2 text-blue-400 text-xs hover:underline">
                    <ExternalLink size={14} /> Link Nonton
                  </a>
                )}

                {/* Action Row */}
                <div className="pt-4 mt-auto border-t border-white/5 flex items-center justify-between">
                  <div className="flex gap-1">
                    <button 
                      onClick={() => updateStatus(item.id, 'planning')}
                      className={`p-1.5 rounded-md transition-colors ${item.status === 'planning' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:text-slate-400'}`}
                      title="Planning"
                    >
                      <Clock size={16} />
                    </button>
                    <button 
                      onClick={() => updateStatus(item.id, 'watching')}
                      className={`p-1.5 rounded-md transition-colors ${item.status === 'watching' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-600 hover:text-slate-400'}`}
                      title="Watching"
                    >
                      <PlayCircle size={16} />
                    </button>
                    <button 
                      onClick={() => updateStatus(item.id, 'completed')}
                      className={`p-1.5 rounded-md transition-colors ${item.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-600 hover:text-slate-400'}`}
                      title="Completed"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  </div>
                  <span className={`text-[10px] font-bold uppercase ${item.status === 'watching' ? 'text-blue-400' : item.status === 'completed' ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Tambah Data */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Tambah Tontonan</h2>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleAddItem} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Judul</label>
                    <input 
                      required
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-slate-800 border border-white/5 rounded-xl py-2 px-4 focus:outline-none focus:border-blue-500"
                      placeholder="Contoh: Interstellar"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Kategori</label>
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                        className="w-full bg-slate-800 border border-white/5 rounded-xl py-2 px-4 focus:outline-none"
                      >
                        <option value="movie">Movie</option>
                        <option value="series">Series</option>
                        <option value="anime">Anime</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Link Poster (URL)</label>
                      <input 
                        type="text"
                        value={formData.posterUrl}
                        onChange={(e) => setFormData({...formData, posterUrl: e.target.value})}
                        className="w-full bg-slate-800 border border-white/5 rounded-xl py-2 px-4 focus:outline-none focus:border-blue-500"
                        placeholder="https://image..."
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Link Nonton</label>
                    <input 
                      type="text"
                      value={formData.link}
                      onChange={(e) => setFormData({...formData, link: e.target.value})}
                      className="w-full bg-slate-800 border border-white/5 rounded-xl py-2 px-4 focus:outline-none focus:border-blue-500"
                      placeholder="https://netflix.com/..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Sinopsis Singkat</label>
                    <textarea 
                      value={formData.synopsis}
                      onChange={(e) => setFormData({...formData, synopsis: e.target.value})}
                      className="w-full bg-slate-800 border border-white/5 rounded-xl py-2 px-4 focus:outline-none focus:border-blue-500 h-24 resize-none"
                      placeholder="Tentang apa film ini..."
                    ></textarea>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-900/30 transition-all">
                    Simpan Ke List
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}