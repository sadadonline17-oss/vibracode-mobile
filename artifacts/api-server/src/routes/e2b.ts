import { Router, Request, Response } from "express";
import { Sandbox } from "e2b";

const router = Router();

export type AgentType =
  | "claude-code"
  | "opencode"
  | "kilocode"
  | "kilo-code"
  | "codex"
  | "amp"
  | "junie"
  | "openclaw";

// ── Agent configs with real E2B sandbox templates ───────────────────────────
const AGENT_CONFIG: Record<
  AgentType,
  {
    template: string;
    command: (prompt: string, openrouterKey: string) => string;
  }
> = {
  // ── Claude Code CLI via OpenRouter ────────────────────────────────────────
  // Uses ANTHROPIC_BASE_URL trick: claude CLI → OpenRouter API
  "claude-code": {
    template: "claude",
    command: (p) =>
      `ANTHROPIC_BASE_URL="https://openrouter.ai/api" ` +
      `claude --dangerously-skip-permissions --output-format stream-json -p "${esc(p)}"`,
  },

  // ── OpenCode (opencode.ai) ────────────────────────────────────────────────
  // Open-source terminal AI coding agent, uses OpenAI-compatible API
  opencode: {
    template: "base",
    command: (p, key) =>
      `bash -c "
        npm install -g opencode-ai 2>/dev/null || npx --yes opencode-ai@latest --version 2>/dev/null || true;
        export OPENAI_BASE_URL='https://openrouter.ai/api/v1';
        export OPENAI_API_KEY='${key}';
        export ANTHROPIC_BASE_URL='https://openrouter.ai/api';
        export ANTHROPIC_AUTH_TOKEN='${key}';
        mkdir -p /home/user/project;
        cd /home/user/project;
        if command -v opencode &>/dev/null; then
          opencode run '${esc(p)}' --model openrouter/free 2>&1;
        else
          npx opencode-ai run '${esc(p)}' --model openrouter/free 2>&1 || \\
          claude --dangerously-skip-permissions -p '${esc(p)}' 2>&1;
        fi
      "`,
  },

  // ── Kilo Code (kilocode.dev) ──────────────────────────────────────────────
  // Uses Claude CLI with Kilo Code system prompt style + OpenRouter
  kilocode: {
    template: "claude",
    command: (p, key) =>
      `ANTHROPIC_BASE_URL="https://openrouter.ai/api" ` +
      `ANTHROPIC_AUTH_TOKEN="${key}" ` +
      `claude --dangerously-skip-permissions --output-format stream-json -p ` +
      `"[Kilo Code Mode] You are an expert AI coding assistant. ` +
      `Analyze the task carefully, plan your approach, write complete production-ready code. ` +
      `Task: ${esc(p)}"`,
  },

  // ── OpenAI Codex CLI ──────────────────────────────────────────────────────
  codex: {
    template: "codex",
    command: (p, key) =>
      `OPENAI_API_KEY="${key}" ` +
      `OPENAI_BASE_URL="https://openrouter.ai/api/v1" ` +
      `codex exec --full-auto --skip-git-repo-check --json -C /home/user/project "${esc(p)}"`,
  },

  // ── Junie (JetBrains AI Agent) ────────────────────────────────────────────
  junie: {
    template: "base",
    command: (p) => `junie --headless "${esc(p)}"`,
  },

  // ── Amp (Anthropic AI agent) ──────────────────────────────────────────────
  amp: {
    template: "amp",
    command: (p, key) =>
      `ANTHROPIC_API_KEY="${key}" ` +
      `ANTHROPIC_BASE_URL="https://openrouter.ai/api" ` +
      `amp --json "${esc(p)}" 2>&1 || echo '{"type":"message","content":"Amp finished"}'`,
  },

  // ── Kilo Code (alias with dash) ───────────────────────────────────────────
  "kilo-code": {
    template: "claude",
    command: (p, key) =>
      `ANTHROPIC_BASE_URL="https://openrouter.ai/api" ` +
      `ANTHROPIC_AUTH_TOKEN="${key}" ` +
      `claude --dangerously-skip-permissions --output-format stream-json -p ` +
      `"[Kilo Code Mode] You are an expert AI coding assistant. ` +
      `Analyze the task carefully, plan your approach, write complete production-ready code. ` +
      `Task: ${esc(p)}"`,
  },

  // ── OpenClaw (multi-agent) ────────────────────────────────────────────────
  openclaw: {
    template: "base",
    command: (p) => `openclaw run "${esc(p)}"`,
  },
};

