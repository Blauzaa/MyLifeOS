'use client'
import { useState } from 'react'
import { Trash2, ArrowRight, Plus, Circle, Clock, CheckCircle2, GripVertical } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useModal } from '../context/ModalContext' // Sesuaikan path
import { TaskItem } from '../types'

interface Props {
  tasks: TaskItem[]
  mode: string
  onAdd: (title: string) => void
  onDelete: (id: string) => void
  onMove: (id: string, currentStatus: string) => void
}

const COLUMN_CONFIG = {
  todo: {
    label: 'To Do',
    icon: <Circle size={14} />,
    color: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    accent: 'bg-slate-500'
  },
  doing: {
    label: 'In Progress',
    icon: <Clock size={14} />,
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    accent: 'bg-blue-500'
  },
  done: {
    label: 'Completed',
    icon: <CheckCircle2 size={14} />,
    color: 'bg-green-500/10 text-green-400 border-green-500/20',
    accent: 'bg-green-500'
  }
}

export default function KanbanBoard({ tasks, mode, onAdd, onDelete, onMove }: Props) {
  const [newTask, setNewTask] = useState('')
  const { showModal } = useModal()

  const activeTasks = tasks.filter((t) => t.category === mode)

  const handleAdd = () => {
    if (!newTask.trim()) return
    onAdd(newTask)
    setNewTask('')
  }

  const handleDeleteClick = (id: string) => {
    showModal({
      title: 'Delete Task?',
      message: 'Are you sure you want to remove this task permanently?',
      type: 'danger',
      onConfirm: () => onDelete(id)
    })
  }

  return (
    <div className="space-y-6">
      
      {/* Input Section (Enhanced) */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
           <Plus className="text-slate-500" size={20}/>
        </div>
        <input
          className="w-full bg-slate-900/50 backdrop-blur-sm border border-white/10 pl-12 pr-20 py-4 rounded-2xl outline-none text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition shadow-xl"
          placeholder={`Add new target for ${mode}...`}
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button 
          onClick={handleAdd}
          disabled={!newTask}
          className="absolute right-2 top-2 bottom-2 bg-white/10 hover:bg-white/20 text-white px-4 rounded-xl text-xs font-bold transition disabled:opacity-0 disabled:scale-90"
        >
          Add
        </button>
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(['todo', 'doing', 'done'] as const).map((status) => {
          const config = COLUMN_CONFIG[status]
          const columnTasks = activeTasks.filter((t) => t.status === status)

          return (
            <div key={status} className="flex flex-col h-full">
              
              {/* Column Header */}
              <div className={`flex items-center gap-2 px-4 py-3 rounded-t-2xl border-x border-t ${config.color} backdrop-blur-sm`}>
                {config.icon}
                <h3 className="uppercase text-xs font-bold tracking-widest flex-1">{config.label}</h3>
                <span className="text-[10px] font-mono bg-black/20 px-2 py-0.5 rounded-full opacity-70">
                  {columnTasks.length}
                </span>
              </div>

              {/* Column Body */}
              <div className="bg-slate-900/40 border-x border-b border-white/5 rounded-b-2xl p-3 min-h-[300px] flex-1 flex flex-col gap-3 relative">
                 
                 {/* Empty State Visual */}
                 {columnTasks.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10 pointer-events-none">
                        <div className={`w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center mb-2 ${status === 'todo' ? 'border-slate-500' : status === 'doing' ? 'border-blue-500' : 'border-green-500'}`}>
                           {config.icon}
                        </div>
                        <p className="text-[10px] uppercase font-bold tracking-widest">No Items</p>
                    </div>
                 )}

                 <AnimatePresence mode='popLayout'>
                   {columnTasks.map((t) => (
                     <motion.div
                       layout // Magic prop: otomatis menganimasikan posisi saat pindah kolom
                       initial={{ opacity: 0, scale: 0.9, y: 10 }}
                       animate={{ opacity: 1, scale: 1, y: 0 }}
                       exit={{ opacity: 0, scale: 0.95 }}
                       transition={{ type: "spring", stiffness: 350, damping: 25 }}
                       key={t.id}
                       className={`group relative p-4 rounded-xl border backdrop-blur-md shadow-sm hover:shadow-lg transition-all
                         ${status === 'done' 
                           ? 'bg-slate-900/50 border-white/5 opacity-60 hover:opacity-100' 
                           : 'bg-slate-800/80 border-white/10 hover:border-white/20 hover:-translate-y-1'
                         }`}
                     >
                       {/* Decorative Side Bar */}
                       <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${config.accent} opacity-50`}></div>

                       <div className="pl-3">
                         <p className={`text-sm font-medium leading-relaxed ${status === 'done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                           {t.title}
                         </p>
                       </div>

                       {/* Action Overlay */}
                       <div className="flex justify-end items-center gap-2 mt-3 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                         <button 
                            onClick={() => handleDeleteClick(t.id)} 
                            className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition"
                            title="Delete"
                         >
                           <Trash2 size={14} />
                         </button>
                         
                         {status !== 'done' && (
                           <button
                             onClick={() => onMove(t.id, status)}
                             className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 px-2 py-1.5 rounded-lg transition"
                           >
                             <span>Next</span> <ArrowRight size={12} />
                           </button>
                         )}
                       </div>
                     </motion.div>
                   ))}
                 </AnimatePresence>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}