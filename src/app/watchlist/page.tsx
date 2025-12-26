'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../../utils/supabase/client'
import { 
  Plus, Search, Trash2, PlayCircle, CheckCircle2, 
  X, Film, Tv, Ghost, Loader2, Link as LinkIcon, GripHorizontal, ImagePlus
} from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { useModal } from '../../context/ModalContext'
// --- DND KIT IMPORTS ---
import {
  DndContext, 
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
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

// --- TYPES ---
type StatusType = 'plan' | 'watching' | 'finished'

interface WatchlistItem {
  id: string
  title: string
  type: 'movie' | 'series' | 'anime'
  status: StatusType
  link?: string
  synopsis?: string
  image_url?: string
  position: number
}

// --- CARD COMPONENT (SORTABLE) ---
function SortableItem({ item, onDelete }: { item: WatchlistItem, onDelete: (id: string, img: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: item.id,
    data: { ...item } // Pass data for drag overlay
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const getTypeIcon = (type: string) => {
    if (type === 'movie') return <Film size={12}/>
    if (type === 'series') return <Tv size={12}/>
    return <Ghost size={12}/>
  }

  // Visual style based on status
  const borderColor = 
    item.status === 'watching' ? 'border-blue-500 shadow-blue-500/20' : 
    item.status === 'finished' ? 'border-emerald-500/30' : 
    'border-white/10';

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`group relative bg-slate-900 border ${borderColor} rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all shadow-xl flex flex-col h-full`}
    >
      {/* Poster */}
      <div className="relative h-48 w-full bg-slate-800 overflow-hidden">
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
             <Film size={40} opacity={0.2} />
          </div>
        )}
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 text-[10px] font-bold text-white uppercase tracking-wider">
          {getTypeIcon(item.type)} {item.type}
        </div>
        {/* Grip Handle */}
        <div {...attributes} {...listeners} className="absolute top-2 right-2 bg-black/40 hover:bg-blue-600 text-white p-1.5 rounded-lg cursor-grab active:cursor-grabbing backdrop-blur-sm transition z-20">
          <GripHorizontal size={16}/>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
           <h3 className="font-bold text-base text-slate-100 line-clamp-1">{item.title}</h3>
           {item.link && (
             <a href={item.link} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 on-drag-disable">
               <LinkIcon size={16} />
             </a>
           )}
        </div>
        <p className="text-xs text-slate-400 line-clamp-3 mb-4 flex-1">
          {item.synopsis || "No synopsis."}
        </p>
        <div className="pt-3 border-t border-white/5 flex justify-end">
           <button onClick={() => onDelete(item.id, item.image_url || '')} className="px-3 py-1 bg-slate-800 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded-lg transition text-xs flex items-center gap-1">
             <Trash2 size={12}/> Remove
           </button>
        </div>
      </div>
    </div>
  )
}

// --- CONTAINER SECTION ---
function StatusSection({ id, title, items, children }: { id: string, title: string, items: WatchlistItem[], children: React.ReactNode }) {
  // Logic untuk Droppable Container (agar bisa drop ke list kosong)
  const { setNodeRef } = useSortable({ id: id, data: { type: 'container', status: id } });

  return (
    <div ref={setNodeRef} className="space-y-4 min-h-[150px] bg-white/[0.02] p-4 rounded-3xl border border-white/5">
        <div className="flex items-center gap-3 border-b border-white/10 pb-2">
            <h2 className="text-xl font-bold text-white tracking-wide">{title}</h2>
            <span className="text-xs font-bold bg-white/10 text-slate-400 px-2 py-0.5 rounded-full">{items.length}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {children}
        </div>
        {items.length === 0 && (
            <div className="h-20 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-slate-600 text-xs uppercase tracking-widest">
                Drop here
            </div>
        )}
    </div>
  )
}

