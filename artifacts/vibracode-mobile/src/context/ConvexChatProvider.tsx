/**
 * ConvexChatProvider – real-time Convex-backed chat context.
 * Drop-in replacement for the AsyncStorage ChatProvider.
 * Streaming messages stay in local state until complete, then persist to Convex.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AgentType, CONFIG, E2B_AGENT_MAP } from "../config";
import { useSettings } from "./SettingsContext";
import {
  ChatContext,
  ChatContextValue,
  generateId,
  Message,
  MessageType,
  Session,
  TaskItem,
} from "./ChatContext";

const DEVICE_ID_KEY = "vibracode_device_id";

const WELCOME_MSG =
  "ما الذي تريد بناءه اليوم؟ صف تطبيقك وسأقوم ببنائه لك.\n\nيمكنك أيضاً تغيير نموذج AI باستخدام زر ✦ أدناه، أو إرسال صورة لوصف التطبيق.";

function makeDeviceId(): string {
  return "user_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

async function getOrCreateDeviceId(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (stored) return stored;
    const fresh = makeDeviceId();
    await AsyncStorage.setItem(DEVICE_ID_KEY, fresh);
    return fresh;
  } catch {
    return makeDeviceId();
  }
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

type ChatMsg =
  | { role: string; content: string }
  | { role: string; content: ContentPart[] };

// ── Backend proxy (preferred — avoids browser CORS/CSP issues) ───────────────
async function callBackendChatStream(
  backendUrl: string,
  model: string,
  fallbackModel: string,
  messages: ChatMsg[],
  apiKey: string,
  signal: AbortSignal,
  onChunk: (text: string) => void
): Promise<void> {
  const resp = await fetch(`${backendUrl}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, fallback: fallbackModel, messages, openrouterKey: apiKey }),
    signal,
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    let msg = `Error ${resp.status}`;
    try { msg = JSON.parse(errText)?.error ?? msg; } catch {}
    throw new Error(msg);
  }

  const reader = resp.body?.getReader();
  if (!reader) throw new Error("No response stream");
  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "chunk";

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
        if (currentEvent === "done") return;
        if (currentEvent === "error") {
          try { throw new Error(JSON.parse(raw).content ?? raw); } catch (e: any) { throw e; }
        }
        try {
          const parsed = JSON.parse(raw);
          const delta = parsed.content ?? parsed.choices?.[0]?.delta?.content ?? "";
          if (delta) onChunk(delta);
        } catch {}
        currentEvent = "chunk";
      }
    }
  }
}

// ── Direct OpenRouter call (fallback when no backend URL) ────────────────────
async function callOpenRouter(
  model: string,
  messages: ChatMsg[],
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
    body: JSON.stringify({ model, messages, stream: true, max_tokens: 4096, temperature: 0.7 }),
    signal,
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    let msg = `Error ${resp.status}`;
    try { msg = JSON.parse(errText)?.error?.message ?? msg; } catch {}
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
        const delta = JSON.parse(data).choices?.[0]?.delta?.content ?? "";
        if (delta) onChunk(delta);
      } catch {}
    }
  }
}

async function callWithFallback(
  primary: string,
  fallback: string,
  messages: ChatMsg[],
  apiKey: string,
  signal: AbortSignal,
  onChunk: (t: string) => void,
  backendUrl?: string
) {
  // Use backend proxy when available (avoids browser CORS/CSP restrictions)
  if (backendUrl) {
    try {
      await callBackendChatStream(backendUrl, primary, fallback, messages, apiKey, signal, onChunk);
      return;
    } catch (err: any) {
      if (err?.name === "AbortError") throw err;
      // Fall through to direct call
    }
  }
  // Direct OpenRouter call (fallback)
  try {
    await callOpenRouter(primary, messages, apiKey, signal, onChunk);
  } catch (err: any) {
    if (err?.name === "AbortError") throw err;
    if (fallback && fallback !== primary) {
      onChunk("\n\n*[تم التبديل إلى النموذج الاحتياطي]*\n\n");
      await callOpenRouter(fallback, messages, apiKey, signal, onChunk);
    } else throw err;
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
  const resp = await fetch(`${backendUrl}/e2b/stream`, {
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
        currentEvent = "message";
      }
    }
  }
}

function convexSessionToLocal(s: any): Session {
  return {
    id: s._id as string,
    name: s.name,
    messages: [],
    previewUrl: s.previewUrl,
    createdAt: s.createdAt,
  };
}

function convexMsgToLocal(m: any): Message {
  return {
    id: m._id as string,
    type: (m.type ?? "message") as MessageType,
    role: m.role,
    content: m.content,
    timestamp: m.createdAt,
    streaming: m.streaming,
    agentId: m.agentId as AgentType | undefined,
    hasImage: m.hasImage,
  };
}

export function ConvexChatProvider({ children }: { children: React.ReactNode }) {
  const { getEffectiveOpenrouterKey } = useSettings();

  const [userId, setUserId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentType>(CONFIG.DEFAULT_AGENT);
  const [selectedModel, setSelectedModel] = useState(CONFIG.DEFAULT_MODEL);
  const [isSending, setIsSending] = useState(false);
  const [activeSkills, setActiveSkills] = useState<string[]>([]);
  const [streamingMsg, setStreamingMsg] = useState<Message | null>(null);
  const [extraMsgs, setExtraMsgs] = useState<Message[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const createSessionMut = useMutation(api.sessions.create);
  const removeSessionMut = useMutation(api.sessions.remove);
  const sendMsgMut = useMutation(api.messages.send);
  const clearSessionMut = useMutation(api.messages.clearSession);
  const setStatusMut = useMutation(api.sessions.setStatus);

  useEffect(() => {
    getOrCreateDeviceId().then(setUserId).catch(() => setUserId(makeDeviceId()));
  }, []);

  const convexSessions = useQuery(
    api.sessions.listByUser,
    userId ? { userId } : "skip"
  ) as any[] | undefined;

  const convexMessages = useQuery(
    api.messages.list,
    currentSessionId ? ({ sessionId: currentSessionId } as any) : "skip"
  ) as any[] | undefined;

  const sessions: Session[] = (convexSessions ?? []).map(convexSessionToLocal);

  const baseMessages: Message[] = (convexMessages ?? []).map(convexMsgToLocal);

  const messagesWithStream: Message[] = streamingMsg
    ? [...baseMessages, ...extraMsgs, streamingMsg]
    : [...baseMessages, ...extraMsgs];

  const currentSession: Session | null = currentSessionId
    ? sessions.find((s) => s.id === currentSessionId) ?? null
    : null;

  const sessionsWithMessages: Session[] = sessions.map((s) =>
    s.id === currentSessionId ? { ...s, messages: messagesWithStream } : s
  );

  useEffect(() => {
    if (!convexSessions || !userId) return;
    if (convexSessions.length === 0) {
      createSessionMut({
        userId,
        agent: selectedAgent,
        model: selectedModel,
        name: "مشروع جديد",
      })
        .then((id: any) => {
          setCurrentSessionId(id as string);
          return sendMsgMut({
            sessionId: id as any,
            role: "assistant",
            type: "message",
            content: WELCOME_MSG,
          });
        })
        .catch(() => {});
    } else if (!currentSessionId) {
      setCurrentSessionId(convexSessions[0]._id);
    }
  }, [convexSessions, userId, currentSessionId]); // eslint-disable-line

  useEffect(() => {
    if (!streamingMsg) setExtraMsgs([]);
  }, [streamingMsg]);

  const addActiveSkill = useCallback((skillPrompt: string, skillTitle: string) => {
    const entry = `### ${skillTitle}\n${skillPrompt}`;
    setActiveSkills((prev) =>
      prev.some((s) => s.startsWith(`### ${skillTitle}`)) ? prev : [...prev, entry]
    );
  }, []);

  const removeActiveSkill = useCallback((skillTitle: string) => {
    setActiveSkills((prev) => prev.filter((s) => !s.startsWith(`### ${skillTitle}`)));
  }, []);

  const createSession = useCallback(
    (name?: string) => {
      if (!userId) return generateId();
      const sessionName = name ?? "مشروع جديد";
      const tempId = generateId();
      createSessionMut({
        userId,
        agent: selectedAgent,
        model: selectedModel,
        name: sessionName,
      }).then((id: any) => {
        setCurrentSessionId(id as string);
      }).catch(() => {});
      return tempId;
    },
    [userId, selectedAgent, selectedModel, createSessionMut]
  );

  const selectSession = useCallback((id: string) => {
    setStreamingMsg(null);
    setExtraMsgs([]);
    setCurrentSessionId(id);
  }, []);

  const clearHistory = useCallback(async () => {
    if (!currentSessionId) return;
    try {
      await clearSessionMut({ sessionId: currentSessionId as any });
    } catch {}
    setStreamingMsg(null);
    setExtraMsgs([]);
  }, [currentSessionId, clearSessionMut]);

  const deleteSession = useCallback(
    async (id: string) => {
      try {
        await removeSessionMut({ sessionId: id as any });
      } catch {}
      if (currentSessionId === id) {
        const remaining = (convexSessions ?? []).filter((s: any) => s._id !== id);
        setCurrentSessionId(remaining[0]?._id ?? null);
      }
    },
    [currentSessionId, convexSessions, removeSessionMut]
  );

  const toggleExpanded = useCallback((_msgId: string) => {
    // Convex messages don't support expanded toggle without a mutation
    // For now, toggle is a no-op on Convex messages
  }, []);

  const cancelMessage = useCallback(() => {
    abortRef.current?.abort();
    setIsSending(false);
    setStreamingMsg((m) => m ? { ...m, streaming: false } : null);
  }, []);

  const _doSend = useCallback(
    async (
      userContent: string,
      chatMessages: ChatMsg[],
      sid: string,
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

        const streamPlaceholder: Message = {
          id: generateId(),
          type: "message",
          role: "assistant",
          content: "",
          timestamp: Date.now(),
          streaming: true,
          agentId: selectedAgent,
        };
        setStreamingMsg(streamPlaceholder);

        const addExtra = (type: MessageType, msgContent: string) => {
          const m: Message = {
            id: generateId(),
            type,
            role: "assistant",
            content: msgContent,
            timestamp: Date.now(),
          };
          setExtraMsgs((prev) => [...prev, m]);
          sendMsgMut({
            sessionId: sid as any,
            role: "assistant",
            type,
            content: msgContent,
          }).catch(() => {});
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
              setStreamingMsg((m) => m ? { ...m, content: accumulated } : null);
            } else if (evType === "read" || evType === "read_file") {
              addExtra("read", evContent);
            } else if (evType === "edit" || evType === "edit_file") {
              addExtra("edit", evContent);
            } else if (evType === "bash") {
              addExtra("bash", evContent);
            } else if (evType === "status") {
              setStreamingMsg((m) => m && !accumulated ? { ...m, content: `⚙ ${evContent}` } : m);
            } else if (evType === "tasks" || evType === "tasks_card") {
              try {
                const taskData = JSON.parse(evContent);
                const taskItems: TaskItem[] = Array.isArray(taskData)
                  ? taskData.map((t: any) => ({
                      text: t.content ?? t.task ?? String(t),
                      status: "done" as const,
                    }))
                  : [];
                addExtra("tasks", JSON.stringify(taskItems));
              } catch {}
            } else if (evType === "preview") {
              addExtra("message", `🔗 Preview: ${evContent}`);
            } else if (evType === "error") {
              accumulated = `⚠️ ${evContent}`;
              setStreamingMsg((m) => m ? { ...m, content: accumulated } : null);
            }
          }
        );

        const finalContent = accumulated || streamPlaceholder.content;
        setStreamingMsg(null);
        if (finalContent) {
          sendMsgMut({
            sessionId: sid as any,
            role: "assistant",
            type: "message",
            content: finalContent,
            agentId: selectedAgent,
          }).catch(() => {});
        }
      } else {
        const model = hasImage ? VISION_MODELS[0] : (agent?.model ?? selectedModel);
        const fallback = hasImage ? VISION_MODELS[1] : (agent?.fallback ?? selectedModel);
        let accumulated = "";

        const streamPlaceholder: Message = {
          id: generateId(),
          type: "message",
          role: "assistant",
          content: "",
          timestamp: Date.now(),
          streaming: true,
          agentId: selectedAgent,
        };
        setStreamingMsg(streamPlaceholder);

        await callWithFallback(
          model,
          fallback,
          chatMessages,
          getEffectiveOpenrouterKey(),
          controller.signal,
          (chunk) => {
            accumulated += chunk;
            setStreamingMsg((m) => m ? { ...m, content: accumulated } : null);
          },
          backendUrl || undefined
        );

        setStreamingMsg(null);
        if (accumulated) {
          sendMsgMut({
            sessionId: sid as any,
            role: "assistant",
            type: "message",
            content: accumulated,
            agentId: selectedAgent,
          }).catch(() => {});
        }
      }
    },
    [selectedAgent, selectedModel, activeSkills, getEffectiveOpenrouterKey, sendMsgMut]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!currentSessionId || !content.trim() || isSending) return;

      let sid = currentSessionId;

      if (!sid && userId) {
        sid = (await createSessionMut({
          userId,
          agent: selectedAgent,
          model: selectedModel,
          name: content.slice(0, 40),
        })) as unknown as string;
        setCurrentSessionId(sid);
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsSending(true);

      try {
        await sendMsgMut({
          sessionId: sid as any,
          role: "user",
          type: "message",
          content,
        });

        const agentObj = CONFIG.AGENTS.find((a) => a.id === selectedAgent);
        const skillsText = (activeSkills ?? []).join("\n\n");
        const systemContent = skillsText
          ? `${agentObj?.systemPrompt ?? CONFIG.SYSTEM_PROMPT}\n\n## Active Skills & Rules\n${skillsText}`
          : (agentObj?.systemPrompt ?? CONFIG.SYSTEM_PROMPT);

        const history = (convexMessages ?? [])
          .filter((m: any) => m.type === "message" && m.content?.trim())
          .slice(-20)
          .map((m: any) => ({ role: m.role, content: m.content }));

        const chatMessages: ChatMsg[] = [
          { role: "system", content: systemContent },
          ...history,
          { role: "user", content },
        ];

        await _doSend(content, chatMessages, sid, controller);

        await setStatusMut({ sessionId: sid as any, status: "idle" });
      } catch (err: any) {
        if (err?.name === "AbortError") {
          setStreamingMsg((m) => m ? { ...m, content: m.content || "⏹ تم الإلغاء.", streaming: false } : null);
          setTimeout(() => setStreamingMsg(null), 100);
          return;
        }
        const errMsg = err?.message ?? "Connection error";
        const isQuota = errMsg.includes("429") || errMsg.toLowerCase().includes("rate limit");
        const isModelUnavail = errMsg.includes("404") || errMsg.toLowerCase().includes("model");
        let userErrMsg = `⚠️ ${errMsg}`;
        if (isQuota) userErrMsg = "⚠️ تم تجاوز حد الطلبات. جرب مرة أخرى بعد قليل.";
        else if (isModelUnavail) userErrMsg = "⚠️ هذا النموذج غير متاح. اختر نموذجاً آخر.";
        setStreamingMsg(null);
        sendMsgMut({
          sessionId: sid as any,
          role: "assistant",
          type: "error" as any,
          content: userErrMsg,
        }).catch(() => {});
      } finally {
        setIsSending(false);
      }
    },
    [currentSessionId, userId, selectedAgent, selectedModel, isSending, activeSkills,
      _doSend, sendMsgMut, createSessionMut, convexMessages, setStatusMut]
  );

  const sendVisionMessage = useCallback(
    async (text: string, imageBase64: string, imageMimeType: string) => {
      if (!currentSessionId || isSending) return;

      const sid = currentSessionId;
      const displayText = text || "ما الذي يمكن بناؤه استناداً لهذه الصورة؟";

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsSending(true);

      try {
        await sendMsgMut({
          sessionId: sid as any,
          role: "user",
          type: "message",
          content: `🖼 ${displayText}`,
          hasImage: true,
        });

        const dataUrl = `data:${imageMimeType};base64,${imageBase64}`;
        const chatMessages: ChatMsg[] = [
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

        await _doSend(displayText, chatMessages, sid, controller, true);
      } catch (err: any) {
        if (err?.name === "AbortError") {
          setStreamingMsg((m) => m ? { ...m, content: m.content || "⏹ تم الإلغاء.", streaming: false } : null);
          setTimeout(() => setStreamingMsg(null), 100);
          return;
        }
        setStreamingMsg(null);
      } finally {
        setIsSending(false);
      }
    },
    [currentSessionId, isSending, _doSend, sendMsgMut]
  );

  const value: ChatContextValue = {
    sessions: sessionsWithMessages,
    currentSessionId,
    currentSession: currentSession
      ? { ...currentSession, messages: messagesWithStream }
      : null,
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
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
