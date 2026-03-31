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
import { useSettings } from "./SettingsContext";

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
  agentId?: AgentType;
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
  cancelMessage: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);
const STORAGE_KEY = "vibracode_v4";

export function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function createWelcomeMessage(): Message {
  return {
    id: generateId(),
    type: "message",
    role: "assistant",
    content:
      "What do you want to build today? Describe your app and I'll build it for you.\n\nYou can also switch AI provider using the ✦ button below.",
    timestamp: Date.now(),
  };
}

function inferTasksFromPrompt(content: string): TaskItem[] {
  const lc = content.toLowerCase();

  if (lc.includes("airbnb") || lc.includes("booking") || lc.includes("rental")) {
    return [
      { text: "Build home screen with search and map listings", status: "active" },
      { text: "Create listing detail with photos and booking", status: "pending" },
      { text: "Add user profile and saved listings", status: "pending" },
      { text: "Implement tab navigation and routing", status: "pending" },
    ];
  }
  if (lc.includes("chat") || lc.includes("message") || lc.includes("whatsapp")) {
    return [
      { text: "Design chat bubble UI components", status: "active" },
      { text: "Add contacts/conversations list screen", status: "pending" },
      { text: "Implement real-time message state", status: "pending" },
    ];
  }
  if (lc.includes("todo") || lc.includes("task") || lc.includes("checklist")) {
    return [
      { text: "Create task list with CRUD operations", status: "active" },
      { text: "Add swipe-to-delete and complete gestures", status: "pending" },
      { text: "Implement local persistence with AsyncStorage", status: "pending" },
    ];
  }
  if (lc.includes("ecommerc") || lc.includes("shop") || lc.includes("store")) {
    return [
      { text: "Build product grid with search and filter", status: "active" },
      { text: "Create product detail and cart screens", status: "pending" },
      { text: "Add checkout and order confirmation flow", status: "pending" },
    ];
  }
  if (lc.includes("social") || lc.includes("instagram") || lc.includes("feed")) {
    return [
      { text: "Build scrollable image feed screen", status: "active" },
      { text: "Create post detail with likes and comments", status: "pending" },
      { text: "Add user profile and follow system", status: "pending" },
    ];
  }
  if (lc.includes("weather") || lc.includes("forecast")) {
    return [
      { text: "Build weather dashboard with current conditions", status: "active" },
      { text: "Add 7-day forecast and hourly chart", status: "pending" },
      { text: "Implement location detection and search", status: "pending" },
    ];
  }
  if (lc.includes("music") || lc.includes("player") || lc.includes("spotify")) {
    return [
      { text: "Create music player UI with controls", status: "active" },
      { text: "Build song list and playlist screens", status: "pending" },
      { text: "Add progress bar and album art display", status: "pending" },
    ];
  }

  const name = content.slice(0, 30).trim();
  return [
    { text: `Analyze requirements for ${name}`, status: "active" },
    { text: "Design UI layout and navigation structure", status: "pending" },
    { text: "Implement core functionality and logic", status: "pending" },
    { text: "Add styling and responsive design", status: "pending" },
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
    fileCount: Math.floor(Math.random() * 3) + 2,
  });

  msgs.push({
    id: generateId(),
    type: "edit",
    role: "assistant",
    content: "",
    timestamp: Date.now() + 200,
    fileCount: Math.floor(Math.random() * 4) + 3,
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
    fileCount: Math.floor(Math.random() * 3) + 4,
  });

  msgs.push({
    id: generateId(),
    type: "bash",
    role: "assistant",
    content: "",
    timestamp: Date.now() + 500,
    fileCount: 1,
  });

  msgs.push({
    id: generateId(),
    type: "tasks",
    role: "assistant",
    content: "",
    timestamp: Date.now() + 600,
    tasks: tasks.map((t) => ({ ...t, status: "done" as const })),
  });

  return msgs;
}

async function callOpenRouter(
  model: string,
  messages: { role: string; content: string }[],
  apiKey: string,
  signal: AbortSignal,
  onChunk: (text: string) => void
): Promise<void> {
  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://vibracode.app",
      "X-Title": "Vibra Code",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      max_tokens: 4096,
      temperature: 0.7,
    }),
    signal,
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    let msg = `Error ${resp.status}`;
    try {
      const e = JSON.parse(errText);
      msg = e?.error?.message ?? msg;
    } catch {}
    throw new Error(msg);
  }

  const reader = resp.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const data = trimmed.slice(6);
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content ?? "";
        if (delta) onChunk(delta);
      } catch {}
    }
  }
}

