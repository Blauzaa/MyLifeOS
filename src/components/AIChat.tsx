'use client'

import { useChat } from '@ai-sdk/react';
import { Bot, Send, X, Loader2, CheckCircle2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Hook standar AI SDK React
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    maxSteps: 5, // Samakan dengan di server agar logic-nya sinkron
  });

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* 1. Chat Window */}
      {isOpen && (
        <div className="bg-slate-900 w-80 md:w-96 h-[500px] flex flex-col rounded-2xl overflow-hidden border border-slate-700 shadow-2xl mb-4">
          
          {/* Header */}
          <div className="p-4 bg-blue-600 flex justify-between items-center">
            <div className="flex items-center gap-2 text-white">
              <Bot size={20} />
              <span className="font-bold text-sm">LifeOS AI</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:opacity-80">
              <X size={18}/>
            </button>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
            {messages.length === 0 && (
              <p className="text-center text-slate-500 text-sm mt-10">
                Silakan ketik tugas yang ingin dicatat.
              </p>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                
                {/* Text Content */}
                {m.content && (
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'
                  }`}>
                    {m.content}
                  </div>
                )}

                {/* Tool Invocations (Loading State saat menyimpan) */}
                {m.toolInvocations?.map((toolInvocation) => {
                  const toolCallId = toolInvocation.toolCallId;
                  const addResult = 'result' in toolInvocation;

                  if (toolInvocation.toolName === 'addTask') {
                    return (
                      <div key={toolCallId} className="bg-slate-900 border border-slate-700 p-2 rounded text-xs text-slate-400 flex items-center gap-2 mt-1">
                        {!addResult ? <Loader2 className="animate-spin" size={12}/> : <CheckCircle2 className="text-green-500" size={12}/>}
                        <span>{addResult ? 'Tugas tersimpan' : 'Menyimpan tugas...'}</span>
                      </div>
                    )
                  }
                  return null;
                })}
              </div>
            ))}
            
            {/* Loading Indicator Text */}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
               <div className="flex justify-start">
                 <Loader2 className="animate-spin text-slate-500" size={16}/>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
            <input 
              className="flex-1 bg-slate-800 text-white p-2 rounded-xl text-sm outline-none border border-slate-700 focus:border-blue-500"
              value={input} 
              onChange={handleInputChange} 
              placeholder="Tulis sesuatu..."
            />
            <button type="submit" disabled={isLoading || !input.trim()} className="bg-blue-600 text-white p-2 rounded-xl disabled:opacity-50">
              <Send size={18}/>
            </button>
          </form>
        </div>
      )}

      {/* 2. Toggle Button */}
      <button onClick={() => setIsOpen(!isOpen)} className="bg-blue-600 hover:bg-blue-500 p-4 rounded-full text-white shadow-lg transition-all">
        {isOpen ? <X size={24} /> : <Bot size={28} />}
      </button>
    </div>
  );
}