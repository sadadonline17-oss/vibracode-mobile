import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchEventSource } from "react-native-fetch-event-source";
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
  | "tasks_card"
  | "read_file"
  | "edit_file"
  | "status"
  | "preview"
  | "error";

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
  hasImage?: boolean;
}

export interface Session {
  id: string;
  name: string;
  messages: Message[];
  previewUrl?: string;
  createdAt: number;
}

export interface ChatContextValue {
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
  sendVisionMessage: (text: string, imageBase64: string, imageMimeType: string) => Promise<void>;
  clearHistory: () => void;
  deleteSession: (id: string) => void;
  toggleExpanded: (msgId: string) => void;
  cancelMessage: () => void;
  addActiveSkill: (skillPrompt: string, skillTitle: string) => void;
  removeActiveSkill: (skillTitle: string) => void;
}

export const ChatContext = createContext<ChatContextValue | null>(null);
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
      "ما الذي تريد بناءه اليوم؟ صف تطبيقك وسأقوم ببنائه لك.\n\nيمكنك أيضاً تغيير نموذج AI باستخدام زر ✦ أدناه، أو إرسال صورة لوصف التطبيق.",
    timestamp: Date.now(),
  };
}

const VISION_MODELS = [
  "google/gemini-2.0-flash-exp:free",
  "anthropic/claude-3.5-sonnet",
  "openai/gpt-4o",
  "qwen/qwen2-vl-7b-instruct:free",
];

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

type ChatMessage =
  | { role: string; content: string }
  | { role: string; content: ContentPart[] };

