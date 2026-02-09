'use client';

import { motion } from 'framer-motion';
import { Message } from '@/lib/api';
import 'katex/dist/katex.min.css';
import katex from 'katex';
import { useEffect, useRef } from 'react';

interface ChatMessageProps {
  message: Message;
  userAvatar?: string | null;
}

// Format content: Hide code blocks, fix math
function formatContent(content: string): string {
  let formatted = content;
  
  // 1. Remove Python code blocks completely for display
  formatted = formatted.replace(/```python[\s\S]*?```/g, '');
  formatted = formatted.replace(/```[\s\S]*?```/g, ''); // Remove all code blocks as requested
  
  // 2. Fix common math symbols
  formatted = formatted
    .replace(/−/g, '-')
    .replace(/×/g, '\\times ')
    .replace(/÷/g, '\\div ')
    .replace(/√/g, '\\sqrt')
    .replace(/π/g, '\\pi ')
    .replace(/∫/g, '\\int ');

  // 3. Render LaTeX
  formatted = formatted.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try {
      return `<div class="katex-display">${katex.renderToString(math.trim(), { displayMode: true })}</div>`;
    } catch { return `$$${math}$$`; }
  });
  
  formatted = formatted.replace(/\$([^$\n]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false });
    } catch { return `$${math}$`; }
  });

  // 4. Formatting
  formatted = formatted.replace(/\*\*Step (\d+)\*\*/gi, '<br><strong>Step $1</strong>');
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\n/g, '<br>');
  
  return formatted;
}

export default function ChatMessage({ message, userAvatar }: ChatMessageProps) {
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
      className={`message ${isUser ? 'user' : 'assistant'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {!isUser && (
        <div className="message-avatar">⚡</div>
      )}
      
      <div className="message-content">
        {isUser ? (
          message.content
        ) : (
          <div ref={contentRef} />
        )}
        
        {message.has_graph && graphUrl && (
          <div className="graph-container">
            <img src={graphUrl} alt="Graph" />
          </div>
        )}
      </div>

      {isUser && (
        <div className="message-avatar">
          {userAvatar ? <img src={userAvatar} className="rounded-full w-full h-full" /> : '👤'}
        </div>
      )}
    </motion.div>
  );
}
