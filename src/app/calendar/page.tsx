'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'
import { 
  ChevronLeft, ChevronRight, X, Trash2, 
  Calendar as CalIcon, Plus, Clock, MapPin 
} from 'lucide-react'

const supabase = createClient()

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState({ title: '', description: '', start_time: '09:00', end_time: '10:00' })

  // --- GENERATE YEARS LIST (Dynamic Range: Current Year +/- 10) ---
  const currentYear = new Date().getFullYear()
  const yearsRange = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i) 

  // --- HELPER FUNCTIONS ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const fetchEvents = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    // Ambil event (bisa dioptimasi by month range nanti)
    const { data } = await supabase.from('events').select('*').eq('user_id', user.id)
    if (data) setEvents(data)
  }

  useEffect(() => { fetchEvents() }, [currentDate])

  // --- NAVIGATION HANDLERS ---
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))

  // Direct Jump Handlers (Dropdown)
  const handleMonthSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value)
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
    setShowModal(true)
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
      setShowModal(false)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if(confirm('Delete event?')) {
        await supabase.from('events').delete().eq('id', id)
        fetchEvents()
    }
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
      // Kotak Kosong (Tanggal bulan sebelumnya)
      if (!day) return <div key={`blank-${i}`} className="min-h-[100px] bg-slate-900/30 border border-white/5" />
      
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayEvents = events.filter(e => e.event_date === dateStr)
      const isToday = dateStr === new Date().toISOString().split('T')[0]

      return (
        <div 
          key={day} 
          onClick={() => handleDateClick(day)}
          className={`min-h-[100px] border border-white/5 p-2 hover:bg-white/5 cursor-pointer group relative transition flex flex-col gap-1 
            ${isToday ? 'bg-blue-900/10' : 'bg-slate-900/40'}`}
        >
          <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-slate-400 group-hover:text-white'}`}>
            {day}
          </span>
          
          <div className="space-y-1 overflow-hidden">
            {dayEvents.map(ev => (
              <div key={ev.id} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-200 truncate border border-blue-500/20 flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                <span className="truncate font-medium">{ev.title}</span>
              </div>
            ))}
          </div>
        </div>
      )
    })
  }

  return (
    <div className="p-6 md:p-8 space-y-6 pb-24 max-w-7xl mx-auto animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Calendar</h1>
           <p className="text-slate-400 text-sm">Organize your schedule efficiently</p>
        </div>
        
        {/* DYNAMIC NAVIGATOR */}
        <div className="flex items-center bg-slate-800 p-1.5 rounded-xl border border-white/10 shadow-lg">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"><ChevronLeft size={20}/></button>
          
          <div className="flex gap-1 px-2">
              {/* MONTH SELECTOR */}
              <select 
                value={currentDate.getMonth()} 
                onChange={handleMonthSelect}
                className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer appearance-none hover:text-blue-400 transition text-center"
              >
                {MONTHS.map((m, idx) => (
                    <option key={m} value={idx} className="bg-slate-900 text-white">{m}</option>
                ))}
              </select>

              {/* YEAR SELECTOR */}
              <select 
                value={currentDate.getFullYear()} 
                onChange={handleYearSelect}
                className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer appearance-none hover:text-blue-400 transition ml-2 text-center"
              >
                {yearsRange.map((y) => (
                    <option key={y} value={y} className="bg-slate-900 text-white">{y}</option>
                ))}
              </select>
          </div>

          <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"><ChevronRight size={20}/></button>
        </div>
      </div>

      {/* CALENDAR GRID */}
      <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl bg-slate-950">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-white/10 bg-slate-900/50">
          {DAYS.map(d => (
            <div key={d} className="py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                {d}
            </div>
          ))}
        </div>
        {/* Date Cells */}
        <div className="grid grid-cols-7">
          {renderCalendar()}
        </div>
      </div>

      {/* MODAL ADD/VIEW EVENT */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
               <div className="flex items-center gap-3">
                  <div className="bg-blue-600/20 p-2 rounded-lg text-blue-400">
                    <CalIcon size={20}/> 
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">Event Details</h3>
                    <p className="text-xs text-slate-400">{selectedDate}</p>
                  </div>
               </div>
               <button onClick={() => setShowModal(false)} className="hover:bg-red-500/20 hover:text-red-400 p-2 rounded-lg transition"><X size={20}/></button>
            </div>
            
            <div className="p-6 space-y-5">
               {/* Form Inputs */}
               <div className="space-y-4">
                   <div>
                     <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">Event Title</label>
                     <input 
                        autoFocus 
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm" 
                        value={formData.title} 
                        onChange={e => setFormData({...formData, title: e.target.value})} 
                        placeholder="e.g. Project Meeting"
                     />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">Start</label>
                        <input type="time" className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm" 
                          value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})}/>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">End</label>
                        <input type="time" className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm" 
                          value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})}/>
                     </div>
                   </div>

                   <div>
                     <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">Description (Optional)</label>
                     <textarea className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 h-20 resize-none text-sm" 
                        value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Add notes..."/>
                   </div>
               </div>

               <button onClick={handleSave} disabled={!formData.title || loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-3 rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
                 {loading ? <Clock className="animate-spin" size={18}/> : <Plus size={18}/>}
                 {loading ? 'Saving...' : 'Add Event'}
               </button>

               {/* Existing Events List */}
               <div className="border-t border-white/10 pt-5">
                  <h4 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-2 uppercase tracking-wide">
                    Events on {selectedDate}
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                    {events.filter(e => e.event_date === selectedDate).map(ev => (
                      <div key={ev.id} className="flex justify-between items-center bg-slate-800/40 hover:bg-slate-800 p-3 rounded-xl border border-white/5 transition group">
                         <div>
                            <p className="text-sm font-bold text-white group-hover:text-blue-200 transition">{ev.title}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                                <Clock size={10}/> {ev.start_time.slice(0,5)} - {ev.end_time.slice(0,5)}
                            </p>
                         </div>
                         <button onClick={() => handleDelete(ev.id)} className="text-slate-600 hover:bg-red-500/20 hover:text-red-400 p-2 rounded-lg transition">
                            <Trash2 size={14}/>
                         </button>
                      </div>
                    ))}
                    {events.filter(e => e.event_date === selectedDate).length === 0 && (
                        <p className="text-xs text-slate-600 italic text-center py-2">No events scheduled yet.</p>
                    )}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}