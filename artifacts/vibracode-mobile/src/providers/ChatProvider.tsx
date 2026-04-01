import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface Message {
  id:        string;
  role:      'user' | 'assistant';
  type:      string;
  content:   string;
  createdAt: number;
  streaming?: boolean;
  agentId?:  string;
  metadata?: any;
}

export interface ChatContextValue {
  messages:    Message[];
  isLoading:   boolean;
  isOnline:    boolean;
  sessionId:   string | null;
  sendMessage: (prompt: string, agentId?: string) => Promise<void>;
  clearMessages: () => void;
}

const ChatCtx = createContext<ChatContextValue | null>(null);

const STORAGE_KEY = 'vibracode_messages';

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages,   setMessages] = useState<Message[]>([]);
  const [isLoading,  setLoading]  = useState(false);
  const [isOnline,   setOnline]   = useState(true);
  const [sessionId,  setSessionId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setMessages(JSON.parse(raw));
    });
    const unsub = NetInfo.addEventListener((s) => setOnline(!!s.isConnected));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  function addMessage(msg: Omit<Message, 'id'>) {
    const full: Message = { ...msg, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` };
    setMessages((prev) => [...prev, full]);
    return full.id;
  }

  async function sendMessage(prompt: string, agentId = 'claude') {
    setLoading(true);
    addMessage({ role: 'user', type: 'message', content: prompt, createdAt: Date.now() });

    const backendUrl = (process.env.EXPO_PUBLIC_BACKEND_URL ?? '').replace(/\/$/, '');

    if (isOnline && backendUrl) {
      try {
        let currentSessionId = sessionId;
        if (!currentSessionId) {
          const sid = `session_${Date.now()}`;
          setSessionId(sid);
          currentSessionId = sid;
        }
        const res = await fetch(`${backendUrl}/api/e2b/generate`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ sessionId: currentSessionId, prompt, agent: agentId }),
        });
        if (!res.ok) throw new Error(await res.text());
      } catch (err) {
        addMessage({ role: 'assistant', type: 'error', content: String(err), createdAt: Date.now() });
      }
    } else {
      addMessage({
        role:      'assistant',
        type:      'status',
        content:   '📡 Offline — message saved. Will retry when connected.',
        createdAt: Date.now(),
      });
    }

    setLoading(false);
  }

  function clearMessages() {
    setMessages([]);
    AsyncStorage.removeItem(STORAGE_KEY);
  }

  return (
    <ChatCtx.Provider value={{ messages, isLoading, isOnline, sessionId, sendMessage, clearMessages }}>
      {children}
    </ChatCtx.Provider>
  );
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatCtx);
  if (!ctx) throw new Error('useChat must be inside <ChatProvider>');
  return ctx;
}
