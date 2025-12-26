'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'
import { ChevronLeft, ChevronRight, X, Trash2, Calendar as CalIcon, Plus } from 'lucide-react'

const supabase = createClient()
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ title: '', description: '', start_time: '09:00', end_time: '10:00' })

  // Helper
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  // Fetch Events
  const fetchEvents = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('events').select('*').eq('user_id', user.id)
    if (data) setEvents(data)
  }

  useEffect(() => { fetchEvents() }, [currentDate])

  // Handlers
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
        user_id: user.id, event_date: selectedDate, ...formData
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

  // Render Grid
  const renderCalendar = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    const blanks = Array(firstDay).fill(null)
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    return [...blanks, ...days].map((day, i) => {
      if (!day) return <div key={`blank-${i}`} className="h-24 bg-slate-900/30 border border-white/5" />
      
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayEvents = events.filter(e => e.event_date === dateStr)
      const isToday = dateStr === new Date().toISOString().split('T')[0]

      return (
        <div key={day} onClick={() => handleDateClick(day)}
             className={`h-24 border border-white/5 p-2 hover:bg-white/5 cursor-pointer group relative transition ${isToday ? 'bg-blue-900/10' : ''}`}>
          <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-slate-400 group-hover:text-white'}`}>{day}</span>
          <div className="mt-1 space-y-1 overflow-hidden">
            {dayEvents.slice(0, 3).map(ev => (
              <div key={ev.id} className="text-[10px] px-1 py-0.5 rounded bg-blue-600/20 text-blue-200 truncate border border-blue-500/20">
                {ev.start_time.slice(0,5)} {ev.title}
              </div>
            ))}
          </div>
        </div>
      )
    })
  }

  return (
    <div className="p-6 md:p-8 space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold">Calendar</h1><p className="text-slate-400">Manage your schedule</p></div>
        <div className="flex items-center gap-4 bg-slate-800 p-1 rounded-xl border border-white/10">
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-white/10 rounded-lg"><ChevronLeft/></button>
          <span className="font-bold w-32 text-center">{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-white/10 rounded-lg"><ChevronRight/></button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl bg-slate-950">
        <div className="grid grid-cols-7 border-b border-white/10">{DAYS.map(d => <div key={d} className="py-3 text-center text-sm font-bold text-slate-500">{d}</div>)}</div>
        <div className="grid grid-cols-7">{renderCalendar()}</div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-white/10 flex justify-between bg-slate-800/50">
               <h3 className="font-bold flex items-center gap-2"><CalIcon size={18} className="text-blue-500"/> {selectedDate}</h3>
               <button onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
               <div><label className="text-xs font-bold text-slate-500">TITLE</label><input autoFocus className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Event title..."/></div>
               <div className="grid grid-cols-2 gap-4">
                 <div><label className="text-xs font-bold text-slate-500">START</label><input type="time" className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 outline-none" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})}/></div>
                 <div><label className="text-xs font-bold text-slate-500">END</label><input type="time" className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 outline-none" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})}/></div>
               </div>
               <button onClick={handleSave} disabled={!formData.title || loading} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold transition disabled:opacity-50">{loading ? 'Saving...' : 'Save Event'}</button>
               
               <div className="border-t border-white/10 pt-4">
                  <h4 className="text-xs font-bold text-slate-500 mb-2">Events on this day</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                    {events.filter(e => e.event_date === selectedDate).map(ev => (
                      <div key={ev.id} className="flex justify-between items-center bg-slate-800/50 p-2 rounded-lg border border-white/5">
                         <div><p className="text-sm font-bold">{ev.title}</p><p className="text-[10px] text-slate-400">{ev.start_time.slice(0,5)} - {ev.end_time.slice(0,5)}</p></div>
                         <button onClick={() => handleDelete(ev.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={14}/></button>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}