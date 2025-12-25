/* eslint-disable react-hooks/immutability */
'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../../utils/supabase/supabaseClient'
import { Play, Pause, RotateCcw, Trophy, Loader2, History } from 'lucide-react'

const supabase = createClient()

interface FocusSession {
  id: string
  task_name: string
  duration_minutes: number
  completed_at: string
}

export default function FocusPage() {
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  const [sessions, setSessions] = useState<FocusSession[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSessions = useCallback(async () => {
    const { data } = await supabase
      .from('focus_sessions')
      .select('*')
      .order('completed_at', { ascending: false })
    if (data) setSessions(data as FocusSession[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      handleComplete()
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, timeLeft])

  const handleComplete = async () => {
    setIsActive(false)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { error } = await supabase.from('focus_sessions').insert({
        user_id: user.id,
        duration_minutes: 25,
        task_name: 'Deep Work Session'
      })
      
      if (!error) {
        alert("Sesi Selesai! Kerja bagus!")
        fetchSessions()
      }
    }
    setTimeLeft(25 * 60)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center py-10 space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">Focus Mode</h1>
        <p className="text-slate-400">Stay focused, be productive.</p>
      </div>

      {/* Timer Circle */}
      <div className="relative group">
        <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 transition-all duration-1000 ${isActive ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}></div>
        <div className="relative w-80 h-80 flex flex-col items-center justify-center bg-slate-900 rounded-full border-[12px] border-slate-800 shadow-2xl">
          <span className="text-7xl font-mono font-bold text-white tracking-tighter">
            {formatTime(timeLeft)}
          </span>
          <span className="text-slate-500 mt-2 font-medium tracking-widest uppercase text-xs">Minutes</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-6">
        <button 
          onClick={() => setIsActive(!isActive)} 
          className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all shadow-xl ${isActive ? 'bg-slate-800 text-white' : 'bg-white text-slate-900 hover:scale-105'}`}
        >
          {isActive ? <Pause size={32} fill="currentColor"/> : <Play size={32} fill="currentColor" className="ml-1"/>}
        </button>
        <button 
          onClick={() => {setIsActive(false); setTimeLeft(25 * 60)}} 
          className="w-20 h-20 bg-slate-800 text-slate-400 rounded-3xl flex items-center justify-center hover:bg-slate-700 transition"
        >
          <RotateCcw size={28} />
        </button>
      </div>

      {/* Stats & History */}
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <History size={16}/> Recent Sessions
          </h3>
          <div className="flex items-center gap-1.5 text-yellow-500 font-bold text-sm">
            <Trophy size={16}/> {sessions.length}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-4"><Loader2 className="animate-spin text-slate-600"/></div>
        ) : (
          <div className="space-y-3">
            {sessions.slice(0, 5).map(s => (
              <div key={s.id} className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex justify-between items-center transition hover:bg-white/5">
                <div>
                  <p className="text-sm font-medium text-slate-200">{s.task_name}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">{new Date(s.completed_at).toLocaleDateString()}</p>
                </div>
                <span className="text-xs bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full font-bold">{s.duration_minutes}m</span>
              </div>
            ))}
            {sessions.length === 0 && <p className="text-center text-slate-600 text-sm py-4 italic">Belum ada sesi selesai.</p>}
          </div>
        )}
      </div>
    </div>
  )
}