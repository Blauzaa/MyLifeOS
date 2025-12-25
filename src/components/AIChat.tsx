/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
// Jika ai/react masih merah, coba gunakan @ai-sdk/react (jika sudah install versi terbaru)
// Tapi standarnya adalah ai/react
import { useChat } from 'ai/react'

import { Bot, Send, X, Sparkles, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false)
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  })

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-[100]">
      {isOpen ? (
        <div className="bg-slate-900 border border-white/10 w-80 md:w-96 h-[500px] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="p-4 bg-blue-600 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <span className="font-bold text-sm">LifeOS AI</span>
            </div>
            <button onClick={() => setIsOpen(false)}><X size={18}/></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-xs text-slate-500 text-center mt-10">
                <p>&quot;Tambahkan task beli kopi&quot;</p>
              </div>
            )}
            
            {messages.map((m: any) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.content && (
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-200'
                  }`}>
                    {m.content}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <Loader2 className="animate-spin text-blue-500" size={16}/>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-black/20">
            <div className="flex gap-2">
              <input 
                className="flex-1 bg-slate-800 text-white rounded-xl px-4 py-2 text-sm outline-none"
                placeholder="Tanya sesuatu..."
                value={input}
                onChange={handleInputChange}
              />
              <button type="submit" disabled={isLoading} className="bg-blue-600 p-2 rounded-xl text-white disabled:opacity-50">
                <Send size={18}/>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-lg"
        >
          <Bot size={28} />
        </button>
      )}
    </div>
  )
}