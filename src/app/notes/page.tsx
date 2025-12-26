'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '../../utils/supabase/client'
import { Plus, Trash2, Save, Image as ImageIcon, Loader2, Cloud } from 'lucide-react'
import imageCompression from 'browser-image-compression'

const supabase = createClient()

interface Note {
  id: string
  title: string
  content: string
  created_at: string
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 1. FETCH DATA
  const fetchNotes = useCallback(async () => {
    const { data } = await supabase.from('notes').select('*').order('created_at', { ascending: false })
    if (data) setNotes(data as Note[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  // ============================================================
  // 2. FUNGSI UPLOAD KE CLOUDINARY
  // ============================================================
  const processAndUploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) return null

    try {
      setIsUploading(true)
      
      // A. Kompresi Gambar (Biar upload cepet & hemat kuota Cloudinary)
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true }
      const compressedFile = await imageCompression(file, options)
      
      // B. Siapkan Data
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      
      if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary Config (Cloud Name / Preset) belum diset di .env")
      }

      const formData = new FormData()
      formData.append('file', compressedFile)
      formData.append('upload_preset', uploadPreset) // Wajib untuk Unsigned Upload
      
      // C. Kirim ke Cloudinary API
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || "Gagal upload ke Cloudinary")
      }

      // D. Ambil Secure URL (HTTPS)
      return result.secure_url 
      
    } catch (err) {
      console.error("Upload failed", err)
      alert("Gagal upload gambar! Cek console untuk detail.")
      return null
    } finally {
      setIsUploading(false)
    }
  }

  // 3. INSERT TEXT LOGIC
  const insertTextAtCursor = (text: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      setEditContent(prev => prev + text)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentText = editContent
    
    const newText = currentText.substring(0, start) + text + currentText.substring(end)
    setEditContent(newText)

    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length
      textarea.focus()
    }, 0)
  }

  // 4. SAVE LOGIC
  const saveToDb = async (noteId: string | undefined, title: string, content: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setSaveStatus('saving')

    try {
      if (noteId) {
        await supabase.from('notes').update({ 
          title, 
          content, 
          updated_at: new Date() 
        }).eq('id', noteId)

        setNotes(prev => prev.map(n => n.id === noteId ? { ...n, title, content } : n))
      } else {
        const { data } = await supabase.from('notes').insert({
          title: title || 'Untitled Note',
          content,
          user_id: user.id
        }).select().single()

        if (data) {
          setSelectedNote(data)
          setNotes(prev => [data, ...prev])
        }
      }
      setSaveStatus('saved')
    } catch (error) {
      console.error(error)
      setSaveStatus('unsaved')
    }
  }

  // 5. AUTO SAVE
  useEffect(() => {
    if (!selectedNote && !editTitle && !editContent) return 

    const isChanged = selectedNote 
      ? (editTitle !== selectedNote.title || editContent !== selectedNote.content)
      : (editTitle !== '' || editContent !== '')

    if (!isChanged) return

    setSaveStatus('unsaved')

    const timer = setTimeout(() => {
      saveToDb(selectedNote?.id, editTitle, editContent)
    }, 1000)

    return () => clearTimeout(timer)
  }, [editTitle, editContent, selectedNote])

  // 6. EVENT HANDLERS
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault()
        const file = items[i].getAsFile()
        if (file) {
          const url = await processAndUploadImage(file)
          if (url) {
            // Kita tambahkan styling agar gambar responsif di dalam note
            const imgTag = `\n<img src="${url}" alt="image" style="max-width:100%; border-radius:12px; margin: 10px 0;" />\n`
            insertTextAtCursor(imgTag)
          }
        }
      }
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        const url = await processAndUploadImage(file)
        if (url) {
          const imgTag = `\n<img src="${url}" alt="image" style="max-width:100%; border-radius:12px; margin: 10px 0;" />\n`
          insertTextAtCursor(imgTag)
        }
      }
    }
  }

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = await processAndUploadImage(file)
      if (url) {
        const imgTag = `\n<img src="${url}" alt="image" style="max-width:100%; border-radius:12px; margin: 10px 0;" />\n`
        insertTextAtCursor(imgTag)
      }
    }
  }

  const createNewNote = () => {
    setSelectedNote(null)
    setEditTitle('')
    setEditContent('')
    setSaveStatus('saved')
    setTimeout(() => document.getElementById('note-title')?.focus(), 100)
  }

  const selectNote = (note: Note) => {
    setSelectedNote(note)
    setEditTitle(note.title)
    setEditContent(note.content || '')
    setSaveStatus('saved')
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus catatan ini?")) return
    await supabase.from('notes').delete().eq('id', id)
    if (selectedNote?.id === id) createNewNote()
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] gap-6">
      
      {/* SIDEBAR */}
      <div className="w-full md:w-80 flex flex-col gap-4">
        <button 
          onClick={createNewNote}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition shadow-lg shadow-blue-900/20"
        >
          <Plus size={20}/> New Note
        </button>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {loading ? <Loader2 className="animate-spin mx-auto mt-10 opacity-20"/> : 
            notes.map(note => (
              <div 
                key={note.id}
                onClick={() => selectNote(note)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedNote?.id === note.id 
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                  : 'bg-slate-800/40 border-white/5 hover:bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <h3 className="font-bold truncate text-sm">{note.title || 'Untitled'}</h3>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-[10px] opacity-60">{new Date(note.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* EDITOR */}
      <div className="flex-1 bg-slate-900 border border-white/5 rounded-3xl flex flex-col overflow-hidden shadow-2xl relative">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div className="flex gap-2 items-center">
            {/* Indikator Save */}
            <div className="flex items-center gap-2 mr-4 px-3 py-1 rounded-full bg-black/20 border border-white/5">
              {saveStatus === 'saving' && <Loader2 size={14} className="animate-spin text-blue-400"/>}
              {saveStatus === 'saved' && <Cloud size={14} className="text-emerald-400"/>}
              {saveStatus === 'unsaved' && <div className="w-3 h-3 rounded-full bg-amber-500"/>}
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'unsaved' ? 'Unsaved' : 'Saved'}
              </span>
            </div>

            <label className="cursor-pointer p-2 hover:bg-white/10 rounded-lg text-slate-400 transition" title="Upload Image (Cloudinary)">
              {isUploading ? <Loader2 className="animate-spin" size={20}/> : <ImageIcon size={20}/>}
              <input type="file" hidden accept="image/*" onChange={handleManualUpload} disabled={isUploading}/>
            </label>
          </div>

          {selectedNote && (
            <button onClick={() => handleDelete(selectedNote.id)} className="p-2 hover:bg-red-500/10 text-slate-600 hover:text-red-500 rounded-lg transition">
              <Trash2 size={20}/>
            </button>
          )}
        </div>

        {/* Input Title */}
        <input 
          id="note-title"
          className="w-full bg-transparent px-8 pt-6 pb-2 text-3xl font-bold outline-none text-slate-100 placeholder:text-slate-600"
          placeholder="Judul Catatan..."
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
        />

        {/* Textarea dengan Drop & Paste */}
        <textarea 
          ref={textareaRef}
          className="w-full flex-1 bg-transparent px-8 py-4 outline-none resize-none font-mono text-sm leading-relaxed text-slate-300 placeholder:text-slate-700 custom-scrollbar"
          placeholder="Tulis sesuatu... (Paste gambar atau drag & drop file di sini)"
          value={editContent}
          onChange={e => setEditContent(e.target.value)}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
        />

        {/* Preview Kecil di Bawah */}
        {editContent.includes('<img') && (
          <div className="h-32 border-t border-white/5 p-4 bg-black/20 overflow-y-auto">
            <p className="text-[10px] uppercase font-bold text-slate-600 mb-2 flex items-center gap-2">
              <ImageIcon size={12}/> Attachments in this note
            </p>
            <div className="flex gap-2 flex-wrap">
               {editContent.match(/<img[^>]+src="([^">]+)"/g)?.map((img, i) => (
                 <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 relative group">
                    <div dangerouslySetInnerHTML={{__html: img.replace('style="', 'style="width:100%;height:100%;object-fit:cover;')}} />
                 </div>
               ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}