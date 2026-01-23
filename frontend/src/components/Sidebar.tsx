'use client';

import { ConversationListItem } from '@/lib/api';
import { MessageSquare, Plus, Trash2, X } from 'lucide-react';

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
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={onClose}
          style={{
            display: 'none',
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
          }}
        />
      )}
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{ transform: isOpen ? 'translateX(0)' : undefined }}>
        <div className="sidebar-header">
          <button onClick={onNewChat} className="new-chat-btn">
            <Plus size={18} />
            New Chat
          </button>
        </div>

        <div className="chat-list">
          {conversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <MessageSquare size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p style={{ fontSize: '14px' }}>No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`chat-item ${currentId === conv.id ? 'active' : ''}`}
                onClick={() => onSelect(conv.id)}
              >
                <div className="chat-item-icon">
                  <MessageSquare size={16} />
                </div>
                <div className="chat-item-content">
                  <div className="chat-item-title">{conv.title}</div>
                  <div className="chat-item-date">{formatDate(conv.updated_at)}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    opacity: 0.5,
                    transition: 'opacity 0.2s, color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.color = 'var(--error)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.5';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ 
          padding: '16px 20px', 
          borderTop: '1px solid var(--border-color)',
          fontSize: '12px',
          color: 'var(--text-muted)',
          textAlign: 'center'
        }}>
          Math Agent v2.0
        </div>
      </aside>
    </>
  );
}
