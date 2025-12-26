'use client'

import { useChat } from '@ai-sdk/react';
import { Bot, Send, X, Loader2, CheckCircle2, Trash2, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModal } from '../context/ModalContext'; // Import Custom Modal

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Custom Modal Context
  const { showModal } = useModal();

  // Hook standar AI SDK React
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/chat',
    maxSteps: 5,
  });

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Handler: Clear Chat dengan Custom Modal
  const handleClearChat = () => {
    showModal({
      title: 'Clear Conversation?',
      message: 'This will remove all current chat history. This action cannot be undone.',
      type: 'danger',
      onConfirm: () => setMessages([]) // Reset pesan
    })
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans flex flex-col items-end gap-4">

      {/* 1. Chat Window (Animated) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-slate-900/90 backdrop-blur-md w-[85vw] md:w-96 h-[500px] flex flex-col rounded-3xl overflow-hidden border border-white/10 shadow-2xl origin-bottom-right"
          >

            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-700 flex justify-between items-center shadow-lg relative z-10">
              <div className="flex items-center gap-2.5 text-white">
                <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                  <Bot size={20} className="text-white" />
                </div>
                <div>
                  <span className="font-bold text-sm block leading-none">LifeOS Assistant</span>
                  <span className="text-[10px] text-blue-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Online
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Clear Chat Button */}
                {messages.length > 0 && (
                  <button onClick={handleClearChat} className="text-blue-200 hover:text-white hover:bg-white/10 p-2 rounded-lg transition" title="Clear Chat">
                    <Trash2 size={16} />
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="text-blue-200 hover:text-white hover:bg-white/10 p-2 rounded-lg transition">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50 custom-scrollbar">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                  <div className="bg-slate-800 p-4 rounded-full mb-4">
                    <Sparkles className="text-blue-400" size={32} />
                  </div>
                  <p className="text-slate-300 text-sm font-medium">How can I help you today?</p>
                  <p className="text-slate-500 text-xs mt-1">Try: "Add a meeting at 10 AM"</p>
                </div>
              )}

              {messages.map((m) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={m.id}
                  className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >

                  {/* Text Content */}
                  {m.content && (
                    <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm shadow-sm leading-relaxed break-words whitespace-pre-wrap ${m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-white/5'
                      }`}>
                      {m.content}
                    </div>
                  )}

                  {/* Tool Invocations (Visualisasi Proses) */}
                  {m.toolInvocations?.map((toolInvocation) => {
                    const toolCallId = toolInvocation.toolCallId;
                    const addResult = 'result' in toolInvocation;
                    const name = toolInvocation.toolName;

                    // --- CLIENT SIDE ACTION HANDLER (Auto Navigation) ---
                    if (name === 'triggerAction' && addResult) {
                      const action = (toolInvocation.result as string).includes('start_focus') ? 'start_focus' :
                        (toolInvocation.result as string).includes('open_calendar') ? 'open_calendar' : null;

                      // We can use a useEffect to watch messages, but performing side-effect in render is risky.
                      // Better: Just show a "Button" to confirm navigation or auto-navigate if safe.
                      // For "God Mode", let's auto-navigate via window.location or router?
                      // We can't easily access router inside this map cleanly without triggering it multiple times.
                      // So we'll render a "Click to Proceed" button or simple status.
                      // BUT, for best UX, let's use a side-effect hook later. For now, visual feedback:
                    }

                    // --- VISUALIZATION MAPPING ---
                    const toolsMap: Record<string, { icon: any, color: string, label: string }> = {
                      addTask: { icon: CheckCircle2, color: 'text-green-400', label: 'Task Created' },
                      addFinance: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Transaction Recorded' },
                      addNote: { icon: CheckCircle2, color: 'text-yellow-400', label: 'Note Saved' },
                      addEvent: { icon: CheckCircle2, color: 'text-orange-400', label: 'Event Scheduled' },
                      addWatchlist: { icon: CheckCircle2, color: 'text-pink-400', label: 'Added to Watchlist' },
                      triggerAction: { icon: Sparkles, color: 'text-purple-400', label: 'Action Triggered' }
                    }

                    const config = toolsMap[name] || { icon: Loader2, color: 'text-blue-400', label: 'Processing...' };

                    return (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        key={toolCallId}
                        className={`mt-2 p-3 rounded-xl border flex items-center gap-3 text-xs w-full max-w-[85%]
                                ${addResult
                            ? `bg-slate-800/50 border-white/5 ${config.color.replace('text', 'border')}`
                            : 'bg-blue-500/10 border-blue-500/30 text-blue-300'}`}
                      >
                        <div className={`p-1.5 rounded-full bg-white/5`}>
                          {!addResult ? <Loader2 className="animate-spin" size={14} /> : <config.icon size={14} className={config.color} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`font-bold block ${config.color}`}>{addResult ? config.label : 'Processing...'}</span>
                          <span className="opacity-70 truncate block">
                            {addResult ? (toolInvocation.result as string) : `Executing ${name}...`}
                          </span>
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              ))}

              {/* Loading Typing Indicator */}
              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center border border-white/5">
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-150"></span>
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-300"></span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="p-3 bg-slate-900 border-t border-white/10 flex gap-2 items-end">
              <textarea
                className="flex-1 bg-slate-950/50 text-white px-4 py-3 rounded-xl text-sm outline-none border border-white/10 focus:border-blue-500 transition focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600 resize-none custom-scrollbar"
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
                placeholder="Type a message..."
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20 aspect-square flex items-center justify-center shrink-0 h-[44px]"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-full text-white shadow-2xl transition-all relative z-50
            ${isOpen ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110'}`}
      >
        <AnimatePresence mode='wait'>
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <Bot size={28} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notification Badge (Optional logic) */}
        {!isOpen && messages.length > 0 && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900"></span>
        )}
      </motion.button>
    </div>
  );
}