'use client'
import { useState } from 'react'
import { Trash2, Plus, Calendar, Clock, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useModal } from '../context/ModalContext' // Pastikan path import sesuai

// --- Interfaces ---
export interface EventItem {
  id: string
  title: string
  time: string 
  user_id?: string
}

interface Props {
  events: EventItem[]
  onAdd: (title: string, time: string) => void
  onDelete: (id: string) => void
  loading?: boolean
}

export default function AgendaWidget({ events, onAdd, onDelete, loading }: Props) {
  const [newEvent, setNewEvent] = useState({ title: '', time: '' })
  const { showModal } = useModal() // Menggunakan Custom Modal

  const handleAdd = () => {
    if (!newEvent.title || !newEvent.time) return
    onAdd(newEvent.title, newEvent.time)
    setNewEvent({ title: '', time: '' })
  }

  const handleDeleteClick = (id: string) => {
    showModal({
      title: 'Remove Agenda?',
      message: 'Are you sure you want to remove this item from your daily agenda?',
      type: 'danger',
      onConfirm: () => onDelete(id)
    })
  }

  return (
    <div className="mx-4 mt-6 bg-slate-900/50 p-5 rounded-2xl border border-white/5 shadow-xl backdrop-blur-sm">
      <h2 className="text-xs font-bold mb-4 flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-200 uppercase tracking-wider">
        <Calendar size={14} className="text-orange-400" /> Today's Agenda
      </h2>
      
      {/* List Events Area */}
      <div className="space-y-2 mb-4 max-h-[180px] overflow-y-auto custom-scrollbar pr-2 min-h-[60px]">
        {loading ? (
           <div className="flex items-center justify-center py-4 text-slate-500 gap-2">
              <Loader2 className="animate-spin" size={14}/> <span className="text-xs">Loading...</span>
           </div>
        ) : events.length === 0 ? (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }}
             className="text-center py-4 border-2 border-dashed border-white/5 rounded-xl bg-black/20"
           >
              <Clock className="mx-auto mb-1 text-slate-600" size={16}/>
              <p className="text-[10px] text-slate-500">No events scheduled</p>
           </motion.div>
        ) : (
          <AnimatePresence mode='popLayout'>
            {events.map((e) => (
              <motion.div 
                layout
                key={e.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-3 text-xs group bg-black/20 p-2 rounded-lg border border-transparent hover:border-white/5 transition-colors"
              >
                <div className="bg-orange-500/10 text-orange-300 px-2 py-1 rounded-md font-mono text-[10px] whitespace-nowrap border border-orange-500/20 font-bold">
                  {e.time}
                </div>
                <span className="flex-1 truncate text-slate-300 font-medium">{e.title}</span>
                <button 
                  onClick={() => handleDeleteClick(e.id)} 
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                  title="Remove"
                >
                  <Trash2 size={12} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Input Form Area */}
      <div className="flex flex-col gap-2 pt-3 border-t border-white/5">
        <div className="flex gap-2">
            {/* Input Time dengan style dark mode */}
            <input 
              type="time"
              className="bg-slate-950 w-24 px-2 py-2 text-[10px] rounded-lg border border-white/10 text-slate-300 outline-none focus:border-orange-500 transition [color-scheme:dark]"
              value={newEvent.time} 
              onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} 
            />
            
            <input 
              placeholder="Meeting..." 
              className="bg-slate-950 flex-1 px-3 py-2 text-[10px] rounded-lg border border-white/10 text-slate-300 outline-none focus:border-orange-500 transition placeholder:text-slate-600"
              value={newEvent.title} 
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} 
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
        </div>
        
        <button 
          onClick={handleAdd} 
          disabled={!newEvent.title || !newEvent.time}
          className="w-full bg-gradient-to-r from-orange-600/80 to-amber-600/80 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-bold py-2 rounded-lg shadow-lg shadow-orange-900/20 flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
        >
          <Plus size={12} strokeWidth={3} /> Add to Agenda
        </button>
      </div>
    </div>
  )
}