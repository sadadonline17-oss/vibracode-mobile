import { Router, Request, Response } from "express";
import { Sandbox } from "e2b";

const router = Router();

export type AgentType = "claude-code" | "codex" | "junie" | "openclaw";

// ── Official E2B Templates (from e2b.dev/docs/agents) ──────────────────────
const AGENT_CONFIG: Record<
  AgentType,
  {
    template: string;
    envKey: string;
    command: (prompt: string) => string;
  }
> = {
  "claude-code": {
    template: "claude",
    envKey: "ANTHROPIC_API_KEY",
    command: (p) =>
      `claude --dangerously-skip-permissions --output-format stream-json -p "${esc(p)}"`,
  },
  codex: {
    template: "codex",
    envKey: "CODEX_API_KEY",
    command: (p) =>
      `codex exec --full-auto --skip-git-repo-check --json -C /home/user/project "${esc(p)}"`,
  },
  junie: {
    template: "base",
    envKey: "JUNIE_OPENROUTER_API_KEY",
    command: (p) => `junie --headless "${esc(p)}"`,
  },
  openclaw: {
    template: "base",
    envKey: "OPENROUTER_API_KEY",
    command: (p) => `openclaw run "${esc(p)}"`,
  },
};

function esc(s: string) {
  return s.replace(/"/g, '\\"').replace(/\n/g, " ").slice(0, 2000);
}

// ── Output parser for each agent's JSON format ────────────────────────────
type ParsedEvent = { type: string; content: string } | null;

function parseClaudeCode(line: string): ParsedEvent {
  try {
    const ev = JSON.parse(line);
    if (ev.type === "assistant" && ev.message?.content) {
      for (const block of ev.message.content) {
        if (block.type === "text") {
          return { type: "message", content: block.text };
        }
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
    if (ev.type === "result") {
      return {
        type: "status",
        content: `Done in ${ev.duration_ms ?? 0}ms`,
      };
    }
    if (ev.type === "system" && ev.subtype === "init") {
      return { type: "status", content: "Agent started" };
    }
    return null;
  } catch {
    return line.trim() ? { type: "bash", content: line } : null;
  }
}

function parseCodex(line: string): ParsedEvent {
  try {
    const ev = JSON.parse(line);
    if (ev.type === "message") {
      return { type: "message", content: ev.content ?? "" };
    }
    if (ev.type === "tool_call") {
      if (ev.name === "shell")
        return { type: "bash", content: ev.parameters?.command ?? "" };
      if (ev.name === "write_file" || ev.name === "apply_patch")
        return { type: "edit", content: ev.parameters?.path ?? "" };
      if (ev.name === "read_file")
        return { type: "read", content: ev.parameters?.path ?? "" };
    }
    if (ev.type === "done") {
      return { type: "status", content: "Done" };
    }
    return null;
  } catch {
    return line.trim() ? { type: "bash", content: line } : null;
  }
}

function parseDefault(line: string): ParsedEvent {
  return line.trim() ? { type: "bash", content: line } : null;
}

function parseLine(line: string, agent: AgentType): ParsedEvent {
  if (agent === "claude-code") return parseClaudeCode(line);
  if (agent === "codex") return parseCodex(line);
  return parseDefault(line);
}

// ── SSE helper ────────────────────────────────────────────────────────────
function sendSSE(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// ── POST /api/e2b/stream  — SSE streaming endpoint ───────────────────────
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

  // Setup SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  sendSSE(res, "status", { content: `Starting ${agent} sandbox…` });

  let sandbox: Sandbox | null = null;

  try {
    // 1. Create sandbox from official E2B template
    sandbox = await Sandbox.create(cfg.template, {
      envs: {
        [cfg.envKey]: OPENROUTER_KEY,
        // Claude Code needs ANTHROPIC_BASE_URL for OpenRouter
        ...(agent === "claude-code" && {
          ANTHROPIC_BASE_URL: "https://openrouter.ai/api",
          ANTHROPIC_AUTH_TOKEN: OPENROUTER_KEY,
        }),
        OPENROUTER_API_KEY: OPENROUTER_KEY,
      },
      apiKey: E2B_API_KEY,
      timeoutMs: 10 * 60 * 1000,
    });

    sendSSE(res, "status", { content: "Sandbox ready — running agent…" });

    // 2. Create project directory
    await sandbox.commands.run("mkdir -p /home/user/project");

    // 3. Run agent with streaming
    const cmd = cfg.command(prompt);

    await sandbox.commands.run(cmd, {
      cwd: "/home/user/project",
      onStdout: (data: string) => {
        for (const line of data.split("\n").filter(Boolean)) {
          const parsed = parseLine(line, agent);
          if (parsed) sendSSE(res, parsed.type, { content: parsed.content });
        }
      },
      onStderr: (data: string) => {
        if (data.trim()) {
          sendSSE(res, "bash", { content: data.trim() });
        }
      },
    });

    // 4. Try to get preview URL (ngrok)
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
    if (sandbox) {
      await sandbox.kill().catch(() => {});
    }
    res.end();
  }
});

// ── POST /api/e2b/run  — non-streaming (collects all messages) ────────────
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
        [cfg.envKey]: OPENROUTER_KEY,
        ...(agent === "claude-code" && {
          ANTHROPIC_BASE_URL: "https://openrouter.ai/api",
          ANTHROPIC_AUTH_TOKEN: OPENROUTER_KEY,
        }),
        OPENROUTER_API_KEY: OPENROUTER_KEY,
      },
      apiKey: E2B_API_KEY,
      timeoutMs: 10 * 60 * 1000,
    });

    const messages: Array<{ type: string; content: string }> = [];

    await sandbox.commands.run("mkdir -p /home/user/project");

    await sandbox.commands.run(cfg.command(prompt), {
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
