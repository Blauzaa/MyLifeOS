/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '../../utils/supabase/client'
import { 
  Play, Pause, RotateCcw, Trophy, Loader2, History, 
  Settings, Music, Volume2, VolumeX, Coffee, Brain, 
  ChevronRight, ChevronLeft, Bell,
  X
} from 'lucide-react'

const supabase = createClient()

// --- TIPE DATA ---
interface FocusSession {
  id: string
  task_name: string
  duration_minutes: number
  completed_at: string
}

type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

// --- 1. DAFTAR LAGU & SUARA (Expanded) ---
const TRACKS = [
  { name: "Rainy Mood", url: "https://cdn.pixabay.com/audio/2022/07/04/audio_331b26cb75.mp3", type: 'Ambience 🌧️' },
  { name: "Lofi Study Beats", url: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3", type: 'Music 🎧' },
  { name: "Cozy Fireplace", url: "https://cdn.pixabay.com/audio/2021/09/06/audio_097486e923.mp3", type: 'Ambience 🔥' },
  { name: "Coffee Shop", url: "https://cdn.pixabay.com/audio/2017/08/07/21/51/coffee-shop-2608871_1280.mp3", type: 'Ambience ☕' },
  { name: "Night Forest", url: "https://cdn.pixabay.com/audio/2021/09/06/audio_3f34825955.mp3", type: 'Ambience 🦉' },
  { name: "Deep Focus Piano", url: "https://cdn.pixabay.com/audio/2020/09/14/audio_0317e3e9d8.mp3", type: 'Music 🎹' },
  { name: "Alpha Waves", url: "https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3", type: 'Binaural 🧠' },
]

// --- 2. ALARM SOUND (Chill / Zen Bell) ---
const ALARM_URL = "https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3" 

export default function FocusPage() {
  // --- STATE TIMER ---
  const [mode, setMode] = useState<TimerMode>('focus')
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  
  // --- STATE SETTINGS ---
  const [showSettings, setShowSettings] = useState(false)
  const [durations, setDurations] = useState({
    focus: 25,
    shortBreak: 5,
    longBreak: 15
  })

  // --- STATE DATA & AUDIO ---
  const [taskName, setTaskName] = useState('')
  const [sessions, setSessions] = useState<FocusSession[]>([])
  const [loading, setLoading] = useState(true)
  
  // Audio State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // --- FETCH HISTORY ---
  const fetchSessions = useCallback(async () => {
    const { data } = await supabase
      .from('focus_sessions')
      .select('*')
      .order('completed_at', { ascending: false })
      .limit(5)
    if (data) setSessions(data as FocusSession[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  // --- AUDIO PLAYER LOGIC ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  useEffect(() => {
    if (audioRef.current) {
      if (isPlayingAudio) {
        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) {
            playPromise.catch(e => console.log("Audio play prevented:", e))
        }
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlayingAudio, currentTrackIndex])

  const toggleAudio = () => setIsPlayingAudio(!isPlayingAudio)
  
  const changeTrack = (index: number) => {
    setCurrentTrackIndex(index)
    setIsPlayingAudio(true) // Auto play saat ganti lagu
  }

  // --- TIMER LOGIC ---
  const switchMode = (newMode: TimerMode) => {
    setMode(newMode)
    setTimeLeft(durations[newMode] * 60)
    setIsActive(false)
  }

  const saveSettings = () => {
    setShowSettings(false)
    setTimeLeft(durations[mode] * 60)
    setIsActive(false)
  }

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000)
    } else if (timeLeft === 0) {
      handleComplete()
    }
    return () => { if (interval) clearInterval(interval) }
  }, [isActive, timeLeft])

  const handleComplete = async () => {
    setIsActive(false)
    
    // 3. MAIN ALARM (SOFT BELL)
    const alarm = new Audio(ALARM_URL)
    alarm.volume = 0.6 // Volume alarm pas (tidak terlalu kencang)
    alarm.play().catch(e => console.log("Alarm play error", e))

    if (mode === 'focus') {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('focus_sessions').insert({
          user_id: user.id,
          duration_minutes: durations.focus,
          task_name: taskName || 'Focus Session'
        })
        fetchSessions()
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgress = () => {
    const totalSeconds = durations[mode] * 60
    return ((totalSeconds - timeLeft) / totalSeconds) * 100
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 flex flex-col md:flex-row gap-8 min-h-[80vh]">
      
      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef} 
        src={TRACKS[currentTrackIndex].url} 
        loop 
      />

      {/* --- LEFT: TIMER SECTION --- */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        
        {/* Mode Selector */}
        <div className="flex bg-slate-800/50 p-1 rounded-xl border border-white/5">
          {[
            { id: 'focus', label: 'Focus', icon: Brain },
            { id: 'shortBreak', label: 'Short', icon: Coffee },
            { id: 'longBreak', label: 'Long', icon: Coffee },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => switchMode(m.id as TimerMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === m.id ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <m.icon size={16}/> {m.label}
            </button>
          ))}
        </div>

        {/* Task Input */}
        {mode === 'focus' && (
          <div className="w-full max-w-sm relative group">
             <input 
              type="text" 
              placeholder="What's your focus?" 
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="bg-transparent border-b-2 border-white/10 text-center text-2xl font-bold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 w-full pb-2 transition-all"
             />
             <div className="absolute right-0 top-2 opacity-0 group-hover:opacity-100 transition text-slate-500">
                ✏️
             </div>
          </div>
        )}

        {/* Timer UI (Circle) */}
        <div className="relative group cursor-pointer" onClick={() => setIsActive(!isActive)}>
           {/* Glow Effect */}
           <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 transition-all duration-1000 ${isActive ? 'bg-blue-500 animate-pulse' : 'bg-transparent'}`}></div>
           
           <div className="w-72 h-72 md:w-80 md:h-80 relative">
             <svg className="w-full h-full -rotate-90 drop-shadow-2xl" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="2" />
                <circle 
                  cx="50" cy="50" r="45" fill="none" stroke={mode === 'focus' ? '#3b82f6' : '#10b981'} strokeWidth="3" 
                  strokeDasharray="283" strokeDashoffset={283 - (283 * getProgress() / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-7xl md:text-8xl font-mono font-bold tracking-tighter transition-colors ${isActive ? 'text-white' : 'text-slate-400'}`}>
                  {formatTime(timeLeft)}
                </span>
                <span className={`text-sm font-bold uppercase tracking-[0.2em] mt-2 ${isActive ? 'text-blue-400' : 'text-slate-600'}`}>
                   {isActive ? 'Running' : 'Paused'}
                </span>
             </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-6">
          <button onClick={() => setShowSettings(true)} className="p-4 rounded-2xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition shadow-lg border border-white/5" title="Settings">
             <Settings size={22} />
          </button>
          
          <button 
            onClick={() => setIsActive(!isActive)} 
            className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all shadow-2xl ${
              isActive 
                ? 'bg-slate-800 text-white border border-white/10' 
                : 'bg-white text-slate-900 hover:scale-105 shadow-blue-500/20'
            }`}
          >
            {isActive ? <Pause size={32} fill="currentColor"/> : <Play size={32} fill="currentColor" className="ml-1"/>}
          </button>

          <button onClick={() => {setIsActive(false); setTimeLeft(durations[mode] * 60)}} className="p-4 rounded-2xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition shadow-lg border border-white/5" title="Reset">
             <RotateCcw size={22} />
          </button>
        </div>
      </div>

      {/* --- RIGHT: SIDEBAR --- */}
      <div className="w-full md:w-80 flex flex-col gap-6">
        
        {/* MUSIC PLAYER CARD */}
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-xl">
            <div className="absolute -top-6 -right-6 p-4 opacity-[0.03] rotate-12"><Music size={150}/></div>
            
            <div className="flex items-center justify-between mb-6">
               <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest flex items-center gap-2">
                 <Music size={14} className="text-blue-500"/> Soundscapes
               </h3>
               {isPlayingAudio && (
                 <div className="flex gap-0.5 items-end h-3">
                    <div className="w-1 bg-blue-500 animate-[bounce_1s_infinite] h-2"></div>
                    <div className="w-1 bg-blue-500 animate-[bounce_1.2s_infinite] h-3"></div>
                    <div className="w-1 bg-blue-500 animate-[bounce_0.8s_infinite] h-1"></div>
                 </div>
               )}
            </div>
            
            {/* Track Selector Dropdown */}
            <div className="relative mb-6 group">
                <select 
                  value={currentTrackIndex} 
                  onChange={(e) => changeTrack(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-white/10 text-white text-sm rounded-xl p-3 pl-3 pr-10 outline-none appearance-none cursor-pointer hover:border-blue-500/50 transition font-medium truncate"
                >
                  {TRACKS.map((track, i) => (
                    <option key={i} value={i}>
                       {track.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <ChevronRight size={16} className="rotate-90"/>
                </div>
            </div>

            {/* Now Playing Info */}
            <div className="flex items-center justify-between mb-6 bg-white/5 p-4 rounded-xl border border-white/5">
               <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">{TRACKS[currentTrackIndex].type}</p>
                  <p className="text-white font-bold leading-tight">{TRACKS[currentTrackIndex].name}</p>
               </div>
               <button onClick={toggleAudio} className={`w-10 h-10 rounded-full flex items-center justify-center transition shadow-lg ${isPlayingAudio ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                 {isPlayingAudio ? <Pause size={18} fill="currentColor"/> : <Play size={18} fill="currentColor" className="ml-0.5"/>}
               </button>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button onClick={() => changeTrack((currentTrackIndex - 1 + TRACKS.length) % TRACKS.length)} className="text-slate-500 hover:text-white"><ChevronLeft size={20}/></button>
                <div className="flex-1 flex items-center gap-2 bg-slate-800/50 rounded-lg p-2">
                   {volume === 0 ? <VolumeX size={16} className="text-slate-500"/> : <Volume2 size={16} className="text-blue-400"/>}
                   <input 
                     type="range" min="0" max="1" step="0.05" value={volume} 
                     onChange={(e) => setVolume(parseFloat(e.target.value))}
                     className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                   />
                </div>
                <button onClick={() => changeTrack((currentTrackIndex + 1) % TRACKS.length)} className="text-slate-500 hover:text-white"><ChevronRight size={20}/></button>
              </div>
            </div>
        </div>

        {/* STATS CARD */}
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 flex-1 shadow-xl">
          <div className="flex items-center justify-between mb-4">
             <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest flex items-center gap-2">
               <History size={14}/> Recent Focus
             </h3>
             <span className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded text-xs font-bold flex gap-1 items-center">
               <Trophy size={12}/> {sessions.length}
             </span>
          </div>
          
          <div className="space-y-2 overflow-y-auto max-h-[250px] pr-1 custom-scrollbar">
            {loading ? <Loader2 className="animate-spin mx-auto text-slate-600 mt-4"/> : sessions.map(s => (
              <div key={s.id} className="group flex justify-between items-center p-3 rounded-xl hover:bg-white/5 transition border border-transparent hover:border-white/5 bg-slate-800/30">
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-slate-200 truncate">{s.task_name}</p>
                  <p className="text-[10px] text-slate-500">{new Date(s.completed_at).toLocaleDateString()}</p>
                </div>
                <span className="text-xs font-mono text-slate-500 font-bold bg-slate-900 px-2 py-1 rounded border border-white/5">{s.duration_minutes}m</span>
              </div>
            ))}
            {sessions.length === 0 && <p className="text-center text-slate-600 text-xs italic py-4">No sessions yet.</p>}
          </div>
        </div>

      </div>

      {/* --- SETTINGS MODAL --- */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-bold text-white flex items-center gap-2"><Settings size={20}/> Timer Settings</h2>
               <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-white"><X size={20}/></button>
            </div>
            
            <div className="space-y-5 mb-8">
              <div>
                <label className="text-xs uppercase font-bold text-slate-500 mb-2 block">Focus Duration</label>
                <div className="flex items-center gap-2">
                   <input type="number" value={durations.focus} onChange={(e) => setDurations({...durations, focus: Number(e.target.value)})} className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 font-mono font-bold text-lg text-center"/>
                   <span className="text-slate-500 text-sm">min</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-bold text-slate-500 mb-2 block">Short Break</label>
                  <div className="flex items-center gap-2">
                     <input type="number" value={durations.shortBreak} onChange={(e) => setDurations({...durations, shortBreak: Number(e.target.value)})} className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-green-500 font-mono font-bold text-lg text-center"/>
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-slate-500 mb-2 block">Long Break</label>
                  <div className="flex items-center gap-2">
                     <input type="number" value={durations.longBreak} onChange={(e) => setDurations({...durations, longBreak: Number(e.target.value)})} className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-green-500 font-mono font-bold text-lg text-center"/>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={saveSettings} className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-900/20">
               Save Changes
            </button>
          </div>
        </div>
      )}

    </div>
  )
}