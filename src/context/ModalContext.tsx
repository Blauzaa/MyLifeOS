'use client'
import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import ConfirmationModal from '../components/ConfirmationModal'

type ModalType = 'danger' | 'warning' | 'info'

interface ModalOptions {
  title: string
  message: string
  type?: ModalType
  confirmText?: string
  cancelText?: string
  // Support Async Function (Promise)
  onConfirm: () => Promise<void> | void
  // Optional: Logic tambahan saat cancel
  onCancel?: () => void 
}

interface ModalContextType {
  showModal: (options: ModalOptions) => void
  closeModal: () => void
  isLoading: boolean
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const [config, setConfig] = useState<ModalOptions>({
    title: '', 
    message: '', 
    type: 'info', 
    onConfirm: () => {}
  })

  // Menggunakan useCallback agar function reference stabil
  const showModal = useCallback((options: ModalOptions) => {
    setConfig({
      ...options,
      type: options.type || 'info'
    })
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    if (isLoading) return // Cegah tutup paksa saat sedang loading
    setIsOpen(false)
    // Kita tidak mengosongkan 'config' di sini agar 
    // teks tidak hilang saat animasi fade-out modal berjalan.
  }, [isLoading])

  const handleConfirm = async () => {
    if (!config.onConfirm) {
      closeModal()
      return
    }

    try {
      setIsLoading(true)
      // Tunggu function onConfirm selesai (misal: request ke Supabase)
      await config.onConfirm()
      setIsOpen(false) // Tutup modal hanya jika sukses
    } catch (error) {
      console.error("Action failed:", error)
      // Opsional: Kamu bisa menambahkan logic Toast Error di sini
      // agar user tau kenapa modal tidak tertutup (gagal)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (config.onCancel) config.onCancel()
    closeModal()
  }

  return (
    <ModalContext.Provider value={{ showModal, closeModal, isLoading }}>
      {children}
      
      {/* Pastikan component ConfirmationModal kamu menerima prop 'isLoading' 
        jika ingin menampilkan spinner di tombol confirm 
      */}
      <ConfirmationModal 
        isOpen={isOpen}
        title={config.title}
        message={config.message}
        type={config.type || 'info'}
        confirmText={isLoading ? 'Processing...' : config.confirmText} // Feedback text sederhana
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) throw new Error('useModal must be used within a ModalProvider')
  return context
}