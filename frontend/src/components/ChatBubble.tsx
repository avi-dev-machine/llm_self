'use client';

import { motion } from 'framer-motion';
import { Message } from '@/lib/api';
import 'katex/dist/katex.min.css';
import katex from 'katex';
import { useEffect, useRef } from 'react';
import { Bot, User } from 'lucide-react';

interface ChatBubbleProps {
  message: Message;
}

// Format content: math support + code hiding
function formatContent(content: string): string {
  let formatted = content;
  
  // Hide code blocks
  formatted = formatted.replace(/```[\s\S]*?```/g, ''); 
  
  // Math corrections
  formatted = formatted
    .replace(/×/g, '\\times ')
    .replace(/÷/g, '\\div ')
    .replace(/π/g, '\\pi ');

  // LaTeX
  formatted = formatted.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try { return `<div class="katex-display">${katex.renderToString(math.trim(), { displayMode: true })}</div>`; } 
    catch { return `$$${math}$$`; }
  });
  
  formatted = formatted.replace(/\$([^$\n]+?)\$/g, (_, math) => {
    try { return katex.renderToString(math.trim(), { displayMode: false }); } 
    catch { return `$${math}$`; }
  });

  formatted = formatted.replace(/\n/g, '<br>');
  return formatted;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const isUser = message.role === 'user';
  
  const getGraphUrl = () => {
    if (!message.graph_path) return null;
    if (message.graph_path.startsWith('http')) return message.graph_path;
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7860'}${message.graph_path}`;
  };
  const graphUrl = getGraphUrl();

  useEffect(() => {
    if (contentRef.current && !isUser) {
      contentRef.current.innerHTML = formatContent(message.content);
    }
  }, [message.content, isUser]);

  return (
    <motion.div 
      className={`flex gap-3 mb-6 w-full ${isUser ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/50 flex items-center justify-center shrink-0">
          <Bot size={16} className="text-indigo-400" />
        </div>
      )}

      <div className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm ${
        isUser 
          ? 'bg-indigo-600 text-white rounded-br-none' 
          : 'bg-[rgba(255,255,255,0.03)] border border-[var(--border-glass)] text-gray-100 rounded-bl-none'
      }`}>
        <div className="text-[15px] leading-relaxed font-light">
          {isUser ? (
            message.content
          ) : (
            <div ref={contentRef} />
          )}
        </div>

        {message.has_graph && graphUrl && (
          <motion.div 
            className="mt-3 rounded-xl overflow-hidden border border-[var(--border-glass)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <img src={graphUrl} alt="Graph" className="w-full" />
          </motion.div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-700/50 border border-gray-600/50 flex items-center justify-center shrink-0">
          <User size={16} className="text-gray-400" />
        </div>
      )}
    </motion.div>
  );
}
