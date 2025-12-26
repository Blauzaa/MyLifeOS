'use client'

import { useChat } from '@ai-sdk/react';
import { Bot, Send, X, Loader2, CheckCircle2, Trash2, Sparkles, Zap } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModal } from '../context/ModalContext';
import { useFocus } from '../context/FocusContext';
import { useRouter } from 'next/navigation';

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { showModal } = useModal();
  const { setConfig, setTaskName, switchMode, setIsActive } = useFocus();
  const router = useRouter();

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/chat',
    maxSteps: 5,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleClearChat = () => {
    showModal({
      title: 'Clear Conversation?',
      message: 'This will remove all current chat history.',
      type: 'danger',
      onConfirm: () => setMessages([])
    })
  }

  // --- HANDLE TOOL ACTIONS ---
  useEffect(() => {
    if (!messages.length) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'assistant' || !lastMessage.toolInvocations) return;

    lastMessage.toolInvocations.forEach(tool => {
      if (!('result' in tool)) return; // Wait for result

      // 1. TRIGGER ACTION (Navigation)
      if (tool.toolName === 'triggerAction') {
        const res = tool.result as string;
        if (res.includes('start_focus')) router.push('/focus');
        if (res.includes('open_finance')) router.push('/finance');
        if (res.includes('open_calendar')) router.push('/calendar');
        if (res.includes('open_tasks')) router.push('/tasks');
        if (res.includes('open_notes')) router.push('/notes');
        if (res.includes('open_resources')) router.push('/resources');
      }

      // 2. START FOCUS SESSION (Config + Nav)
      if (tool.toolName === 'startFocusSession') {
        try {
          const data = JSON.parse(tool.result as string);
          if (data.action === 'start_focus_session') {
            setConfig(prev => ({ ...prev, ...data.config }));
            setTaskName(data.taskName);
            switchMode('focus');
            setIsActive(true); // Auto start
            router.push('/focus');
          }
        } catch (e) { console.error("Failed to parse focus config", e) }
      }
    });
  }, [messages, router, setConfig, setIsActive, setTaskName, switchMode]);

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-slate-900/90 backdrop-blur-md w-[85vw] md:w-96 h-[500px] flex flex-col rounded-3xl overflow-hidden border border-white/10 shadow-2xl origin-bottom-right"
          >
            <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-700 flex justify-between items-center shadow-lg relative z-10">
              <div className="flex items-center gap-2.5 text-white">
                <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm"><Bot size={20} /></div>
                <div>
                  <span className="font-bold text-sm block leading-none">LifeOS Assistant</span>
                  <span className="text-[10px] text-blue-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Online
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button onClick={handleClearChat} className="text-blue-200 hover:text-white hover:bg-white/10 p-2 rounded-lg transition"><Trash2 size={16} /></button>
                )}
                <button onClick={() => setIsOpen(false)} className="text-blue-200 hover:text-white hover:bg-white/10 p-2 rounded-lg transition"><X size={18} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50 custom-scrollbar">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                  <Sparkles className="text-blue-400 mb-4" size={32} />
                  <p className="text-slate-300 text-sm font-medium">How can I help you today?</p>
                </div>
              )}

              {messages.map((m) => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={m.id} className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {m.content && (
                    <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm shadow-sm leading-relaxed break-words whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-white/5'}`}>
                      {m.content}
                    </div>
                  )}
                  {m.toolInvocations?.map((tool) => {
                    const isDone = 'result' in tool;
                    const toolsMap: Record<string, any> = {
                      addTask: { icon: CheckCircle2, color: 'text-green-400', label: 'Task Created' },
                      addFinance: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Finance Recorded' },
                      addNote: { icon: CheckCircle2, color: 'text-yellow-400', label: 'Note Saved' },
                      addEvent: { icon: CheckCircle2, color: 'text-orange-400', label: 'Event Scheduled' },
                      addWatchlist: { icon: CheckCircle2, color: 'text-pink-400', label: 'Watchlist Updated' },
                      triggerAction: { icon: Sparkles, color: 'text-purple-400', label: 'Navigating...' },
                      startFocusSession: { icon: Zap, color: 'text-blue-400', label: 'Focus Mode Started' },
                      addResource: { icon: CheckCircle2, color: 'text-cyan-400', label: 'Resource Saved' }
                    }
                    const info = toolsMap[tool.toolName] || { icon: Loader2, color: 'text-slate-400', label: 'Processing...' };

                    return (
                      <div key={tool.toolCallId} className={`mt-2 p-3 rounded-xl border flex items-center gap-3 text-xs w-full max-w-[85%] ${isDone ? `bg-slate-800/50 border-white/5 ${info.color.replace('text', 'border')}` : 'bg-blue-500/10 border-blue-500/30'}`}>
                        <info.icon size={14} className={isDone ? info.color : 'animate-spin text-blue-400'} />
                        <div>
                          <span className={`font-bold block ${info.color}`}>{isDone ? info.label : 'Processing...'}</span>
                          <span className="opacity-70 truncate block">{isDone ? 'Completed' : 'Thinking...'}</span>
                        </div>
                      </div>
                    )
                  })}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-3 bg-slate-900 border-t border-white/10 flex gap-2 items-end">
              <textarea
                className="flex-1 bg-slate-950/50 text-white px-4 py-3 rounded-xl text-sm outline-none border border-white/10 focus:border-blue-500 transition resize-none custom-scrollbar"
                value={input} onChange={handleInputChange}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any); } }}
                placeholder="Type a message..." rows={1} style={{ minHeight: '44px', maxHeight: '120px' }}
              />
              <button type="submit" disabled={isLoading || !input.trim()} className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition disabled:opacity-50 shadow-lg h-[44px] w-[44px] flex items-center justify-center">
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button onClick={() => setIsOpen(!isOpen)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`p-4 rounded-full text-white shadow-2xl transition-all relative z-50 ${isOpen ? 'bg-slate-700' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}>
        {isOpen ? <X size={24} /> : <Bot size={28} />}
      </motion.button>
    </div>
  );
}