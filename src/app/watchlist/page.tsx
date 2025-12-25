'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../../utils/supabase/client'
import { 
  Plus, Search, Trash2, PlayCircle, CheckCircle2, 
  Clock, X, Film, Tv, Ghost, Loader2
} from 'lucide-react'

const supabase = createClient()

interface WatchlistItem {
  id: string
  title: string
  type: 'movie' | 'series' | 'anime'
  status: 'plan' | 'watching' | 'finished'
  created_at: string
}

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ title: '', type: 'movie', status: 'plan' })

  const fetchWatchlist = useCallback(async () => {
    const { data } = await supabase
      .from('watchlist')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setItems(data as WatchlistItem[])
    setLoading(false)
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchWatchlist() }, [fetchWatchlist])

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert("Login dulu!")
    
    const { error } = await supabase.from('watchlist').insert({ 
      title: formData.title,
      type: formData.type,
      status: formData.status,
      user_id: user.id 
    })

    if (!error) {
      setIsModalOpen(false)
      setFormData({ title: '', type: 'movie', status: 'plan' })
      fetchWatchlist()
    }
  }

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('watchlist').update({ status }).eq('id', id)
    if (!error) fetchWatchlist()
  }

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('watchlist').delete().eq('id', id)
    if (!error) {
      setItems(prev => prev.filter(i => i.id !== id))
    }
  }

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getTypeIcon = (type: string) => {
    if (type === 'movie') return <Film size={14}/>
    if (type === 'series') return <Tv size={14}/>
    return <Ghost size={14}/>
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Watchlist</h1>
          <p className="text-slate-500">Movies, Series, and Anime to track.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold transition shadow-lg shadow-blue-900/20"
        >
          <Plus size={20}/> Add New
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition" size={18} />
        <input 
          type="text" placeholder="Search title..." 
          className="w-full bg-slate-800/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-blue-500/50 transition"
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-blue-500" size={40}/></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map(item => (
            <div key={item.id} className="group bg-slate-900 border border-white/5 rounded-3xl p-5 space-y-4 hover:border-white/20 transition-all duration-300 shadow-xl">
              <div className="flex justify-between items-start">
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md">
                  {getTypeIcon(item.type)} {item.type}
                </span>
                <button onClick={() => deleteItem(item.id)} className="text-slate-700 hover:text-red-500 transition p-1"><Trash2 size={16}/></button>
              </div>
              
              <h3 className="font-bold text-lg text-slate-100 line-clamp-2 min-h-[3.5rem]">{item.title}</h3>
              
              <div className="flex gap-2 pt-2 border-t border-white/5">
                <button 
                  title="Mark as Watching"
                  onClick={() => updateStatus(item.id, 'watching')} 
                  className={`flex-1 flex justify-center py-2 rounded-xl transition ${item.status === 'watching' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                >
                  <PlayCircle size={20}/>
                </button>
                <button 
                  title="Mark as Finished"
                  onClick={() => updateStatus(item.id, 'finished')} 
                  className={`flex-1 flex justify-center py-2 rounded-xl transition ${item.status === 'finished' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                >
                  <CheckCircle2 size={20}/>
                </button>
                <button 
                  title="Mark as Plan"
                  onClick={() => updateStatus(item.id, 'plan')} 
                  className={`flex-1 flex justify-center py-2 rounded-xl transition ${item.status === 'plan' ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                >
                  <Clock size={20}/>
                </button>
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center text-slate-600 italic">Watchlist kosong.</div>
          )}
        </div>
      )}

      {/* Modal Add */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <form onSubmit={handleAddItem} className="bg-slate-900 p-8 rounded-3xl w-full max-w-md border border-white/10 space-y-6 shadow-2xl relative">
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-500"><X size={20}/></button>
            <h2 className="text-2xl font-bold text-white">Add to Watchlist</h2>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Title</label>
                <input required placeholder="Enter title..." className="w-full bg-slate-800 border border-white/5 p-4 rounded-2xl outline-none focus:border-blue-500 transition" onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Type</label>
                <select className="w-full bg-slate-800 border border-white/5 p-4 rounded-2xl outline-none appearance-none" onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="movie">🎬 Movie</option>
                  <option value="series">📺 Series</option>
                  <option value="anime">⛩️ Anime</option>
                </select>
              </div>
            </div>

            <button className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-bold text-white transition shadow-lg shadow-blue-900/30">Save to List</button>
          </form>
        </div>
      )}
    </div>
  )
}