// ── Call via backend proxy (preferred — avoids browser CORS/CSP issues) ──────
async function callBackendChatStream(
  backendUrl: string,
  model: string,
  fallbackModel: string,
  messages: ChatMessage[],
  apiKey: string,
  signal: AbortSignal,
  onChunk: (text: string) => void
): Promise<void> {
  await fetchEventSource(`${backendUrl}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      fallback: fallbackModel,
      messages,
      openrouterKey: apiKey,
    }),
    signal,
    async onopen(response) {
      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        let msg = `Error ${response.status}`;
        try { msg = JSON.parse(errText)?.error ?? msg; } catch {}
        throw new Error(msg);
      }
    },
    onmessage(ev) {
      const eventType = ev.event || "chunk";
      const raw = ev.data;
      if (eventType === "done") return;
      if (eventType === "error") {
        try { throw new Error(JSON.parse(raw).content ?? raw); } catch (e: any) { throw e; }
      }
      try {
        const parsed = JSON.parse(raw);
        const delta = parsed.content ?? parsed.choices?.[0]?.delta?.content ?? "";
        if (delta) onChunk(delta);
      } catch {}
    },
    onerror(err) {
      throw err;
    },
  });
}

// ── Direct OpenRouter call (fallback when no backend URL) ────────────────────
async function callOpenRouter(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
  signal: AbortSignal,
  onChunk: (text: string) => void
): Promise<void> {
  await fetchEventSource("https://openrouter.ai/api/v1/chat/completions", {
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
    async onopen(response) {
      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        let msg = `Error ${response.status}`;
        try {
          const e = JSON.parse(errText);
          msg = e?.error?.message ?? msg;
        } catch {}
        throw new Error(msg);
      }
    },
    onmessage(ev) {
      if (ev.data === "[DONE]") return;
      try {
        const parsed = JSON.parse(ev.data);
        const delta = parsed.choices?.[0]?.delta?.content ?? "";
        if (delta) onChunk(delta);
      } catch {}
    },
    onerror(err) {
      throw err;
    },
  });
}

async function callWithFallback(
  primaryModel: string,
  fallbackModel: string,
  messages: ChatMessage[],
  apiKey: string,
  signal: AbortSignal,
  onChunk: (text: string) => void,
  backendUrl?: string
): Promise<void> {
  // Use backend proxy when available (avoids browser CORS/CSP restrictions)
  if (backendUrl) {
    try {
      await callBackendChatStream(backendUrl, primaryModel, fallbackModel, messages, apiKey, signal, onChunk);
      return;
    } catch (err: any) {
      if (err?.name === "AbortError") throw err;
      // Fall through to direct call
    }
  }
  // Direct OpenRouter call (fallback)
  try {
    await callOpenRouter(primaryModel, messages, apiKey, signal, onChunk);
  } catch (err: any) {
    if (err?.name === "AbortError") throw err;
    if (fallbackModel && fallbackModel !== primaryModel) {
      onChunk("\n\n*[تم التبديل إلى النموذج الاحتياطي]*\n\n");
      await callOpenRouter(fallbackModel, messages, apiKey, signal, onChunk);
    } else {
      throw err;
    }
  }
}

async function callE2BStream(
  backendUrl: string,
  prompt: string,
  e2bAgent: string,
  sessionId: string,
  openrouterKey: string,
  signal: AbortSignal,
  onEvent: (type: string, content: string) => void
): Promise<void> {
  await fetchEventSource(`${backendUrl}/e2b/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, agent: e2bAgent, sessionId, openrouterKey }),
    signal,
    async onopen(response) {
      if (!response.ok) {
        const txt = await response.text().catch(() => "");
        throw new Error(`E2B error ${response.status}: ${txt}`);
      }
    },
    onmessage(ev) {
      const eventType = ev.event || "message";
      const raw = ev.data;
      try {
        const obj = JSON.parse(raw);
        const content = obj.content ?? raw;
        onEvent(eventType, typeof content === "string" ? content : JSON.stringify(content));
      } catch {
        onEvent(eventType, raw);
      }
    },
    onerror(err) {
      throw err;
    },
  });
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
    setActiveSkills((prev) =>
      prev.some((s) => s.startsWith(`### ${skillTitle}`)) ? prev : [...prev, entry]
    );
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
          name: "مشروع جديد",
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
      name: name ?? "مشروع جديد",
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

  const _doSend = useCallback(
    async (
      userContent: string,
      chatMessages: ChatMessage[],
      sid: string,
      streamId: string,
      controller: AbortController,
      hasImage?: boolean
    ) => {
      const agent = CONFIG.AGENTS.find((a) => a.id === selectedAgent);
      const e2bAgentName = E2B_AGENT_MAP[selectedAgent];
      const backendUrl = CONFIG.BACKEND_URL;

      if (e2bAgentName && backendUrl && !hasImage) {
        let accumulated = "";

        const skillsText = (activeSkills ?? []).join("\n\n");
        const e2bPrompt = skillsText
          ? `## Active Skills & Context\n${skillsText}\n\n## Task\n${userContent}`
          : userContent;

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
              s.id === sid ? { ...s, messages: [...s.messages, newMsg] } : s
            )
          );
        };

        await callE2BStream(
          backendUrl,
          e2bPrompt,
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
                          m.id === streamId ? { ...m, content: accumulated } : m
                        ),
                      }
                    : s
                )
              );
            } else if (evType === "read" || evType === "read_file") {
              addMsg("read", evContent);
            } else if (evType === "edit" || evType === "edit_file") {
              addMsg("edit", evContent);
            } else if (evType === "bash") {
              addMsg("bash", evContent);
            } else if (evType === "status") {
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
            } else if (evType === "tasks" || evType === "tasks_card") {
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
            } else if (evType === "preview") {
              addMsg("message", `🔗 Preview: ${evContent}`);
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
        const model = hasImage
          ? VISION_MODELS[0]
          : (agent?.model ?? selectedModel);
        const fallback = hasImage
          ? VISION_MODELS[1]
          : (agent?.fallback ?? selectedModel);

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
          },
          backendUrl || undefined
        );
      }
    },
    [selectedAgent, selectedModel, activeSkills, getEffectiveOpenrouterKey]
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
            name:
              s.messages.filter((m) => m.type === "message" && m.role === "user").length === 0
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
        const agentSystemPrompt = agent?.systemPrompt ?? CONFIG.SYSTEM_PROMPT;
        const activeSkillsText = (activeSkills ?? []).join("\n\n");
        const systemContent = activeSkillsText
          ? `${agentSystemPrompt}\n\n## Active Skills & Rules\n${activeSkillsText}`
          : agentSystemPrompt;

        const session = sessions.find((s) => s.id === sid);
        const history =
          session?.messages
            .filter((m) => m.type === "message" && m.role !== undefined && m.content.trim())
            .slice(-20)
            .map((m) => ({ role: m.role as string, content: m.content })) ?? [];

        const chatMessages: ChatMessage[] = [
          { role: "system", content: systemContent },
          ...history,
          { role: "user", content },
        ];

        await _doSend(content, chatMessages, sid, streamId, controller);

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
                        ? { ...m, content: m.content || "⏹ تم الإلغاء.", streaming: false }
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
          userErrMsg = "⚠️ تم تجاوز حد الطلبات. جرب مرة أخرى بعد قليل.";
        } else if (isModelUnavail) {
          userErrMsg = "⚠️ هذا النموذج غير متاح. اختر نموذجاً آخر.";
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
    [currentSessionId, selectedAgent, selectedModel, sessions, isSending, activeSkills, _doSend]
  );

  const sendVisionMessage = useCallback(
    async (text: string, imageBase64: string, imageMimeType: string) => {
      if (!currentSessionId || isSending) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsSending(true);

      const displayText = text || "ما الذي يمكن بناؤه استناداً لهذه الصورة؟";

      const userMsg: Message = {
        id: generateId(),
        type: "message",
        role: "user",
        content: `🖼 ${displayText}`,
        timestamp: Date.now(),
        hasImage: true,
      };

      const sid = currentSessionId;

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sid) return s;
          return {
            ...s,
            name:
              s.messages.filter((m) => m.type === "message" && m.role === "user").length === 0
                ? displayText.slice(0, 40)
                : s.name,
            messages: [...s.messages, userMsg],
          };
        })
      );

      const streamId = generateId();
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
        const dataUrl = `data:${imageMimeType};base64,${imageBase64}`;

        const chatMessages: ChatMessage[] = [
          {
            role: "system",
            content:
              "You are a mobile app builder. When the user sends an image (screenshot, mockup, wireframe, or design), analyze it carefully and describe what app to build, then start building it step by step with detailed React Native / Expo code.",
          },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: dataUrl } },
              { type: "text", text: displayText },
            ],
          },
        ];

        await _doSend(displayText, chatMessages, sid, streamId, controller, true);

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
                        ? { ...m, content: m.content || "⏹ تم الإلغاء.", streaming: false }
                        : m
                    ),
                  }
                : s
            )
          );
          return;
        }

        const errMsg = err?.message ?? "Vision error";
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sid
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === streamId
                      ? { ...m, content: `⚠️ ${errMsg}`, streaming: false }
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
    [currentSessionId, selectedAgent, isSending, sessions, _doSend]
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
        sendVisionMessage,
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
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
