/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '../../utils/supabase/client'
import { 
  Play, Pause, RotateCcw, Trophy, Loader2, History, 
  Settings, Music, Volume2, VolumeX, Coffee, Brain, 
  ChevronRight, ChevronLeft, Zap, CheckCircle2, Repeat
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

// --- 1. DAFTAR LAGU (Updated: Lebih Stabil) ---
const MUSIC_TRACKS = [
  { name: "Lofi Hip Hop (Stream)", url: "https://stream.zeno.fm/0r0xa792kwzuv", type: 'Radio 🔴' },
  { name: "Rain Sounds", url: "https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg", type: 'Nature 🌧️' },
  { name: "Relaxing Piano", url: "https://cdn.pixabay.com/audio/2022/03/24/audio_3cb7ae3a96.mp3", type: 'Music 🎹' },
  { name: "White Noise", url: "https://actions.google.com/sounds/v1/ambiences/white_noise.ogg", type: 'Focus 🧠' },
  { name: "Forest Night", url: "https://actions.google.com/sounds/v1/nature/crickets_in_the_night_ambience.ogg", type: 'Nature 🦗' },
  { name: "Cafe Ambience", url: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg", type: 'Ambience ☕' },
]

// --- 2. ALARM SOUND (Digital Beep - Soft) ---
// Suara beep digital klasik tapi pendek
const ALARM_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"

export default function FocusPage() {
  // --- STATE TIMER ---
  const [mode, setMode] = useState<TimerMode>('focus')
  const [timeLeft, setTimeLeft] = useState(25 * 60) // Default 25 min
  const [isActive, setIsActive] = useState(false)
  const [cycles, setCycles] = useState(0) // Menghitung berapa kali fokus selesai
  
  // --- STATE SETTINGS ---
  const [showSettings, setShowSettings] = useState(false)
  const [config, setConfig] = useState({
    focusDuration: 60,      // Default 1 jam (sesuai request)
    shortBreakDuration: 5,  // Default 5 menit
    longBreakDuration: 10,  // Default 10 menit
    longBreakInterval: 3,   // Long break setelah 3 sesi fokus
    autoStart: false        // Otomatis lanjut timer
  })

  // --- STATE DATA & AUDIO ---
  const [taskName, setTaskName] = useState('')
  const [sessions, setSessions] = useState<FocusSession[]>([])
  const [loading, setLoading] = useState(true)
  
  // Audio State
  const [trackIndex, setTrackIndex] = useState(0)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [volume, setVolume] = useState(0.4) // Volume default sedang
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // Ref untuk mencegah double submission strict mode
  const isProcessingComplete = useRef(false)

  // --- FETCH HISTORY ---
  const fetchSessions = useCallback(async () => {
    const { data } = await supabase.from('focus_sessions').select('*').order('completed_at', { ascending: false }).limit(5)
    if (data) setSessions(data as FocusSession[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  // --- AUDIO PLAYER LOGIC ---
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  useEffect(() => {
    if (audioRef.current) {
      if (isPlayingAudio) {
        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) playPromise.catch(() => setIsPlayingAudio(false)) // Reset jika error
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlayingAudio, trackIndex])

  const toggleAudio = () => setIsPlayingAudio(!isPlayingAudio)
  const changeTrack = (idx: number) => {
    setTrackIndex(idx)
    setIsPlayingAudio(true)
  }

  // --- TIMER LOGIC (LOOPING SYSTEM) ---
  const switchMode = (newMode: TimerMode) => {
    setMode(newMode)
    if (newMode === 'focus') setTimeLeft(config.focusDuration * 60)
    else if (newMode === 'shortBreak') setTimeLeft(config.shortBreakDuration * 60)
    else if (newMode === 'longBreak') setTimeLeft(config.longBreakDuration * 60)
    setIsActive(false)
    isProcessingComplete.current = false
  }

  const saveSettings = () => {
    setShowSettings(false)
    // Reset timer saat ini ke durasi baru
    if (mode === 'focus') setTimeLeft(config.focusDuration * 60)
    else if (mode === 'shortBreak') setTimeLeft(config.shortBreakDuration * 60)
    else if (mode === 'longBreak') setTimeLeft(config.longBreakDuration * 60)
    setIsActive(false)
  }

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000)
    } else if (timeLeft === 0 && isActive) {
      // Timer habis
      handleTimerComplete()
    }
    
    return () => { if (interval) clearInterval(interval) }
  }, [isActive, timeLeft])

  // --- 4. FIX DOUBLE ENTRY & 3. LOOPING LOGIC ---
  const handleTimerComplete = async () => {
    if (isProcessingComplete.current) return // Cegah jalan 2x
    isProcessingComplete.current = true
    setIsActive(false) // Stop timer sementara

    // A. Play Alarm (Beep)
    const alarm = new Audio(ALARM_URL)
    alarm.volume = 0.4
    alarm.play().catch(e => console.log("Alarm blocked", e))

    // B. Logic Mode Switching
    if (mode === 'focus') {
      // 1. Simpan ke Database (Cuma kalau mode fokus)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('focus_sessions').insert({
          user_id: user.id,
          duration_minutes: config.focusDuration,
          task_name: taskName || 'Deep Work'
        })
        fetchSessions() // Refresh list
      }

      // 2. Tentukan Break selanjutnya (Short atau Long?)
      const nextCycles = cycles + 1
      setCycles(nextCycles)

      if (nextCycles % config.longBreakInterval === 0) {
        // Waktunya Long Break
        setMode('longBreak')
        setTimeLeft(config.longBreakDuration * 60)
      } else {
        // Waktunya Short Break
        setMode('shortBreak')
        setTimeLeft(config.shortBreakDuration * 60)
      }

    } else {
      // Kalau Break selesai, balik ke Focus
      setMode('focus')
      setTimeLeft(config.focusDuration * 60)
    }

    // C. Auto Start?
    if (config.autoStart) {
      setTimeout(() => {
        isProcessingComplete.current = false
        setIsActive(true)
      }, 1500) // Jeda dikit sebelum mulai lagi
    } else {
      isProcessingComplete.current = false
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTotalDuration = () => {
    if (mode === 'focus') return config.focusDuration * 60
    if (mode === 'shortBreak') return config.shortBreakDuration * 60
    return config.longBreakDuration * 60
  }

  const getProgress = () => {
    const total = getTotalDuration()
    return ((total - timeLeft) / total) * 100
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 flex flex-col lg:flex-row gap-8 min-h-[85vh]">
      
      {/* Audio Element Hidden */}
      <audio ref={audioRef} src={MUSIC_TRACKS[trackIndex].url} loop crossOrigin="anonymous"/>

      {/* --- LEFT: TIMER UTAMA --- */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-8 relative">
        
        {/* Status Indicator */}
        <div className="absolute top-0 left-0 bg-slate-800/50 px-3 py-1 rounded-full text-xs font-bold text-slate-400 border border-white/5 flex items-center gap-2">
           <Repeat size={12}/> Loop: {cycles} / {config.longBreakInterval} to Long Break
        </div>

        {/* Mode Tabs */}
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-white/10 shadow-inner">
          {[
            { id: 'focus', label: 'Focus', icon: Brain },
            { id: 'shortBreak', label: 'Short Break', icon: Coffee },
            { id: 'longBreak', label: 'Long Break', icon: Zap },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => switchMode(m.id as TimerMode)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                mode === m.id 
                ? (mode === 'focus' ? 'bg-blue-600 text-white shadow-blue-900/50' : 'bg-emerald-600 text-white shadow-emerald-900/50') + ' shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <m.icon size={16}/> {m.label}
            </button>
          ))}
        </div>

        {/* Task Input */}
        {mode === 'focus' ? (
          <div className="w-full max-w-md text-center">
             <input 
              type="text" 
              placeholder="What are you working on?" 
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="bg-transparent border-b-2 border-slate-700 text-center text-2xl font-bold text-slate-100 placeholder-slate-700 focus:outline-none focus:border-blue-500 w-full pb-2 transition-all"
             />
          </div>
        ) : (
          <div className="text-center text-emerald-400 font-bold text-xl flex items-center gap-2 animate-bounce">
            <Coffee size={24}/> Time to recharge!
          </div>
        )}

        {/* Timer Circle */}
        <div className="relative group cursor-pointer" onClick={() => setIsActive(!isActive)}>
           {/* Glow Effect */}
           <div className={`absolute inset-0 rounded-full blur-[50px] opacity-20 transition-all duration-1000 ${
             isActive 
               ? (mode === 'focus' ? 'bg-blue-500' : 'bg-emerald-500') 
               : 'bg-transparent'
           }`}></div>
           
           <div className="w-72 h-72 md:w-80 md:h-80 relative">
             <svg className="w-full h-full -rotate-90 drop-shadow-2xl" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="3" />
                <circle 
                  cx="50" cy="50" r="45" fill="none" stroke={mode === 'focus' ? '#3b82f6' : '#10b981'} strokeWidth="4" 
                  strokeDasharray="283" strokeDashoffset={283 - (283 * getProgress() / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-7xl font-mono font-bold tracking-tighter transition-colors ${isActive ? 'text-white' : 'text-slate-500'}`}>
                  {formatTime(timeLeft)}
                </span>
                <span className={`text-xs font-bold uppercase tracking-[0.3em] mt-4 ${isActive ? (mode === 'focus' ? 'text-blue-400' : 'text-emerald-400') : 'text-slate-700'}`}>
                   {isActive ? (mode === 'focus' ? 'FOCUSING' : 'RESTING') : 'PAUSED'}
                </span>
             </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button onClick={() => setShowSettings(true)} className="p-4 rounded-2xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition border border-white/5">
             <Settings size={24} />
          </button>
          
          <button 
            onClick={() => setIsActive(!isActive)} 
            className={`w-24 h-24 rounded-[2rem] flex items-center justify-center transition-all shadow-2xl hover:scale-105 active:scale-95 ${
              isActive 
                ? 'bg-slate-800 text-white border border-white/10 ring-4 ring-slate-900' 
                : 'bg-white text-slate-900 shadow-blue-500/20'
            }`}
          >
            {isActive ? <Pause size={36} fill="currentColor"/> : <Play size={36} fill="currentColor" className="ml-2"/>}
          </button>

          <button onClick={() => {setIsActive(false); setTimeLeft(getTotalDuration())}} className="p-4 rounded-2xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition border border-white/5">
             <RotateCcw size={24} />
          </button>
        </div>
      </div>

      {/* --- RIGHT: SIDEBAR (Music & History) --- */}
      <div className="w-full lg:w-96 flex flex-col gap-6">
        
        {/* MUSIC PLAYER */}
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-xl">
             <div className="flex items-center justify-between mb-4">
               <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest flex items-center gap-2">
                 <Music size={16} className={isPlayingAudio ? "text-blue-400 animate-spin-slow" : "text-slate-600"}/> Ambience
               </h3>
               {isPlayingAudio && <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>}
            </div>

            {/* Track Selector */}
            <div className="bg-slate-950 rounded-xl p-2 mb-4 border border-white/5 flex items-center justify-between">
               <button onClick={() => changeTrack((trackIndex - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length)} className="p-2 text-slate-400 hover:text-white"><ChevronLeft size={20}/></button>
               <div className="text-center overflow-hidden px-2">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">{MUSIC_TRACKS[trackIndex].type}</p>
                  <p className="text-sm font-bold text-white truncate w-32">{MUSIC_TRACKS[trackIndex].name}</p>
               </div>
               <button onClick={() => changeTrack((trackIndex + 1) % MUSIC_TRACKS.length)} className="p-2 text-slate-400 hover:text-white"><ChevronRight size={20}/></button>
            </div>

            {/* Play/Vol Controls */}
            <div className="flex items-center gap-3">
               <button onClick={toggleAudio} className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center transition ${isPlayingAudio ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {isPlayingAudio ? <Pause size={20} fill="currentColor"/> : <Play size={20} fill="currentColor" className="ml-1"/>}
               </button>
               <div className="flex-1 bg-slate-800 rounded-lg px-3 py-2 flex items-center gap-2">
                  <Volume2 size={16} className="text-slate-400"/>
                  <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
               </div>
            </div>
        </div>

        {/* HISTORY */}
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 flex-1 shadow-lg flex flex-col min-h-[300px]">
           <div className="flex items-center justify-between mb-4">
             <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest flex items-center gap-2">
               <History size={14}/> Recent Sessions
             </h3>
             <span className="text-xs font-bold text-slate-500">{sessions.length} done</span>
           </div>
           
           <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar pr-2">
             {loading ? <Loader2 className="animate-spin mx-auto text-slate-600 mt-4"/> : sessions.map(s => (
               <div key={s.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-800/30 border border-transparent hover:border-white/10 transition">
                 <div>
                   <p className="text-sm font-medium text-slate-200">{s.task_name}</p>
                   <p className="text-[10px] text-slate-500">{new Date(s.completed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                 </div>
                 <div className="flex items-center gap-2">
                   <CheckCircle2 size={14} className="text-blue-500"/>
                   <span className="text-xs font-mono font-bold text-slate-400">{s.duration_minutes}m</span>
                 </div>
               </div>
             ))}
             {sessions.length === 0 && <p className="text-center text-slate-600 text-xs italic mt-10">No sessions yet.</p>}
           </div>
        </div>

      </div>

      {/* --- SETTINGS MODAL (Expanded) --- */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-[2rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Settings className="text-blue-500"/> Timer Settings</h2>
            
            <div className="space-y-6 mb-8">
              {/* Duration Settings */}
              <div className="grid grid-cols-3 gap-3">
                 <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Focus (m)</label>
                    <input type="number" value={config.focusDuration} onChange={(e) => setConfig({...config, focusDuration: Number(e.target.value)})} className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-center text-white font-bold outline-none focus:border-blue-500"/>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Short (m)</label>
                    <input type="number" value={config.shortBreakDuration} onChange={(e) => setConfig({...config, shortBreakDuration: Number(e.target.value)})} className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-center text-white font-bold outline-none focus:border-emerald-500"/>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Long (m)</label>
                    <input type="number" value={config.longBreakDuration} onChange={(e) => setConfig({...config, longBreakDuration: Number(e.target.value)})} className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-center text-white font-bold outline-none focus:border-emerald-500"/>
                 </div>
              </div>

              {/* Loop Settings */}
              <div className="bg-slate-800/50 p-4 rounded-xl space-y-4 border border-white/5">
                  <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-300">Sessions before Long Break</span>
                      <input type="number" min="1" max="10" value={config.longBreakInterval} onChange={(e) => setConfig({...config, longBreakInterval: Number(e.target.value)})} className="w-16 bg-slate-900 border border-white/10 rounded-lg p-2 text-center text-white font-bold"/>
                  </div>
                  
                  <div className="flex justify-between items-center border-t border-white/5 pt-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-300">Auto-start Timer</span>
                        <span className="text-[10px] text-slate-500">Continue to next timer automatically</span>
                      </div>
                      <button 
                        onClick={() => setConfig({...config, autoStart: !config.autoStart})}
                        className={`w-12 h-6 rounded-full transition relative ${config.autoStart ? 'bg-blue-600' : 'bg-slate-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.autoStart ? 'left-7' : 'left-1'}`}></div>
                      </button>
                  </div>
              </div>
            </div>

            <button onClick={saveSettings} className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-600/20">
               Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  )
}