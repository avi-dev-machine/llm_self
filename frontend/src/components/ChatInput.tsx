'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Mic, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4 bg-gradient-to-t from-[var(--bg-dark)] via-[var(--bg-dark)] to-transparent">
      <motion.div 
        className={`relative flex items-end gap-3 p-2 rounded-3xl border transition-all duration-300 ${
          isFocused 
            ? 'bg-[rgba(20,20,30,0.9)] border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)]' 
            : 'bg-[rgba(20,20,30,0.6)] border-[var(--border-glass)] backdrop-blur-xl'
        }`}
        animate={{ y: 0, opacity: 1 }}
        initial={{ y: 50, opacity: 0 }}
      >
        <button className="p-3 text-indigo-400 hover:text-indigo-300 transition-colors">
          <Sparkles size={20} />
        </button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Ask anything..."
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none py-3 max-h-32 min-h-[24px]"
          style={{ height: 'auto' }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = Math.min(target.scrollHeight, 120) + 'px';
          }}
        />

        <motion.button
          onClick={handleSubmit}
          disabled={!input.trim() || disabled}
          className="p-3 rounded-full bg-indigo-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          whileTap={{ scale: 0.9 }}
          animate={{ scale: input.trim() ? 1 : 0.8, opacity: input.trim() ? 1 : 0.5 }}
        >
          <Send size={18} />
        </motion.button>
      </motion.div>
    </div>
  );
}
