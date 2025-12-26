// src/context/FocusContext.tsx
'use client'
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '../utils/supabase/client'

const supabase = createClient()

// --- DATA LAGU & CONFIG ---
export const MUSIC_TRACKS = [
  { name: "Lofi Hip Hop (Stream)", url: "https://stream.zeno.fm/0r0xa792kwzuv", type: 'Radio 🔴' },
  { name: "Rain Sounds", url: "https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg", type: 'Nature 🌧️' },
  { name: "Relaxing Piano", url: "https://cdn.pixabay.com/audio/2022/03/24/audio_3cb7ae3a96.mp3", type: 'Music 🎹' },
  { name: "White Noise", url: "https://actions.google.com/sounds/v1/ambiences/white_noise.ogg", type: 'Focus 🧠' },
  { name: "Forest Night", url: "https://actions.google.com/sounds/v1/nature/crickets_in_the_night_ambience.ogg", type: 'Nature 🦗' },
  { name: "Cafe Ambience", url: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg", type: 'Ambience ☕' },
]

const ALARM_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"

type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

interface FocusContextType {
  mode: TimerMode
  timeLeft: number
  isActive: boolean
  taskName: string
  setTaskName: (name: string) => void
  setIsActive: (active: boolean) => void
  switchMode: (mode: TimerMode) => void
  config: any
  setConfig: (config: any) => void
  totalDuration: number
  // Audio
  isPlayingAudio: boolean
  toggleAudio: () => void
  trackIndex: number
  changeTrack: (index: number) => void
  volume: number
  setVolume: (vol: number) => void
  // Stats
  sessions: any[]
  cycles: number
  refreshSessions: () => void
  clearSessions: () => void
}


const FocusContext = createContext<FocusContextType | undefined>(undefined)

export function FocusProvider({ children }: { children: React.ReactNode }) {
  // State Timer
  const [mode, setMode] = useState<TimerMode>('focus')
  const [timeLeft, setTimeLeft] = useState(60 * 60)
  const [isActive, setIsActive] = useState(false)
  const [taskName, setTaskName] = useState('')
  const [cycles, setCycles] = useState(0)

  // State Settings
  const [config, setConfig] = useState({
    focusDuration: 60, shortBreakDuration: 5, longBreakDuration: 10, longBreakInterval: 3, autoStart: false
  })

  // LIVE UPDATE TIMER WHEN CONFIG CHANGES (IF NOT ACTIVE)
  useEffect(() => {
    if (!isActive) {
      if (mode === 'focus') setTimeLeft(config.focusDuration * 60)
      else if (mode === 'shortBreak') setTimeLeft(config.shortBreakDuration * 60)
      else setTimeLeft(config.longBreakDuration * 60)
    }
  }, [config, mode, isActive])


  const clearSessions = () => {
    setSessions([])
    setCycles(0)
  }
  // State Audio
  const [trackIndex, setTrackIndex] = useState(0)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [volume, setVolume] = useState(0.4)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isProcessingComplete = useRef(false)

  // Data
  const [sessions, setSessions] = useState<any[]>([])

  // --- AUDIO LOGIC ---
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  useEffect(() => {
    if (audioRef.current) {
      if (isPlayingAudio) {
        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) playPromise.catch(() => setIsPlayingAudio(false))
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlayingAudio, trackIndex])

  const toggleAudio = () => setIsPlayingAudio(!isPlayingAudio)
  const changeTrack = (idx: number) => { setTrackIndex(idx); setIsPlayingAudio(true) }

  // --- TIMER LOGIC ---
  const getTotalDuration = () => {
    if (mode === 'focus') return config.focusDuration * 60
    if (mode === 'shortBreak') return config.shortBreakDuration * 60
    return config.longBreakDuration * 60
  }

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode)
    if (newMode === 'focus') setTimeLeft(config.focusDuration * 60)
    else if (newMode === 'shortBreak') setTimeLeft(config.shortBreakDuration * 60)
    else setTimeLeft(config.longBreakDuration * 60)
    setIsActive(false)
    isProcessingComplete.current = false
  }

  const fetchSessions = useCallback(async () => {
    const { data } = await supabase.from('focus_sessions').select('*').order('completed_at', { ascending: false }).limit(5)
    if (data) setSessions(data)
  }, [])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000)
    } else if (timeLeft === 0 && isActive) {
      handleTimerComplete()
    }
    return () => { if (interval) clearInterval(interval) }
  }, [isActive, timeLeft])

  const handleTimerComplete = async () => {
    if (isProcessingComplete.current) return
    isProcessingComplete.current = true
    setIsActive(false)

    const alarm = new Audio(ALARM_URL)
    alarm.volume = 0.4
    alarm.play().catch(e => console.log(e))

    if (mode === 'focus') {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('focus_sessions').insert({
          user_id: user.id, duration_minutes: config.focusDuration, task_name: taskName || 'Deep Work'
        })
        fetchSessions()
      }
      const nextCycles = cycles + 1
      setCycles(nextCycles)
      if (nextCycles % config.longBreakInterval === 0) switchMode('longBreak')
      else switchMode('shortBreak')
    } else {
      switchMode('focus')
    }

    if (config.autoStart) {
      setTimeout(() => { isProcessingComplete.current = false; setIsActive(true) }, 1500)
    } else {
      isProcessingComplete.current = false
    }
  }

  return (
    <FocusContext.Provider value={{
      mode,
      timeLeft,
      isActive,
      setIsActive,
      switchMode,
      taskName,
      setTaskName,
      config,
      setConfig,
      isPlayingAudio,
      toggleAudio,
      trackIndex,
      changeTrack,
      volume,
      setVolume,
      sessions,
      cycles,
      refreshSessions: fetchSessions,
      totalDuration: getTotalDuration(),
      clearSessions, // ✅ sekarang valid
    }}>

      {children}
      {/* GLOBAL AUDIO ELEMENT (Hidden but always active) */}
      <audio ref={audioRef} src={MUSIC_TRACKS[trackIndex].url} loop crossOrigin="anonymous" />
    </FocusContext.Provider>
  )
}

export const useFocus = () => {
  const context = useContext(FocusContext)
  if (!context) throw new Error('useFocus must be used within a FocusProvider')
  return context
}