'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '../../utils/supabase/client'
import {
  Plus, Trash2, Image as ImageIcon, Loader2, Cloud,
  Search, FileText, MoreVertical, Layout, X
} from 'lucide-react'
import imageCompression from 'browser-image-compression'

// Import Global Modal
import { useModal } from '../../context/ModalContext'

// --- TIPTAP IMPORTS ---
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageExtension from '@tiptap/extension-image'

const supabase = createClient()

interface Note {
  id: string
  title: string
  content: string
  cover_url?: string // New: Cover image via URL
  created_at: string
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const { showModal } = useModal() // Panggil Modal Global

  const [loading, setLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')

  const [editTitle, setEditTitle] = useState('')
  const [searchTerm, setSearchTerm] = useState('') // New: Search
  const [coverUrlInput, setCoverUrlInput] = useState('')
  const [showCoverInput, setShowCoverInput] = useState(false)

  const [lastChange, setLastChange] = useState<number>(Date.now())
  const isDeletingRef = useRef(false) // Prevent auto-save resurrection

  // --- SETUP EDITOR TIPTAP ---
  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExtension.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-xl max-w-full my-6 border border-white/10 shadow-2xl transition-transform hover:scale-[1.01]',
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-lg max-w-none focus:outline-none min-h-[50vh] text-slate-300 leading-relaxed',
      },
    },
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

  // Sync Editor Content
  useEffect(() => {
    if (editor && selectedNote) {
      const currentHTML = editor.getHTML()
      // Hanya set content jika berbeda signifikan untuk mencegah cursor jump
      if (currentHTML !== selectedNote.content && !editor.isFocused) {
        editor.commands.setContent(selectedNote.content || '')
      }
    }
  }, [selectedNote, editor])

  // 2. FUNGSI UPLOAD (Cloudinary)
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
        method: 'POST', body: formData
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error?.message)
      return result.secure_url
    } catch (err) {
      console.error(err)
      // Gunakan Modal untuk error
      showModal({
        title: 'Upload Failed', message: 'Could not upload image.', type: 'danger',
        onConfirm: function (): Promise<void> | void {
          throw new Error('Function not implemented.')
        }
      })
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = await processAndUploadImage(e.target.files[0])
      if (url && editor) {
        editor.chain().focus().setImage({ src: url }).run()
      }
    }
  }

  // 3. FUNGSI HAPUS GAMBAR (Cloudinary Cleanup)
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

  // 4. CREATE NEW NOTE
  const createNewNote = () => {
    setSelectedNote(null) // This will trigger the "Select a note or create new one" empty state
    // But wait, the previous logic was:
    // setSelectedNote({ id: 'new', title: '', content: '', created_at: new Date().toISOString() }) 
    // OR immediately insert to DB (as requested previously to fix ID issues).
    // Let's implement the safe way: Just text editor reset, and saveToDb handles the insert.
    setEditTitle('')
    editor?.commands.clearContent()
    setCoverUrlInput('')
    setSaveStatus('unsaved') // This puts it in "ready to save" state? No, 'unsaved' implies changes made. 
    // Actually, simply setting selectedNote(null) clears the view?
    // Looking at the render:
    // {!selectedNote && !editTitle && editor?.isEmpty && ( Show Placeholder )}
    // So if we just clear everything, it shows placeholder.
    // If we want to *start* a new note, we can just focus the editor/title.
    // Let's just reset states.
    setEditTitle('')
    if (editor) editor.commands.setContent('')
    setCoverUrlInput('')
    setSelectedNote(null)
  }

  // 4. SAVE LOGIC
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saveToDb = useCallback(async () => {
    if (isDeletingRef.current) return // BLOCK SAVE IF DELETING
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setSaveStatus('saving')
    const contentHtml = editor?.getHTML() || ''

    // Payload sanitization
    const payload = {
      title: editTitle || 'Untitled Note',
      content: contentHtml,
      cover_url: coverUrlInput || null,
      updated_at: new Date().toISOString()
    }

    try {
      if (selectedNote) {
        // Update existing
        const { error } = await supabase.from('notes').update(payload).eq('id', selectedNote.id)
        if (error) throw error

        setNotes(prev => prev.map(n => n.id === selectedNote.id ? { ...n, ...payload, cover_url: payload.cover_url || undefined } : n))
      } else {
        // Create new
        const { data, error } = await supabase.from('notes').insert({
          ...payload,
          user_id: user.id
        }).select().single()

        if (error) throw error
        if (data) {
          setSelectedNote(data)
          setNotes(prev => [data, ...prev])
        }
      }
      setSaveStatus('saved')
    } catch (error: any) {
      console.error("Save Error:", error)
      setSaveStatus('unsaved')
    }
  }, [editTitle, editor, coverUrlInput, selectedNote])

  // --- AUTO SAVE EFFECT ---
  useEffect(() => {
    if (saveStatus === 'unsaved') {
      const timeoutId = setTimeout(() => {
        saveToDb()
      }, 2000) // Auto save after 2 seconds
      return () => clearTimeout(timeoutId)
    }
  }, [saveStatus, saveToDb])

  // ...

  // REQ #8: CUSTOM MODAL DELETE
  const handleDelete = (id: string) => {
    showModal({
      title: 'Delete Note?',
      message: 'This note and all images inside it will be permanently deleted.',
      type: 'danger',
      confirmText: 'Delete Forever',
      onConfirm: async () => {
        isDeletingRef.current = true // SET FLAG
        const noteToDelete = notes.find(n => n.id === id)
        if (noteToDelete?.content) {
          await deleteImagesFromCloudinary(noteToDelete.content)
        }
        await supabase.from('notes').delete().eq('id', id)

        if (selectedNote?.id === id) setSelectedNote(null)
        setNotes(prev => prev.filter(n => n.id !== id))

        // Reset flag after small delay to ensure any pending auto-saves behave
        setTimeout(() => { isDeletingRef.current = false }, 1000)
      }
    })
  }

  const selectNote = (note: Note) => {
    setSelectedNote(note)
    setEditTitle(note.title)
    setCoverUrlInput(note.cover_url || '')
    setSaveStatus('saved')
    setShowCoverInput(false)
  }

  const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] gap-6 animate-in fade-in duration-500">

      {/* --- SIDEBAR --- */}
      <div className="w-full md:w-80 flex flex-col gap-4 flex-shrink-0">

        {/* Header Sidebar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition"
            />
          </div>
          <button onClick={createNewNote} className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-xl transition shadow-lg hover:shadow-blue-500/20 active:scale-95">
            <Plus size={20} />
          </button>
        </div>

        {/* List Notes */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center pt-20 opacity-50 space-y-2">
              <Loader2 className="animate-spin" />
              <span className="text-xs">Loading notes...</span>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center text-slate-500 pt-10 text-sm">No notes found.</div>
          ) : (
            filteredNotes.map((note, idx) => (
              <div key={note.id} onClick={() => selectNote(note)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 animate-in slide-in-from-left-4
                    ${selectedNote?.id === note.id
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500 text-white shadow-xl translate-x-1'
                    : 'bg-slate-900/40 border-white/5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 hover:border-white/10'
                  }`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <h3 className={`font-bold truncate text-sm mb-1 ${!note.title && 'italic opacity-50'}`}>{note.title || 'Untitled'}</h3>
                <div className="flex justify-between items-center text-[10px] opacity-70">
                  <span className="flex items-center gap-1"><FileText size={10} /> {new Date(note.created_at).toLocaleDateString()}</span>
                  {note.cover_url && <ImageIcon size={10} />}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- MAIN EDITOR --- */}
      <div className="flex-1 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">

        {/* Cover Image Area */}
        {coverUrlInput && (
          <div className="relative h-48 w-full group overflow-hidden bg-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverUrlInput} alt="Cover" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
            <button onClick={() => setCoverUrlInput('')} className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition hover:bg-red-500">
              <Trash2 size={14} />
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div className="flex gap-3 items-center">

            {/* Status Indicator */}
            {/* Status Indicator */}
            <button
              onClick={() => saveStatus === 'unsaved' && saveToDb()}
              disabled={saveStatus !== 'unsaved'}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold tracking-wide transition-all
                ${saveStatus === 'saving' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 cursor-wait' :
                  saveStatus === 'unsaved' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20 cursor-pointer' :
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 cursor-default'}`}>
              {saveStatus === 'saving' ? <Loader2 size={12} className="animate-spin" /> : <Cloud size={12} />}
              {saveStatus === 'saving' ? 'SAVING...' : saveStatus === 'unsaved' ? 'UNSAVED (CLICK TO SAVE)' : 'SAVED'}
            </button>

            <div className="h-6 w-px bg-white/10 mx-1"></div>

            {/* Actions */}
            <button onClick={() => setShowCoverInput(!showCoverInput)}
              className={`p-2 rounded-lg transition ${showCoverInput ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/10 text-slate-400'}`} title="Add Cover URL">
              <Layout size={18} />
            </button>

            <label className="cursor-pointer p-2 hover:bg-white/10 rounded-lg text-slate-400 transition" title="Insert Image in Text">
              {isUploading ? <Loader2 className="animate-spin" size={18} /> : <ImageIcon size={18} />}
              <input type="file" hidden accept="image/*" onChange={handleManualUpload} disabled={isUploading} />
            </label>
          </div>

          {selectedNote && (
            <button onClick={() => handleDelete(selectedNote.id)} className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-lg transition" title="Delete Note">
              <Trash2 size={18} />
            </button>
          )}
        </div>

        {/* Input Cover URL (Collapsible) */}
        {showCoverInput && (
          <div className="px-6 py-3 bg-slate-900 border-b border-white/5 animate-in slide-in-from-top-2 flex gap-2">
            <input
              placeholder="Paste image URL for header cover (https://...)"
              className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none text-white focus:border-blue-500"
              value={coverUrlInput}
              onChange={(e) => {
                setCoverUrlInput(e.target.value)
                setSaveStatus('unsaved') // Trigger auto save
                setLastChange(Date.now())
              }}
            />
            <button onClick={() => setShowCoverInput(false)} className="p-1.5 hover:bg-white/10 rounded"><X size={16} /></button>
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar cursor-text bg-slate-900/30" onClick={() => editor?.chain().focus().run()}>
          <div className="max-w-3xl mx-auto px-8 py-10 min-h-full">
            <input
              id="note-title"
              className="w-full bg-transparent text-4xl font-bold outline-none text-slate-100 placeholder:text-slate-600 mb-6 border-none p-0 focus:ring-0"
              placeholder="Untitled Note"
              value={editTitle}
              onChange={e => {
                setEditTitle(e.target.value)
                setSaveStatus('unsaved')
                setLastChange(Date.now())
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <EditorContent editor={editor} className="min-h-[300px]" />
          </div>
        </div>

        {!selectedNote && !editTitle && editor?.isEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 pointer-events-none bg-slate-900/50 backdrop-blur-sm z-10">
            <div className="bg-slate-900 p-6 rounded-2xl border border-white/5 shadow-2xl flex flex-col items-center">
              <FileText size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium text-slate-400">Select a note or create a new one</p>
              <p className="text-sm opacity-50 mt-1">Your ideas are safe here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}