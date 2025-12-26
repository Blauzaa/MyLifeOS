'use client'
import { createContext, useContext, useState, ReactNode } from 'react'
import ConfirmationModal from '../components/ConfirmationModal'

type ModalType = 'danger' | 'warning' | 'info'

interface ModalOptions {
  title: string
  message: string
  type?: ModalType
  confirmText?: string
  onConfirm: () => Promise<void> | void
}

interface ModalContextType {
  showModal: (options: ModalOptions) => void
  closeModal: () => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<ModalOptions>({
    title: '', message: '', type: 'info', onConfirm: () => {}
  })

  const showModal = (options: ModalOptions) => {
    setConfig({ ...options, type: options.type || 'info' })
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
  }

  const handleConfirm = async () => {
    if (config.onConfirm) await config.onConfirm()
    closeModal()
  }

  return (
    <ModalContext.Provider value={{ showModal, closeModal }}>
      {children}
      {/* Modal ditaruh di sini sekali saja untuk seluruh aplikasi */}
      <ConfirmationModal 
        isOpen={isOpen}
        title={config.title}
        message={config.message}
        type={config.type || 'info'}
        onConfirm={handleConfirm}
        onCancel={closeModal}
        confirmText={config.confirmText}
      />
    </ModalContext.Provider>
  )
}

// Custom hook biar gampang dipanggil
export function useModal() {
  const context = useContext(ModalContext)
  if (!context) throw new Error('useModal must be used within a ModalProvider')
  return context
}