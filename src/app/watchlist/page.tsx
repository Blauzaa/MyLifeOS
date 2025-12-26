/* eslint-disable @next/next/no-img-element */
'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../../utils/supabase/client'
import {
  Plus, Search, Trash2, Film, Tv, Ghost, Loader2,
  Link as LinkIcon, GripVertical, ImagePlus, X, Save
} from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { useModal } from '../../context/ModalContext' // Custom Modal
import { motion, AnimatePresence } from 'framer-motion' // Animasi

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

// --- COMPONENT: CARD ITEM (Sortable) ---
function SortableItem({ item, onDelete }: { item: WatchlistItem, onDelete: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: item.id,
    data: { ...item }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const getTypeIcon = (type: string) => {
    if (type === 'movie') return <Film size={12} />
    if (type === 'series') return <Tv size={12} />
    return <Ghost size={12} />
  }

  // Warna border status
  const statusColors = {
    plan: 'border-slate-700 hover:border-slate-500',
    watching: 'border-blue-500/50 hover:border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]',
    finished: 'border-emerald-500/50 hover:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
  }

  return (
    <div ref={setNodeRef} style={style} className="h-full touch-none">
      <motion.div
        layoutId={item.id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02, y: -2 }}
        className={`group relative bg-slate-900/80 backdrop-blur-sm border rounded-2xl overflow-hidden transition-all flex flex-col h-full ${statusColors[item.status]}`}
      >
        {/* Image Area */}
        <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
          {item.image_url ? (
            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
              <Film size={40} strokeWidth={1} />
              <span className="text-[10px] mt-2 uppercase tracking-widest">No Poster</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 text-[10px] font-bold text-white uppercase tracking-wider shadow-lg border border-white/5">
            {getTypeIcon(item.type)} {item.type}
          </div>

          {/* Drag Handle */}
          <div {...attributes} {...listeners} className="absolute top-2 right-2 bg-black/50 hover:bg-blue-600 text-white p-1.5 rounded-lg cursor-grab active:cursor-grabbing backdrop-blur-md transition-colors z-20 border border-white/10 opacity-0 group-hover:opacity-100 translate-y-[-10px] group-hover:translate-y-0 duration-200">
            <GripVertical size={16} />
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 flex flex-col flex-1 relative">
          {/* Gradient Overlay bottom of image */}
          <div className="absolute -top-10 left-0 w-full h-10 bg-gradient-to-t from-slate-900/90 to-transparent"></div>

          <div className="flex justify-between items-start mb-2 z-10">
            <h3 className="font-bold text-base text-slate-100 line-clamp-1 leading-tight" title={item.title}>{item.title}</h3>
            {item.link && (
              <a href={item.link} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-blue-400 transition" onPointerDown={(e) => e.stopPropagation()}>
                <LinkIcon size={16} />
              </a>
            )}
          </div>

          <p className="text-xs text-slate-400 line-clamp-3 mb-4 flex-1 leading-relaxed">
            {item.synopsis || <span className="italic opacity-50">No synopsis available.</span>}
          </p>

          <div className="pt-3 border-t border-white/5 flex justify-between items-center mt-auto">
            <span className="text-[10px] text-slate-600 font-mono uppercase">ID: {item.id.slice(0, 4)}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
              className="px-2 py-1 hover:bg-red-500/20 text-slate-600 hover:text-red-400 rounded-lg transition text-xs flex items-center gap-1"
            >
              <Trash2 size={12} /> Remove
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// --- COMPONENT: STATUS COLUMN (Droppable) ---
function StatusSection({ id, title, items, children, color }: { id: string, title: string, items: WatchlistItem[], children: React.ReactNode, color: string }) {
  const { setNodeRef } = useSortable({ id: id, data: { type: 'container', status: id } });

  return (
    <div ref={setNodeRef} className="flex flex-col space-y-4">
      {/* Header Column */}
      <div className={`flex items-center justify-between p-4 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-sm border-l-4 ${color}`}>
        <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
          {title}
        </h2>
        <span className="text-xs font-bold bg-white/5 text-slate-300 px-2.5 py-1 rounded-full border border-white/5 shadow-inner">
          {items.length}
        </span>
      </div>

      {/* Drop Zone */}
      <div className="min-h-[200px] h-full rounded-3xl transition-colors">
        {items.length === 0 ? (
          <div className="h-40 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-slate-600 gap-2 hover:border-white/10 transition-colors bg-slate-900/20">
            <Ghost size={24} className="opacity-20" />
            <span className="text-xs font-bold uppercase tracking-widest opacity-40">Drop items here</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

// --- PAGE: MAIN WATCHLIST ---
export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)

  // Custom Modal
  const { showModal } = useModal()

  // Form State
  const [formData, setFormData] = useState({
    title: '', type: 'movie', status: 'plan', link: '', synopsis: '', image_url: ''
  })

  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 1. FETCH DATA
  const fetchWatchlist = useCallback(async () => {
    const { data } = await supabase.from('watchlist').select('*').order('position', { ascending: true })
    if (data) setItems(data as WatchlistItem[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchWatchlist() }, [fetchWatchlist])

  // 2. IMAGE UPLOAD LOGIC (Paste & File Select)
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

  useEffect(() => {
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen])

  const processAndUploadImage = async (file: File) => {
    try {
      setIsUploading(true)
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 800, useWebWorker: true }
      const compressedFile = await imageCompression(file, options)

      const formDataUpload = new FormData()
      formDataUpload.append('file', compressedFile)
      formDataUpload.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '')

      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST', body: formDataUpload
      })
      const data = await res.json()
      setFormData(prev => ({ ...prev, image_url: data.secure_url }))
    } catch {
      alert("Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  // 3. CRUD OPERATIONS
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      showModal({
        title: 'Error', message: 'You must be logged in.', type: 'danger',
        onConfirm: function (): Promise<void> | void {
          throw new Error('Function not implemented.')
        }
      })
      return
    }

    // Check if Edit Mode (activeId is used temporarily to store ID being edited when modal is open, 
    // BUT activeId is also used for DnD. We should use a separate state or just reuse activeId if DnD is not active.
    // However, logic above sets activeId on click. DnD sets activeId on DragStart. 
    // They might conflict but likely not at same time. 
    // BETTER: Use a separate state `editingId`.
    // But since I used activeId in the previous step, I should use it here or check if items contains it.
    // Wait, activeId is string | null.

    // UPDATE
    if (activeId && items.find(i => i.id === activeId)) {
      const { error } = await supabase.from('watchlist').update({
        ...formData, updated_at: new Date()
      }).eq('id', activeId)

      if (!error) {
        setIsModalOpen(false)
        setActiveId(null)
        setFormData({ title: '', type: 'movie', status: 'plan', link: '', synopsis: '', image_url: '' })
        fetchWatchlist()
      }
    } else {
      // CREATE
      // Auto position at bottom
      const statusItems = items.filter(i => i.status === formData.status);
      const newPos = statusItems.length > 0 ? Math.max(...statusItems.map(i => i.position)) + 1 : 0;

      const { error } = await supabase.from('watchlist').insert({
        ...formData, user_id: user.id, position: newPos
      })

      if (!error) {
        setIsModalOpen(false)
        setFormData({ title: '', type: 'movie', status: 'plan', link: '', synopsis: '', image_url: '' })
        fetchWatchlist()
      } else {
        showModal({
          title: 'Error', message: error.message, type: 'danger',
          onConfirm: function (): Promise<void> | void {
            throw new Error('Function not implemented.')
          }
        })
      }
    }
  }

  const deleteItem = (id: string) => {
    showModal({
      title: 'Delete from Watchlist?',
      message: 'This action cannot be undone.',
      type: 'danger',
      confirmText: 'Yes, Delete',
      onConfirm: async () => {
        const { error } = await supabase.from('watchlist').delete().eq('id', id)
        if (!error) {
          setItems(prev => prev.filter(i => i.id !== id))
        }
      }
    })
  }

  // 4. DRAG AND DROP HANDLERS
  const findContainer = (id: string) => {
    if (items.find(i => i.id === id)) return items.find(i => i.id === id)?.status;
    if (['plan', 'watching', 'finished'].includes(id)) return id as StatusType;
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
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
      newItems[activeIndex] = { ...newItems[activeIndex], status: overContainer as StatusType };
      return arrayMove(newItems, activeIndex, newIndex);
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer) return;

    const oldIndex = items.findIndex(i => i.id === activeId);
    const newIndex = items.findIndex(i => i.id === overId);

    if (oldIndex === -1 || newIndex === -1) return;

    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems); // Update UI Immediately

    // Update DB
    const droppedItem = newItems.find(i => i.id === activeId);
    if (droppedItem) {
      await supabase.from('watchlist').update({ status: droppedItem.status }).eq('id', droppedItem.id);
      const containerItems = newItems.filter(i => i.status === droppedItem.status);
      await Promise.all(
        containerItems.map((item, idx) => supabase.from('watchlist').update({ position: idx }).eq('id', item.id))
      );
    }
  };

  const filteredItems = items.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-200 pb-40 animate-in fade-in duration-700">
      <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">My Watchlist</h1>
            <p className="text-slate-500 mt-2">Manage your movies and series workflow.</p>
          </div>

          <div className="flex w-full md:w-auto gap-4">
            <div className="relative group flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                type="text" placeholder="Search title..."
                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-blue-500/50 focus:bg-slate-900 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all text-slate-200"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all whitespace-nowrap"
            >
              <Plus size={20} /> <span className="hidden sm:inline">Add New</span>
            </button>
          </div>
        </div>

        {/* BOARD AREA */}
        {loading ? (
          <div className="flex justify-center pt-32"><Loader2 className="animate-spin text-blue-500" size={50} /></div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">

              {/* COLUMN 1: PLAN */}
              <SortableContext items={filteredItems.filter(i => i.status === 'plan').map(i => i.id)} strategy={rectSortingStrategy}>
                <StatusSection id="plan" title="Plan to Watch" items={filteredItems.filter(i => i.status === 'plan')} color="border-l-slate-500">
                  {filteredItems.filter(i => i.status === 'plan').map(item => <SortableItem key={item.id} item={item} onDelete={deleteItem} />)}
                </StatusSection>
              </SortableContext>

              {/* COLUMN 2: WATCHING */}
              <SortableContext items={filteredItems.filter(i => i.status === 'watching').map(i => i.id)} strategy={rectSortingStrategy}>
                <StatusSection id="watching" title="Watching Now" items={filteredItems.filter(i => i.status === 'watching')} color="border-l-blue-500">
                  {filteredItems.filter(i => i.status === 'watching').map(item => <SortableItem key={item.id} item={item} onDelete={deleteItem} />)}
                </StatusSection>
              </SortableContext>

              {/* COLUMN 3: FINISHED */}
              <SortableContext items={filteredItems.filter(i => i.status === 'finished').map(i => i.id)} strategy={rectSortingStrategy}>
                <StatusSection id="finished" title="Finished" items={filteredItems.filter(i => i.status === 'finished')} color="border-l-emerald-500">
                  {filteredItems.filter(i => i.status === 'finished').map(item => <SortableItem key={item.id} item={item} onDelete={deleteItem} />)}
                </StatusSection>
              </SortableContext>

            </div>

            {/* DRAG OVERLAY (Ghost Item) */}
            <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
              {activeId ? (
                <div className="opacity-90 rotate-3 cursor-grabbing w-[300px] pointer-events-none">
                  <div className="bg-slate-800 p-3 rounded-2xl border border-blue-500 shadow-2xl flex gap-3 items-center">
                    <div className="h-16 w-12 bg-slate-700 rounded-lg overflow-hidden shrink-0">
                      {items.find(i => i.id === activeId)?.image_url && <img src={items.find(i => i.id === activeId)?.image_url!} className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <div className="h-4 bg-slate-600 rounded w-32 mb-2"></div>
                      <div className="h-2 bg-slate-700 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* --- ADD MODAL --- */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2"><Film size={20} className="text-blue-500" /> Add New Entry</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition"><X size={20} /></button>
                </div>

                <form onSubmit={handleAddItem} className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Image Upload Area */}
                    <div className="w-full md:w-1/3 space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Cover Image</label>
                      <div className="relative group w-full aspect-[2/3] bg-slate-800 rounded-xl border-2 border-dashed border-white/10 hover:border-blue-500/50 transition-colors overflow-hidden flex flex-col items-center justify-center text-center cursor-pointer">
                        {formData.image_url ? (
                          <>
                            <img src={formData.image_url} className="w-full h-full object-cover" alt="Preview" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="text-xs font-bold text-white">Change Image</span>
                            </div>
                          </>
                        ) : (
                          <div className="p-4 space-y-2">
                            {isUploading ? <Loader2 className="animate-spin mx-auto text-blue-500" /> : <ImagePlus className="mx-auto text-slate-600 group-hover:text-blue-500 transition" />}
                            <p className="text-[10px] text-slate-500">Click or Paste (Ctrl+V)</p>
                          </div>
                        )}
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => { if (e.target.files?.[0]) await processAndUploadImage(e.target.files[0]) }} />
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="flex-1 space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Title</label>
                        <input required placeholder="Movie title..." className="w-full bg-slate-800 border border-white/5 p-3 rounded-xl outline-none focus:border-blue-500/50 text-white font-bold" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">Status</label>
                          <div className="relative">
                            <select className="w-full bg-slate-800 border border-white/5 p-3 rounded-xl outline-none appearance-none cursor-pointer" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}>
                              <option value="plan">📅 Plan</option>
                              <option value="watching">▶️ Watching</option>
                              <option value="finished">✅ Finished</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">Type</label>
                          <div className="relative">
                            <select className="w-full bg-slate-800 border border-white/5 p-3 rounded-xl outline-none appearance-none cursor-pointer" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })}>
                              <option value="movie">🎬 Movie</option>
                              <option value="series">📺 Series</option>
                              <option value="anime">👻 Anime</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Link (Optional)</label>
                        <input placeholder="https://..." className="w-full bg-slate-800 border border-white/5 p-3 rounded-xl outline-none focus:border-blue-500/50 text-sm text-slate-300" value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Synopsis</label>
                        <textarea rows={3} placeholder="Short description..." className="w-full bg-slate-800 border border-white/5 p-3 rounded-xl outline-none focus:border-blue-500/50 text-sm text-slate-300 resize-none" value={formData.synopsis} onChange={e => setFormData({ ...formData, synopsis: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-bold transition">Cancel</button>
                    <button type="submit" disabled={isUploading} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition flex items-center gap-2 disabled:opacity-50">
                      {isUploading ? <Loader2 className="animate-spin" /> : <Save size={18} />} Save Entry
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}