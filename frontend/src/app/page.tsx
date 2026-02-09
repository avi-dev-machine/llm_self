'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, Message } from '@/lib/api';
import AvatarHero from '@/components/AvatarHero';
import ChatInput from '@/components/ChatInput';
import ChatBubble from '@/components/ChatBubble';
import { Menu, MoreHorizontal } from 'lucide-react';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showHero, setShowHero] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (content: string) => {
    if (!content.trim() || isSending) return;
    
    // Hide Hero on first message
    if (messages.length === 0) setShowHero(false);

    const tempUserMsg: Message = {
      id: Date.now(),
      role: 'user',
      content,
      has_graph: false,
      graph_path: null,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setIsSending(true);

    try {
      // For now using session-less flow or create new conversation silently
      // In real PWA we'd check auth, here we assume open or handle internally
      const response = await api.sendMessage(content);
      setMessages(prev => [...prev, response.message]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: Date.now(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again.",
        has_graph: false,
        graph_path: null,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="glow-orb top-[-10%] left-[-10%]" />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 px-6 py-4 flex justify-between items-center backdrop-blur-md bg-[rgba(5,5,7,0.5)]">
        <button className="p-2 -ml-2 text-white/80 hover:text-white">
          <Menu size={24} />
        </button>
        <span className="font-display font-semibold tracking-wide">AI Companion</span>
        <button className="p-2 -mr-2 text-white/80 hover:text-white">
          <MoreHorizontal size={24} />
        </button>
      </header>

      {/* Main Scroll Area */}
      <main className="flex-1 overflow-y-auto pb-32 pt-20 px-4">
        <AnimatePresence>
          {showHero && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
              transition={{ duration: 0.5 }}
            >
              <AvatarHero />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-2xl mx-auto mt-4">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
          </AnimatePresence>
          
          {isSending && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 mb-6"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/50 flex items-center justify-center">
                 <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
              </div>
              <div className="text-sm text-indigo-300 flex items-center">
                Thinking...
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <ChatInput onSend={handleSend} disabled={isSending} />
    </div>
  );
}