function esc(s: string) {
  return s.replace(/'/g, "'\\''").replace(/"/g, '\\"').replace(/\n/g, " ").slice(0, 2000);
}

// ── Output parsers ──────────────────────────────────────────────────────────
type ParsedEvent = { type: string; content: string } | null;

function parseClaudeCode(line: string): ParsedEvent {
  try {
    const ev = JSON.parse(line);
    if (ev.type === "assistant" && ev.message?.content) {
      for (const block of ev.message.content) {
        if (block.type === "text") return { type: "message", content: block.text };
        if (block.type === "tool_use") {
          if (block.name === "Read")
            return { type: "read", content: block.input?.file_path ?? "" };
          if (block.name === "Write" || block.name === "Edit")
            return { type: "edit", content: block.input?.file_path ?? "" };
          if (block.name === "Bash")
            return { type: "bash", content: block.input?.command ?? "" };
          if (block.name === "TodoWrite")
            return {
              type: "tasks",
              content:
                typeof block.input === "string"
                  ? block.input
                  : JSON.stringify(block.input),
            };
        }
      }
    }
    if (ev.type === "result")
      return { type: "status", content: `Done in ${ev.duration_ms ?? 0}ms` };
    if (ev.type === "system" && ev.subtype === "init")
      return { type: "status", content: "Agent started" };
    return null;
  } catch {
    return line.trim() ? { type: "bash", content: line } : null;
  }
}

function parseCodex(line: string): ParsedEvent {
  try {
    const ev = JSON.parse(line);
    if (ev.type === "message") return { type: "message", content: ev.content ?? "" };
    if (ev.type === "tool_call") {
      if (ev.name === "shell") return { type: "bash", content: ev.parameters?.command ?? "" };
      if (ev.name === "write_file" || ev.name === "apply_patch")
        return { type: "edit", content: ev.parameters?.path ?? "" };
      if (ev.name === "read_file") return { type: "read", content: ev.parameters?.path ?? "" };
    }
    if (ev.type === "done") return { type: "status", content: "Done" };
    return null;
  } catch {
    return line.trim() ? { type: "bash", content: line } : null;
  }
}

function parseDefault(line: string): ParsedEvent {
  return line.trim() ? { type: "message", content: line } : null;
}

function parseAmp(line: string): ParsedEvent {
  try {
    const ev = JSON.parse(line);
    if (ev.type === "text")    return { type: "message",   content: ev.content ?? "" };
    if (ev.type === "command") return { type: "bash",       content: ev.command ?? "" };
    if (ev.type === "file")    return { type: "edit",       content: ev.path ?? "" };
    if (ev.type === "done")    return { type: "status",     content: "Done" };
    return null;
  } catch {
    return line.trim() ? { type: "message", content: line } : null;
  }
}

function parseLine(line: string, agent: AgentType): ParsedEvent {
  if (agent === "claude-code" || agent === "kilocode" || agent === "kilo-code") return parseClaudeCode(line);
  if (agent === "codex") return parseCodex(line);
  if (agent === "amp") return parseAmp(line);
  return parseDefault(line);
}

