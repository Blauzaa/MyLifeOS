/* eslint-disable react-hooks/set-state-in-effect */
'use client'
import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Coffee, Brain, Volume2, VolumeX, Trophy, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react'

type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

interface Task {
  id: string
  text: string
  completed: boolean
}

export default function FocusPage() {
  const [mode, setMode] = useState<TimerMode>('focus')
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  
  // Fitur Baru: Mini Task State
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState('')
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ambientRef = useRef<HTMLAudioElement | null>(null)

  const MODES = {
    focus: { time: 25, label: 'Focus Time', color: 'text-blue-400', accent: 'bg-blue-500' },
    shortBreak: { time: 5, label: 'Short Break', color: 'text-emerald-400', accent: 'bg-emerald-500' },
    longBreak: { time: 15, label: 'Long Break', color: 'text-purple-400', accent: 'bg-purple-500' },
  }

  // Load data dari localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('focus_sessions')
    if (savedSessions) setSessionsCompleted(parseInt(savedSessions))
    
    const savedTasks = localStorage.getItem('focus_tasks')
    if (savedTasks) setTasks(JSON.parse(savedTasks))
    
    if (Notification.permission !== 'granted') {
      Notification.requestPermission()
    }
    
    audioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg')
    ambientRef.current = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/codeskulptor-assets/Eerie_Suns_Soundtrack.mp3')
    ambientRef.current.loop = true
  }, [])

  // Simpan tasks ke localStorage setiap kali berubah
  useEffect(() => {
    localStorage.setItem('focus_tasks', JSON.stringify(tasks))
  }, [tasks])

  // Handle Ambient Sound
  useEffect(() => {
    if (ambientRef.current) {
      if (isActive && !isMuted && mode === 'focus') {
        ambientRef.current.play().catch(() => {})
      } else {
        ambientRef.current.pause()
      }
    }
  }, [isActive, isMuted, mode])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      setIsActive(false)
      if (audioRef.current) audioRef.current.play().catch(() => {})
      
      if (mode === 'focus') {
        const newTotal = sessionsCompleted + 1
        setSessionsCompleted(newTotal)
        localStorage.setItem('focus_sessions', newTotal.toString())
      }

      if (Notification.permission === 'granted') {
        new Notification("Waktu Habis!", { body: `Sesi ${MODES[mode].label} telah selesai.` })
      }
    }

    return () => { if (interval) clearInterval(interval) }
  }, [isActive, timeLeft, mode, sessionsCompleted])

  useEffect(() => {
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    document.title = isActive ? `(${timeString}) Focus Mode` : 'Focus Mode'
  }, [timeLeft, isActive])

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode)
    setIsActive(false)
    setTimeLeft(MODES[newMode].time * 60)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Task Handlers
  const addTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.trim()) return
    const task: Task = { id: crypto.randomUUID(), text: newTask, completed: false }
    setTasks([...tasks, task])
    setNewTask('')
  }

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id))
  }

  const radius = 120
  const circumference = 2 * Math.PI * radius
  const progress = ((MODES[mode].time * 60 - timeLeft) / (MODES[mode].time * 60)) * 100
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-start min-h-screen space-y-8 p-4 pt-12 max-w-2xl mx-auto">
      
      {/* Header Stats */}
      <div className="flex gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-2 bg-slate-800/40 px-4 py-2 rounded-full border border-white/5">
          <Trophy size={16} className="text-yellow-500" />
          <span className="text-sm font-medium text-slate-300">{sessionsCompleted} Sesi Selesai</span>
        </div>
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="flex items-center gap-2 bg-slate-800/40 px-4 py-2 rounded-full border border-white/5 hover:bg-slate-700 transition-colors"
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} className="text-blue-400" />}
          <span className="text-sm font-medium text-slate-300">{isMuted ? 'Muted' : 'Focus Sound'}</span>
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 flex gap-1 shadow-2xl">
        {(Object.keys(MODES) as TimerMode[]).map((m) => (
          <button 
            key={m}
            onClick={() => switchMode(m)}
            className={`px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${mode === m ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {MODES[m].label}
          </button>
        ))}
      </div>

      {/* Timer Circle */}
      <div className="relative group">
        <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 transition-colors duration-1000 ${MODES[mode].accent}`}></div>
        <svg className="transform -rotate-90 w-64 h-64 md:w-72 md:h-72 relative z-10">
          <circle cx="50%" cy="50%" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800/50" />
          <circle
            cx="50%" cy="50%" r={radius}
            stroke="currentColor" strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`transition-all duration-1000 ease-linear ${MODES[mode].color}`}
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-20">
          <div className="text-5xl md:text-6xl font-mono font-bold tracking-tighter text-white drop-shadow-2xl">
            {formatTime(timeLeft)}
          </div>
          <p className={`mt-2 font-bold uppercase tracking-widest text-[10px] ${MODES[mode].color} opacity-80`}>
            {isActive ? 'Deep Work' : 'Ready?'}
          </p>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center gap-6">
        <button 
          onClick={() => { setIsActive(!isActive) }}
          className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all shadow-2xl hover:scale-105 active:scale-95 ${isActive ? 'bg-slate-800 text-white border border-white/10' : 'bg-white text-slate-900'}`}
        >
          {isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1"/>}
        </button>
        
        <button 
          onClick={() => { setIsActive(false); setTimeLeft(MODES[mode].time * 60); }}
          className="w-12 h-12 rounded-2xl bg-slate-800/50 text-slate-400 border border-white/5 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-all"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {/* Fitur Baru: Focus Task List */}
      <div className="w-full max-w-md space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Target Sesi Ini</h3>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-500">{tasks.length} Tugas</span>
        </div>

        <form onSubmit={addTask} className="relative group">
          <input 
            type="text" 
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Apa yang ingin dikerjakan?"
            className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 px-4 pr-12 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-slate-200 placeholder:text-slate-600"
          />
          <button type="submit" className="absolute right-2 top-1.5 p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            <Plus size={18} />
          </button>
        </form>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
          {tasks.map(task => (
            <div key={task.id} className="group flex items-center gap-3 bg-slate-800/20 hover:bg-slate-800/40 p-3 rounded-xl border border-white/5 transition-all">
              <button onClick={() => toggleTask(task.id)} className="text-slate-500 hover:text-blue-400 transition-colors">
                {task.completed ? <CheckCircle2 size={20} className="text-blue-400" /> : <Circle size={20} />}
              </button>
              <span className={`flex-1 text-sm transition-all ${task.completed ? 'text-slate-600 line-through' : 'text-slate-300'}`}>
                {task.text}
              </span>
              <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-6 text-slate-600 text-xs italic">
              Belum ada target. Tentukan satu hal untuk difokuskan!
            </div>
          )}
        </div>
      </div>

      <div className="text-slate-500 text-xs max-w-xs text-center italic leading-relaxed opacity-40 hover:opacity-100 transition-opacity pb-8">
        {mode === 'focus' 
          ? '"Tetap fokus pada satu tugas sampai selesai."' 
          : '"Istirahat sejenak untuk mengembalikan energi."'}
      </div>

    </div>
  )
}