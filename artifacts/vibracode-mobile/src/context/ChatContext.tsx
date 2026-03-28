import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AgentType, CONFIG } from "../config";

export type MessageType =
  | "message"
  | "read"
  | "edit"
  | "bash"
  | "tasks"
  | "status";

export interface Message {
  id: string;
  type: MessageType;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface Session {
  id: string;
  name: string;
  messages: Message[];
  previewUrl?: string;
  createdAt: number;
}

interface ChatContextValue {
  sessions: Session[];
  currentSessionId: string | null;
  currentSession: Session | null;
  selectedAgent: AgentType;
  selectedModel: string;
  isSending: boolean;
  setSelectedAgent: (a: AgentType) => void;
  setSelectedModel: (m: string) => void;
  createSession: (name?: string) => string;
  selectSession: (id: string) => void;
  sendMessage: (content: string) => Promise<void>;
  deleteSession: (id: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

const STORAGE_KEY = "vibracode_sessions";

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function createWelcomeMessage(): Message {
  return {
    id: generateId(),
    type: "message",
    role: "assistant",
    content:
      "مرحباً! أنا Vibra Code. صف لي التطبيق الذي تريد بناءه وسأبدأ العمل فوراً.",
    timestamp: Date.now(),
  };
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentType>(
    CONFIG.DEFAULT_AGENT
  );
  const [selectedModel, setSelectedModel] = useState(CONFIG.DEFAULT_MODEL);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const stored: Session[] = JSON.parse(raw);
          setSessions(stored);
          if (stored.length > 0) setCurrentSessionId(stored[0].id);
        } else {
          const id = generateId();
          const initial: Session = {
            id,
            name: "مشروع جديد",
            messages: [createWelcomeMessage()],
            createdAt: Date.now(),
          };
          setSessions([initial]);
          setCurrentSessionId(id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)).catch(
        () => {}
      );
    }
  }, [sessions]);

  const currentSession =
    sessions.find((s) => s.id === currentSessionId) ?? null;

  const createSession = useCallback((name?: string) => {
    const id = generateId();
    const session: Session = {
      id,
      name: name ?? `مشروع ${Date.now()}`,
      messages: [createWelcomeMessage()],
      createdAt: Date.now(),
    };
    setSessions((prev) => [session, ...prev]);
    setCurrentSessionId(id);
    return id;
  }, []);

  const selectSession = useCallback((id: string) => {
    setCurrentSessionId(id);
  }, []);

  const deleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        return next;
      });
      if (currentSessionId === id) {
        setSessions((prev) => {
          const remaining = prev.filter((s) => s.id !== id);
          setCurrentSessionId(remaining[0]?.id ?? null);
          return remaining;
        });
      }
    },
    [currentSessionId]
  );

  const addMessage = useCallback(
    (sessionId: string, msg: Message) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, messages: [...s.messages, msg] } : s
        )
      );
    },
    []
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!currentSessionId || !content.trim()) return;

      const agent = CONFIG.AGENTS.find((a) => a.id === selectedAgent);

      const userMsg: Message = {
        id: generateId(),
        type: "message",
        role: "user",
        content,
        timestamp: Date.now(),
      };
      addMessage(currentSessionId, userMsg);
      setIsSending(true);

      const statusId = generateId();
      const statusMsg: Message = {
        id: statusId,
        type: "status",
        role: "assistant",
        content: "جاري المعالجة...",
        timestamp: Date.now(),
      };
      addMessage(currentSessionId, statusMsg);

      try {
        const session = sessions.find((s) => s.id === currentSessionId);
        const history =
          session?.messages
            .filter((m) => m.type === "message" && m.role !== undefined)
            .slice(-10)
            .map((m) => ({
              role: m.role,
              content: m.content,
            })) ?? [];

        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
            },
            body: JSON.stringify({
              model: agent?.model ?? selectedModel,
              messages: [
                {
                  role: "system",
                  content: `أنت ${agent?.label ?? "Claude Code"}، مساعد برمجي متخصص في بناء التطبيقات. تجيب باللغة العربية وتكتب الكود بالإنجليزية. استخدم Markdown للكود.`,
                },
                ...history,
                { role: "user", content },
              ],
              max_tokens: 2000,
            }),
          }
        );

        const data = await response.json();
        const replyContent =
          data.choices?.[0]?.message?.content ??
          "حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.";

        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === statusId
                      ? {
                          ...m,
                          id: generateId(),
                          type: "message" as MessageType,
                          role: "assistant" as const,
                          content: replyContent,
                          timestamp: Date.now(),
                        }
                      : m
                  ),
                }
              : s
          )
        );
      } catch {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === statusId
                      ? {
                          ...m,
                          type: "message" as MessageType,
                          content:
                            "تعذر الاتصال بالخادم. تحقق من الاتصال بالإنترنت.",
                        }
                      : m
                  ),
                }
              : s
          )
        );
      } finally {
        setIsSending(false);
      }
    },
    [currentSessionId, selectedAgent, selectedModel, sessions, addMessage]
  );

  return (
    <ChatContext.Provider
      value={{
        sessions,
        currentSessionId,
        currentSession,
        selectedAgent,
        selectedModel,
        isSending,
        setSelectedAgent,
        setSelectedModel,
        createSession,
        selectSession,
        sendMessage,
        deleteSession,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be inside ChatProvider");
  return ctx;
}
