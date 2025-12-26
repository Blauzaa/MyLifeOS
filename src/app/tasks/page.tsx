'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '../../utils/supabase/client'
import {
  Plus, Trash2, CheckCircle, Clock, Loader2,
  Calendar, CheckSquare, X, AlertCircle, Image as ImageIcon,
  Link as LinkIcon, UploadCloud
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

// --- CLOUDINARY CONFIG ---
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

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
  cover_url?: string
  created_at: string
  subtasks: Subtask[]
  position?: number
}

// ==========================================
// 1. IMPROVED TASK EDIT MODAL (WITH PASTE & UPLOAD)
// ==========================================
const TaskModal = ({ task, onClose, onUpdate }: { task: Task, onClose: () => void, onUpdate: () => void }) => {
  const [localTask, setLocalTask] = useState<Task>(task)
  const [subtaskInput, setSubtaskInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [isUploading, setIsUploading] = useState(false) // State loading upload

  // Helper: Upload ke Cloudinary
  const uploadImage = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      const imageUrl = data.secure_url;

      // Update Local & Supabase
      updateTaskField({ cover_url: imageUrl });
      setShowUrlInput(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please check your Cloudinary config.');
    } finally {
      setIsUploading(false);
    }
  };

  // Event Listener untuk Paste (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Hanya proses jika ada items
      if (!e.clipboardData?.items) return;

      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault(); // Mencegah paste default jika sedang di textarea
          const file = items[i].getAsFile();
          if (file) {
            uploadImage(file);
          }
          break; // Hanya ambil gambar pertama
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle ESC Key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const updateTaskField = async (field: Partial<Task>) => {
    setLocalTask(prev => ({ ...prev, ...field }))
    const { error } = await supabase.from('tasks').update(field).eq('id', task.id)
    if (!error) onUpdate()
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="relative bg-slate-900 border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >

        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-50 p-2 bg-black/50 hover:bg-red-500/80 text-white rounded-full transition-all backdrop-blur-md group shadow-lg border border-white/10"
          title="Close (Esc)"
        >
          <X size={18} className="group-hover:rotate-90 transition-transform" />
        </button>

        {/* Cover Image Area */}
        <div className="relative h-36 bg-slate-800/50 border-b border-white/5 group flex-shrink-0">
          {isUploading ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-blue-400 bg-slate-950/80 absolute z-20">
              <Loader2 className="animate-spin mb-2" size={32} />
              <span className="text-xs font-bold animate-pulse">UPLOADING IMAGE...</span>
            </div>
          ) : null}

          {localTask.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={localTask.cover_url} alt="Cover" className="w-full h-full object-cover opacity-80" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 text-sm bg-slate-950">
              <ImageIcon size={24} className="mb-2" />
              <p>No Cover Image</p>
              <p className="text-xs text-slate-700 mt-1">Ctrl+V to paste image</p>
            </div>
          )}

          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button onClick={() => setShowUrlInput(!showUrlInput)} className="bg-black/60 hover:bg-black/80 text-white px-3 py-1 rounded-full text-xs flex items-center backdrop-blur-md border border-white/10">
              <LinkIcon size={12} className="mr-1" /> {localTask.cover_url ? 'Change URL' : 'Add URL'}
            </button>
          </div>
        </div>

        {/* URL Input Drawer */}
        {showUrlInput && (
          <div className="bg-slate-800 p-3 border-b border-white/10 flex gap-2 animate-in slide-in-from-top-2">
            <input
              type="text"
              placeholder="Paste image URL here..."
              className="flex-1 bg-slate-950 border border-white/10 rounded px-3 py-1 text-sm text-white focus:border-blue-500 outline-none"
              defaultValue={localTask.cover_url || ''}
              onBlur={(e) => {
                if (e.target.value) updateTaskField({ cover_url: e.target.value })
                setShowUrlInput(false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateTaskField({ cover_url: e.currentTarget.value })
                  setShowUrlInput(false)
                }
              }}
              autoFocus
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col md:flex-row bg-slate-900">
          {/* LEFT COLUMN */}
          <div className="flex-1 p-6 border-r border-white/5">
            <input
              value={localTask.title}
              onChange={(e) => setLocalTask(p => ({ ...p, title: e.target.value }))}
              onBlur={(e) => updateTaskField({ title: e.target.value })}
              className="bg-transparent text-2xl font-bold w-full outline-none text-white placeholder-slate-500 mb-6"
              placeholder="Task Title"
            />

            <div className="space-y-6">
              <div>
                <label className="text-xs text-slate-400 uppercase font-bold flex items-center gap-2 mb-2">Description</label>
                <textarea
                  className="w-full bg-slate-800/30 border border-white/5 rounded-xl p-3 text-sm min-h-[100px] outline-none resize-none focus:bg-slate-800/50 transition"
                  placeholder="Add a more detailed description..."
                  value={localTask.description || ''}
                  onChange={(e) => setLocalTask(prev => ({ ...prev, description: e.target.value }))}
                  onBlur={(e) => updateTaskField({ description: e.target.value })}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs text-slate-400 uppercase font-bold flex items-center gap-2">
                    <CheckSquare size={14} /> Subtasks
                  </label>
                  <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                    {Math.round((localTask.subtasks.filter(s => s.is_completed).length / (localTask.subtasks.length || 1)) * 100)}%
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mb-3">
                    <div
                      className="bg-blue-500 h-full transition-all duration-300"
                      style={{ width: `${(localTask.subtasks.filter(s => s.is_completed).length / (localTask.subtasks.length || 1)) * 100}%` }}
                    />
                  </div>

                  {localTask.subtasks.map(sub => (
                    <div key={sub.id} className="flex items-center gap-3 group hover:bg-slate-800/50 p-2 -mx-2 rounded-lg transition">
                      <button onClick={() => toggleSubtask(sub.id, sub.is_completed)}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${sub.is_completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 hover:border-blue-500'}`}
                      >
                        {sub.is_completed && <CheckCircle size={12} className="text-slate-900" strokeWidth={3} />}
                      </button>
                      <span className={`text-sm flex-1 ${sub.is_completed ? 'line-through text-slate-600' : 'text-slate-300'}`}>{sub.title}</span>
                      <button onClick={() => deleteSubtask(sub.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 p-1">
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  <div className="flex gap-2 mt-3">
                    <Plus size={18} className="text-slate-500" />
                    <input
                      value={subtaskInput}
                      onChange={(e) => setSubtaskInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                      placeholder="Add subtask..."
                      className="flex-1 bg-transparent text-sm outline-none text-white placeholder-slate-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="w-full md:w-64 bg-slate-900/50 p-6 space-y-6 border-l border-white/5">
            <div className="space-y-4 pt-4 md:pt-0">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold uppercase">Status</label>
                <select
                  value={localTask.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as any;
                    if (newStatus === 'done' && localTask.subtasks.length > 0) {
                      const hasIncomplete = localTask.subtasks.some(s => !s.is_completed);
                      if (hasIncomplete) {
                        // Prevent change & show warning via Alert for simplicity inside Modal (or use custom modal if possible, but standard alert is safer for now to avoid z-index hell)
                        // Better: Use the same showModal from context if available in parent?
                        // Since TaskModal is a child component, we might not have access to the exact same 'showModal' context instance if not passed or if context is global. 
                        // Actually TaskModal uses `useModal`? No, `TasksPage` uses it. 
                        // Let's pass a `checkSubtasks` prop or handle it inside `updateTaskField`.
                        // For now, let's just use window.confirm or alert to block it, OR simply revert if not confirmed.
                        const confirmComplete = window.confirm(`"${localTask.title}" has incomplete subtasks. Mark all as done and complete task?`);
                        if (confirmComplete) {
                          // Logic to mark all subtasks done
                          // We need to call a function that updates subtasks AND status.
                          // Since we are inside the modal, we can call a prop function or handle it here.
                          // Let's defer to a prop `onForceComplete` if possible? 
                          // But `TaskModal` only has `onUpdate`.
                          // Let's try to do it here.
                          // Call an async function to update all subtasks.
                          updateTaskField({ status: 'done' }); // This just updates status. 
                          // We need to update subtasks too. Since updateTaskField is simple, we might need a separate function.
                          // Let's stick to the prompt requirement: "manual ubah status dia tanya".
                          // Let's assume the user accepted.
                          const updateSubtasks = async () => {
                            await supabase.from('subtasks').update({ is_completed: true }).eq('task_id', localTask.id);
                            // Refetch? cancel?
                            // We update local state too.
                            setLocalTask(prev => ({
                              ...prev,
                              status: 'done',
                              subtasks: prev.subtasks.map(s => ({ ...s, is_completed: true }))
                            }));
                            updateTaskField({ status: 'done' });
                          };
                          updateSubtasks();
                        } else {
                          // Cancel: do nothing, revert select value (react state won't change)
                          return;
                        }
                      } else {
                        updateTaskField({ status: newStatus });
                      }
                    } else {
                      updateTaskField({ status: newStatus });
                    }
                  }}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option value="todo">To Do</option>
                  <option value="doing">In Progress</option>
                  <option value="done">Completed</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold uppercase">Priority</label>
                <div className="flex flex-wrap gap-2">
                  {(['low', 'medium', 'high'] as const).map(p => (
                    <button key={p} onClick={() => updateTaskField({ priority: p })}
                      className={`px-3 py-1.5 text-xs rounded-md capitalize transition border ${localTask.priority === p ?
                        (p === 'high' ? 'bg-red-500/20 border-red-500/50 text-red-400' : p === 'medium' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-blue-500/20 border-blue-500/50 text-blue-400')
                        : 'border-slate-700 text-slate-400 hover:border-slate-500'}`
                      }>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold uppercase">Deadline</label>
                <input type="date"
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  value={localTask.deadline ? new Date(localTask.deadline).toISOString().split('T')[0] : ''}
                  onChange={(e) => updateTaskField({ deadline: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 2. SORTABLE TASK CARD (UNCHANGED)
// ==========================================
const SortableTaskCard = ({ task, onClick, onDeleteRequest }: { task: Task, onClick: () => void, onDeleteRequest: (id: string) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: { ...task } });

  const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const priorityColor = { high: 'bg-red-500', medium: 'bg-orange-500', low: 'bg-blue-500' }[task.priority || 'medium']

  const doneSubtasks = task.subtasks.filter(s => s.is_completed).length
  const totalSubtasks = task.subtasks.length
  const progress = totalSubtasks === 0 ? 0 : (doneSubtasks / totalSubtasks) * 100
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done'

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={onClick}
      className={`group bg-slate-900 border border-white/5 rounded-xl hover:border-blue-500/50 transition-all shadow-md hover:shadow-xl cursor-grab active:cursor-grabbing relative overflow-hidden touch-none flex flex-col`}
    >
      {task.cover_url && (
        <div className="h-24 w-full overflow-hidden border-b border-white/5 bg-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={task.cover_url} alt="Cover" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
        </div>
      )}

      <div className="p-3">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h4 className={`text-sm font-medium leading-tight ${task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>{task.title}</h4>
          <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${priorityColor}`} title={`Priority: ${task.priority}`} />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
          {task.deadline && (
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-400 font-bold' : ''}`}>
              {isOverdue ? <AlertCircle size={12} /> : <Calendar size={12} />}
              {new Date(task.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </div>
          )}
          {totalSubtasks > 0 && (
            <div className={`flex items-center gap-1 ${progress === 100 ? 'text-emerald-400' : ''}`}>
              <CheckSquare size={12} /> {doneSubtasks}/{totalSubtasks}
            </div>
          )}
        </div>
      </div>

      <button onClick={(e) => { e.stopPropagation(); onDeleteRequest(task.id) }}
        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition p-1.5 rounded-md hover:bg-slate-800 bg-slate-900/50 backdrop-blur-sm"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ==========================================
// 3. TASK COLUMN (UNCHANGED)
// ==========================================
const TaskColumn = ({ title, status, icon: Icon, color, tasks, onTaskClick, onDeleteRequest, delay }: any) => {
  const { setNodeRef } = useSortable({ id: status, data: { type: 'container', status } });
  const filteredTasks = tasks.filter((t: Task) => t.status === status);

  return (
    <div
      ref={setNodeRef}
      className="flex-1 min-w-[320px] bg-slate-900/40 backdrop-blur-sm rounded-3xl border border-white/5 p-4 flex flex-col h-full animate-in slide-in-from-bottom-5 fade-in duration-700"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className={`font-bold flex items-center gap-2 uppercase text-xs tracking-widest ${color}`}>
          <Icon size={16} /> {title}
        </h3>
        <span className="bg-white/5 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-slate-400">{filteredTasks.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pb-10 min-h-[150px]">
        <SortableContext items={filteredTasks.map((t: Task) => t.id)} strategy={rectSortingStrategy}>
          {filteredTasks.map((task: Task) => (
            <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} onDeleteRequest={onDeleteRequest} />
          ))}
        </SortableContext>
        {filteredTasks.length === 0 && (
          <div className="h-32 border-2 border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center text-slate-600 gap-2 opacity-50">
            <div className="p-3 bg-white/5 rounded-full"><Plus size={16} /></div>
            <span className="text-xs font-medium">Drop items here</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ==========================================
// 4. MAIN PAGE
// ==========================================

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const { showModal } = useModal()

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

  const addTask = async () => {
    if (!newTask) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('tasks').insert({
      title: newTask, status: 'todo', user_id: user.id, priority: 'medium'
    })

    if (!error) { setNewTask(''); fetchTasks() }
  }

  const handleDeleteRequest = (id: string) => {
    showModal({
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task? This action is irreversible.',
      type: 'danger',
      confirmText: 'Yes, Delete',
      onConfirm: async () => {
        await supabase.from('tasks').delete().eq('id', id);
        setTasks(prev => prev.filter(t => t.id !== id));
      }
    })
  }

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

    // Jangan clear activeId dulu di state agar drag overlay tidak hilang tiba-tiba jika kita mau revert visual
    // Tapi karena kita pakai modal, kita harus clear status dragging
    setActiveId(null);

    if (!over) return;

    const overId = over.id as string;

    // Helper to find target container status
    const findContainer = (id: string) => {
      if (['todo', 'doing', 'done'].includes(id)) return id;
      return tasks.find(t => t.id === id)?.status;
    };

    const targetStatus = findContainer(overId);
    const item = tasks.find(t => t.id === activeId);

    if (!item || !targetStatus) return;

    // === LOGIKA BARU FORCE DONE ===
    if (targetStatus === 'done' && item.subtasks.length > 0) {
      const hasIncompleteSubtasks = item.subtasks.some(s => !s.is_completed);

      if (hasIncompleteSubtasks) {
        // 1. REVERT: Balikin ke posisi awal di UI agar tidak "lompat" sebelum konfirmasi
        // Kita paksa render ulang dari state 'tasks' yang belum berubah (karena optimistic update kita hanya update via setter, tapi jika kita tidak commit ke DB dan fetchTasks ulang, mungkin state local sudah kotor karena handleDragOver)
        // Solusi: Kita fetch ulang saja atau revert manual.
        // Tapi handleDragOver mengubah state 'tasks' secara real-time.
        // Kita harus kembalikan item ke status aslinya.
        // Status asli bisa diambil dari originalStatus yang kita simpan, atau simpelnya: reload data.

        await fetchTasks(); // Revert UI paling aman

        // 2. TAMPILKAN MODAL KONFIRMASI
        showModal({
          title: 'Incomplete Subtasks',
          message: `"${item.title}" still has pending subtasks. Do you want to check them all as completed and move to Done?`,
          type: 'warning',
          confirmText: 'Yes, Complete All',
          cancelText: 'Cancel',
          onConfirm: async () => {
            await forceCompleteTask(activeId);
          }
        })
        return;
      }
    }

    // Update normal jika tidak ada masalah subtask
    await updateTaskStatusAndOrder(activeId, targetStatus as string);
  };

  const updateTaskStatusAndOrder = async (taskId: string, status: string) => {
    // Optimistic Update sudah terjadi di handleDragOver, 
    // kita hanya perlu memastikan DB sinkron untuk status final.
    await supabase.from('tasks').update({ status }).eq('id', taskId);
    // Fetch ulang untuk memastikan data konsisten
    fetchTasks();
  }

  // Fungsi khusus: Pindah ke Done + Centang semua Subtask
  const forceCompleteTask = async (taskId: string) => {
    // 1. Update Subtasks -> is_completed: true
    await supabase.from('subtasks').update({ is_completed: true }).eq('task_id', taskId);

    // 2. Update Task -> status: 'done'
    await supabase.from('tasks').update({ status: 'done' }).eq('id', taskId);

    // 3. Refresh Data
    fetchTasks();
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-in slide-in-from-top-5 duration-700">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Kanban Board</h1>
          <p className="text-slate-400 text-sm">Manage projects and tasks visually.</p>
        </div>
        <div className="flex gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 w-full md:w-96 shadow-lg backdrop-blur-md">
          <input
            placeholder="What needs to be done?"
            className="bg-transparent px-4 py-2 w-full outline-none text-sm text-white placeholder-slate-500"
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
          />
          <button onClick={addTask} className="bg-blue-600 p-2.5 rounded-xl hover:bg-blue-500 transition text-white shadow-lg hover:scale-105 active:scale-95">
            <Plus size={18} strokeWidth={3} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center pt-32">
          <Loader2 className="animate-spin text-blue-500" size={48} />
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="flex flex-col lg:flex-row gap-6 overflow-x-auto pb-4 h-full px-1">
            <TaskColumn title="To Do" status="todo" icon={Clock} color="text-slate-400" tasks={tasks} onTaskClick={setSelectedTask} onDeleteRequest={handleDeleteRequest} delay={100} />
            <TaskColumn title="In Progress" status="doing" icon={Loader2} color="text-blue-400" tasks={tasks} onTaskClick={setSelectedTask} onDeleteRequest={handleDeleteRequest} delay={200} />
            <TaskColumn title="Done" status="done" icon={CheckCircle} color="text-emerald-400" tasks={tasks} onTaskClick={setSelectedTask} onDeleteRequest={handleDeleteRequest} delay={300} />
          </div>

          <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
            {activeId ? (
              <div className="opacity-90 rotate-2 w-[320px] bg-slate-800 border border-blue-500 rounded-xl p-4 shadow-2xl cursor-grabbing">
                <div className="flex justify-between font-bold text-white">{tasks.find(t => t.id === activeId)?.title}</div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {selectedTask && <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} onUpdate={fetchTasks} />}
    </div>
  )
}