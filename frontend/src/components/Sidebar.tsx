'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, MessageSquare } from 'lucide-react';
import { ConversationListItem } from '@/lib/api';

interface SidebarProps {
  isOpen: boolean;
  conversations: ConversationListItem[];
  currentId: number | null;
  onSelect: (id: number) => void;
  onNewChat: () => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}

export default function Sidebar({
  isOpen,
  conversations,
  currentId,
  onSelect,
  onNewChat,
  onDelete,
  onClose,
}: SidebarProps) {
  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString();
  };

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="sidebar-overlay open"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Bottom Sheet Sidebar */}
      <motion.div
        className={`sidebar ${isOpen ? 'open' : ''}`}
        initial={false}
        animate={isOpen ? { y: 0 } : { y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        <div className="sidebar-handle" />
        
        <div className="sidebar-header">
          <h2 className="sidebar-title">Chats</h2>
        </div>

        <div style={{ padding: '0 12px' }}>
          <motion.button
            className="new-chat-btn"
            onClick={onNewChat}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={20} />
            New Chat
          </motion.button>
        </div>

        <div className="chat-list">
          <AnimatePresence mode="popLayout">
            {conversations.map((conv) => (
              <motion.div
                key={conv.id}
                className={`chat-item ${currentId === conv.id ? 'active' : ''}`}
                onClick={() => onSelect(conv.id)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                whileTap={{ scale: 0.98 }}
                layout
              >
                <div className="chat-item-icon">
                  <MessageSquare size={18} />
                </div>
                <div className="chat-item-content">
                  <div className="chat-item-title">{conv.title}</div>
                  <div className="chat-item-date">{formatDate(conv.updated_at)}</div>
                </div>
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    padding: '8px',
                    cursor: 'pointer',
                    borderRadius: '8px',
                  }}
                >
                  <Trash2 size={16} />
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>

          {conversations.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px', 
              color: 'var(--text-muted)',
              fontSize: '14px'
            }}>
              No conversations yet.<br />
              Start a new chat!
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