async function callWithFallback(
  primaryModel: string,
  fallbackModel: string,
  messages: { role: string; content: string }[],
  apiKey: string,
  signal: AbortSignal,
  onChunk: (text: string) => void
): Promise<void> {
  try {
    await callOpenRouter(primaryModel, messages, apiKey, signal, onChunk);
  } catch (err: any) {
    if (err?.name === "AbortError") throw err;
    if (fallbackModel && fallbackModel !== primaryModel) {
      onChunk("\n\n*[Switched to fallback model]*\n\n");
      await callOpenRouter(fallbackModel, messages, apiKey, signal, onChunk);
    } else {
      throw err;
    }
  }
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { getEffectiveOpenrouterKey } = useSettings();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentType>(CONFIG.DEFAULT_AGENT);
  const [selectedModel, setSelectedModel] = useState(CONFIG.DEFAULT_MODEL);
  const [isSending, setIsSending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const stored: Session[] = JSON.parse(raw);
            if (stored.length > 0) {
              setSessions(stored);
              setCurrentSessionId(stored[0].id);
              return;
            }
          } catch {}
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
    if (sessions.length > 0) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)).catch(() => {});
    }
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

  const cancelMessage = useCallback(() => {
    abortRef.current?.abort();
    setIsSending(false);
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

      const userMsg: Message = {
        id: generateId(),
        type: "message",
        role: "user",
        content,
        timestamp: Date.now(),
      };

      const sid = currentSessionId;

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sid) return s;
          return {
            ...s,
            name: s.messages.filter((m) => m.type === "message" && m.role === "user").length === 0
              ? content.slice(0, 40)
              : s.name,
            messages: [...s.messages, userMsg],
          };
        })
      );

      // Infer tasks for visual UX
      const tasks = inferTasksFromPrompt(content);

      const taskMsg: Message = {
        id: generateId(),
        type: "tasks",
        role: "assistant",
        content: "",
        timestamp: Date.now() + 50,
        tasks: tasks.map((t) => ({ ...t })),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sid ? { ...s, messages: [...s.messages, taskMsg] } : s
        )
      );

      await new Promise((r) => setTimeout(r, 500));

      const progressMsgs = makeProgressMessages(tasks);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sid ? { ...s, messages: [...s.messages, ...progressMsgs] } : s
        )
      );

      await new Promise((r) => setTimeout(r, 300));

      const streamId = generateId();
      const agent = CONFIG.AGENTS.find((a) => a.id === selectedAgent);
      const streamMsg: Message = {
        id: streamId,
        type: "message",
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        streaming: true,
        agentId: selectedAgent,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sid ? { ...s, messages: [...s.messages, streamMsg] } : s
        )
      );

      try {
        const model = agent?.model ?? selectedModel;
        const fallback = agent?.fallback ?? selectedModel;

        const session = sessions.find((s) => s.id === sid);
        const history =
          session?.messages
            .filter((m) => m.type === "message" && m.role !== undefined && m.content.trim())
            .slice(-20)
            .map((m) => ({ role: m.role as string, content: m.content })) ?? [];

        const chatMessages = [
          { role: "system", content: CONFIG.SYSTEM_PROMPT },
          ...history,
          { role: "user", content },
        ];

        let accumulated = "";

        await callWithFallback(
          model,
          fallback,
          chatMessages,
          getEffectiveOpenrouterKey(),
          controller.signal,
          (chunk) => {
            accumulated += chunk;
            setSessions((prev) =>
              prev.map((s) =>
                s.id === sid
                  ? {
                      ...s,
                      messages: s.messages.map((m) =>
                        m.id === streamId ? { ...m, content: accumulated } : m
                      ),
                    }
                  : s
              )
            );
          }
        );

        setSessions((prev) =>
          prev.map((s) =>
            s.id === sid
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
        if (err?.name === "AbortError") {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === sid
                ? {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === streamId
                        ? { ...m, content: m.content || "⏹ Message cancelled.", streaming: false }
                        : m
                    ),
                  }
                : s
            )
          );
          return;
        }

        const errMsg = err?.message ?? "Connection error";
        const isQuota = errMsg.includes("429") || errMsg.toLowerCase().includes("rate limit");
        const isModelUnavail = errMsg.includes("404") || errMsg.toLowerCase().includes("model");

        let userErrMsg = `⚠️ ${errMsg}`;
        if (isQuota) {
          userErrMsg = "⚠️ Rate limit reached. Switching to another model — please try again.";
        } else if (isModelUnavail) {
          userErrMsg = "⚠️ This model isn't available. Try selecting a different AI provider.";
        }

        setSessions((prev) =>
          prev.map((s) =>
            s.id === sid
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === streamId
                      ? { ...m, content: userErrMsg, streaming: false }
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
        cancelMessage,
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
