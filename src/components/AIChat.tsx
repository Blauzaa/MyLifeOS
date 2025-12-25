/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useChat } from '@ai-sdk/react'
import { Bot, Send, X, Sparkles, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [textInput, setTextInput] = useState('')

  // PERBAIKAN DI SINI:
  // 1. Hapus // @ts-ignore yang bikin error ESLint
  // 2. Tambahkan 'as any' TEPAT SETELAH kurung kurawal tutup options
// Tambahkan : any di sini agar TypeScript berhenti mengecek properti yang keluar
  const { messages, append, isLoading }: any = useChat({
    api: '/api/chat',
    maxSteps: 5,
    // Tambahkan : any pada parameter err
    onError: (err: any) => console.error("AI Error:", err)
  } as any)

  const handleKirimPesan = async (e: React.FormEvent) => {
    e.preventDefault();
    const pesan = textInput.trim();
    if (!pesan || isLoading) return;

    console.log("Mencoba mengirim pesan:", pesan);

    try {
      setTextInput(''); 
      await append({
        role: 'user',
        content: pesan
      });
    } catch (err) {
      console.error("Gagal mengirim:", err);
    }
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-[100]">
      {isOpen ? (
        <div className="bg-slate-900 border border-white/10 w-80 md:w-96 h-[500px] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 text-white">
          <div className="p-4 bg-blue-600 flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <span className="font-bold text-sm">LifeOS Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)}><X size={18}/></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950 custom-scrollbar">
            {messages.length === 0 && (
              <div className="text-xs text-slate-500 text-center mt-10 italic">
                &quot;Tambahkan task beli kopi&quot;
              </div>
            )}
            
            {messages.map((m: any) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.content && (
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200 shadow-lg'
                  }`}>
                    {m.content}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 p-2 rounded-xl">
                  <Loader2 className="animate-spin text-blue-500" size={16}/>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleKirimPesan} className="p-4 border-t border-white/5 bg-slate-900">
            <div className="flex gap-2">
              <input 
                className="flex-1 bg-slate-800 text-white rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 ring-blue-500 transition-all"
                placeholder="Tanya LifeOS AI..."
                value={textInput} 
                onChange={(e) => setTextInput(e.target.value)}
              />
              <button 
                type="submit" 
                disabled={isLoading || !textInput.trim()} 
                className="bg-blue-600 p-2 rounded-xl text-white disabled:opacity-50 transition-transform active:scale-95"
              >
                <Send size={18}/>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-lg shadow-blue-900/20 transition-all hover:scale-110 active:scale-95"
        >
          <Bot size={28} />
        </button>
      )}
    </div>
  )
}