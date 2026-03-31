import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AgentType, CONFIG, E2B_AGENT_MAP } from "../config";
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
  activeSkills: string[];
  setSelectedAgent: (a: AgentType) => void;
  setSelectedModel: (m: string) => void;
  createSession: (name?: string) => string;
  selectSession: (id: string) => void;
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => void;
  deleteSession: (id: string) => void;
  toggleExpanded: (msgId: string) => void;
  cancelMessage: () => void;
  addActiveSkill: (skillPrompt: string, skillTitle: string) => void;
  removeActiveSkill: (skillTitle: string) => void;
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

// ── E2B Sandbox SSE streaming ─────────────────────────────────────────────
async function callE2BStream(
  backendUrl: string,
  prompt: string,
  e2bAgent: string,
  sessionId: string,
  openrouterKey: string,
  signal: AbortSignal,
  onEvent: (type: string, content: string) => void
): Promise<void> {
  const url = `${backendUrl}/e2b/stream`;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, agent: e2bAgent, sessionId, openrouterKey }),
    signal,
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`E2B error ${resp.status}: ${txt}`);
  }

  const reader = resp.body?.getReader();
  if (!reader) throw new Error("No stream from E2B server");

  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "message";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("event: ")) {
        currentEvent = trimmed.slice(7).trim();
      } else if (trimmed.startsWith("data: ")) {
        const raw = trimmed.slice(6);
        try {
          const obj = JSON.parse(raw);
          const content = obj.content ?? raw;
          onEvent(currentEvent, typeof content === "string" ? content : JSON.stringify(content));
        } catch {
          onEvent(currentEvent, raw);
        }
        currentEvent = "message"; // reset after consuming
      }
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
  const [activeSkills, setActiveSkills] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const addActiveSkill = useCallback((skillPrompt: string, skillTitle: string) => {
    const entry = `### ${skillTitle}\n${skillPrompt}`;
    setActiveSkills((prev) => prev.some((s) => s.startsWith(`### ${skillTitle}`)) ? prev : [...prev, entry]);
  }, []);

  const removeActiveSkill = useCallback((skillTitle: string) => {
    setActiveSkills((prev) => prev.filter((s) => !s.startsWith(`### ${skillTitle}`)));
  }, []);

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
        const e2bAgentName = E2B_AGENT_MAP[selectedAgent];
        const backendUrl = CONFIG.BACKEND_URL;

        // ── E2B path: claude-code or codex run in a real sandbox ──────────
        if (e2bAgentName && backendUrl) {
          let accumulated = "";

          const addMsg = (type: MessageType, msgContent: string) => {
            const newMsg: Message = {
              id: generateId(),
              type,
              role: "assistant",
              content: msgContent,
              timestamp: Date.now(),
            };
            setSessions((prev) =>
              prev.map((s) =>
                s.id === sid
                  ? { ...s, messages: [...s.messages, newMsg] }
                  : s
              )
            );
          };

          await callE2BStream(
            backendUrl,
            content,
            e2bAgentName,
            sid,
            getEffectiveOpenrouterKey(),
            controller.signal,
            (evType, evContent) => {
              if (evType === "message") {
                accumulated += evContent;
                setSessions((prev) =>
                  prev.map((s) =>
                    s.id === sid
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
              } else if (evType === "read") {
                addMsg("read", evContent);
              } else if (evType === "edit") {
                addMsg("edit", evContent);
              } else if (evType === "bash") {
                addMsg("bash", evContent);
              } else if (evType === "status") {
                // update streaming msg status label
                setSessions((prev) =>
                  prev.map((s) =>
                    s.id === sid
                      ? {
                          ...s,
                          messages: s.messages.map((m) =>
                            m.id === streamId && !accumulated
                              ? { ...m, content: `⚙ ${evContent}` }
                              : m
                          ),
                        }
                      : s
                  )
                );
              } else if (evType === "tasks") {
                try {
                  const taskData = JSON.parse(evContent);
                  const taskItems = Array.isArray(taskData)
                    ? taskData.map((t: any) => ({
                        text: t.content ?? t.task ?? String(t),
                        status: "done" as const,
                      }))
                    : [];
                  const tasksMsg: Message = {
                    id: generateId(),
                    type: "tasks",
                    role: "assistant",
                    content: "",
                    timestamp: Date.now(),
                    tasks: taskItems,
                  };
                  setSessions((prev) =>
                    prev.map((s) =>
                      s.id === sid
                        ? { ...s, messages: [...s.messages, tasksMsg] }
                        : s
                    )
                  );
                } catch {}
              } else if (evType === "error") {
                accumulated = `⚠️ ${evContent}`;
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
            }
          );
        } else {
        // ── OpenRouter path: all other agents ────────────────────────────
        const model = agent?.model ?? selectedModel;
        const fallback = agent?.fallback ?? selectedModel;

        const session = sessions.find((s) => s.id === sid);
        const history =
          session?.messages
            .filter((m) => m.type === "message" && m.role !== undefined && m.content.trim())
            .slice(-20)
            .map((m) => ({ role: m.role as string, content: m.content })) ?? [];

        // Use per-agent system prompt if available
        const agentSystemPrompt = agent?.systemPrompt ?? CONFIG.SYSTEM_PROMPT;

        // Inject active skills context if any
        const activeSkillsText = (activeSkills ?? []).join("\n\n");
        const systemContent = activeSkillsText
          ? `${agentSystemPrompt}\n\n## Active Skills & Rules\n${activeSkillsText}`
          : agentSystemPrompt;

        const chatMessages = [
          { role: "system", content: systemContent },
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
        } // end else OpenRouter

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
    [currentSessionId, selectedAgent, selectedModel, sessions, isSending, patchSession, activeSkills]
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
        activeSkills,
        setSelectedAgent,
        setSelectedModel,
        createSession,
        selectSession,
        sendMessage,
        clearHistory,
        deleteSession,
        toggleExpanded,
        cancelMessage,
        addActiveSkill,
        removeActiveSkill,
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
