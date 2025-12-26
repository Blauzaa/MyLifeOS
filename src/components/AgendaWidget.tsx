'use client'
import { useState } from 'react'
import { Trash2, Plus, Calendar, Clock } from 'lucide-react'

// --- PERBAIKAN: Tambahkan 'export' di sini ---
export interface EventItem {
  id: string
  title: string
  time: string // Kita pakai format string sederhana untuk widget sidebar
  user_id?: string
}

interface Props {
  events: EventItem[]
  onAdd: (title: string, time: string) => void
  onDelete: (id: string) => void
  loading?: boolean
}

export default function AgendaWidget({ events, onAdd, onDelete, loading }: Props) {
  // ... (kode komponen tetap sama seperti sebelumnya, pastikan logic inputnya benar)
  const [newEvent, setNewEvent] = useState({ title: '', time: '' })

  const handleAdd = () => {
    if (!newEvent.title || !newEvent.time) return
    onAdd(newEvent.title, newEvent.time)
    setNewEvent({ title: '', time: '' })
  }

  return (
    <div className="mx-4 mt-6 bg-slate-900/50 p-4 rounded-xl border border-white/5 shadow-inner">
      <h2 className="text-xs font-bold mb-4 flex items-center gap-2 text-orange-400 uppercase tracking-wider">
        <Calendar size={12} /> Today's Agenda
      </h2>
      
      {/* List Events */}
      <div className="space-y-2 mb-4 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
        {loading ? (
           <p className="text-xs text-slate-600 animate-pulse">Loading...</p>
        ) : events.length === 0 ? (
           <div className="text-center py-2 border border-dashed border-white/10 rounded-lg">
              <p className="text-[10px] text-slate-500">No events today</p>
           </div>
        ) : (
          events.map((e) => (
            <div key={e.id} className="flex items-center gap-2 text-xs group">
              <div className="bg-orange-500/10 text-orange-300 px-1.5 py-0.5 rounded font-mono text-[10px] whitespace-nowrap border border-orange-500/20">
                {e.time}
              </div>
              <span className="flex-1 truncate text-slate-300">{e.title}</span>
              <button onClick={() => onDelete(e.id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400">
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Input Form */}
      <div className="flex flex-col gap-2 pt-3 border-t border-white/5">
        <div className="flex gap-2">
            <input placeholder="09:00" className="bg-black/30 w-16 px-2 py-1.5 text-[10px] rounded border border-white/5 text-slate-300"
              value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} />
            <input placeholder="Meeting..." className="bg-black/30 flex-1 px-2 py-1.5 text-[10px] rounded border border-white/5 text-slate-300"
              value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} 
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}/>
        </div>
        <button onClick={handleAdd} className="w-full bg-orange-600/20 hover:bg-orange-600/40 text-orange-300 text-[10px] py-1.5 rounded border border-orange-500/20 flex items-center justify-center gap-1">
          <Plus size={12} /> Add Event
        </button>
      </div>
    </div>
  )
}