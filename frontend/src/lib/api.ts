const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7860';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  has_graph: boolean;
  graph_path: string | null;
  created_at: string;
}

interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

interface ConversationListItem {
  id: number;
  title: string;
  updated_at: string;
  message_count: number;
}

interface ChatResponse {
  message: Message;
  conversation_id: number;
  should_offer_graph: boolean;
  graph_base64: string | null;
}

interface User {
  id: number;
  email: string;
  name: string;
  avatar_url: string | null;
  provider: string;
  created_at: string;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.setToken(null);
        throw new Error('Unauthorized');
      }
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async getMe(): Promise<User> {
    return this.fetch<User>('/auth/me');
  }

  getGoogleAuthUrl(): string {
    return `${API_URL}/auth/google`;
  }

  // Chat
  async sendMessage(content: string, conversationId?: number): Promise<ChatResponse> {
    return this.fetch<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({
        content,
        conversation_id: conversationId,
      }),
    });
  }

  async getConversations(): Promise<ConversationListItem[]> {
    return this.fetch<ConversationListItem[]>('/chat/history');
  }

  async getConversation(id: number): Promise<Conversation> {
    return this.fetch<Conversation>(`/chat/${id}`);
  }

  async deleteConversation(id: number): Promise<void> {
    await this.fetch(`/chat/${id}`, { method: 'DELETE' });
  }

  async generateGraph(conversationId: number): Promise<{ graph_base64: string }> {
    return this.fetch(`/chat/${conversationId}/graph`, { method: 'POST' });
  }
}

export const api = new ApiClient();
export type { Message, Conversation, ConversationListItem, ChatResponse, User };
