'use client';

import { useState, useEffect, useRef } from 'react';
import { api, Message, ConversationListItem } from '@/lib/api';
import ChatMessage from '@/components/ChatMessage';
import Sidebar from '@/components/Sidebar';
import AuthScreen from '@/components/AuthScreen';
import { Menu, Plus, Send, LogOut } from 'lucide-react';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string; avatar_url: string | null } | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [input, setInput] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = api.getToken();
      if (token) {
        try {
          const userData = await api.getMe();
          setUser(userData);
          setIsAuthenticated(true);
          loadConversations();
        } catch {
          api.setToken(null);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      api.setToken(token);
      window.history.replaceState({}, '', '/');
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const convs = await api.getConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadConversation = async (id: number) => {
    try {
      const conv = await api.getConversation(id);
      setMessages(conv.messages);
      setCurrentConversationId(id);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
  };

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const content = input.trim();
    setInput('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

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
      const response = await api.sendMessage(content, currentConversationId || undefined);
      
      if (!currentConversationId) {
        setCurrentConversationId(response.conversation_id);
        loadConversations();
      }

      setMessages(prev => [...prev, response.message]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLogout = () => {
    api.setToken(null);
    setIsAuthenticated(false);
    setUser(null);
    setMessages([]);
    setConversations([]);
    setCurrentConversationId(null);
  };

  const handleDeleteConversation = async (id: number) => {
    try {
      await api.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversationId === id) {
        startNewChat();
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  };

  if (isLoading) {
    return (
      <div className="auth-container">
        <div style={{ textAlign: 'center' }}>
          <div className="auth-logo">🧮</div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="app-container">
      <Sidebar
        isOpen={sidebarOpen}
        conversations={conversations}
        currentId={currentConversationId}
        onSelect={loadConversation}
        onNewChat={startNewChat}
        onDelete={handleDeleteConversation}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-content">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px' }}
            >
              <Menu size={20} />
            </button>
            <button
              onClick={startNewChat}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px' }}
              title="New Chat"
            >
              <Plus size={20} />
            </button>
          </div>

          <h1 className="header-title">Math Agent</h1>

          <div className="user-menu">
            {user && (
              <>
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="user-avatar" />
                ) : (
                  <div className="user-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                    {user.name.charAt(0)}
                  </div>
                )}
              </>
            )}
            <button
              onClick={handleLogout}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🧮</div>
              <h2 className="empty-title">How can I help you today?</h2>
              <p className="empty-subtitle">
                I&apos;m your AI math tutor for JEE and Olympiad preparation. 
                Ask me any problem and I&apos;ll solve it step by step.
              </p>
              <div className="suggestions">
                <button className="suggestion-chip" onClick={() => handleSuggestionClick("Find the derivative of x³ - 3x² + 2x")}>
                  Derivative of x³ - 3x² + 2x
                </button>
                <button className="suggestion-chip" onClick={() => handleSuggestionClick("Solve: ∫(x² + 2x + 1)dx")}>
                  Integrate x² + 2x + 1
                </button>
                <button className="suggestion-chip" onClick={() => handleSuggestionClick("If x + 1/x = 3, find x² + 1/x²")}>
                  x + 1/x = 3, find x² + 1/x²
                </button>
              </div>
            </div>
          ) : (
            <div className="messages-wrapper">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} userAvatar={user?.avatar_url} userName={user?.name} />
              ))}
              {isSending && (
                <div className="message assistant">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="input-container">
          <div className="input-wrapper">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me a math problem..."
              disabled={isSending}
              rows={1}
              className="input-box"
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 150) + 'px';
              }}
            />
            <button
              onClick={handleSend}
              disabled={isSending || !input.trim()}
              className="send-btn"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
