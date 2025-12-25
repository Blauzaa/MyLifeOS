'use client'
// Update tampilan v1
import { useEffect, useState } from 'react'
import { createClient } from '../utils/supabase/supabaseClient'
import { Plus } from 'lucide-react'

// 1. Kita definisikan bentuk datanya supaya TypeScript tidak marah
interface Item {
  id: string
  title: string
  url: string
  type: string
  user_id?: string
}

export default function Home() {
  const supabase = createClient()
  
  // State untuk menampung data
  const [items, setItems] = useState<Item[]>([])
  const [newItem, setNewItem] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [loading, setLoading] = useState(true)

  // 2. Ambil data saat web dibuka
  useEffect(() => {
    const getData = async () => {
      // Cek apakah user sudah login
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.log("Belum login, silakan login dulu.")
      } else {
        // Ambil data dari tabel dynamic_items
        const { data, error } = await supabase
          .from('dynamic_items')
          .select('*')
          .eq('type', 'work') // Filter: ambil yang tipe 'work' saja
        
        if (data) {
          setItems(data as Item[])
        }
        if (error) {
          console.error("Error ambil data:", error)
        }
      }
      setLoading(false)
    }

    getData()
  }, [supabase]) // <-- FIX: Supabase dimasukkan ke sini biar gak warning kuning

  // 3. Fungsi Tambah Data (Dynamic Feature)
  const addItem = async () => {
    // Validasi input
    if (!newItem || !newUrl) return alert('Isi judul dan URL dulu!')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert('Login dulu bos!')

    // Kirim ke Database Supabase
    const { error } = await supabase.from('dynamic_items').insert({
      title: newItem,
      url: newUrl,
      type: 'work',
      user_id: user.id
    })

    if (!error) {
      // FIX ERROR TYPESCRIPT DI SINI:
      // Kita buat object sementara yang punya 'id' dan 'type'
      // agar sesuai dengan Interface Item di atas.
      const tempItem: Item = {
        id: Date.now().toString(), // Pakai ID sementara (timestamp) biar unik
        title: newItem,
        url: newUrl,
        type: 'work',
        user_id: user.id
      }

      // Update UI langsung
      setItems([...items, tempItem])
      
      // Reset form
      setNewItem('')
      setNewUrl('')
    } else {
      console.error(error)
      alert('Gagal simpan ke database!')
    }
  }

  // 4. Fungsi Login GitHub
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${location.origin}/auth/callback`, // Opsional, agar balik ke halaman ini
      },
    })
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            My LifeOS 🚀
          </h1>
          <button 
            onClick={handleLogin}
            className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded border border-gray-700 transition"
          >
            Login / Sync
          </button>
        </div>
        
        {/* Widget: Work Links */}
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-blue-400">
            🏢 Work Mode
          </h2>
          
          {/* Loading State */}
          {loading && <p className="text-gray-500 text-sm">Sedang memuat data...</p>}

          {/* List Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {items.map((item) => (
              <a 
                key={item.id} 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center gap-3 bg-gray-800/50 hover:bg-gray-800 p-4 rounded-xl border border-gray-700/50 hover:border-blue-500/50 transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition">
                  {/* Ikon Link Sederhana */}
                  🔗
                </div>
                <span className="font-medium truncate text-gray-300 group-hover:text-white">
                  {item.title}
                </span>
              </a>
            ))}
          </div>

          {/* Input Form (Add New) */}
          <div className="flex flex-col sm:flex-row gap-2 bg-gray-950/50 p-2 rounded-xl border border-dashed border-gray-700">
            <input 
              className="bg-transparent px-4 py-2 rounded-lg w-full focus:outline-none focus:bg-gray-800 text-sm"
              placeholder="Nama Link (misal: GitHub Kantor)"
              value={newItem} 
              onChange={e => setNewItem(e.target.value)}
            />
            <div className="w-[1px] bg-gray-700 hidden sm:block"></div>
            <input 
              className="bg-transparent px-4 py-2 rounded-lg w-full focus:outline-none focus:bg-gray-800 text-sm"
              placeholder="URL (https://...)"
              value={newUrl} 
              onChange={e => setNewUrl(e.target.value)}
            />
            <button 
              onClick={addItem} 
              className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg flex items-center justify-center min-w-[40px] transition"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}