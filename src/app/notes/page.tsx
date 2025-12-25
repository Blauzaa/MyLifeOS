'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '../../utils/supabase/client'
import { Plus, Trash2, Save, Image as ImageIcon, Loader2, FileText, Search, X } from 'lucide-react'
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
  
  // State untuk form edit
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')

  const fetchNotes = useCallback(async () => {
    const { data } = await supabase.from('notes').select('*').order('created_at', { ascending: false })
    if (data) setNotes(data as Note[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  // Simpan atau Update Catatan
  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert("Login dulu!")

    if (selectedNote) {
      // Update
      await supabase.from('notes').update({ 
        title: editTitle, 
        content: editContent,
        updated_at: new Date() 
      }).eq('id', selectedNote.id)
    } else {
      // Create New
      const { data } = await supabase.from('notes').insert({
        title: editTitle || 'Untitled Note',
        content: editContent,
        user_id: user.id
      }).select().single()
      if (data) setSelectedNote(data)
    }
    fetchNotes()
  }

  const deleteNote = async (id: string) => {
    if (!confirm("Hapus catatan ini?")) return
    await supabase.from('notes').delete().eq('id', id)
    if (selectedNote?.id === id) {
      setSelectedNote(null)
      setEditTitle(''); setEditContent('')
    }
    fetchNotes()
  }

  // LOGIK KOMPRESI GAMBAR & UPLOAD
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)

      // 1. Opsi Kompresi
      const options = {
        maxSizeMB: 0.2, // Maksimal 200KB (Sangat hemat!)
        maxWidthOrHeight: 800, // Maksimal lebar/tinggi 800px
        useWebWorker: true
      }

      // 2. Proses Kompresi
      const compressedFile = await imageCompression(file, options)
      
      // 3. Upload ke Supabase Storage
      const fileName = `${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage
        .from('note-attachments')
        .upload(fileName, compressedFile)

      if (error) throw error

      // 4. Ambil URL Publik
      const { data: { publicUrl } } = supabase.storage
        .from('note-attachments')
        .getPublicUrl(data.path)

      // 5. Masukkan ke dalam konten catatan (sebagai tag gambar HTML atau Markdown)
      const imgTag = `\n<img src="${publicUrl}" alt="image" style="max-width:100%; border-radius:12px;" />\n`
      setEditContent(prev => prev + imgTag)

    } catch (err) {
      console.error(err)
      alert("Gagal upload gambar")
    } finally {
      setIsUploading(false)
    }
  }

  const selectNote = (note: Note) => {
    setSelectedNote(note)
    setEditTitle(note.title)
    setEditContent(note.content)
  }

  const createNewNote = () => {
    setSelectedNote(null)
    setEditTitle('')
    setEditContent('')
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] gap-6">
      
      {/* --- SIDEBAR: DAFTAR CATATAN --- */}
      <div className="w-full md:w-80 flex flex-col gap-4">
        <button 
          onClick={createNewNote}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition"
        >
          <Plus size={20}/> New Note
        </button>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {loading ? <Loader2 className="animate-spin mx-auto mt-10 opacity-20"/> : 
            notes.map(note => (
              <div 
                key={note.id}
                onClick={() => selectNote(note)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedNote?.id === note.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800/40 border-white/5 hover:bg-white/5'}`}
              >
                <h3 className="font-bold truncate text-sm">{note.title || 'Untitled'}</h3>
                <p className="text-[10px] opacity-50 mt-1">{new Date(note.created_at).toLocaleDateString()}</p>
              </div>
            ))
          }
        </div>
      </div>

      {/* --- EDITOR: TEMPAT MENULIS --- */}
      <div className="flex-1 bg-slate-900 border border-white/5 rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        {/* Editor Toolbar */}
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex gap-2">
            <label className="cursor-pointer p-2 hover:bg-white/10 rounded-lg text-slate-400 transition" title="Tambah Gambar">
              {isUploading ? <Loader2 className="animate-spin" size={20}/> : <ImageIcon size={20}/>}
              <input type="file" hidden accept="image/*" onChange={handleImageUpload} disabled={isUploading}/>
            </label>
            <button onClick={handleSave} className="p-2 hover:bg-white/10 rounded-lg text-emerald-400 transition" title="Simpan Catatan">
              <Save size={20}/>
            </button>
          </div>
          {selectedNote && (
            <button onClick={() => deleteNote(selectedNote.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-500 transition">
              <Trash2 size={20}/>
            </button>
          )}
        </div>

        {/* Input Title */}
        <input 
          className="w-full bg-transparent px-8 py-6 text-2xl font-bold outline-none border-b border-white/5"
          placeholder="Judul Catatan..."
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
        />

        {/* Textarea Area */}
        <textarea 
          className="w-full flex-1 bg-transparent px-8 py-6 outline-none resize-none font-mono text-sm leading-relaxed"
          placeholder="Mulai menulis sesuatu atau tempel link di sini..."
          value={editContent}
          onChange={e => setEditContent(e.target.value)}
        />

        {/* Preview Area Sederhana (Jika isinya ada HTML gambar) */}
        {editContent.includes('<img') && (
          <div className="h-40 border-t border-white/5 p-4 bg-black/20 overflow-y-auto">
            <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">Image Preview</p>
            <div dangerouslySetInnerHTML={{ __html: editContent.match(/<img[^>]*>/g)?.join('') || '' }} className="flex gap-2 flex-wrap" />
          </div>
        )}
      </div>

    </div>
  )
}