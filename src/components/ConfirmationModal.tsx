'use client'
import { Trash2, AlertTriangle, AlertCircle } from 'lucide-react'

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
  if (!isOpen) return null;

  const colors = {
    danger: 'bg-red-600 hover:bg-red-500',
    warning: 'bg-orange-600 hover:bg-orange-500',
    info: 'bg-blue-600 hover:bg-blue-500'
  }

  const icons = {
    danger: <Trash2 size={24}/>,
    warning: <AlertTriangle size={24}/>,
    info: <AlertCircle size={24}/>
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-2xl p-6 shadow-2xl scale-100">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-full bg-white/5 ${type === 'danger' ? 'text-red-500' : type === 'warning' ? 'text-orange-500' : 'text-blue-500'}`}>
            {icons[type]}
          </div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        <p className="text-slate-400 mb-6 text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-slate-300 hover:bg-white/5 rounded-lg text-sm font-medium transition">
            Cancel
          </button>
          <button onClick={onConfirm} className={`px-4 py-2 text-white rounded-lg text-sm font-bold shadow-lg transition ${colors[type]}`}>
            {confirmText || (type === 'danger' ? 'Yes, Delete' : 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}