import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
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

export interface TaskItem {
  text: string;
  status: "pending" | "active" | "done";
}

export interface Message {
  id: string;
  type: MessageType;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  tasks?: TaskItem[];
  fileCount?: number;
  expanded?: boolean;
  streaming?: boolean;
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
  clearHistory: () => void;
  deleteSession: (id: string) => void;
  toggleExpanded: (msgId: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);
const STORAGE_KEY = "vibracode_v3";

export function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function createWelcomeMessage(): Message {
  return {
    id: generateId(),
    type: "message",
    role: "assistant",
    content:
      "What do you want to build today? Describe your app and I'll build it for you.",
    timestamp: Date.now(),
  };
}

function makeTasksMessage(content: string): Message[] {
  const lc = content.toLowerCase();
  let tasks: TaskItem[];

  if (lc.includes("airbnb") || lc.includes("booking")) {
    tasks = [
      { text: "Create home screen with search and listings", status: "active" },
      { text: "Add listing detail screen", status: "pending" },
      { text: "Create tab navigation structure", status: "pending" },
    ];
  } else if (lc.includes("chat") || lc.includes("message")) {
    tasks = [
      { text: "Design chat bubble UI components", status: "active" },
      { text: "Add real-time message state", status: "pending" },
      { text: "Implement send functionality", status: "pending" },
    ];
  } else if (lc.includes("todo") || lc.includes("task")) {
    tasks = [
      { text: "Create task list with CRUD operations", status: "active" },
      { text: "Add swipe-to-delete gesture", status: "pending" },
      { text: "Implement local persistence", status: "pending" },
    ];
  } else {
    const name = content.slice(0, 35);
    tasks = [
      { text: `Design ${name} UI layout`, status: "active" },
      { text: "Implement core functionality", status: "pending" },
      { text: "Add navigation and routing", status: "pending" },
    ];
  }

  return [
    {
      id: generateId(),
      type: "tasks",
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      tasks: tasks.map((t) => ({ ...t })),
    },
  ];
}

function makeProgressMessages(tasks: TaskItem[]): Message[] {
  const msgs: Message[] = [];

  msgs.push({
    id: generateId(),
    type: "read",
    role: "assistant",
    content: "",
    timestamp: Date.now() + 100,
    fileCount: 2,
  });

  msgs.push({
    id: generateId(),
    type: "edit",
    role: "assistant",
    content: "",
    timestamp: Date.now() + 200,
    fileCount: 4,
  });

  msgs.push({
    id: generateId(),
    type: "tasks",
    role: "assistant",
    content: "",
    timestamp: Date.now() + 300,
    tasks: tasks.map((t, i) => ({
      ...t,
      status: i < 1 ? ("done" as const) : i === 1 ? ("active" as const) : ("pending" as const),
    })),
  });

  msgs.push({
    id: generateId(),
    type: "edit",
    role: "assistant",
    content: "",
    timestamp: Date.now() + 400,
    fileCount: 6,
  });

  msgs.push({
    id: generateId(),
    type: "read",
    role: "assistant",
    content: "",
    timestamp: Date.now() + 500,
    fileCount: 1,
  });

  msgs.push({
    id: generateId(),
    type: "edit",
    role: "assistant",
    content: "",
    timestamp: Date.now() + 600,
    fileCount: 1,
  });

  msgs.push({
    id: generateId(),
    type: "tasks",
    role: "assistant",
    content: "",
    timestamp: Date.now() + 700,
    tasks: tasks.map((t) => ({ ...t, status: "done" as const })),
  });

  return msgs;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentType>(
    CONFIG.DEFAULT_AGENT
  );
  const [selectedModel, setSelectedModel] = useState(CONFIG.DEFAULT_MODEL);
  const [isSending, setIsSending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const stored: Session[] = JSON.parse(raw);
          if (stored.length > 0) {
            setSessions(stored);
            setCurrentSessionId(stored[0].id);
            return;
          }
        }
        const id = generateId();
        const init: Session = {
          id,
          name: "New Project",
          messages: [createWelcomeMessage()],
          createdAt: Date.now(),
        };
        setSessions([init]);
        setCurrentSessionId(id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (sessions.length > 0)
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)).catch(() => {});
  }, [sessions]);

  const currentSession = sessions.find((s) => s.id === currentSessionId) ?? null;

  const createSession = useCallback((name?: string) => {
    const id = generateId();
    const s: Session = {
      id,
      name: name ?? "New Project",
      messages: [createWelcomeMessage()],
      createdAt: Date.now(),
    };
    setSessions((prev) => [s, ...prev]);
    setCurrentSessionId(id);
    return id;
  }, []);

  const selectSession = useCallback((id: string) => {
    setCurrentSessionId(id);
  }, []);

  const clearHistory = useCallback(() => {
    if (!currentSessionId) return;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? { ...s, messages: [createWelcomeMessage()] }
          : s
      )
    );
  }, [currentSessionId]);

  const deleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        if (currentSessionId === id) setCurrentSessionId(next[0]?.id ?? null);
        return next;
      });
    },
    [currentSessionId]
  );

  const toggleExpanded = useCallback((msgId: string) => {
    setSessions((prev) =>
      prev.map((s) => ({
        ...s,
        messages: s.messages.map((m) =>
          m.id === msgId ? { ...m, expanded: !m.expanded } : m
        ),
      }))
    );
  }, []);

  const patchSession = useCallback(
    (sid: string, fn: (s: Session) => Session) => {
      setSessions((prev) => prev.map((s) => (s.id === sid ? fn(s) : s)));
    },
    []
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!currentSessionId || !content.trim() || isSending) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsSending(true);

      // User message
      const userMsg: Message = {
        id: generateId(),
        type: "message",
        role: "user",
        content,
        timestamp: Date.now(),
      };

      patchSession(currentSessionId, (s) => ({
        ...s,
        name: s.messages.length <= 1 ? content.slice(0, 40) : s.name,
        messages: [...s.messages, userMsg],
      }));

      // Build task cards immediately for UX
      const taskMsgs = makeTasksMessage(content);
      const initialTasks = taskMsgs[0].tasks ?? [];

      patchSession(currentSessionId, (s) => ({
        ...s,
        messages: [...s.messages, userMsg, ...taskMsgs],
      }));

      // Progress messages
      await new Promise((r) => setTimeout(r, 600));
      const progressMsgs = makeProgressMessages(initialTasks);
      patchSession(currentSessionId, (s) => ({
        ...s,
        messages: [...s.messages, ...progressMsgs],
      }));

      // Streaming AI response
      const streamId = generateId();
      const streamMsg: Message = {
        id: streamId,
        type: "message",
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        streaming: true,
      };

      patchSession(currentSessionId, (s) => ({
        ...s,
        messages: [...s.messages, streamMsg],
      }));

      try {
        const agent = CONFIG.AGENTS.find((a) => a.id === selectedAgent);
        const model = agent?.model ?? selectedModel;
        const session = sessions.find((s) => s.id === currentSessionId);
        const history =
          session?.messages
            .filter((m) => m.type === "message" && m.role !== undefined)
            .slice(-8)
            .map((m) => ({ role: m.role, content: m.content })) ?? [];

        const resp = await fetch(`${CONFIG.OPENROUTER_BASE_URL}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://vibracode.app",
            "X-Title": "Vibra Code",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: CONFIG.SYSTEM_PROMPT },
              ...history,
              { role: "user", content },
            ],
            stream: true,
            max_tokens: 2000,
          }),
          signal: controller.signal,
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        const reader = resp.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content ?? "";
              if (delta) {
                accumulated += delta;
                setSessions((prev) =>
                  prev.map((s) =>
                    s.id === currentSessionId
                      ? {
                          ...s,
                          messages: s.messages.map((m) =>
                            m.id === streamId
                              ? { ...m, content: accumulated }
                              : m
                          ),
                        }
                      : s
                  )
                );
              }
            } catch {}
          }
        }

        // Mark streaming complete
        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === streamId ? { ...m, streaming: false } : m
                  ),
                }
              : s
          )
        );
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === streamId
                      ? {
                          ...m,
                          content:
                            "⚠️ Connection error. Check your internet and try again.",
                          streaming: false,
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
    [currentSessionId, selectedAgent, selectedModel, sessions, isSending, patchSession]
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
        clearHistory,
        deleteSession,
        toggleExpanded,
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
