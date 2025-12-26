/* eslint-disable react-hooks/set-state-in-effect */
'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../../utils/supabase/client'
import { 
  ChevronLeft, ChevronRight, X, Trash2, 
  Calendar as CalIcon, Plus, Clock, Loader2, MapPin 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useModal } from '../../context/ModalContext'

const supabase = createClient()

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

interface CalendarEvent {
  id: string
  title: string
  description: string
  start_time: string
  end_time: string
  event_date: string
  user_id: string
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [showEventModal, setShowEventModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [direction, setDirection] = useState(0) // 1 = Next, -1 = Prev

  // Context Modal Confirmation
  const { showModal } = useModal()

  // Form State
  const [formData, setFormData] = useState({ title: '', description: '', start_time: '09:00', end_time: '10:00' })

  // Generate Years Range
  const currentYear = new Date().getFullYear()
  const yearsRange = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i) 

  // --- HELPER FUNCTIONS ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const fetchEvents = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('events').select('*').eq('user_id', user.id)
    if (data) setEvents(data as CalendarEvent[])
  }, [])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  // --- NAVIGATION HANDLERS ---
  const changeMonth = (dir: number) => {
    setDirection(dir)
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + dir, 1))
  }

  const jumpToToday = () => {
    setDirection(currentDate < new Date() ? 1 : -1)
    setCurrentDate(new Date())
  }

  const handleMonthSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value)
    setDirection(newMonth > currentDate.getMonth() ? 1 : -1)
    setCurrentDate(new Date(currentDate.getFullYear(), newMonth, 1))
  }

  const handleYearSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value)
    setCurrentDate(new Date(newYear, currentDate.getMonth(), 1))
  }

  // --- EVENT HANDLERS ---
  const handleDateClick = (day: number) => {
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    const dateStr = `${year}-${month}-${dayStr}`
    
    setSelectedDate(dateStr)
    setShowEventModal(true)
    setFormData({ title: '', description: '', start_time: '09:00', end_time: '10:00' })
  }

  const handleSave = async () => {
    if (!formData.title) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user && selectedDate) {
      await supabase.from('events').insert({
        user_id: user.id,
        event_date: selectedDate,
        ...formData
      })
      await fetchEvents()
      setShowEventModal(false)
    }
    setLoading(false)
  }

  // Penggantian window.confirm dengan Custom Modal
  const handleDelete = (id: string) => {
    showModal({
      title: 'Delete Event?',
      message: 'Are you sure you want to remove this schedule?',
      type: 'danger',
      onConfirm: async () => {
        await supabase.from('events').delete().eq('id', id)
        // Optimistic update agar terasa cepat
        setEvents(prev => prev.filter(e => e.id !== id))
      }
    })
  }

  // --- ANIMATION VARIANTS ---
  const calendarVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 })
  }

  // --- RENDER CALENDAR GRID ---
  const renderCalendar = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    
    const blanks = Array(firstDay).fill(null)
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    
    return [...blanks, ...days].map((day, i) => {
      // Empty Slot
      if (!day) return <div key={`blank-${i}`} className="min-h-[100px] bg-slate-900/20 border border-white/5" />
      
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayEvents = events.filter(e => e.event_date === dateStr)
      
      // Cek apakah hari ini
      const todayStr = new Date().toISOString().split('T')[0]
      const isToday = dateStr === todayStr

      return (
        <motion.div 
          key={day}
          whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
          onClick={() => handleDateClick(day)}
          className={`min-h-[100px] border border-white/5 p-2 cursor-pointer group relative transition flex flex-col gap-1
            ${isToday ? 'bg-blue-900/10 shadow-[inset_0_0_20px_rgba(37,99,235,0.1)]' : 'bg-slate-900/40'}
          `}
        >
          <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full transition-all
            ${isToday 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
              : 'text-slate-400 group-hover:text-white group-hover:bg-white/10'}`
            }>
            {day}
          </span>
          
          <div className="space-y-1 mt-1 overflow-hidden">
            {dayEvents.slice(0, 3).map(ev => (
              <motion.div 
                initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                key={ev.id} 
                className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-200 truncate border border-blue-500/20 flex items-center gap-1.5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 animate-pulse"></div>
                <span className="truncate font-medium">{ev.title}</span>
              </motion.div>
            ))}
            {dayEvents.length > 3 && (
               <span className="text-[10px] text-slate-500 pl-2">+{dayEvents.length - 3} more</span>
            )}
          </div>
        </motion.div>
      )
    })
  }

  return (
    <div className="p-4 md:p-8 space-y-8 pb-40 max-w-7xl mx-auto animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
           <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
             Calendar
           </h1>
           <p className="text-slate-500">Manage your schedule and important dates.</p>
        </div>
        
        {/* NAVIGATOR */}
        <div className="flex items-center gap-3 bg-slate-900/80 p-2 rounded-2xl border border-white/10 shadow-xl backdrop-blur-sm">
          <button onClick={() => changeMonth(-1)} className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition active:scale-95">
            <ChevronLeft size={20}/>
          </button>
          
          <div className="flex items-center gap-2 px-2">
              <select 
                value={currentDate.getMonth()} 
                onChange={handleMonthSelect}
                className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer hover:text-blue-400 transition text-center py-1"
              >
                {MONTHS.map((m, idx) => <option key={m} value={idx} className="bg-slate-900">{m}</option>)}
              </select>

              <select 
                value={currentDate.getFullYear()} 
                onChange={handleYearSelect}
                className="bg-transparent text-slate-400 font-bold text-sm outline-none cursor-pointer hover:text-blue-400 transition ml-2 text-center py-1"
              >
                {yearsRange.map((y) => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
              </select>
          </div>

          <button onClick={() => changeMonth(1)} className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition active:scale-95">
            <ChevronRight size={20}/>
          </button>

          <div className="w-px h-6 bg-white/10 mx-1"></div>
          
          <button onClick={jumpToToday} className="text-xs font-bold text-blue-400 hover:bg-blue-500/10 px-3 py-2 rounded-lg transition">
            Today
          </button>
        </div>
      </div>

      {/* CALENDAR GRID WRAPPER */}
      <div className="rounded-3xl border border-white/10 overflow-hidden shadow-2xl bg-slate-950 flex flex-col relative z-0">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-white/10 bg-slate-900/80 backdrop-blur">
          {DAYS.map(d => (
            <div key={d} className="py-4 text-center text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">
                {d}
            </div>
          ))}
        </div>
        
        {/* Animated Grid Content */}
        <div className="overflow-hidden relative min-h-[500px]">
          <AnimatePresence initial={false} custom={direction} mode='popLayout'>
            <motion.div
              key={currentDate.toISOString()}
              custom={direction}
              variants={calendarVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="grid grid-cols-7 w-full h-full"
            >
              {renderCalendar()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* --- MODAL ADD/VIEW EVENT (Custom) --- */}
      <AnimatePresence>
        {showEventModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4"
            onClick={() => setShowEventModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-slate-900 w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800">
                 <div className="flex items-center gap-4">
                    <div className="bg-blue-500/20 p-3 rounded-2xl text-blue-400 border border-blue-500/20 shadow-inner">
                      <CalIcon size={24}/> 
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-white">Event Details</h3>
                      <p className="text-xs text-blue-300 font-mono mt-0.5 flex items-center gap-1">
                        <Clock size={10} /> {new Date(selectedDate || '').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                 </div>
                 <button onClick={() => setShowEventModal(false)} className="hover:bg-white/10 p-2 rounded-full transition text-slate-400 hover:text-white"><X size={20}/></button>
              </div>
              
              <div className="p-6 space-y-6">
                 {/* Form Inputs */}
                 <div className="space-y-4">
                    <div className="group">
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block ml-1 tracking-wider">Title</label>
                      <input 
                        autoFocus 
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm group-hover:border-white/20" 
                        value={formData.title} 
                        onChange={e => setFormData({...formData, title: e.target.value})} 
                        placeholder="What's happening?"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block ml-1 tracking-wider">Start Time</label>
                         <input type="time" className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm cursor-pointer" 
                           value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})}/>
                      </div>
                      <div>
                         <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block ml-1 tracking-wider">End Time</label>
                         <input type="time" className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm cursor-pointer" 
                           value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})}/>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block ml-1 tracking-wider">Description</label>
                      <textarea className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 h-24 resize-none text-sm custom-scrollbar" 
                        value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Add location or notes..."/>
                    </div>
                 </div>

                 <button onClick={handleSave} disabled={!formData.title || loading} 
                   className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed py-3.5 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 active:scale-[0.98]">
                   {loading ? <Loader2 className="animate-spin" size={18}/> : <Plus size={18}/>}
                   {loading ? 'Saving Event...' : 'Add to Calendar'}
                 </button>

                 {/* Existing Events List in Modal */}
                 <div className="border-t border-white/10 pt-5">
                    <h4 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-2 uppercase tracking-wide">
                      Existing Events
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                      <AnimatePresence>
                        {events.filter(e => e.event_date === selectedDate).map(ev => (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            key={ev.id} 
                            className="flex justify-between items-center bg-slate-800/40 hover:bg-slate-800 p-3 rounded-xl border border-white/5 transition group"
                          >
                             <div>
                                <p className="text-sm font-bold text-white group-hover:text-blue-300 transition">{ev.title}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                                    <span className="bg-white/5 px-1 rounded">{ev.start_time.slice(0,5)} - {ev.end_time.slice(0,5)}</span>
                                </p>
                             </div>
                             <button onClick={() => handleDelete(ev.id)} className="text-slate-500 hover:bg-red-500/10 hover:text-red-400 p-2 rounded-lg transition" title="Delete Event">
                                <Trash2 size={16}/>
                             </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      
                      {events.filter(e => e.event_date === selectedDate).length === 0 && (
                         <div className="text-center py-4 border-2 border-dashed border-white/5 rounded-xl">
                            <p className="text-xs text-slate-600 italic">No events scheduled for this day yet.</p>
                         </div>
                      )}
                    </div>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}