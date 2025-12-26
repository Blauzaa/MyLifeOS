'use client'
import { useEffect, useState, useCallback, useRef } from 'react' // Tambah useRef
import { createClient } from '../../utils/supabase/client'
import { Plus, Trash2, Save, Image as ImageIcon, Loader2, Cloud } from 'lucide-react'
import imageCompression from 'browser-image-compression'

// --- TIPTAP IMPORTS ---
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageExtension from '@tiptap/extension-image'

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
  
  // STATE BARU: Untuk memancing auto-save setiap ada perubahan sekecil apapun
  const [lastChange, setLastChange] = useState<number>(Date.now())

  // --- SETUP EDITOR TIPTAP ---
  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExtension.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-xl max-w-full my-4 border border-white/10 shadow-lg',
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px]',
      },
    },
    // INI KUNCINYA: Setiap ada update (ketik/hapus gambar), kita update timestamp
    onUpdate: () => {
      setSaveStatus('unsaved') 
      setLastChange(Date.now()) 
    },
  })

  // 1. FETCH DATA
  const fetchNotes = useCallback(async () => {
    const { data } = await supabase.from('notes').select('*').order('created_at', { ascending: false })
    if (data) setNotes(data as Note[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  // Sync Editor Content saat Note dipilih
  useEffect(() => {
    if (editor && selectedNote) {
      // Cek agar tidak reset kursor saat auto-save (hanya set content jika beda jauh/awal load)
      const currentHTML = editor.getHTML()
      if (currentHTML !== selectedNote.content) {
        editor.commands.setContent(selectedNote.content || '')
      }
    }
  }, [selectedNote, editor]) // Hapus dependency lain agar tidak loop

  // 2. FUNGSI UPLOAD (Sama seperti sebelumnya)
  const processAndUploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) return null
    try {
      setIsUploading(true)
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true }
      const compressedFile = await imageCompression(file, options)
      
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      
      if (!cloudName || !uploadPreset) throw new Error("Config Cloudinary missing")

      const formData = new FormData()
      formData.append('file', compressedFile)
      formData.append('upload_preset', uploadPreset) 
      
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error?.message)
      return result.secure_url 
    } catch (err) {
      console.error(err)
      alert("Gagal upload gambar")
      return null
    } finally {
      setIsUploading(false)
    }
  }

  // 3. FUNGSI HAPUS GAMBAR (Sama seperti sebelumnya)
  const deleteImagesFromCloudinary = async (htmlContent: string) => {
    const regex = /res\.cloudinary\.com\/[^/]+\/image\/upload\/v\d+\/([^/.]+)/g;
    let match;
    const publicIds = [];
    while ((match = regex.exec(htmlContent)) !== null) {
      publicIds.push(match[1]);
    }
    if (publicIds.length === 0) return;

    await Promise.all(publicIds.map(async (id) => {
      await fetch('/api/cloudinary/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_id: id })
      });
    }));
  }

  // 4. SAVE LOGIC
  const saveToDb = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !editor) return

    setSaveStatus('saving')
    const contentHtml = editor.getHTML()

    try {
      if (selectedNote) {
        await supabase.from('notes').update({ 
          title: editTitle, 
          content: contentHtml, 
          updated_at: new Date() 
        }).eq('id', selectedNote.id)

        // Update list lokal tanpa fetch ulang
        setNotes(prev => prev.map(n => n.id === selectedNote.id ? { ...n, title: editTitle, content: contentHtml } : n))
      } else {
        const { data } = await supabase.from('notes').insert({
          title: editTitle || 'Untitled Note',
          content: contentHtml,
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

  // 5. AUTO SAVE (DIPERBAIKI)
  useEffect(() => {
    // Jangan save jika tidak ada note aktif atau editor kosong saat awal
    if (!selectedNote && !editTitle && editor?.isEmpty) return 

    // Debounce timer
    const timer = setTimeout(() => {
      saveToDb()
    }, 1500) 

    return () => clearTimeout(timer)
    
  // PERUBAHAN PENTING:
  // Kita memantau 'lastChange' (angka waktu) dan 'editTitle'.
  // 'lastChange' akan berubah SETIAP KALI ada update di editor (termasuk hapus gambar).
  }, [lastChange, editTitle]) 


  // 6. EVENT HANDLERS
  const handlePaste = async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault()
        const file = items[i].getAsFile()
        if (file) {
          const url = await processAndUploadImage(file)
          if (url && editor) {
            editor.chain().focus().setImage({ src: url }).run()
          }
        }
      }
    }
  }

  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom
    dom.addEventListener('paste', handlePaste as any)
    return () => dom.removeEventListener('paste', handlePaste as any)
  }, [editor])

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && editor) {
      const url = await processAndUploadImage(file)
      if (url) {
        editor.chain().focus().setImage({ src: url }).run()
      }
    }
  }

  const createNewNote = () => {
    setSelectedNote(null)
    setEditTitle('')
    editor?.commands.clearContent()
    setSaveStatus('saved')
    setTimeout(() => document.getElementById('note-title')?.focus(), 100)
  }

  const selectNote = (note: Note) => {
    setSelectedNote(note)
    setEditTitle(note.title)
    setSaveStatus('saved')
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus catatan ini?")) return
    const noteToDelete = notes.find(n => n.id === id)
    if (noteToDelete?.content) {
      await deleteImagesFromCloudinary(noteToDelete.content)
    }
    await supabase.from('notes').delete().eq('id', id)
    if (selectedNote?.id === id) createNewNote()
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] gap-6">
      
      {/* SIDEBAR */}
      <div className="w-full md:w-80 flex flex-col gap-4">
        <button onClick={createNewNote} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition shadow-lg shadow-blue-900/20">
          <Plus size={20}/> New Note
        </button>
        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {loading ? <Loader2 className="animate-spin mx-auto mt-10 opacity-20"/> : 
            notes.map(note => (
              <div key={note.id} onClick={() => selectNote(note)} className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedNote?.id === note.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-800/40 border-white/5 hover:bg-white/5 text-slate-400 hover:text-slate-200'}`}>
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
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2 mr-4 px-3 py-1 rounded-full bg-black/20 border border-white/5">
              {saveStatus === 'saving' && <Loader2 size={14} className="animate-spin text-blue-400"/>}
              {saveStatus === 'saved' && <Cloud size={14} className="text-emerald-400"/>}
              {saveStatus === 'unsaved' && <div className="w-3 h-3 rounded-full bg-amber-500"/>}
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'unsaved' ? 'Unsaved' : 'Saved'}
              </span>
            </div>
            <label className="cursor-pointer p-2 hover:bg-white/10 rounded-lg text-slate-400 transition" title="Upload Image">
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

        <input 
          id="note-title"
          className="w-full bg-transparent px-8 pt-6 pb-2 text-3xl font-bold outline-none text-slate-100 placeholder:text-slate-600"
          placeholder="Judul Catatan..."
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
        />
        <div className="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar cursor-text" onClick={() => editor?.chain().focus().run()}>
           <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}