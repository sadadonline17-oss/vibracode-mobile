import { Router, Request, Response } from "express";

const router = Router();

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

const SERVER_OPENROUTER_KEY =
  process.env.OPENROUTER_API_KEY ??
  "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";

// ── POST /api/chat/stream — OpenRouter SSE proxy ──────────────────────────
router.post("/stream", async (req: Request, res: Response) => {
  const {
    model,
    fallback,
    messages,
    openrouterKey,
    systemPrompt,
  } = req.body as {
    model: string;
    fallback?: string;
    messages: { role: string; content: string }[];
    openrouterKey?: string;
    systemPrompt?: string;
  };

  if (!model || !messages?.length) {
    res.status(400).json({ error: "model and messages required" });
    return;
  }

  const apiKey =
    openrouterKey?.trim() && openrouterKey.startsWith("sk-")
      ? openrouterKey.trim()
      : SERVER_OPENROUTER_KEY;

  const chatMessages = systemPrompt
    ? [{ role: "system", content: systemPrompt }, ...messages]
    : messages;

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const tryModel = async (targetModel: string): Promise<boolean> => {
    try {
      const upstream = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://vibracode.app",
          "X-Title": "Vibra Code",
        },
        body: JSON.stringify({
          model: targetModel,
          messages: chatMessages,
          stream: true,
          max_tokens: 4096,
          temperature: 0.7,
        }),
      });

      if (!upstream.ok) {
        const errText = await upstream.text().catch(() => "");
        let msg = `Error ${upstream.status}`;
        try {
          const e = JSON.parse(errText);
          msg = e?.error?.message ?? msg;
        } catch {}
        send("error", { content: msg });
        return false;
      }

      const reader = upstream.body?.getReader();
      if (!reader) {
        send("error", { content: "No response stream from OpenRouter" });
        return false;
      }

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
          if (data === "[DONE]") {
            send("done", { content: "completed" });
            return true;
          }
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content ?? "";
            if (delta) send("chunk", { content: delta });
          } catch {}
        }
      }

      send("done", { content: "completed" });
      return true;
    } catch (err: any) {
      send("error", { content: err.message ?? "Network error" });
      return false;
    }
  };

  const ok = await tryModel(model);
  if (!ok && fallback && fallback !== model) {
    send("chunk", { content: "\n\n*[Switched to fallback model]*\n\n" });
    await tryModel(fallback);
  }

  res.end();
});

// ── POST /api/chat/models — list available free models ────────────────────
router.get("/models", async (_req: Request, res: Response) => {
  res.json({
    models: [
      { id: "google/gemini-2.0-flash-exp:free", label: "Gemini 2.0 Flash", badge: "Google" },
      { id: "google/gemini-flash-1.5:free", label: "Gemini Flash 1.5", badge: "Google" },
      { id: "anthropic/claude-3.5-sonnet:free", label: "Claude 3.5 Sonnet", badge: "Anthropic" },
      { id: "anthropic/claude-3-haiku:free", label: "Claude 3 Haiku", badge: "Anthropic" },
      { id: "qwen/qwen-2.5-coder-32b:free", label: "Qwen 2.5 Coder 32B", badge: "Alibaba" },
      { id: "qwen/qwen-2.5-72b-instruct:free", label: "Qwen 2.5 72B", badge: "Alibaba" },
      { id: "deepseek/deepseek-coder:free", label: "DeepSeek Coder", badge: "DeepSeek" },
      { id: "deepseek/deepseek-r1:free", label: "DeepSeek R1", badge: "DeepSeek" },
      { id: "deepseek/deepseek-r1-distill-qwen-32b:free", label: "DeepSeek R1 Distill 32B", badge: "DeepSeek" },
      { id: "meta-llama/llama-3.1-70b-instruct:free", label: "Llama 3.1 70B", badge: "Meta" },
      { id: "meta-llama/llama-3.1-8b-instruct:free", label: "Llama 3.1 8B", badge: "Meta" },
      { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B", badge: "Meta" },
      { id: "moonshotai/kimi-k2:free", label: "Kimi K2", badge: "Moonshot" },
      { id: "nousresearch/hermes-3-llama-3.1-70b:free", label: "Hermes 3 70B", badge: "NousResearch" },
      { id: "mistralai/mistral-7b-instruct:free", label: "Mistral 7B", badge: "Mistral" },
      { id: "mistralai/mistral-nemo:free", label: "Mistral Nemo", badge: "Mistral" },
      { id: "microsoft/phi-3-mini-128k-instruct:free", label: "Phi-3 Mini", badge: "Microsoft" },
      { id: "microsoft/phi-3-medium-128k-instruct:free", label: "Phi-3 Medium", badge: "Microsoft" },
      { id: "openai/gpt-4o-mini:free", label: "GPT-4o Mini", badge: "OpenAI" },
      { id: "x-ai/grok-3-mini-beta:free", label: "Grok 3 Mini", badge: "xAI" },
      { id: "thudm/glm-4-9b:free", label: "GLM-4 9B", badge: "THUDM" },
      { id: "nvidia/llama-3.1-nemotron-70b-instruct:free", label: "Nemotron 70B", badge: "NVIDIA" },
    ],
  });
});

export default router;
