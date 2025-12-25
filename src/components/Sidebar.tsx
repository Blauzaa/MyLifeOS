'use client'

import React, { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  CheckSquare, 
  Wallet, 
  Layers, 
  LogOut,
  Menu,
  X,
  Zap,
  Tv
} from 'lucide-react'

/**
 * Penyesuaian untuk Lingkungan Preview:
 * Karena 'next/navigation' dan 'next/link' tidak tersedia dalam lingkungan simulasi ini,
 * kita menggunakan pendekatan state-based navigation sederhana agar Sidebar tetap bisa dirender.
 * Untuk proyek lokal Anda, Anda bisa tetap menggunakan 'Link' dan 'usePathname'.
 */

const menus = [
  { name: 'Overview', id: 'overview', icon: LayoutDashboard },
  { name: 'Tasks', id: 'tasks', icon: CheckSquare },
  { name: 'Finance', id: 'finance', icon: Wallet },
  { name: 'Focus Mode', id: 'focus', icon: Zap },
  { name: 'Watch List', id: 'watchlist', icon: Tv },
  { name: 'Resources', id: 'resources', icon: Layers },
]

export default function Sidebar() {
  // Menggunakan state lokal untuk simulasi path aktif di lingkungan preview
  const [activeTab, setActiveTab] = useState('overview');
  
  // Mock function untuk logout
  const handleLogout = () => {
    console.log("Logging out...");
    // window.location.reload(); // Dinonaktifkan di preview agar tidak loop
  }

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-950 border-r border-white/10 h-screen fixed left-0 top-0 z-50">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            LifeOS v4
          </h1>
          <p className="text-[10px] text-slate-500 font-mono mt-1 tracking-tighter uppercase">Personal Dashboard</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
          {menus.map((menu) => (
            <button 
              key={menu.id} 
              onClick={() => setActiveTab(menu.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                activeTab === menu.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <menu.icon size={20} className={activeTab === menu.id ? 'text-white' : 'group-hover:text-blue-400 transition-colors'} />
              <span className="font-medium text-sm">{menu.name}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/10 rounded-xl w-full transition group"
          >
            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* --- MOBILE BOTTOM NAV --- */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-950/80 backdrop-blur-lg border-t border-white/10 z-50 px-2 py-3 flex justify-around items-center">
        {menus.map((menu) => (
          <button 
            key={menu.id} 
            onClick={() => setActiveTab(menu.id)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === menu.id ? 'text-blue-400' : 'text-slate-500'
            }`}
          >
            <menu.icon size={20} />
            <span className="text-[9px] font-semibold tracking-tight">{menu.name.split(' ')[0]}</span>
          </button>
        ))}
        <button 
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 text-slate-500 active:text-red-400"
        >
          <LogOut size={20} />
          <span className="text-[9px] font-semibold tracking-tight">Exit</span>
        </button>
      </nav>

      {/* Main Content Area Placeholder (Hanya untuk keperluan Preview) */}
      <main className="md:ml-64 p-8 text-slate-400 pb-24 md:pb-8">
        <div className="border-2 border-dashed border-white/5 rounded-3xl h-[80vh] flex items-center justify-center">
          <div className="text-center px-6">
            <h2 className="text-xl font-semibold text-slate-200">Halaman {menus.find(m => m.id === activeTab)?.name}</h2>
            <p className="text-sm mt-2 opacity-60">Sidebar telah diperbarui dengan menu baru. Navigasi aktif: <code className="bg-white/10 px-2 py-1 rounded text-blue-400">{activeTab}</code></p>
          </div>
        </div>
      </main>
    </>
  )
}