// --- MAIN PAGE ---
export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null); // ID item yg sedang di-drag
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const { showModal } = useModal()
  // State form
  const [formData, setFormData] = useState({ title: '', type: 'movie', status: 'plan', link: '', synopsis: '', image_url: '' })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 1. FETCH
  const fetchWatchlist = useCallback(async () => {
    const { data } = await supabase.from('watchlist').select('*').order('position', { ascending: true })
    if (data) setItems(data as WatchlistItem[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchWatchlist() }, [fetchWatchlist])

  // 2. PASTE IMAGE
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
        if (!isModalOpen) return;
        const clipItems = e.clipboardData?.items
        if (!clipItems) return
        for (let i = 0; i < clipItems.length; i++) {
            if (clipItems[i].type.indexOf('image') !== -1) {
                e.preventDefault()
                const file = clipItems[i].getAsFile()
                if (file) await processAndUploadImage(file)
            }
        }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [isModalOpen])

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
    } catch { alert("Gagal upload") } finally { setIsUploading(false) }
  }

  

  // 3. CRUD
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert("Login required")
    
    // Taruh di posisi paling bawah dari status yang dipilih
    const statusItems = items.filter(i => i.status === formData.status);
    const newPos = statusItems.length > 0 ? Math.max(...statusItems.map(i => i.position)) + 1 : 0;

    const { error } = await supabase.from('watchlist').insert({ 
        ...formData, user_id: user.id, position: newPos 
    })

    if (!error) {
      setIsModalOpen(false)
      setFormData({ title: '', type: 'movie', status: 'plan', link: '', synopsis: '', image_url: '' })
      fetchWatchlist()
    }
  }

