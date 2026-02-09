'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [shouldOfferGraph, setShouldOfferGraph] = useState(false);
  
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
      setSidebarOpen(false);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setSidebarOpen(false);
    setShouldOfferGraph(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const content = input.trim();
    setInput('');
    setShouldOfferGraph(false);
    
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
      
      // Only offer graph if backend says so AND there's no graph already
      if (response.should_offer_graph && !response.message.has_graph) {
        setShouldOfferGraph(true);
      }
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

  const handleGraphRequest = async () => {
    if (isSending) return;
    setShouldOfferGraph(false);
    setInput('Yes, please show the graph');
    setTimeout(() => handleSend(), 100);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <motion.div 
          className="loading-spinner"
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          🧮
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <motion.button
            className="icon-btn"
            onClick={() => setSidebarOpen(true)}
            whileTap={{ scale: 0.95 }}
          >
            <Menu size={20} />
          </motion.button>
          <div className="header-info">
            <h1>Math AI</h1>
            <div className="header-status">
              <span className="status-dot" />
              <span>Online</span>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <motion.button
            className="icon-btn"
            onClick={startNewChat}
            whileTap={{ scale: 0.95 }}
            title="New Chat"
          >
            <Plus size={20} />
          </motion.button>
          <motion.button
            className="icon-btn"
            onClick={handleLogout}
            whileTap={{ scale: 0.95 }}
            title="Logout"
          >
            <LogOut size={18} />
          </motion.button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {messages.length === 0 ? (
          <>
            {/* Hero Section */}
            <motion.div 
              className="hero-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="hero-card">
                <motion.div 
                  className="hero-avatar"
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  🧮
                </motion.div>
                <h2 className="hero-title">Hi {user?.name?.split(' ')[0] || 'there'}!</h2>
                <p className="hero-subtitle">I&apos;m your AI math tutor for JEE & Olympiad prep</p>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div 
              className="quick-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="quick-actions-scroll">
                <motion.button 
                  className="quick-action-pill"
                  onClick={() => handleSuggestionClick("Find the derivative of x³ - 3x² + 2x")}
                  whileTap={{ scale: 0.97 }}
                >
                  📐 Derivatives
                </motion.button>
                <motion.button 
                  className="quick-action-pill"
                  onClick={() => handleSuggestionClick("Solve: ∫(x² + 2x + 1)dx")}
                  whileTap={{ scale: 0.97 }}
                >
                  ∫ Integration
                </motion.button>
                <motion.button 
                  className="quick-action-pill"
                  onClick={() => handleSuggestionClick("Plot the graph of y = sin(x) + cos(x)")}
                  whileTap={{ scale: 0.97 }}
                >
                  📊 Graph a function
                </motion.button>
                <motion.button 
                  className="quick-action-pill"
                  onClick={() => handleSuggestionClick("If x + 1/x = 3, find x² + 1/x²")}
                  whileTap={{ scale: 0.97 }}
                >
                  🧩 Algebra
                </motion.button>
              </div>
            </motion.div>
          </>
        ) : (
          <div className="messages-container">
            <div className="messages-wrapper">
              <AnimatePresence mode="popLayout">
                {messages.map((msg, index) => (
                  <ChatMessage 
                    key={msg.id} 
                    message={msg} 
                    userAvatar={user?.avatar_url} 
                    userName={user?.name}
                    isLast={index === messages.length - 1}
                    showGraphButton={shouldOfferGraph && index === messages.length - 1 && msg.role === 'assistant'}
                    onGraphRequest={handleGraphRequest}
                  />
                ))}
              </AnimatePresence>
              
              {isSending && (
                <motion.div 
                  className="message assistant"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </main>

      {/* Input Bar */}
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
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
          <motion.button
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            className="send-btn"
            whileTap={{ scale: 0.92 }}
          >
            <Send size={20} />
          </motion.button>
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        conversations={conversations}
        currentId={currentConversationId}
        onSelect={loadConversation}
        onNewChat={startNewChat}
        onDelete={handleDeleteConversation}
        onClose={() => setSidebarOpen(false)}
      />
    </div>
  );
}
