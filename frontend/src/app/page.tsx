'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, Message, ConversationListItem } from '@/lib/api';
import ChatMessage from '@/components/ChatMessage';
import Sidebar from '@/components/Sidebar';
import ChatInput from '@/components/ChatInput';
import AuthScreen from '@/components/AuthScreen';
import { Menu, Plus } from 'lucide-react';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; avatar_url: string | null } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const convs = await api.getConversations();
      setConversations(convs);
    } catch { /* ignore */ }
  };

  const loadConversation = async (id: number) => {
    try {
      const conv = await api.getConversation(id);
      setMessages(conv.messages);
      setCurrentConversationId(id);
      setSidebarOpen(false);
    } catch { /* ignore */ }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setSidebarOpen(false);
  };

  const handleSend = async (content: string) => {
    if (!content.trim() || isSending) return;

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
      console.error(error);
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = () => {
    api.setToken(null);
    setIsAuthenticated(false);
    setUser(null);
    setMessages([]);
  };

  if (isLoading) return <div className="loading-container">...</div>;
  if (!isAuthenticated) return <AuthScreen />;

  return (
    <>
      <div className="blob-container">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div className="app-container">
        <Sidebar 
          isOpen={sidebarOpen}
          conversations={conversations}
          currentId={currentConversationId}
          onSelect={loadConversation}
          onNewChat={startNewChat}
          onClose={() => setSidebarOpen(false)}
          onDelete={async (id) => {
            await api.deleteConversation(id);
            setConversations(p => p.filter(c => c.id !== id));
            if (currentConversationId === id) startNewChat();
          }}
        />

        <main className="main-content">
          <header className="header">
            <button className="icon-btn" onClick={() => setSidebarOpen(true)}>
              <Menu color="white" />
            </button>
            <div style={{fontWeight:600}}>MathGPT</div>
            <button className="icon-btn" onClick={startNewChat}>
              <Plus color="white" />
            </button>
          </header>

          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-logo">⚡</div>
              <h2>How can I help with math today?</h2>
            </div>
          ) : (
            <div className="messages-container">
              <div className="messages-wrapper">
                {messages.map(msg => (
                  <ChatMessage 
                    key={msg.id} 
                    message={msg} 
                    userAvatar={user?.avatar_url} 
                  />
                ))}
                {isSending && (
                  <div className="message assistant">
                    <div className="message-avatar">⚡</div>
                    <div className="message-content">Thinking...</div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          <ChatInput onSend={handleSend} disabled={isSending} />
        </main>
      </div>
    </>
  );
}