const deleteItem = (id: string) => {
    showModal({
        title: 'Remove Movie?',
        message: 'Are you sure you want to remove this from your watchlist?',
        type: 'danger',
        onConfirm: async () => {
            // Logic hapus supabase di sini
            await supabase.from('watchlist').delete().eq('id', id)
            // update state...
        }
    })
  }

  // --- DRAG AND DROP LOGIC (KANBAN) ---

  const findContainer = (id: string) => {
    if (items.find(i => i.id === id)) {
        return items.find(i => i.id === id)?.status;
    }
    // Jika id adalah nama container (plan, watching, finished)
    if (['plan', 'watching', 'finished'].includes(id)) return id as StatusType;
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Logic saat sedang digeser (Move item between lists visually)
const handleDragOver = (event: DragOverEvent) => {
  const { active, over } = event;
  if (!over) return; // ⬅️ WAJIB

  const activeId = active.id as string;
  const overId = over.id as string;

  const activeContainer = findContainer(activeId);
  const overContainer = findContainer(overId);

  if (!activeContainer || !overContainer || activeContainer === overContainer) return;

  setItems((prev) => {
    const activeIndex = prev.findIndex(i => i.id === activeId);
    const overIndex = prev.findIndex(i => i.id === overId);

    let newIndex = overIndex >= 0 ? overIndex : prev.length;

    const newItems = [...prev];
    newItems[activeIndex] = {
      ...newItems[activeIndex],
      status: overContainer as StatusType,
    };

    return arrayMove(newItems, activeIndex, newIndex);
  });
};
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;
  setActiveId(null);

  if (!over) return; // ⬅️ WAJIB

  const activeId = active.id as string;
  const overId = over.id as string;

  const activeContainer = findContainer(activeId);
  const overContainer = findContainer(overId);

  if (!activeContainer || !overContainer) return;

  const oldIndex = items.findIndex(i => i.id === activeId);
  const newIndex = items.findIndex(i => i.id === overId);

  if (oldIndex === -1 || newIndex === -1) return;

  const newItems = arrayMove(items, oldIndex, newIndex);
  setItems(newItems);

  const droppedItem = newItems.find(i => i.id === activeId);
  if (!droppedItem) return;

  await supabase
    .from('watchlist')
    .update({ status: droppedItem.status })
    .eq('id', droppedItem.id);

  const containerItems = newItems.filter(i => i.status === droppedItem.status);
  await Promise.all(
    containerItems.map((item, idx) =>
      supabase.from('watchlist').update({ position: idx }).eq('id', item.id)
    )
  );
};



  // --- RENDER ---
  const filteredItems = items.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
  
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-40">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Watchlist Board</h1>
          <p className="text-slate-500">Geser kartu antar status untuk update.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-900/20">
          <Plus size={20}/> Add New
        </button>
      </div>

      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input 
          type="text" placeholder="Search..." 
          className="w-full bg-slate-800/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-blue-500/50 text-slate-200"
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-blue-500" size={40}/></div>
      ) : (
        <DndContext 
            sensors={sensors} 
            collisionDetection={closestCorners} // Better for kanban
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-col gap-8">
                {/* 1. PLAN */}
                <SortableContext items={filteredItems.filter(i => i.status === 'plan').map(i => i.id)} strategy={rectSortingStrategy}>
                    <StatusSection id="plan" title="📋 Plan to Watch" items={filteredItems.filter(i => i.status === 'plan')}>
                         {filteredItems.filter(i => i.status === 'plan').map(item => <SortableItem key={item.id} item={item} onDelete={deleteItem}/>)}
                    </StatusSection>
                </SortableContext>

                {/* 2. WATCHING */}
                <SortableContext items={filteredItems.filter(i => i.status === 'watching').map(i => i.id)} strategy={rectSortingStrategy}>
                    <StatusSection id="watching" title="▶️ Now Watching" items={filteredItems.filter(i => i.status === 'watching')}>
                         {filteredItems.filter(i => i.status === 'watching').map(item => <SortableItem key={item.id} item={item} onDelete={deleteItem}/>)}
                    </StatusSection>
                </SortableContext>

                {/* 3. FINISHED */}
                <SortableContext items={filteredItems.filter(i => i.status === 'finished').map(i => i.id)} strategy={rectSortingStrategy}>
                    <StatusSection id="finished" title="✅ Finished" items={filteredItems.filter(i => i.status === 'finished')}>
                         {filteredItems.filter(i => i.status === 'finished').map(item => <SortableItem key={item.id} item={item} onDelete={deleteItem}/>)}
                    </StatusSection>
                </SortableContext>
            </div>

            {/* DRAG OVERLAY (Yang muncul saat item terbang) */}
            <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
                {activeId ? (
                   <div className="opacity-80 rotate-3 cursor-grabbing w-[200px]">
                      {/* Tampilan sederhana saat dragging */}
                      <div className="bg-slate-800 p-2 rounded-xl border border-blue-500 shadow-2xl">
                          <div className="h-32 bg-slate-700 rounded-lg overflow-hidden mb-2">
                             {items.find(i => i.id === activeId)?.image_url && <img src={items.find(i => i.id === activeId)?.image_url!} className="w-full h-full object-cover"/>}
                          </div>
                          <div className="h-4 bg-slate-600 rounded w-3/4"></div>
                      </div>
                   </div>
                ) : null}
            </DragOverlay>
        </DndContext>
      )}

      {/* MODAL (Sama seperti sebelumnya) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <form onSubmit={handleAddItem} className="bg-slate-900 p-6 rounded-3xl w-full max-w-lg border border-white/10 space-y-4 shadow-2xl relative my-auto">
             <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
             <h2 className="text-2xl font-bold text-white mb-4">Add Item</h2>
             
             <div className="flex gap-4">
                 <div className="w-24 h-32 bg-slate-800 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden relative shrink-0">
                    {formData.image_url ? <img src={formData.image_url} className="w-full h-full object-cover"/> : (isUploading ? <Loader2 className="animate-spin"/> : <ImagePlus/>)}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => { if(e.target.files?.[0]) await processAndUploadImage(e.target.files[0]) }} />
                 </div>
                 <div className="flex-1 space-y-2">
                     <input required placeholder="Judul..." className="w-full bg-slate-800 p-3 rounded-xl outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                     <select className="w-full bg-slate-800 p-3 rounded-xl outline-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                         <option value="plan">Plan</option><option value="watching">Watching</option><option value="finished">Finished</option>
                     </select>
                     <select className="w-full bg-slate-800 p-3 rounded-xl outline-none" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                         <option value="movie">Movie</option><option value="series">Series</option><option value="anime">Anime</option>
                     </select>
                 </div>
             </div>
             <input placeholder="Link..." className="w-full bg-slate-800 p-3 rounded-xl outline-none" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} />
             <button className="w-full bg-blue-600 py-3 rounded-xl font-bold text-white mt-2">Save</button>
          </form>
        </div>
      )}
    </div>
  )
}