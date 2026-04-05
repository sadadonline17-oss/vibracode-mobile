import { CONFIG } from "../config";

export interface BashToolInput {
  command: string;
  timeout?: number;
  description?: string;
}

export interface BashToolResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  interrupted: boolean;
}

export async function executeBashTool(
  input: BashToolInput,
  backendUrl?: string,
  onOutput?: (chunk: string) => void
): Promise<BashToolResult> {
  const base = (backendUrl || CONFIG.BACKEND_URL || "").replace(/\/$/, "");
  if (!base) {
    return { stdout: "", stderr: "No backend URL configured", exitCode: 1, interrupted: false };
  }

  try {
    const res = await fetch(`${base}/terminal/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: input.command, timeout: input.timeout ?? 30000 }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { stdout: "", stderr: `HTTP ${res.status}: ${errText}`, exitCode: 1, interrupted: false };
    }

    const data = await res.json() as { stdout: string; stderr: string; code: number };
    if (data.stdout && onOutput) onOutput(data.stdout);
    return { stdout: data.stdout ?? "", stderr: data.stderr ?? "", exitCode: data.code ?? 0, interrupted: false };
  } catch (err: any) {
    return { stdout: "", stderr: err?.message ?? "Fetch failed", exitCode: 1, interrupted: false };
  }
}
