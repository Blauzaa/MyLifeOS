'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { collection, query, where, orderBy, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../../utils/firebase/client'
import { onAuthStateChanged, User } from 'firebase/auth'
import {
  Plus, Trash2, Loader2, Link as LinkIcon, ExternalLink,
  Globe, Code, Save, X, ImagePlus, Eye, EyeOff, Edit2, Github, CheckCircle2, Search
} from 'lucide-react'
import { useModal } from '../../context/ModalContext'
import { motion, AnimatePresence } from 'framer-motion'
import imageCompression from 'browser-image-compression'

// --- GLOBAL LOCK ---
let isGlobalSyncActive = false;

interface ProjectItem {
  id: string
  title: string
  description: string
  tech_stack: string[]
  github_url?: string
  demo_url?: string
  cover_url?: string
  is_published: boolean
  created_at: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [isGithubUser, setIsGithubUser] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle')
  const [newImportedCount, setNewImportedCount] = useState(0)
  
  const [searchQuery, setSearchQuery] = useState('')

  const { showModal } = useModal()
  
  const projectsRef = useRef<ProjectItem[]>([])
  const hasAttemptedSync = useRef(false)

  useEffect(() => {
    projectsRef.current = projects
  }, [projects])

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tech_stack_input: '',
    github_url: '',
    demo_url: '',
    cover_url: '',
    is_published: false
  })

  // 1. Ambil Project yang Sudah Tersimpan di Firestore
  const fetchProjects = useCallback(async (userArg?: User) => {
    try {
      const user = userArg || auth.currentUser
      if (!user) {
        setLoading(false)
        return
      }

      const q = query(
        collection(db, 'projects'),
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc')
      )

      const querySnapshot = await getDocs(q)
      const data = querySnapshot.docs.map(doc => {
        const item = doc.data()
        return {
          id: doc.id,
          title: item.title || '',
          description: item.description || '',
          tech_stack: item.tech_stack || [],
          github_url: item.github_url || '',
          demo_url: item.demo_url || '',
          cover_url: item.cover_url || '',
          is_published: item.is_published ?? false,
          created_at: item.created_at?.toDate ? item.created_at.toDate().toISOString() : new Date().toISOString()
        } as ProjectItem
      })

      setProjects(data)
    } catch (error) {
      console.error("Error fetching projects:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 2. SINKRONISASI OTOMATIS GITHUB (Public & Private via Server API)
  const silentSyncGitHub = useCallback(async (user: User) => {
    if (isGlobalSyncActive) return
    isGlobalSyncActive = true
    setSyncStatus('checking')

    try {
      const reposRes = await fetch('/api/github/repos')
      if (!reposRes.ok) throw new Error("Gagal mengambil repositori dari API Server")
      const repos = await reposRes.json()

      const existingUrls = new Set(projectsRef.current.map(p => p.github_url?.toLowerCase()))
      let importedCount = 0

      for (const repo of repos) {
        if (!existingUrls.has(repo.html_url.toLowerCase())) {
          await addDoc(collection(db, 'projects'), {
            title: repo.name,
            description: repo.description || 'Imported draft from GitHub.',
            tech_stack: repo.private ? ['Private', repo.language].filter(Boolean) : [repo.language].filter(Boolean),
            github_url: repo.html_url,
            demo_url: repo.homepage || '',
            cover_url: '',
            is_published: false,
            user_id: user.uid,
            created_at: serverTimestamp()
          })
          importedCount++
        }
      }

      setNewImportedCount(importedCount)
      setSyncStatus('success')
      
      if (importedCount > 0) {
        await fetchProjects(user)
      }

      setTimeout(() => setSyncStatus('idle'), 4000)
    } catch (error) {
      console.error("Auto Sync Error:", error)
      setSyncStatus('error')
    } finally {
      isGlobalSyncActive = false
    }
  }, [fetchProjects])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchProjects(user)
        const githubProvider = user.providerData.find(p => p.providerId === 'github.com')
        setIsGithubUser(!!githubProvider)
      } else {
        setProjects([])
        setLoading(false)
        setIsGithubUser(false)
      }
    })
    return () => unsubscribe()
  }, [fetchProjects])

  useEffect(() => {
    const user = auth.currentUser
    if (!loading && isGithubUser && user && !hasAttemptedSync.current) {
      hasAttemptedSync.current = true
      silentSyncGitHub(user)
    }
  }, [loading, isGithubUser, silentSyncGitHub])

  // 3. PROSES UPLOAD IMAGE (Cloudinary)
  const processAndUploadImage = async (file: File) => {
    try {
      setIsUploading(true)
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1000, useWebWorker: true }
      const compressedFile = await imageCompression(file, options)

      const formDataUpload = new FormData()
      formDataUpload.append('file', compressedFile)
      formDataUpload.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '')

      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formDataUpload
      })
      const data = await res.json()
      setFormData(prev => ({ ...prev, cover_url: data.secure_url }))
    } catch (error) {
      console.error("Upload failed", error)
      alert("Gagal mengunggah gambar.")
    } finally {
      setIsUploading(false)
    }
  }

  // 4. PASANG LISTEN CLIPBOARD PASTE (Ctrl+V)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!isModalOpen) return // Hanya aktif ketika modal sedang terbuka

      const clipItems = e.clipboardData?.items
      if (!clipItems) return

      for (let i = 0; i < clipItems.length; i++) {
        // Deteksi jika item di clipboard bertipe gambar
        if (clipItems[i].type.indexOf('image') !== -1) {
          e.preventDefault()
          const file = clipItems[i].getAsFile()
          if (file) {
            await processAndUploadImage(file)
          }
          break // Ambil satu gambar utama saja
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen])

  // 5. Simpan / Update Detail Proyek
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault()
    const user = auth.currentUser
    if (!user) return

    const techArray = formData.tech_stack_input
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    const payload = {
      title: formData.title,
      description: formData.description,
      tech_stack: techArray,
      github_url: formData.github_url,
      demo_url: formData.demo_url,
      cover_url: formData.cover_url,
      is_published: formData.is_published,
      updated_at: new Date().toISOString()
    }

    try {
      if (editingId) {
        const docRef = doc(db, 'projects', editingId)
        await updateDoc(docRef, payload)
      } else {
        await addDoc(collection(db, 'projects'), {
          ...payload,
          user_id: user.uid,
          created_at: serverTimestamp()
        })
      }

      setIsModalOpen(false)
      resetForm()
      fetchProjects(user)
    } catch (error) {
      console.error("Error saving project:", error)
    }
  }

  const startEdit = (item: ProjectItem) => {
    setEditingId(item.id)
    setFormData({
      title: item.title,
      description: item.description,
      tech_stack_input: item.tech_stack.join(', '),
      github_url: item.github_url || '',
      demo_url: item.demo_url || '',
      cover_url: item.cover_url || '',
      is_published: item.is_published
    })
    setIsModalOpen(true)
  }

  const handleDeleteProject = (id: string) => {
    showModal({
      title: 'Delete Project?',
      message: 'This will remove this project from your list and portfolio website. This action is irreversible.',
      type: 'danger',
      confirmText: 'Yes, Delete',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'projects', id))
          setProjects(prev => prev.filter(p => p.id !== id))
        } catch (error) {
          console.error("Error deleting project:", error)
        }
      }
    })
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      title: '',
      description: '',
      tech_stack_input: '',
      github_url: '',
      demo_url: '',
      cover_url: '',
      is_published: false
    })
  }

  // LOGIC PENCARIAN
  const filteredProjects = projects.filter(project => {
    const query = searchQuery.toLowerCase()
    return (
      project.title.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query) ||
      project.tech_stack.some(tech => tech.toLowerCase().includes(query))
    )
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-200 pb-40 animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* HEADER & CONTROLS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Project Portfolio</h1>
              <p className="text-slate-500 mt-2">Manage projects and sync them to your live portfolio.</p>
            </div>

            {/* STATUS NOTIFIKASI */}
            <AnimatePresence>
              {syncStatus !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold tracking-wide backdrop-blur-md
                    ${syncStatus === 'checking' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      syncStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'}`}
                >
                  {syncStatus === 'checking' && <Loader2 className="animate-spin" size={14} />}
                  {syncStatus === 'success' && <CheckCircle2 size={14} />}
                  {syncStatus === 'checking' && "Checking GitHub for public/private..."}
                  {syncStatus === 'success' && (newImportedCount > 0 ? `Synced! Added ${newImportedCount} new drafts.` : "All projects up to date!")}
                  {syncStatus === 'error' && "Sync failed. Check GITHUB_PAT."}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex w-full md:w-auto gap-4">
            {/* SEARCH BAR INPUT */}
            <div className="relative group flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search projects..."
                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-blue-500/50 focus:bg-slate-900 transition-all text-slate-200 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-2xl flex items-center gap-2 font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all justify-center shrink-0"
            >
              <Plus size={20} /> Add Manual Project
            </button>
          </div>
        </div>

        {/* LIST PROJECTS CARD */}
        {loading ? (
          <div className="flex justify-center pt-32">
            <Loader2 className="animate-spin text-blue-500" size={48} />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="h-64 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-slate-600 gap-2 bg-slate-900/20">
            <Globe size={40} className="opacity-20" />
            <span className="text-sm font-bold uppercase tracking-widest opacity-40">
              {searchQuery ? 'No matching projects found.' : 'No projects yet. Checking GitHub...'}
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div key={project.id} className="bg-slate-900/80 backdrop-blur-sm border border-white/5 rounded-3xl overflow-hidden flex flex-col group relative hover:border-blue-500/30 transition-all duration-300">
                
                {/* Image Header */}
                <div className="h-44 bg-slate-950 relative overflow-hidden">
                  {project.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={project.cover_url} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
                      <Code size={36} />
                      <span className="text-[10px] mt-2 uppercase tracking-wider">No Cover Image</span>
                      <span className="text-[9px] text-slate-600 mt-1">Edit to add screenshot</span>
                    </div>
                  )}

                  {/* Badge Publish Status */}
                  <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 backdrop-blur-md border ${
                    project.is_published 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                      : 'bg-slate-800/80 text-slate-400 border-white/5'
                  }`}>
                    {project.is_published ? <Eye size={12} /> : <EyeOff size={12} />}
                    {project.is_published ? 'Published to MyPorto' : 'Draft (Hidden)'}
                  </div>
                </div>

                {/* Info & Metadata */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-slate-100 truncate mb-2">{project.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">{project.description}</p>
                    
                    {/* Tech Stack Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {project.tech_stack.map((tech, i) => (
                        <span key={i} className="text-[10px] font-mono bg-white/5 border border-white/5 text-slate-400 px-2 py-0.5 rounded-md">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer Action Card */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="flex gap-2">
                      {project.github_url && (
                        <a href={project.github_url} target="_blank" rel="noreferrer" className="p-1.5 text-slate-500 hover:text-white transition" title="GitHub Repo">
                          <LinkIcon size={16} />
                        </a>
                      )}
                      {project.demo_url && (
                        <a href={project.demo_url} target="_blank" rel="noreferrer" className="p-1.5 text-slate-500 hover:text-white transition" title="Live Demo">
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(project)} className="p-2 text-slate-500 hover:text-blue-400 transition rounded-lg hover:bg-white/5" title="Edit Detail">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDeleteProject(project.id)} className="p-2 text-slate-500 hover:text-red-400 transition rounded-lg hover:bg-white/5" title="Remove">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- EDIT / ADD PROJECT MODAL --- */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Globe size={20} className="text-blue-500" /> 
                    {editingId ? 'Edit Project Detail' : 'Add Manual Project'}
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition"><X size={20} /></button>
                </div>

                <form onSubmit={handleSaveProject} className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    
                    {/* Cover Upload Area */}
                    <div className="w-full md:w-1/3 space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Screenshot / Cover</label>
                      <div className="relative group w-full aspect-[4/3] bg-slate-800 rounded-xl border-2 border-dashed border-white/10 hover:border-blue-500/50 transition-colors overflow-hidden flex flex-col items-center justify-center text-center cursor-pointer">
                        {formData.cover_url ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={formData.cover_url} className="w-full h-full object-cover" alt="Preview" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="text-xs font-bold text-white">Change Image</span>
                            </div>
                          </>
                        ) : (
                          <div className="p-4 space-y-2">
                            {isUploading ? <Loader2 className="animate-spin mx-auto text-blue-500" /> : <ImagePlus className="mx-auto text-slate-600 group-hover:text-blue-500 transition" />}
                            <p className="text-[10px] text-slate-500">Upload or Paste (Ctrl+V)</p>
                          </div>
                        )}
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => { if (e.target.files?.[0]) await processAndUploadImage(e.target.files[0]) }} />
                      </div>
                    </div>

                    {/* Inputs Area */}
                    <div className="flex-1 space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Project Title</label>
                        <input required placeholder="Project Name..." className="w-full bg-slate-800 border border-white/5 p-3 rounded-xl outline-none focus:border-blue-500/50 text-white font-bold text-sm" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Tech Stack (Separate by commas)</label>
                        <input placeholder="React, Nextjs, Tailwind, Firebase..." className="w-full bg-slate-800 border border-white/5 p-3 rounded-xl outline-none focus:border-blue-500/50 text-slate-200 text-sm" value={formData.tech_stack_input} onChange={e => setFormData({ ...formData, tech_stack_input: e.target.value })} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">GitHub Repo Link</label>
                          <input placeholder="https://github.com/..." className="w-full bg-slate-800 border border-white/5 p-3 rounded-xl outline-none focus:border-blue-500/50 text-slate-300 text-sm" value={formData.github_url} onChange={e => setFormData({ ...formData, github_url: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">Live Demo Link</label>
                          <input placeholder="https://..." className="w-full bg-slate-800 border border-white/5 p-3 rounded-xl outline-none focus:border-blue-500/50 text-slate-300 text-sm" value={formData.demo_url} onChange={e => setFormData({ ...formData, demo_url: e.target.value })} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Professional Description</label>
                        <textarea rows={4} placeholder="Write a professional summary. What problem does this solve? What was your role?" className="w-full bg-slate-800 border border-white/5 p-3 rounded-xl outline-none focus:border-blue-500/50 text-sm text-slate-300 resize-none custom-scrollbar" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                      </div>

                      {/* Publish Switch Toggle */}
                      <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-white/5 cursor-pointer" onClick={() => setFormData({ ...formData, is_published: !formData.is_published })}>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-300">Publish to MyPorto</span>
                          <span className="text-[10px] text-slate-500">Turn on to automatically sync this to your external portfolio website</span>
                        </div>
                        <div className={`w-11 h-6 rounded-full transition-colors relative ${formData.is_published ? 'bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-slate-700'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${formData.is_published ? 'left-6' : 'left-1'}`}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-bold transition text-sm">Cancel</button>
                    <button type="submit" disabled={isUploading} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition flex items-center gap-2 disabled:opacity-50 text-sm">
                      {isUploading ? <Loader2 className="animate-spin" /> : <Save size={18} />} Save Project
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}