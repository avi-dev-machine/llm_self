'use client';

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Send, Mic } from 'lucide-react';
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
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="input-container">
      <motion.div 
        className="input-wrapper"
        animate={{ 
          boxShadow: isFocused ? '0 8px 32px rgba(139, 127, 212, 0.25)' : '0 8px 32px rgba(0, 0, 0, 0.08)',
          borderColor: isFocused ? 'rgba(156, 173, 223, 0.8)' : 'rgba(255, 255, 255, 0.5)'
        }}
        transition={{ duration: 0.2 }}
      >
        <button 
          className="icon-btn" 
          style={{ width: '36px', height: '36px', border: 'none', background: 'transparent' }}
          disabled
        >
          <Mic size={20} color="var(--text-muted)" />
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
          className="input-box"
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = Math.min(target.scrollHeight, 120) + 'px';
          }}
        />

        <AnimatePresence>
          {input.trim() && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={handleSubmit}
              disabled={disabled}
              className="send-btn"
              whileTap={{ scale: 0.9 }}
            >
              <Send size={20} />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
