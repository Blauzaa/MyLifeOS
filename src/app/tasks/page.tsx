/* eslint-disable react-hooks/set-state-in-effect */
'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '../../utils/supabase/client'
import { 
  Plus, Trash2, ArrowRight, CheckCircle, Clock, Loader2, 
  Calendar, Flag, CheckSquare, X, AlertCircle 
} from 'lucide-react'

const supabase = createClient()

// --- Types ---
interface Subtask {
  id: string
  task_id: string
  title: string
  is_completed: boolean
}

interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'doing' | 'done'
  priority: 'low' | 'medium' | 'high'
  deadline?: string
  created_at: string
  subtasks: Subtask[]
}

// --- Components ---

// 1. Task Modal (Untuk Edit Detail, Subtask, Prioritas, Deadline)
const TaskModal = ({ task, onClose, onUpdate }: { task: Task, onClose: () => void, onUpdate: () => void }) => {
  const [subtaskInput, setSubtaskInput] = useState('')
  const [localTask, setLocalTask] = useState<Task>(task)

  // Update field task utama (Priority, Deadline, Desc)
  const updateTaskField = async (field: Partial<Task>) => {
    const { error } = await supabase.from('tasks').update(field).eq('id', task.id)
    if (!error) {
      setLocalTask(prev => ({ ...prev, ...field }))
      onUpdate() // Refresh parent
    }
  }

  // Subtask Logic
  const addSubtask = async () => {
    if (!subtaskInput) return
    const { data, error } = await supabase.from('subtasks').insert({
      task_id: task.id,
      title: subtaskInput
    }).select().single()

    if (!error && data) {
      setSubtaskInput('')
      setLocalTask(prev => ({ ...prev, subtasks: [...prev.subtasks, data] }))
      onUpdate()
    }
  }

  const toggleSubtask = async (subId: string, currentStatus: boolean) => {
    const { error } = await supabase.from('subtasks').update({ is_completed: !currentStatus }).eq('id', subId)
    if (!error) {
      setLocalTask(prev => ({
        ...prev,
        subtasks: prev.subtasks.map(s => s.id === subId ? { ...s, is_completed: !currentStatus } : s)
      }))
      onUpdate()
    }
  }

  const deleteSubtask = async (subId: string) => {
    const { error } = await supabase.from('subtasks').delete().eq('id', subId)
    if (!error) {
      setLocalTask(prev => ({ ...prev, subtasks: prev.subtasks.filter(s => s.id !== subId) }))
      onUpdate()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-start bg-slate-800/50">
          <input 
            value={localTask.title} 
            onChange={(e) => {
               setLocalTask(p => ({...p, title: e.target.value}))
            }}
            onBlur={(e) => updateTaskField({ title: e.target.value })}
            className="bg-transparent text-xl font-bold w-full outline-none text-white placeholder-slate-500"
          />
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg"><X size={20} /></button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          
          {/* Controls: Priority & Deadline */}
          <div className="flex gap-4 flex-wrap">
            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Priority</label>
              <div className="flex bg-slate-800 rounded-lg p-1 border border-white/5">
                {(['low', 'medium', 'high'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => updateTaskField({ priority: p })}
                    className={`px-3 py-1 text-xs rounded-md capitalize transition ${localTask.priority === p 
                      ? (p === 'high' ? 'bg-red-500/20 text-red-400' : p === 'medium' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400') 
                      : 'text-slate-400 hover:text-white'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Deadline</label>
              <input 
                type="date" 
                className="block bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500"
                value={localTask.deadline ? new Date(localTask.deadline).toISOString().split('T')[0] : ''}
                onChange={(e) => updateTaskField({ deadline: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center gap-2">
              Description
            </label>
            <textarea 
              className="w-full bg-slate-800/50 border border-white/5 rounded-xl p-3 text-sm min-h-[100px] outline-none focus:border-blue-500/50 transition"
              placeholder="Tambahkan detail tugas..."
              value={localTask.description || ''}
              onChange={(e) => setLocalTask(prev => ({ ...prev, description: e.target.value }))}
              onBlur={(e) => updateTaskField({ description: e.target.value })}
            />
          </div>

          {/* Subtasks */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center gap-2">
                <CheckSquare size={14} /> Subtasks
              </label>
              <span className="text-xs text-slate-500">
                {localTask.subtasks.filter(s => s.is_completed).length}/{localTask.subtasks.length} Done
              </span>
            </div>
            
            <div className="flex gap-2">
              <input 
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                placeholder="Tambah langkah kecil..."
                className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500/50"
              />
              <button onClick={addSubtask} className="bg-blue-600 hover:bg-blue-500 px-3 rounded-lg"><Plus size={18} /></button>
            </div>

            <div className="space-y-2 mt-2">
              {localTask.subtasks.map(sub => (
                <div key={sub.id} className="flex items-center gap-3 group bg-slate-800/30 p-2 rounded-lg hover:bg-slate-800 transition">
                  <button 
                    onClick={() => toggleSubtask(sub.id, sub.is_completed)}
                    className={`p-1 rounded flex-shrink-0 ${sub.is_completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}
                  >
                    {sub.is_completed ? <CheckCircle size={14} /> : <div className="w-3.5 h-3.5 border-2 border-current rounded-sm" />}
                  </button>
                  <span className={`text-sm flex-1 ${sub.is_completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                    {sub.title}
                  </span>
                  <button onClick={() => deleteSubtask(sub.id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 2. Task Card (Updated UI)
const TaskCard = ({ task, onDelete, onMove, onClick }: { task: Task, onDelete: (id: string) => void, onMove: (id: string, status: string) => void, onClick: () => void }) => {
  
  // Logic warna prioritas
  const priorityColor = {
    high: 'border-l-red-500',
    medium: 'border-l-orange-500',
    low: 'border-l-blue-500'
  }[task.priority || 'medium']

  const priorityBadge = {
    high: 'bg-red-500/10 text-red-400',
    medium: 'bg-orange-500/10 text-orange-400',
    low: 'bg-blue-500/10 text-blue-400'
  }[task.priority || 'medium']

  // Logic Deadline
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done'
  const deadlineText = task.deadline ? new Date(task.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : null

  // Logic Subtasks Progress
  const doneSubtasks = task.subtasks.filter(s => s.is_completed).length
  const totalSubtasks = task.subtasks.length
  const progress = totalSubtasks === 0 ? 0 : (doneSubtasks / totalSubtasks) * 100

  return (
    <div 
      onClick={onClick}
      className={`group bg-slate-900 border border-white/5 rounded-xl p-4 hover:border-blue-500/30 transition-all shadow-lg cursor-pointer relative border-l-4 ${priorityColor}`}
    >
      {/* Header Card: Title & Priority */}
      <div className="flex justify-between items-start mb-2">
        <h4 className={`text-sm font-medium ${task.status === 'done' ? 'line-through opacity-50' : 'text-slate-100'}`}>
          {task.title}
        </h4>
      </div>

      {/* Meta Info Row */}
      <div className="flex items-center gap-3 mb-3 text-xs">
        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${priorityBadge}`}>
          {task.priority}
        </span>
        
        {deadlineText && (
          <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
            {isOverdue ? <AlertCircle size={12} /> : <Calendar size={12} />}
            {deadlineText}
          </div>
        )}
      </div>

      {/* Subtask Progress Bar */}
      {totalSubtasks > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>Subtasks</span>
            <span>{doneSubtasks}/{totalSubtasks}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center mt-2 border-t border-white/5 pt-3">
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(task.id) }} 
          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition"
        >
          <Trash2 size={14} />
        </button>
        
        {task.status !== 'done' && (
          <button
            onClick={(e) => { e.stopPropagation(); onMove(task.id, task.status) }}
            className="flex items-center gap-1 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-white transition border border-white/10"
          >
            {task.status === 'todo' ? 'Start' : 'Finish'} <ArrowRight size={12} />
          </button>
        )}
      </div>
    </div>
  )
}

interface TaskColumnProps {
  title: string
  status: 'todo' | 'doing' | 'done'
  icon: React.ElementType
  color: string
  tasks: Task[]
  onDelete: (id: string) => void
  onMove: (id: string, currentStatus: string) => void
  onTaskClick: (task: Task) => void
}

const TaskColumn = ({ title, status, icon: Icon, color, tasks, onDelete, onMove, onTaskClick }: TaskColumnProps) => (
  <div className="flex-1 min-w-[300px] bg-slate-800/20 rounded-3xl border border-white/5 p-4 flex flex-col h-full">
    <div className="flex items-center justify-between mb-4 px-2">
      <h3 className="font-bold flex items-center gap-2 uppercase text-xs tracking-widest opacity-60">
        <Icon size={14} className={color} /> {title} 
        <span className="bg-slate-800 px-2 py-0.5 rounded-full text-[10px] border border-white/5">
          {tasks.filter((t) => t.status === status).length}
        </span>
      </h3>
    </div>
    <div className="space-y-3 overflow-y-auto custom-scrollbar pb-10">
      {tasks.filter((t) => t.status === status).map((task) => (
        <TaskCard 
          key={task.id} 
          task={task} 
          onDelete={onDelete} 
          onMove={onMove} 
          onClick={() => onTaskClick(task)}
        />
      ))}
    </div>
  </div>
)

// --- Main Page ---

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const fetchTasks = useCallback(async () => {
    // Kita perlu join tabel subtasks
    const { data } = await supabase
      .from('tasks')
      .select(`
        *,
        subtasks (*)
      `)
      .order('created_at', { ascending: false })
      .order('created_at', { referencedTable: 'subtasks', ascending: true }) // Sort subtask by creation

    if (data) setTasks(data as Task[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const addTask = async () => {
    if (!newTask) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert("Login dulu!")

    const { error } = await supabase.from('tasks').insert({
      title: newTask,
      status: 'todo',
      user_id: user.id,
      priority: 'medium' // Default priority
    })

    if (!error) {
      setNewTask('')
      fetchTasks()
    }
  }

  const moveTask = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'todo' ? 'doing' : 'done'
    const { error } = await supabase.from('tasks').update({ status: nextStatus }).eq('id', id)
    if (!error) fetchTasks()
  }

  const deleteTask = async (id: string) => {
    if(!confirm("Yakin hapus tugas ini?")) return
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
    if (selectedTask?.id === id) setSelectedTask(null)
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">✅ Task Board</h1>
          <p className="text-slate-400 text-sm mt-1">Manage priorities, deadlines, and subtasks.</p>
        </div>
        <div className="flex gap-2 bg-slate-900 p-1.5 rounded-xl border border-white/10 w-full md:w-96 shadow-inner">
          <input
            placeholder="Tambah tugas baru..."
            className="bg-transparent px-3 py-1 w-full outline-none text-sm text-white placeholder-slate-500"
            value={newTask} 
            onChange={e => setNewTask(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
          />
          <button onClick={addTask} className="bg-blue-600 p-2 rounded-lg hover:bg-blue-500 transition text-white shadow-lg shadow-blue-900/20">
            <Plus size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 overflow-x-auto pb-4 h-full">
          <TaskColumn 
            title="To Do" 
            status="todo" 
            icon={Clock} 
            color="text-slate-400" 
            tasks={tasks} 
            onDelete={deleteTask} 
            onMove={moveTask} 
            onTaskClick={setSelectedTask}
          />
          <TaskColumn 
            title="In Progress" 
            status="doing" 
            icon={Loader2} 
            color="text-blue-400" 
            tasks={tasks} 
            onDelete={deleteTask} 
            onMove={moveTask} 
            onTaskClick={setSelectedTask}
          />
          <TaskColumn 
            title="Completed" 
            status="done" 
            icon={CheckCircle} 
            color="text-emerald-400" 
            tasks={tasks} 
            onDelete={deleteTask} 
            onMove={moveTask} 
            onTaskClick={setSelectedTask}
          />
        </div>
      )}

      {/* Render Modal if Task Selected */}
      {selectedTask && (
        <TaskModal 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
          onUpdate={fetchTasks}
        />
      )}
    </div>
  )
}