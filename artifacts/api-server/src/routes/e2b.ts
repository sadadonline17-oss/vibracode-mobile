import { Router, Request, Response } from "express";

const router = Router();

export type AgentType = "claude-code" | "codex" | "gemini" | "cursor";

// E2B Agent Templates (official from e2b.dev/docs)
const AGENT_TEMPLATES: Record<AgentType, string> = {
  "claude-code": "claude",   // E2B pre-built template with Claude Code
  "codex":       "codex",    // E2B pre-built template with Codex CLI
  "gemini":      "base",     // Base template
  "cursor":      "base",     // Base template
};

const AGENT_COMMANDS: Record<AgentType, (prompt: string) => string> = {
  "claude-code": (p) => `claude --dangerously-skip-permissions --output-format stream-json -p "${esc(p)}"`,
  "codex":       (p) => `codex exec --full-auto --skip-git-repo-check --json -C /home/user/project "${esc(p)}"`,
  "gemini":      (p) => `gemini -p "${esc(p)}"`,
  "cursor":      (p) => `qwen-code "${esc(p)}"`,
};

function esc(s: string) {
  return s.replace(/"/g, '\\"').replace(/\n/g, " ").slice(0, 2000);
}

// POST /api/e2b/run  — starts an E2B sandbox and runs the AI agent
router.post("/run", async (req: Request, res: Response) => {
  const { prompt, agent = "claude-code", sessionId } = req.body as {
    prompt: string;
    agent: AgentType;
    sessionId: string;
  };

  if (!prompt || !sessionId) {
    return res.status(400).json({ error: "prompt and sessionId required" });
  }

  const E2B_API_KEY = process.env.E2B_API_KEY;
  if (!E2B_API_KEY) {
    return res.status(500).json({ error: "E2B_API_KEY not configured" });
  }

  try {
    // Dynamic import so server starts even without e2b installed
    const { Sandbox } = await import("e2b" as any);
    const template = AGENT_TEMPLATES[agent] ?? "base";
    const command  = AGENT_COMMANDS[agent](prompt);

    const sandbox = await Sandbox.create(template, {
      envs: {
        ANTHROPIC_API_KEY: process.env.OPENROUTER_API_KEY!,
        ANTHROPIC_BASE_URL: "https://openrouter.ai/api",
        ANTHROPIC_AUTH_TOKEN: process.env.OPENROUTER_API_KEY!,
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY!,
      },
      apiKey: E2B_API_KEY,
      timeoutMs: 10 * 60 * 1000,
    });

    const messages: Array<{ type: string; content: string }> = [];

    await sandbox.commands.run(command, {
      cwd: "/home/user/project",
      onStdout: (line: string) => {
        for (const l of line.split("\n").filter(Boolean)) {
          try {
            const ev = JSON.parse(l);
            // Claude Code stream-json
            if (ev.type === "assistant" && ev.message?.content) {
              for (const block of ev.message.content) {
                if (block.type === "text")
                  messages.push({ type: "message", content: block.text });
                else if (block.type === "tool_use") {
                  const t = block.name === "Read" ? "read"
                    : block.name === "Write" || block.name === "Edit" ? "edit"
                    : block.name === "Bash" ? "bash" : "message";
                  messages.push({ type: t, content: block.input?.file_path ?? block.input?.command ?? "" });
                }
              }
            }
          } catch {
            if (l.trim()) messages.push({ type: "bash", content: l });
          }
        }
      },
    });

    await sandbox.kill();

    return res.json({ ok: true, sessionId, messages });
  } catch (err: any) {
    console.error("[E2B]", err.message);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