// ── SSE helper ──────────────────────────────────────────────────────────────
function sendSSE(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// ── POST /api/e2b/stream ────────────────────────────────────────────────────
router.post("/stream", async (req: Request, res: Response) => {
  const {
    prompt,
    agent = "claude-code",
    sessionId,
    openrouterKey,
  } = req.body as {
    prompt: string;
    agent: AgentType;
    sessionId: string;
    openrouterKey?: string;
  };

  if (!prompt || !sessionId) {
    res.status(400).json({ error: "prompt and sessionId required" });
    return;
  }

  const E2B_API_KEY =
    process.env.E2B_API_KEY ?? "e2b_51e98476ce3cdfff4768678430d5527df28b169a";
  const OPENROUTER_KEY =
    openrouterKey?.trim() ||
    process.env.OPENROUTER_API_KEY ||
    "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";

  const cfg = AGENT_CONFIG[agent];
  if (!cfg) {
    res.status(400).json({ error: `Unknown agent: ${agent}` });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  sendSSE(res, "status", { content: `Starting ${agent} sandbox…` });

  let sandbox: Sandbox | null = null;

  try {
    sandbox = await Sandbox.create(cfg.template, {
      envs: {
        // Claude Code / Kilo Code: route through OpenRouter via ANTHROPIC_BASE_URL
        ANTHROPIC_BASE_URL: "https://openrouter.ai/api",
        ANTHROPIC_AUTH_TOKEN: OPENROUTER_KEY,
        ANTHROPIC_API_KEY: OPENROUTER_KEY,
        // OpenCode / Codex: route through OpenRouter via OPENAI_BASE_URL
        OPENAI_BASE_URL: "https://openrouter.ai/api/v1",
        OPENAI_API_KEY: OPENROUTER_KEY,
        // Generic OpenRouter key
        OPENROUTER_API_KEY: OPENROUTER_KEY,
        OPENROUTER_MODEL: "openrouter/free",
      },
      apiKey: E2B_API_KEY,
      timeoutMs: 10 * 60 * 1000,
    });

    sendSSE(res, "status", { content: "Sandbox ready — running agent…" });

    await sandbox.commands.run("mkdir -p /home/user/project");

    const cmd = cfg.command(prompt, OPENROUTER_KEY);

    await sandbox.commands.run(cmd, {
      cwd: "/home/user/project",
      onStdout: (data: string) => {
        for (const line of data.split("\n").filter(Boolean)) {
          const parsed = parseLine(line, agent);
          if (parsed) sendSSE(res, parsed.type, { content: parsed.content });
        }
      },
      onStderr: (data: string) => {
        if (data.trim()) sendSSE(res, "bash", { content: data.trim() });
      },
    });

    // Check for preview URL
    try {
      const tunnel = await sandbox.commands.run(
        `curl -s http://localhost:4040/api/tunnels 2>/dev/null | ` +
        `python3 -c "import sys,json; d=json.load(sys.stdin); print(d['tunnels'][0]['public_url'])" 2>/dev/null || echo ""`
      );
      if (tunnel.stdout.trim()) {
        sendSSE(res, "preview", { content: tunnel.stdout.trim() });
      }
    } catch {
      // no preview
    }

    sendSSE(res, "done", { content: "completed" });
  } catch (err: any) {
    sendSSE(res, "error", { content: err.message ?? "Unknown error" });
  } finally {
    if (sandbox) await sandbox.kill().catch(() => {});
    res.end();
  }
});

// ── POST /api/e2b/run (non-streaming) ───────────────────────────────────────
router.post("/run", async (req: Request, res: Response) => {
  const {
    prompt,
    agent = "claude-code",
    sessionId,
    openrouterKey,
  } = req.body as {
    prompt: string;
    agent: AgentType;
    sessionId: string;
    openrouterKey?: string;
  };

  if (!prompt || !sessionId) {
    res.status(400).json({ error: "prompt and sessionId required" });
    return;
  }

  const E2B_API_KEY =
    process.env.E2B_API_KEY ?? "e2b_51e98476ce3cdfff4768678430d5527df28b169a";
  const OPENROUTER_KEY =
    openrouterKey?.trim() ||
    process.env.OPENROUTER_API_KEY ||
    "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";

  const cfg = AGENT_CONFIG[agent];
  if (!cfg) {
    res.status(400).json({ error: `Unknown agent: ${agent}` });
    return;
  }

  let sandbox: Sandbox | null = null;

  try {
    sandbox = await Sandbox.create(cfg.template, {
      envs: {
        ANTHROPIC_BASE_URL: "https://openrouter.ai/api",
        ANTHROPIC_AUTH_TOKEN: OPENROUTER_KEY,
        ANTHROPIC_API_KEY: OPENROUTER_KEY,
        OPENAI_BASE_URL: "https://openrouter.ai/api/v1",
        OPENAI_API_KEY: OPENROUTER_KEY,
        OPENROUTER_API_KEY: OPENROUTER_KEY,
      },
      apiKey: E2B_API_KEY,
      timeoutMs: 10 * 60 * 1000,
    });

    const messages: Array<{ type: string; content: string }> = [];
    await sandbox.commands.run("mkdir -p /home/user/project");

    await sandbox.commands.run(cfg.command(prompt, OPENROUTER_KEY), {
      cwd: "/home/user/project",
      onStdout: (data: string) => {
        for (const line of data.split("\n").filter(Boolean)) {
          const parsed = parseLine(line, agent);
          if (parsed) messages.push(parsed);
        }
      },
      onStderr: (data: string) => {
        if (data.trim()) messages.push({ type: "bash", content: data.trim() });
      },
    });

    return res.json({ ok: true, sessionId, messages });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  } finally {
    if (sandbox) await sandbox.kill().catch(() => {});
  }
});

export default router;
