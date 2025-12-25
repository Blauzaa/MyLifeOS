'use client'
import { useState } from 'react'
import { Trash2, Plus, Calendar } from 'lucide-react'
import { EventItem } from '../types'

interface Props {
  events: EventItem[]
  onAdd: (event: Omit<EventItem, 'id'>) => void
  onDelete: (id: string) => void
}

export default function AgendaWidget({ events, onAdd, onDelete }: Props) {
  const [newEvent, setNewEvent] = useState({ title: '', time: '' })

  const handleAdd = () => {
    if (!newEvent.title || !newEvent.time) return
    onAdd(newEvent)
    setNewEvent({ title: '', time: '' })
  }

  return (
    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
      <h2 className="text-sm font-bold mb-3 flex items-center gap-2 text-orange-300">
        <Calendar size={14} /> Agenda Hari Ini
      </h2>
      <div className="space-y-2 mb-3">
        {events.map((e) => (
          <div key={e.id} className="flex gap-3 text-sm group">
            <span className="font-mono text-white/50 bg-white/5 px-1 rounded">{e.time}</span>
            <span className="flex-1 truncate">{e.title}</span>
            <button onClick={() => onDelete(e.id)} className="opacity-0 group-hover:opacity-100 text-red-400">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        {events.length === 0 && <p className="text-xs opacity-30">Tidak ada jadwal.</p>}
      </div>
      <div className="flex gap-2">
        <input
          placeholder="09:00"
          className="bg-black/20 w-16 px-2 py-1 text-xs rounded outline-none"
          value={newEvent.time}
          onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
        />
        <input
          placeholder="Meeting..."
          className="bg-black/20 flex-1 px-2 py-1 text-xs rounded outline-none"
          value={newEvent.title}
          onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
        />
        <button onClick={handleAdd} className="bg-orange-600/50 hover:bg-orange-600 px-2 rounded">
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}