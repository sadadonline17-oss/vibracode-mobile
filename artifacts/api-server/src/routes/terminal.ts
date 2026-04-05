import { Router, Request, Response } from "express";
import { exec } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";

const router = Router();

const SAFE_CWD = "/tmp/vibracode";

async function ensureCwd(cwd: string): Promise<string> {
  const resolved = path.resolve(cwd || SAFE_CWD);
  try { await fs.mkdir(resolved, { recursive: true }); } catch {}
  return resolved;
}

// ── POST /api/terminal/execute ────────────────────────────────────────────────
router.post("/execute", async (req: Request, res: Response) => {
  const { command, cwd, timeout } = req.body as {
    command?: string;
    cwd?: string;
    timeout?: number;
  };

  if (!command?.trim()) {
    res.status(400).json({ error: "command is required" });
    return;
  }

  const safeCwd = await ensureCwd(cwd || SAFE_CWD);
  const safeTimeout = Math.min(timeout ?? 30000, 60000);

  exec(
    command,
    { cwd: safeCwd, timeout: safeTimeout, maxBuffer: 1024 * 512, shell: "/bin/sh" },
    (error, stdout, stderr) => {
      res.json({
        stdout: stdout ?? "",
        stderr: stderr || error?.message || "",
        code: error?.code ?? (error ? 1 : 0),
      });
    }
  );
});

// ── POST /api/files/read ─────────────────────────────────────────────────────
router.post("/files/read", async (req: Request, res: Response) => {
  const { path: filePath } = req.body as { path?: string };
  if (!filePath) { res.status(400).json({ error: "path required" }); return; }
  try {
    const content = await fs.readFile(filePath, "utf-8");
    res.json({ content });
  } catch (err: any) {
    res.status(404).json({ error: err?.message ?? "File not found" });
  }
});

// ── POST /api/files/write ────────────────────────────────────────────────────
router.post("/files/write", async (req: Request, res: Response) => {
  const { path: filePath, content } = req.body as { path?: string; content?: string };
  if (!filePath || content === undefined) {
    res.status(400).json({ error: "path and content required" });
    return;
  }
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, "utf-8");
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Write failed" });
  }
});

export default router;
