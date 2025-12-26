'use client'
import { useState } from 'react'
import { Trash2, Plus, Calendar, Clock } from 'lucide-react'

// Kita definisikan tipe data langsung di sini atau import dari types.ts
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

      {/* --- LIST EVENTS --- */}
      <div className="space-y-2 mb-4 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
        {loading ? (
           <p className="text-xs text-slate-600 animate-pulse">Loading events...</p>
        ) : events.length === 0 ? (
           <div className="text-center py-2 border border-dashed border-white/10 rounded-lg">
              <p className="text-[10px] text-slate-500">No events today</p>
           </div>
        ) : (
          events.map((e) => (
            <div key={e.id} className="flex items-center gap-2 text-xs group animate-in slide-in-from-left-2 duration-300">
              <div className="bg-orange-500/10 text-orange-300 px-1.5 py-0.5 rounded font-mono text-[10px] whitespace-nowrap border border-orange-500/20">
                {e.time}
              </div>
              <span className="flex-1 truncate text-slate-300 group-hover:text-white transition-colors" title={e.title}>
                {e.title}
              </span>
              <button 
                onClick={() => onDelete(e.id)} 
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* --- INPUT FORM --- */}
      <div className="flex flex-col gap-2 pt-3 border-t border-white/5">
        <div className="flex gap-2">
            <div className="relative w-16">
                <Clock size={10} className="absolute left-2 top-2 text-slate-500"/>
                <input
                  placeholder="09:00"
                  className="bg-black/30 w-full pl-6 pr-2 py-1.5 text-[10px] rounded-lg outline-none border border-white/5 focus:border-orange-500/50 transition-colors text-slate-300 placeholder:text-slate-600"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                />
            </div>
            <input
              placeholder="Meeting..."
              className="bg-black/30 flex-1 px-3 py-1.5 text-[10px] rounded-lg outline-none border border-white/5 focus:border-orange-500/50 transition-colors text-slate-300 placeholder:text-slate-600"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
        </div>
        <button 
            onClick={handleAdd} 
            disabled={!newEvent.title || !newEvent.time}
            className="w-full bg-orange-600/20 hover:bg-orange-600/40 text-orange-300 text-[10px] py-1.5 rounded-lg border border-orange-500/20 transition-all flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={12} /> Add Event
        </button>
      </div>
    </div>
  )
}