'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '../../utils/supabase/client'
import { 
  Plus, Search, Trash2, PlayCircle, CheckCircle2, 
  X, Film, Tv, Ghost, Loader2, Link as LinkIcon, GripHorizontal, ImagePlus
} from 'lucide-react'
import imageCompression from 'browser-image-compression'

// --- DND KIT IMPORTS ---
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const supabase = createClient()

interface WatchlistItem {
  id: string
  title: string
  type: 'movie' | 'series' | 'anime'
  status: 'plan' | 'watching' | 'finished'
  link?: string
  synopsis?: string
  image_url?: string
  position: number
}

// --- COMPONENT CARD ---
function SortableItem({ item, onDelete, onUpdateStatus }: { item: WatchlistItem, onDelete: (id: string, img: string) => void, onUpdateStatus: (id: string, status: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const getTypeIcon = (type: string) => {
    if (type === 'movie') return <Film size={12}/>
    if (type === 'series') return <Tv size={12}/>
    return <Ghost size={12}/>
  }

  // Styling khusus berdasarkan status
  const cardBorderColor = 
    item.status === 'watching' ? 'border-blue-500 shadow-blue-900/20' : 
    item.status === 'finished' ? 'border-emerald-900/30 opacity-75 hover:opacity-100' : 
    'border-white/10';

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`group relative bg-slate-900 border ${cardBorderColor} rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all shadow-xl flex flex-col h-full`}
    >
      {/* Gambar Poster */}
      <div className="relative h-48 w-full bg-slate-800 overflow-hidden">
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-800">
             <Film size={40} opacity={0.2} />
          </div>
        )}
        
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 text-[10px] font-bold text-white uppercase tracking-wider">
          {getTypeIcon(item.type)} {item.type}
        </div>

        {/* Drag Handle */}
        <div {...attributes} {...listeners} className="absolute top-2 right-2 bg-black/40 hover:bg-blue-600 text-white p-1.5 rounded-lg cursor-grab active:cursor-grabbing backdrop-blur-sm transition">
          <GripHorizontal size={16}/>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
           <h3 className="font-bold text-base text-slate-100 line-clamp-1" title={item.title}>{item.title}</h3>
           {item.link && (
             <a href={item.link} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300">
               <LinkIcon size={16} />
             </a>
           )}
        </div>

        <p className="text-xs text-slate-400 line-clamp-3 mb-4 flex-1">
          {item.synopsis || "Tidak ada sinopsis."}
        </p>

        {/* Actions */}
        <div className="pt-3 border-t border-white/5 flex gap-1">
           {item.status !== 'watching' && item.status !== 'finished' && (
              <button onClick={() => onUpdateStatus(item.id, 'watching')} className="flex-1 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white py-1.5 rounded-lg transition flex justify-center" title="Mulai Tonton">
                <PlayCircle size={16}/>
              </button>
           )}
           
           {item.status === 'watching' && (
             <button onClick={() => onUpdateStatus(item.id, 'finished')} className="flex-1 bg-blue-600 hover:bg-emerald-600 text-white py-1.5 rounded-lg transition flex justify-center" title="Selesai Tonton">
               <CheckCircle2 size={16}/>
             </button>
           )}

           <button onClick={() => onDelete(item.id, item.image_url || '')} className="px-3 bg-slate-800 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded-lg transition">
             <Trash2 size={16}/>
           </button>
        </div>
      </div>
    </div>
  )
}

// --- REUSABLE SECTION COMPONENT ---
function WatchlistSection({ title, items, id, children }: { title: string, items: WatchlistItem[], id: string, children: React.ReactNode }) {
    if (items.length === 0) return null
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                <h2 className="text-xl font-bold text-white tracking-wide">{title}</h2>
                <span className="text-xs font-bold bg-white/10 text-slate-400 px-2 py-0.5 rounded-full">{items.length}</span>
            </div>
            <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {children}
                </div>
            </SortableContext>
        </div>
    )
}

