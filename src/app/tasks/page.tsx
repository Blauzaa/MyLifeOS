/* eslint-disable react-hooks/set-state-in-effect */
'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '../../utils/supabase/client'
import { 
  Plus, Trash2, CheckCircle, Clock, Loader2, 
  Calendar, CheckSquare, X, AlertCircle, AlertTriangle 
} from 'lucide-react'
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
  position?: number
}

// --- COMPONENTS ---

// 1. CUSTOM CONFIRMATION MODAL (Pengganti Alert/Confirm Browser)
const ConfirmationModal = ({ isOpen, title, message, type = 'danger', onConfirm, onCancel }: { 
    isOpen: boolean, 
    title: string, 
    message: string, 
    type?: 'danger' | 'warning' | 'info',
    onConfirm: () => void, 
    onCancel: () => void 
}) => {
    if (!isOpen) return null;
    
    const colors = {
        danger: 'bg-red-600 hover:bg-red-500',
        warning: 'bg-orange-600 hover:bg-orange-500',
        info: 'bg-blue-600 hover:bg-blue-500'
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-2xl p-6 shadow-2xl scale-100">
                <div className="flex items-center gap-3 mb-4">
                    {type === 'danger' && <div className="p-2 bg-red-500/20 rounded-full text-red-500"><Trash2 size={24}/></div>}
                    {type === 'warning' && <div className="p-2 bg-orange-500/20 rounded-full text-orange-500"><AlertTriangle size={24}/></div>}
                    {type === 'info' && <div className="p-2 bg-blue-500/20 rounded-full text-blue-500"><AlertCircle size={24}/></div>}
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                </div>
                <p className="text-slate-400 mb-6 text-sm leading-relaxed">{message}</p>
                <div className="flex gap-3 justify-end">
                    <button onClick={onCancel} className="px-4 py-2 text-slate-300 hover:bg-white/5 rounded-lg text-sm font-medium transition">Cancel</button>
                    <button onClick={onConfirm} className={`px-4 py-2 text-white rounded-lg text-sm font-bold shadow-lg transition ${colors[type]}`}>
                        {type === 'danger' ? 'Yes, Delete' : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// 2. TASK EDIT MODAL (Detail & Subtasks)
const TaskModal = ({ task, onClose, onUpdate }: { task: Task, onClose: () => void, onUpdate: () => void }) => {
  const [subtaskInput, setSubtaskInput] = useState('')
  const [localTask, setLocalTask] = useState<Task>(task)

  const updateTaskField = async (field: Partial<Task>) => {
    const { error } = await supabase.from('tasks').update(field).eq('id', task.id)
    if (!error) {
      setLocalTask(prev => ({ ...prev, ...field }))
      onUpdate()
    }
  }

  const addSubtask = async () => {
    if (!subtaskInput) return
    const { data, error } = await supabase.from('subtasks').insert({
      task_id: task.id, title: subtaskInput
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
      <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-white/10 flex justify-between items-start bg-slate-800/50">
          <input 
            value={localTask.title} 
            onChange={(e) => setLocalTask(p => ({...p, title: e.target.value}))}
            onBlur={(e) => updateTaskField({ title: e.target.value })}
            className="bg-transparent text-xl font-bold w-full outline-none text-white placeholder-slate-500"
          />
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          <div className="flex gap-4 flex-wrap">
            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase font-bold">Priority</label>
              <div className="flex bg-slate-800 rounded-lg p-1 border border-white/5">
                {(['low', 'medium', 'high'] as const).map(p => (
                  <button key={p} onClick={() => updateTaskField({ priority: p })}
                    className={`px-3 py-1 text-xs rounded-md capitalize transition ${localTask.priority === p ? (p === 'high' ? 'bg-red-500/20 text-red-400' : p === 'medium' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400') : 'text-slate-400'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase font-bold">Deadline</label>
              <input type="date" className="block bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                value={localTask.deadline ? new Date(localTask.deadline).toISOString().split('T')[0] : ''}
                onChange={(e) => updateTaskField({ deadline: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-400 uppercase font-bold">Description</label>
            <textarea className="w-full bg-slate-800/50 border border-white/5 rounded-xl p-3 text-sm min-h-[100px] outline-none resize-none"
              placeholder="Detail tugas..."
              value={localTask.description || ''}
              onChange={(e) => setLocalTask(prev => ({ ...prev, description: e.target.value }))}
              onBlur={(e) => updateTaskField({ description: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs text-slate-400 uppercase font-bold flex items-center gap-2"><CheckSquare size={14} /> Subtasks</label>
              <span className="text-xs text-slate-500">{localTask.subtasks.filter(s => s.is_completed).length}/{localTask.subtasks.length} Done</span>
            </div>
            <div className="flex gap-2">
              <input value={subtaskInput} onChange={(e) => setSubtaskInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                placeholder="Tambah langkah kecil..." className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none" />
              <button onClick={addSubtask} className="bg-blue-600 hover:bg-blue-500 px-3 rounded-lg"><Plus size={18} /></button>
            </div>
            <div className="space-y-2 mt-2">
              {localTask.subtasks.map(sub => (
                <div key={sub.id} className="flex items-center gap-3 group bg-slate-800/30 p-2 rounded-lg hover:bg-slate-800 transition">
                  <button onClick={() => toggleSubtask(sub.id, sub.is_completed)} className={`p-1 rounded flex-shrink-0 ${sub.is_completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                    {sub.is_completed ? <CheckCircle size={14} /> : <div className="w-3.5 h-3.5 border-2 border-current rounded-sm" />}
                  </button>
                  <span className={`text-sm flex-1 ${sub.is_completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>{sub.title}</span>
                  <button onClick={() => deleteSubtask(sub.id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 3. SORTABLE TASK CARD (Draggable)
const SortableTaskCard = ({ task, onClick, onDeleteRequest }: { task: Task, onClick: () => void, onDeleteRequest: (id: string) => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id, data: { ...task } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const priorityColor = { high: 'border-l-red-500', medium: 'border-l-orange-500', low: 'border-l-blue-500' }[task.priority || 'medium']
  const priorityBadge = { high: 'bg-red-500/10 text-red-400', medium: 'bg-orange-500/10 text-orange-400', low: 'bg-blue-500/10 text-blue-400' }[task.priority || 'medium']
  
  const doneSubtasks = task.subtasks.filter(s => s.is_completed).length
  const totalSubtasks = task.subtasks.length
  const progress = totalSubtasks === 0 ? 0 : (doneSubtasks / totalSubtasks) * 100
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done'

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={onClick}
      className={`group bg-slate-900 border border-white/5 rounded-xl p-4 hover:border-blue-500/30 transition-all shadow-lg cursor-grab active:cursor-grabbing relative border-l-4 ${priorityColor} touch-none`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className={`text-sm font-medium ${task.status === 'done' ? 'line-through opacity-50' : 'text-slate-100'}`}>{task.title}</h4>
      </div>
      <div className="flex items-center gap-3 mb-3 text-xs">
        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${priorityBadge}`}>{task.priority}</span>
        {task.deadline && (
          <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
            {isOverdue ? <AlertCircle size={12} /> : <Calendar size={12} />}
            {new Date(task.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
          </div>
        )}
      </div>
      {totalSubtasks > 0 && (
        <div className="mb-2">
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className={`h-full rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      <button onClick={(e) => { e.stopPropagation(); onDeleteRequest(task.id) }} 
        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition p-1 rounded-md hover:bg-white/5"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// 4. COLUMN CONTAINER
const TaskColumn = ({ title, status, icon: Icon, color, tasks, onTaskClick, onDeleteRequest }: { title: string, status: string, icon: any, color: string, tasks: Task[], onTaskClick: (t: Task) => void, onDeleteRequest: (id: string) => void }) => {
    const { setNodeRef } = useSortable({ id: status, data: { type: 'container', status } });
    const filteredTasks = tasks.filter((t) => t.status === status);

    return (
        <div ref={setNodeRef} className="flex-1 min-w-[300px] bg-slate-800/20 rounded-3xl border border-white/5 p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-bold flex items-center gap-2 uppercase text-xs tracking-widest opacity-60">
                    <Icon size={14} className={color} /> {title} 
                    <span className="bg-slate-800 px-2 py-0.5 rounded-full text-[10px] border border-white/5 text-slate-300">{filteredTasks.length}</span>
                </h3>
            </div>
            <div className="space-y-3 overflow-y-auto custom-scrollbar pb-10 flex-1 min-h-[100px]">
                <SortableContext items={filteredTasks.map(t => t.id)} strategy={rectSortingStrategy}>
                    {filteredTasks.map((task) => (
                        <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} onDeleteRequest={onDeleteRequest} />
                    ))}
                </SortableContext>
                {filteredTasks.length === 0 && (
                   <div className="h-full border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center text-slate-600 text-xs italic">Drop here</div>
                )}
            </div>
        </div>
    )
}

// --- MAIN PAGE ---

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const { showModal } = useModal()
  // Custom Modal State
  const [modalConfig, setModalConfig] = useState<{ 
      isOpen: boolean, type: 'danger'|'warning'|'info', title: string, message: string, onConfirm: () => void 
  }>({ isOpen: false, type: 'info', title: '', message: '', onConfirm: () => {} })

  // DnD State
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase.from('tasks').select(`*, subtasks (*)`).order('created_at', { ascending: false })
    if (data) setTasks(data as Task[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  // --- CRUD Logic ---
  const addTask = async () => {
    if (!newTask) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert("Login required")
    const { error } = await supabase.from('tasks').insert({ title: newTask, status: 'todo', user_id: user.id, priority: 'medium' })
    if (!error) { setNewTask(''); fetchTasks() }
  }

  const handleDeleteRequest = (id: string) => {
    showModal({
      title: 'Delete Task?',
      message: 'This action cannot be undone. Are you sure?',
      type: 'danger',
      confirmText: 'Yes, Delete',
      onConfirm: async () => {
         // Logic hapus di sini
         await supabase.from('tasks').delete().eq('id', id);
         setTasks(prev => prev.filter(t => t.id !== id));
      }
    })
  }

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;

    const findStatus = (id: string) => {
        const foundTask = tasks.find(t => t.id === id);
        if (foundTask) return foundTask.status;
        if (['todo', 'doing', 'done'].includes(id)) return id;
        return null;
    }

    const activeStatus = findStatus(activeId);
    const overStatus = findStatus(overId);

    if (!activeStatus || !overStatus || activeStatus === overStatus) return;

    setTasks((prev) => {
        const activeIndex = prev.findIndex(t => t.id === activeId);
        const overIndex = prev.findIndex(t => t.id === overId);
        let newIndex;
        if (['todo', 'doing', 'done'].includes(overId)) {
            newIndex = prev.length + 1;
        } else {
            const isBelowOverItem = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
            const modifier = isBelowOverItem ? 1 : 0;
            newIndex = overIndex >= 0 ? overIndex + modifier : prev.length + 1;
        }

        const newItems = [...prev];
        newItems[activeIndex] = { ...newItems[activeIndex], status: overStatus as any };
        return arrayMove(newItems, activeIndex, newIndex);
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = active.id as string;
    setActiveId(null);

    if (!over) return;

    const overId = over.id as string;
    // Helper to find container status
    const findContainer = (id: string) => {
        if (['todo', 'doing', 'done'].includes(id)) return id;
        return tasks.find(t => t.id === id)?.status;
    };
    
    const targetStatus = findContainer(overId);
    const item = tasks.find(t => t.id === activeId);

    if (!item || !targetStatus) return;

    // --- LOGIC: CHECK SUBTASKS WHEN MOVING TO DONE ---
    if (targetStatus === 'done' && item.subtasks.length > 0) {
        const hasIncompleteSubtasks = item.subtasks.some(s => !s.is_completed);
        
        if (hasIncompleteSubtasks) {
            // STOP! Tampilkan Modal Konfirmasi
            showModal({
           title: 'Unfinished Subtasks',
           message: `Task "${item.title}" still has unchecked subtasks. Mark as done?`,
           type: 'warning',
           confirmText: 'Force Done',
           onConfirm: async () => {
              await updateTaskStatusAndOrder(activeId, 'done');
           }
        })
        return; 
     }
    }

    // Normal move
    await updateTaskStatusAndOrder(activeId, targetStatus as string);
  };

  const updateTaskStatusAndOrder = async (taskId: string, status: string) => {
      // Optimistic update sudah terjadi di onDragOver, tinggal sync DB
      await supabase.from('tasks').update({ status }).eq('id', taskId);
      // Re-fetch untuk memastikan urutan benar (opsional bisa dioptimasi)
      fetchTasks(); 
  }

  const cancelModal = () => {
      setModalConfig(prev => ({...prev, isOpen: false}));
      fetchTasks(); // Revert visual drag if user cancelled
  }

  // --- RENDER ---
  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">✅ Kanban Board</h1>
          <p className="text-slate-400 text-sm mt-1">Drag and drop tasks to manage progress.</p>
        </div>
        <div className="flex gap-2 bg-slate-900 p-1.5 rounded-xl border border-white/10 w-full md:w-96 shadow-inner">
          <input placeholder="New Task..." className="bg-transparent px-3 py-1 w-full outline-none text-sm text-white placeholder-slate-500"
            value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} />
          <button onClick={addTask} className="bg-blue-600 p-2 rounded-lg hover:bg-blue-500 transition text-white shadow-lg"><Plus size={18} /></button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
            <div className="flex flex-col lg:flex-row gap-6 overflow-x-auto pb-4 h-full">
                <TaskColumn title="To Do" status="todo" icon={Clock} color="text-slate-400" tasks={tasks} onTaskClick={setSelectedTask} onDeleteRequest={handleDeleteRequest} />
                <TaskColumn title="In Progress" status="doing" icon={Loader2} color="text-blue-400" tasks={tasks} onTaskClick={setSelectedTask} onDeleteRequest={handleDeleteRequest} />
                <TaskColumn title="Completed" status="done" icon={CheckCircle} color="text-emerald-400" tasks={tasks} onTaskClick={setSelectedTask} onDeleteRequest={handleDeleteRequest} />
            </div>
            <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
                {activeId ? (
                   <div className="opacity-90 rotate-2 w-[300px] bg-slate-800 border border-blue-500 rounded-xl p-4 shadow-2xl">
                      {tasks.find(t => t.id === activeId)?.title}
                   </div>
                ) : null}
            </DragOverlay>
        </DndContext>
      )}

      {selectedTask && <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} onUpdate={fetchTasks} />}
      
      {/* GLOBAL CONFIRMATION MODAL */}
      <ConfirmationModal 
          isOpen={modalConfig.isOpen}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
          onConfirm={modalConfig.onConfirm}
          onCancel={cancelModal}
      />
    </div>
  )
}