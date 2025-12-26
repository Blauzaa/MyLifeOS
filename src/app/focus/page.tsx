/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import { useState, useEffect } from 'react'
import { useFocus, MUSIC_TRACKS } from '../../context/FocusContext' 
import { useModal } from '../../context/ModalContext' // Import Modal Global

import { 
  Play, Pause, RotateCcw, History, 
  Settings, Music, Volume2, VolumeX, Coffee, Brain, 
  ChevronRight, ChevronLeft, Zap, CheckCircle2, Repeat, Trash2, X
} from 'lucide-react'

export default function FocusPage() {
  // Ambil data dari Context
  const { 
    mode, timeLeft, isActive, setIsActive, switchMode,
    taskName, setTaskName, config, setConfig,
    isPlayingAudio, toggleAudio, trackIndex, changeTrack, volume, setVolume,
    sessions, cycles, totalDuration, clearSessions // Asumsi ada fungsi clearSessions di context (jika tidak ada, bisa dihapus)
  } = useFocus()

  const { showModal } = useModal() // Gunakan Global Modal
  const [showSettings, setShowSettings] = useState(false)
  const [isHoveringTimer, setIsHoveringTimer] = useState(false)

  // Format Waktu (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Hitung Progress
  const getProgress = () => {
    return ((totalDuration - timeLeft) / totalDuration) * 100
  }

  // Tema Warna Berdasarkan Mode
  const themeColor = mode === 'focus' ? 'blue' : 'emerald'
  const bgGradient = mode === 'focus' 
    ? 'from-blue-900/20 via-slate-900 to-slate-950' 
    : 'from-emerald-900/20 via-slate-900 to-slate-950'

  // Handler Hapus History (Menggunakan Custom Modal)
  const handleClearHistory = () => {
    showModal({
        title: 'Clear Session History?',
        message: 'This will reset your daily stats. This action cannot be undone.',
        type: 'danger',
        confirmText: 'Clear All',
        onConfirm: () => {
            if(clearSessions) clearSessions()
            // Jika tidak ada fungsi clearSessions di context, logic manual bisa ditaruh sini
        }
    })
  }

  return (
    <div className={`min-h-[85vh] transition-colors duration-1000 bg-gradient-to-br ${bgGradient} flex flex-col items-center justify-center p-4 animate-in fade-in duration-700`}>
      
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 items-start">
      
        {/* --- LEFT COLUMN: TIMER UTAMA --- */}
        <div className="flex-1 w-full flex flex-col items-center relative">
          
          {/* 1. Mode Tabs (Pill Shape) */}
          <div className="bg-black/30 backdrop-blur-md p-1.5 rounded-full border border-white/10 shadow-xl mb-8 flex relative z-10">
            {[
              { id: 'focus', label: 'Focus', icon: Brain },
              { id: 'shortBreak', label: 'Short', icon: Coffee },
              { id: 'longBreak', label: 'Long', icon: Zap },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => switchMode(m.id as any)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                  mode === m.id 
                  ? (mode === 'focus' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]' : 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]') 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <m.icon size={16}/> <span className="hidden md:inline">{m.label}</span>
              </button>
            ))}
          </div>

          {/* 2. Timer Circle (SVG) */}
          <div 
            className="relative group cursor-pointer mb-8" 
            onClick={() => setIsActive(!isActive)}
            onMouseEnter={() => setIsHoveringTimer(true)}
            onMouseLeave={() => setIsHoveringTimer(false)}
          >
             {/* Glow Background */}
             <div className={`absolute inset-0 rounded-full blur-[60px] opacity-20 transition-all duration-1000 ${isActive ? (mode === 'focus' ? 'bg-blue-500 scale-110' : 'bg-emerald-500 scale-110') : 'bg-slate-700 scale-100'}`}></div>
             
             <div className="w-72 h-72 md:w-96 md:h-96 relative">
               <svg className="w-full h-full -rotate-90 drop-shadow-2xl" viewBox="0 0 100 100">
                 {/* Background Circle */}
                 <circle cx="50" cy="50" r="45" fill="none" stroke="#0f172a" strokeWidth="2" className="opacity-50"/>
                 {/* Progress Circle */}
                 <circle 
                   cx="50" cy="50" r="45" fill="none" 
                   stroke={mode === 'focus' ? '#3b82f6' : '#10b981'} 
                   strokeWidth="3" 
                   strokeDasharray="283" 
                   strokeDashoffset={283 - (283 * getProgress() / 100)}
                   strokeLinecap="round"
                   className="transition-all duration-1000 ease-linear shadow-[0_0_10px_currentColor]"
                 />
               </svg>
               
               {/* Center Content */}
               <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                  <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
                    <span className={`text-7xl md:text-8xl font-mono font-bold tracking-tighter transition-colors select-none ${isActive ? 'text-white drop-shadow-lg' : 'text-slate-500'}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                  
                  <div className={`flex items-center gap-2 mt-4 transition-all duration-300 ${isHoveringTimer || !isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                      <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
                        {isActive ? 'PAUSE' : 'START'}
                      </span>
                  </div>
               </div>
            </div>
          </div>

          {/* 3. Task Input */}
          <div className="w-full max-w-md text-center mb-8 relative group">
             {mode === 'focus' ? (
                <>
                  <input 
                    type="text" 
                    placeholder="What are you working on?" 
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className="bg-transparent text-center text-2xl md:text-3xl font-bold text-white placeholder-slate-700 focus:outline-none w-full pb-2 transition-all border-b-2 border-transparent focus:border-blue-500/50"
                  />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-blue-500 transition-all duration-300 group-hover:w-1/2 opacity-50"></div>
                </>
             ) : (
                <div className="text-center animate-bounce-slow">
                   <p className="text-emerald-400 font-bold text-2xl flex items-center justify-center gap-2">
                     <Coffee size={28}/> Recharge Time
                   </p>
                   <p className="text-slate-500 text-sm mt-1">Take a deep breath.</p>
                </div>
             )}
          </div>

          {/* 4. Main Controls */}
          <div className="flex items-center gap-6">
            <button onClick={() => setShowSettings(true)} className="p-4 rounded-full bg-slate-800/50 backdrop-blur text-slate-400 hover:bg-slate-700 hover:text-white transition border border-white/5 shadow-lg active:scale-95 group" title="Settings">
               <Settings size={24} className="group-hover:rotate-90 transition duration-500"/>
            </button>
            
            <button 
              onClick={() => setIsActive(!isActive)} 
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl hover:scale-105 active:scale-95 ${
                isActive 
                  ? 'bg-slate-800 border border-white/10 text-white' 
                  : (mode === 'focus' ? 'bg-blue-600 text-white shadow-blue-600/30' : 'bg-emerald-600 text-white shadow-emerald-600/30')
              }`}
            >
              {isActive ? <Pause size={32} fill="currentColor"/> : <Play size={32} fill="currentColor" className="ml-1"/>}
            </button>

            <button onClick={() => {setIsActive(false); switchMode(mode)}} className="p-4 rounded-full bg-slate-800/50 backdrop-blur text-slate-400 hover:bg-slate-700 hover:text-white transition border border-white/5 shadow-lg active:scale-95" title="Reset Timer">
               <RotateCcw size={24} />
            </button>
          </div>
          
          {/* Loop Counter Badge */}
          <div className="mt-8 flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-full border border-white/5 text-xs font-bold text-slate-400">
             <Repeat size={12}/> Loop {cycles} / {config.longBreakInterval}
          </div>

        </div>

        {/* --- RIGHT COLUMN: SIDEBAR (Music & History) --- */}
        <div className="w-full lg:w-96 flex flex-col gap-6 animate-in slide-in-from-right-8 duration-700">
          
          {/* A. MUSIC PLAYER CARD */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-2xl group">
             {/* Background Image Effect (Simulated Cover Art) */}
             <div className={`absolute inset-0 bg-gradient-to-br from-${themeColor}-500/10 to-transparent opacity-50`}></div>
             
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest flex items-center gap-2">
                    <Music size={14}/> Soundscape
                  </h3>
                  {isPlayingAudio && (
                      <div className="flex gap-1 items-end h-3">
                          <div className="w-1 bg-blue-500 animate-[bounce_1s_infinite] h-2"></div>
                          <div className="w-1 bg-blue-500 animate-[bounce_1.2s_infinite] h-3"></div>
                          <div className="w-1 bg-blue-500 animate-[bounce_0.8s_infinite] h-1.5"></div>
                      </div>
                  )}
               </div>

               {/* Track Info */}
               <div className="flex items-center justify-between bg-black/40 rounded-2xl p-3 mb-4 border border-white/5">
                  <button onClick={() => changeTrack((trackIndex - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length)} className="p-2 text-slate-400 hover:text-white transition hover:scale-110"><ChevronLeft size={20}/></button>
                  <div className="text-center overflow-hidden px-2">
                     <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-0.5">{MUSIC_TRACKS[trackIndex].type}</p>
                     <p className="text-sm font-bold text-white truncate w-32">{MUSIC_TRACKS[trackIndex].name}</p>
                  </div>
                  <button onClick={() => changeTrack((trackIndex + 1) % MUSIC_TRACKS.length)} className="p-2 text-slate-400 hover:text-white transition hover:scale-110"><ChevronRight size={20}/></button>
               </div>

               {/* Controls */}
               <div className="flex items-center gap-3">
                  <button onClick={toggleAudio} className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center transition-all shadow-lg ${isPlayingAudio ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                     {isPlayingAudio ? <Pause size={20} fill="currentColor"/> : <Play size={20} fill="currentColor" className="ml-1"/>}
                  </button>
                  <div className="flex-1 bg-slate-800/50 rounded-full px-4 py-3 flex items-center gap-3 border border-white/5">
                     {volume === 0 ? <VolumeX size={16} className="text-slate-500"/> : <Volume2 size={16} className="text-slate-300"/>}
                     <input 
                        type="range" min="0" max="1" step="0.05" 
                        value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} 
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-white"
                     />
                  </div>
               </div>
             </div>
          </div>

          {/* B. HISTORY CARD */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex-1 shadow-2xl flex flex-col min-h-[300px]">
             <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
               <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest flex items-center gap-2">
                 <History size={14}/> History
               </h3>
               {sessions.length > 0 && (
                 <button onClick={handleClearHistory} className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 hover:underline">
                    <Trash2 size={10}/> Clear
                 </button>
               )}
             </div>
             
             <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar pr-2">
               {sessions.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-40 opacity-40">
                       <CheckCircle2 size={32} className="mb-2 text-slate-500"/>
                       <p className="text-xs text-slate-400">No sessions yet today.</p>
                   </div>
               ) : (
                   sessions.map((s, i) => (
                    <div key={s.id || i} className="flex justify-between items-center p-3 rounded-xl bg-slate-800/40 border border-transparent hover:border-white/10 transition animate-in slide-in-from-bottom-2" style={{animationDelay: `${i * 50}ms`}}>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium text-slate-200 truncate">{s.task_name || 'Untitled Focus'}</p>
                        <p className="text-[10px] text-slate-500">{new Date(s.completed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-950/50 px-2 py-1 rounded-lg">
                        <CheckCircle2 size={12} className="text-blue-500"/>
                        <span className="text-xs font-mono font-bold text-slate-400">{s.duration_minutes}m</span>
                      </div>
                    </div>
                  ))
               )}
             </div>
          </div>

        </div>
      </div>

      {/* --- SETTINGS MODAL (Overhaul UI) --- */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-[2rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 relative">
            <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition">
                <X size={16}/>
            </button>

            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Settings className="text-blue-500"/> Timer Settings
            </h2>
            
            <div className="space-y-6 mb-8">
              {/* Duration Settings */}
              <div className="grid grid-cols-3 gap-3">
                 {[
                    { label: 'Focus', val: config.focusDuration, key: 'focusDuration', color: 'border-blue-500/50 text-blue-400' },
                    { label: 'Short', val: config.shortBreakDuration, key: 'shortBreakDuration', color: 'border-emerald-500/50 text-emerald-400' },
                    { label: 'Long', val: config.longBreakDuration, key: 'longBreakDuration', color: 'border-emerald-500/50 text-emerald-400' }
                 ].map((item) => (
                    <div key={item.label} className="space-y-2 group">
                        <label className="text-[10px] uppercase font-bold text-slate-500 group-hover:text-slate-300 transition">{item.label}</label>
                        <input 
                            type="number" 
                            value={item.val} 
                            onChange={(e) => setConfig({...config, [item.key]: Number(e.target.value)})} 
                            className={`w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-center font-bold outline-none focus:bg-slate-800 transition-all focus:border-opacity-100 ${item.color}`}
                        />
                    </div>
                 ))}
              </div>

              {/* Toggle & Loop Settings */}
              <div className="bg-slate-800/30 p-4 rounded-2xl space-y-4 border border-white/5">
                  <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-300">Long Break Interval</span>
                      <div className="flex items-center gap-2">
                        <input 
                            type="number" min="1" max="10" 
                            value={config.longBreakInterval} 
                            onChange={(e) => setConfig({...config, longBreakInterval: Number(e.target.value)})} 
                            className="w-12 bg-slate-900 border border-white/10 rounded-lg p-1.5 text-center text-white font-bold text-sm"
                        />
                        <span className="text-xs text-slate-500">sessions</span>
                      </div>
                  </div>
                  
                  <div className="flex justify-between items-center border-t border-white/5 pt-4 cursor-pointer" onClick={() => setConfig({...config, autoStart: !config.autoStart})}>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-300">Auto-start Timer</span>
                        <span className="text-[10px] text-slate-500">Smooth transition between modes</span>
                      </div>
                      <div className={`w-11 h-6 rounded-full transition-colors relative ${config.autoStart ? 'bg-blue-600' : 'bg-slate-700'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${config.autoStart ? 'left-6' : 'left-1'}`}></div>
                      </div>
                  </div>
              </div>
            </div>

            <button onClick={() => setShowSettings(false)} className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-600/20 active:scale-[0.98]">
                Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  )
}