// --- MAIN PAGE ---
export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isPasteActive, setIsPasteActive] = useState(false) // Visual indicator saat paste

  const [formData, setFormData] = useState({ 
    title: '', type: 'movie', status: 'plan', link: '', synopsis: '', image_url: '' 
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Fix button click vs drag issue
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 1. FETCH DATA
  const fetchWatchlist = useCallback(async () => {
    const { data } = await supabase.from('watchlist').select('*').order('position', { ascending: true })
    if (data) setItems(data as WatchlistItem[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchWatchlist() }, [fetchWatchlist])

  // 2. PASTE IMAGE HANDLER (Mirip Note)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
        if (!isModalOpen) return; // Hanya aktif saat modal buka

        const items = e.clipboardData?.items
        if (!items) return

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                e.preventDefault()
                const file = items[i].getAsFile()
                if (file) {
                    setIsPasteActive(true)
                    await processAndUploadImage(file)
                    setIsPasteActive(false)
                }
            }
        }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [isModalOpen])

  // 3. UPLOAD LOGIC
  const processAndUploadImage = async (file: File) => {
    try {
      setIsUploading(true)
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 800, useWebWorker: true }
      const compressedFile = await imageCompression(file, options)
      
      const formDataUpload = new FormData()
      formDataUpload.append('file', compressedFile)
      formDataUpload.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)

      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST', body: formDataUpload
      })
      const data = await res.json()
      setFormData(prev => ({ ...prev, image_url: data.secure_url }))
    } catch (err) {
      alert("Gagal upload gambar")
    } finally {
      setIsUploading(false)
    }
  }

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await processAndUploadImage(file)
  }

  // 4. CRUD OPERATIONS
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert("Login dulu!")
    
    const newPosition = items.length > 0 ? Math.max(...items.map(i => i.position)) + 1 : 0;
    const { error } = await supabase.from('watchlist').insert({ ...formData, user_id: user.id, position: newPosition })

    if (!error) {
      setIsModalOpen(false)
      setFormData({ title: '', type: 'movie', status: 'plan', link: '', synopsis: '', image_url: '' })
      fetchWatchlist()
    }
  }

  const deleteItem = async (id: string, imageUrl: string) => {
    if(!confirm("Hapus item ini?")) return;
    if (imageUrl) {
        const regex = /res\.cloudinary\.com\/[^/]+\/image\/upload\/v\d+\/([^/.]+)/;
        const match = imageUrl.match(regex);
        if (match && match[1]) {
            await fetch('/api/cloudinary/delete', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ public_id: match[1] })
            });
        }
    }
    const { error } = await supabase.from('watchlist').delete().eq('id', id)
    if (!error) setItems(prev => prev.filter(i => i.id !== id))
  }

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('watchlist').update({ status }).eq('id', id)
    if (!error) setItems(prev => prev.map(i => i.id === id ? { ...i, status: status as any } : i))
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Simpan urutan baru ke DB
        // (Optimasi: Bisa pakai Debounce jika data sangat banyak)
        newItems.forEach(async (item, idx) => {
             await supabase.from('watchlist').update({ position: idx }).eq('id', item.id)
        });
        return newItems;
      });
    }
  };

  // FILTERING AND SECTIONING
  const filteredItems = items.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
  
  const planItems = filteredItems.filter(i => i.status === 'plan')
  const watchingItems = filteredItems.filter(i => i.status === 'watching')
  const finishedItems = filteredItems.filter(i => i.status === 'finished')

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-40">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Watchlist</h1>
          <p className="text-slate-500">Track perjalanan nonton kamu.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold transition shadow-lg shadow-blue-900/20">
          <Plus size={20}/> Add New
        </button>
      </div>

      {/* SEARCH */}
      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition" size={18} />
        <input 
          type="text" placeholder="Cari judul..." 
          className="w-full bg-slate-800/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-blue-500/50 transition text-slate-200"
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-blue-500" size={40}/></div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="space-y-12">
                {/* 1. PLAN TO WATCH (ATAS) */}
                <WatchlistSection title="📋 Plan to Watch" items={planItems} id="plan">
                    {planItems.map(item => <SortableItem key={item.id} item={item} onDelete={deleteItem} onUpdateStatus={updateStatus}/>)}
                </WatchlistSection>

                {/* 2. WATCHING (TENGAH) */}
                <WatchlistSection title="▶️ Now Watching" items={watchingItems} id="watching">
                    {watchingItems.map(item => <SortableItem key={item.id} item={item} onDelete={deleteItem} onUpdateStatus={updateStatus}/>)}
                </WatchlistSection>

                {/* 3. FINISHED (BAWAH) */}
                <WatchlistSection title="✅ Finished" items={finishedItems} id="finished">
                    {finishedItems.map(item => <SortableItem key={item.id} item={item} onDelete={deleteItem} onUpdateStatus={updateStatus}/>)}
                </WatchlistSection>

                {items.length === 0 && <div className="text-center py-20 text-slate-600 italic">Belum ada watchlist. Tambahkan sekarang!</div>}
            </div>
        </DndContext>
      )}

      {/* MODAL ADD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <form onSubmit={handleAddItem} className="bg-slate-900 p-6 md:p-8 rounded-3xl w-full max-w-lg border border-white/10 space-y-4 shadow-2xl relative my-auto">
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
            <h2 className="text-2xl font-bold text-white mb-2">Add to Watchlist</h2>
            <p className="text-xs text-slate-500 mb-6">Tips: Kamu bisa langsung <span className="text-blue-400 font-bold">CTRL+V</span> gambar di sini.</p>
            
            <div className="flex gap-4">
                {/* Image Upload Area */}
                <div className={`w-28 h-36 bg-slate-800 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden relative group shrink-0 transition-all ${isPasteActive ? 'border-blue-500 bg-blue-500/10' : 'border-white/20'}`}>
                    {formData.image_url ? (
                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover"/>
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-500 text-xs text-center p-2">
                           {isUploading ? <Loader2 className="animate-spin"/> : <><ImagePlus size={20}/><span className="scale-90">Paste or Click</span></>}
                        </div>
                    )}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleManualUpload} disabled={isUploading} />
                </div>

                <div className="flex-1 space-y-3">
                    <input required autoFocus placeholder="Judul..." className="w-full bg-slate-800 border border-white/5 p-3 rounded-xl outline-none focus:border-blue-500 text-sm" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                    
                    <div className="flex gap-2">
                        <select className="bg-slate-800 border border-white/5 p-3 rounded-xl outline-none text-sm flex-1 text-slate-300" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                            <option value="movie">🎬 Movie</option>
                            <option value="series">📺 Series</option>
                            <option value="anime">⛩️ Anime</option>
                        </select>
                        <select className="bg-slate-800 border border-white/5 p-3 rounded-xl outline-none text-sm flex-1 text-slate-300" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                            <option value="plan">📋 Plan</option>
                            <option value="watching">▶️ Watching</option>
                            <option value="finished">✅ Finished</option>
                        </select>
                    </div>
                </div>
            </div>

            <textarea placeholder="Sinopsis singkat..." rows={3} className="w-full bg-slate-800 border border-white/5 p-3 rounded-xl outline-none focus:border-blue-500 text-sm resize-none custom-scrollbar" value={formData.synopsis} onChange={e => setFormData({...formData, synopsis: e.target.value})} />
            
            <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14}/>
                <input placeholder="Link Streaming / MyAnimeList..." className="w-full bg-slate-800 border border-white/5 p-3 pl-9 rounded-xl outline-none focus:border-blue-500 text-sm" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} />
            </div>

            <button disabled={isUploading} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold text-white transition shadow-lg shadow-blue-900/30 disabled:opacity-50 mt-4">
               {isUploading ? 'Uploading Image...' : 'Save Item'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}