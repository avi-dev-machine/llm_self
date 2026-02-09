'use client';

import { motion } from 'framer-motion';
import { Message } from '@/lib/api';
import { BarChart3 } from 'lucide-react';
import 'katex/dist/katex.min.css';
import katex from 'katex';
import { useEffect, useRef } from 'react';

interface ChatMessageProps {
  message: Message;
  userAvatar?: string | null;
  userName?: string;
  isLast?: boolean;
  showGraphButton?: boolean;
  onGraphRequest?: () => void;
}

// Render LaTeX in content
function renderMath(content: string): string {
  // Replace display math $$...$$ 
  let result = content.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try {
      return `<div class="katex-display">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
    } catch {
      return `$$${math}$$`;
    }
  });
  
  // Replace inline math $...$
  result = result.replace(/\$([^$\n]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `$${math}$`;
    }
  });
  
  // Format fractions like a/b that aren't in LaTeX
  result = result.replace(/(\d+)\/(\d+)/g, (_, a, b) => {
    try {
      return katex.renderToString(`\\frac{${a}}{${b}}`, { displayMode: false, throwOnError: false });
    } catch {
      return `${a}/${b}`;
    }
  });
  
  return result;
}

// Format the solution content
function formatContent(content: string): string {
  let formatted = content;
  
  // Clean up common PDF copy issues
  formatted = formatted
    .replace(/−/g, '-')  // Fix minus signs
    .replace(/×/g, '\\times ')  // Fix multiplication
    .replace(/÷/g, '\\div ')  // Fix division
    .replace(/√/g, '\\sqrt')  // Fix square root
    .replace(/π/g, '\\pi ')  // Fix pi
    .replace(/∫/g, '\\int ')  // Fix integral
    .replace(/∑/g, '\\sum ')  // Fix summation
    .replace(/∞/g, '\\infty ')  // Fix infinity
    .replace(/≤/g, '\\leq ')  // Fix less than or equal
    .replace(/≥/g, '\\geq ')  // Fix greater than or equal
    .replace(/≠/g, '\\neq ')  // Fix not equal
    .replace(/±/g, '\\pm ')  // Fix plus-minus
    .replace(/θ/g, '\\theta ')  // Fix theta
    .replace(/α/g, '\\alpha ')  // Fix alpha
    .replace(/β/g, '\\beta ')  // Fix beta
    .replace(/γ/g, '\\gamma ')  // Fix gamma
    .replace(/λ/g, '\\lambda ')  // Fix lambda
    .replace(/∂/g, '\\partial ')  // Fix partial
    .replace(/→/g, '\\rightarrow ');  // Fix arrow
  
  // Render math
  formatted = renderMath(formatted);
  
  // Format step numbers
  formatted = formatted.replace(/^(\d+)\.\s/gm, '<span class="step-number">$1</span>');
  formatted = formatted.replace(/\*\*Step (\d+)\*\*/gi, '<span class="step-number">$1</span> <strong>Step $1</strong>');
  
  // Format bold text
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Format code blocks
  formatted = formatted.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Format line breaks
  formatted = formatted.replace(/\n/g, '<br>');
  
  return formatted;
}

export default function ChatMessage({ 
  message, 
  userAvatar, 
  userName,
  showGraphButton,
  onGraphRequest
}: ChatMessageProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const isUser = message.role === 'user';
  
  // Handle graph image URL
  const getGraphUrl = () => {
    if (!message.graph_path) return null;
    
    // If it's already a full URL (Firebase), use it directly
    if (message.graph_path.startsWith('http')) {
      return message.graph_path;
    }
    
    // Otherwise, construct API URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7860';
    return `${apiUrl}${message.graph_path}`;
  };

  const graphUrl = getGraphUrl();
  
  useEffect(() => {
    // Re-render math if content changes
    if (contentRef.current && !isUser) {
      contentRef.current.innerHTML = formatContent(message.content);
    }
  }, [message.content, isUser]);

  return (
    <motion.div
      className={`message ${isUser ? 'user' : 'assistant'}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="message-avatar">
        {isUser ? (
          userAvatar ? (
            <img src={userAvatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            userName?.charAt(0) || '👤'
          )
        ) : (
          '🤖'
        )}
      </div>
      
      <div className="message-content">
        {isUser ? (
          <span>{message.content}</span>
        ) : (
          <div ref={contentRef} dangerouslySetInnerHTML={{ __html: formatContent(message.content) }} />
        )}
        
        {/* Graph Image */}
        {message.has_graph && graphUrl && (
          <motion.div 
            className="graph-container"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <img src={graphUrl} alt="Mathematical graph" />
          </motion.div>
        )}
        
        {/* Conditional Graph Button - only when backend offers */}
        {showGraphButton && !message.has_graph && (
          <motion.button
            className="graph-btn"
            onClick={onGraphRequest}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.97 }}
          >
            <BarChart3 size={16} />
            Generate Graph
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
