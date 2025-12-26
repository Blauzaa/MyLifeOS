'use client'
import { useEffect } from 'react'
import { Trash2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type ModalType = 'danger' | 'warning' | 'info'

interface ModalProps {
  isOpen: boolean
  title: string
  message: string
  type: ModalType
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
}

export default function ConfirmationModal({ 
  isOpen, title, message, type = 'danger', onConfirm, onCancel, confirmText 
}: ModalProps) {
  
  // --- UX: Handle ESC Key ---
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onCancel])

  // --- Theme Configuration ---
  const theme = {
    danger: {
      bgIcon: 'bg-red-500/10',
      textIcon: 'text-red-500',
      border: 'border-red-500/20',
      button: 'bg-red-600 hover:bg-red-500 shadow-red-900/20',
      glow: 'shadow-[0_0_40px_-10px_rgba(220,38,38,0.3)]', // Efek cahaya merah
      icon: <Trash2 size={24} strokeWidth={2.5}/>
    },
    warning: {
      bgIcon: 'bg-orange-500/10',
      textIcon: 'text-orange-500',
      border: 'border-orange-500/20',
      button: 'bg-orange-600 hover:bg-orange-500 shadow-orange-900/20',
      glow: 'shadow-[0_0_40px_-10px_rgba(234,88,12,0.3)]', // Efek cahaya oranye
      icon: <AlertTriangle size={24} strokeWidth={2.5}/>
    },
    info: {
      bgIcon: 'bg-blue-500/10',
      textIcon: 'text-blue-500',
      border: 'border-blue-500/20',
      button: 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20',
      glow: 'shadow-[0_0_40px_-10px_rgba(37,99,235,0.3)]', // Efek cahaya biru
      icon: <Info size={24} strokeWidth={2.5}/>
    }
  }

  const currentTheme = theme[type]

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          
          {/* 1. Backdrop (Fade In/Out) */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onCancel} // Klik luar untuk close
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* 2. Modal Content (Scale & Fade) */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.3 }}
            className={`relative w-full max-w-sm bg-slate-900 rounded-2xl p-6 border ${currentTheme.border} shadow-2xl ${currentTheme.glow}`}
            onClick={(e) => e.stopPropagation()} // Mencegah klik dalam menutup modal
          >
            
            {/* Close Button Absolute */}
            <button onClick={onCancel} className="absolute top-4 right-4 text-slate-500 hover:text-white transition">
               <X size={18}/>
            </button>

            <div className="flex flex-col items-center text-center">
              {/* Icon Bubble */}
              <div className={`p-4 rounded-full mb-5 ${currentTheme.bgIcon} ${currentTheme.textIcon} ring-1 ring-inset ring-white/5`}>
                {currentTheme.icon}
              </div>

              {/* Text Content */}
              <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                {message}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3 w-full">
                <button 
                  onClick={onCancel} 
                  className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold transition border border-white/5"
                >
                  Cancel
                </button>
                <button 
                  onClick={onConfirm} 
                  className={`flex-1 px-4 py-2.5 text-white rounded-xl text-sm font-bold shadow-lg transition active:scale-[0.98] ${currentTheme.button}`}
                >
                  {confirmText || (type === 'danger' ? 'Yes, Delete' : 'Confirm')}
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}