'use client'
import { useState } from 'react'
import { Trash2, ArrowRight } from 'lucide-react'
import { TaskItem } from '../types'

interface Props {
  tasks: TaskItem[]
  mode: string
  onAdd: (title: string) => void
  onDelete: (id: string) => void
  onMove: (id: string, currentStatus: string) => void
}

export default function KanbanBoard({ tasks, mode, onAdd, onDelete, onMove }: Props) {
  const [newTask, setNewTask] = useState('')

  const activeTasks = tasks.filter((t) => t.category === mode)

  return (
    <div className="space-y-4">
      {/* Input Task */}
      <div className="flex gap-2 mb-4">
        <input
          className="bg-white/5 flex-1 px-4 py-3 rounded-xl outline-none text-lg placeholder:opacity-30 focus:bg-white/10 transition"
          placeholder={`Target ${mode} baru?`}
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onAdd(newTask)
              setNewTask('')
            }
          }}
        />
      </div>

      {/* Grid Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['todo', 'doing', 'done'].map((status) => (
          <div key={status} className="bg-white/5 p-3 rounded-xl min-h-[200px]">
            <h3 className="uppercase text-xs font-bold opacity-40 mb-3 tracking-widest">{status}</h3>
            <div className="space-y-2">
              {activeTasks
                .filter((t) => t.status === status)
                .map((t) => (
                  <div
                    key={t.id}
                    className={`p-3 rounded-lg border border-white/5 ${
                      status === 'doing' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-black/20'
                    } group`}
                  >
                    <p className={`text-sm ${status === 'done' ? 'line-through opacity-50' : ''}`}>{t.title}</p>
                    <div className="flex justify-end gap-2 mt-2 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => onDelete(t.id)} className="text-red-400 hover:bg-red-900/50 p-1 rounded">
                        <Trash2 size={12} />
                      </button>
                      {status !== 'done' && (
                        <button
                          onClick={() => onMove(t.id, status)}
                          className="text-green-400 hover:bg-green-900/50 p-1 rounded"
                        >
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}