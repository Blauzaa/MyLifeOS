/* eslint-disable react-hooks/set-state-in-effect */
'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '../../utils/supabase/client'
import { Plus, Trash2, ArrowRight, CheckCircle, Clock, Loader2 } from 'lucide-react'

const supabase = createClient()

interface Task {
  id: string
  title: string
  status: 'todo' | 'doing' | 'done'
  created_at: string
}

interface TaskColumnProps {
  title: string
  status: 'todo' | 'doing' | 'done'
  icon: React.ElementType
  color: string
  tasks: Task[]
  onDelete: (id: string) => void
  onMove: (id: string, currentStatus: string) => void
}

const TaskColumn = ({ title, status, icon: Icon, color, tasks, onDelete, onMove }: TaskColumnProps) => (
  <div className="flex-1 min-w-[300px] bg-slate-800/30 rounded-3xl border border-white/5 p-5">
    <div className="flex items-center justify-between mb-6">
      <h3 className="font-bold flex items-center gap-2 uppercase text-xs tracking-widest opacity-50">
        <Icon size={16} className={color} /> {title} ({tasks.filter((t: Task) => t.status === status).length})
      </h3>
    </div>
    <div className="space-y-3">
      {tasks.filter((t: Task) => t.status === status).map((task: Task) => (
        <div key={task.id} className="group bg-slate-900 border border-white/5 p-4 rounded-2xl hover:border-blue-500/50 transition-all shadow-lg">
          <p className={`text-sm mb-4 ${status === 'done' ? 'line-through opacity-40' : 'text-slate-200'}`}>{task.title}</p>
          <div className="flex justify-between items-center">
            <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 text-red-400 p-2 hover:bg-red-400/10 rounded-lg transition">
              <Trash2 size={14} />
            </button>
            {status !== 'done' && (
              <button
                onClick={() => onMove(task.id, task.status)}
                className="flex items-center gap-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg text-white transition"
              >
                {status === 'todo' ? 'Start' : 'Finish'} <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
)

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(true)

  // Fix: Wrap in useCallback to make it a stable dependency
  const fetchTasks = useCallback(async () => {
    // Only set loading true if it's the initial load to avoid flickering on updates, 
    // or handle granular loading. For now, we'll keep it simple.
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
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
      user_id: user.id
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
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">✅ Task Manager</h1>
        <div className="flex gap-2 bg-slate-800 p-2 rounded-2xl border border-white/10 w-full md:w-96">
          <input
            placeholder="Tambah tugas baru..."
            className="bg-transparent px-3 py-1 w-full outline-none text-sm"
            value={newTask} onChange={e => setNewTask(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
          />
          <button onClick={addTask} className="bg-blue-600 p-2 rounded-xl hover:bg-blue-500 transition">
            <Plus size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 overflow-x-auto pb-4">
          <TaskColumn title="To Do" status="todo" icon={Clock} color="text-slate-400" tasks={tasks} onDelete={deleteTask} onMove={moveTask} />
          <TaskColumn title="In Progress" status="doing" icon={Plus} color="text-blue-400" tasks={tasks} onDelete={deleteTask} onMove={moveTask} />
          <TaskColumn title="Completed" status="done" icon={CheckCircle} color="text-emerald-400" tasks={tasks} onDelete={deleteTask} onMove={moveTask} />
        </div>
      )}
    </div>
  )
}