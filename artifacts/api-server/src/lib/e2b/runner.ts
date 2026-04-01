import { Sandbox } from 'e2b';
import { getAgentConfig, AgentId } from './agents';
import { parseLine, ParsedEvent } from './parser';

export async function runAgent(
  prompt:  string,
  agentId: AgentId,
  onEvent: (event: ParsedEvent) => Promise<void>
): Promise<{ sandboxId: string; previewUrl?: string }> {
  const cfg = getAgentConfig(agentId);

  const sandbox = await Sandbox.create(cfg.e2bTemplate, {
    apiKey:    process.env.E2B_API_KEY!,
    envs:      cfg.envs,
    timeoutMs: 15 * 60 * 1000,
  });

  const sandboxId = sandbox.sandboxId;

  try {
    await sandbox.commands.run('mkdir -p /home/user/project');

    if (cfg.install) {
      await sandbox.commands.run(cfg.install);
    }

    if (agentId === 'openclaw') {
      await sandbox.files.write('/root/.openclaw/openclaw.json', JSON.stringify({
        env: { OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY },
        agents: { defaults: { model: { primary: 'openrouter/openrouter/auto' } } },
      }));
    }

    const cmd = cfg.command(prompt);
    await sandbox.commands.run(cmd, {
      cwd: '/home/user/project',
      onStdout: async (data: string) => {
        for (const line of data.split('\n')) {
          const evt = parseLine(line, agentId);
          if (evt) await onEvent(evt);
        }
      },
      onStderr: async (data: string) => {
        if (data.trim()) await onEvent({ type: 'bash', content: `[stderr] ${data.trim()}` });
      },
    });

    let previewUrl: string | undefined;
    try {
      const r = await sandbox.commands.run(
        `curl -s http://localhost:4040/api/tunnels 2>/dev/null | ` +
        `python3 -c "import sys,json; d=json.load(sys.stdin); print(d['tunnels'][0]['public_url'])" 2>/dev/null || echo ""`
      );
      if (r.stdout.trim()) previewUrl = r.stdout.trim();
    } catch { /* no preview */ }

    await sandbox.pause().catch(() => sandbox.kill().catch(() => {}));

    return { sandboxId, previewUrl };
  } catch (err) {
    await sandbox.pause().catch(() => sandbox.kill().catch(() => {}));
    throw err;
  }
}

export async function resumeSandbox(sandboxId: string) {
  return Sandbox.connect(sandboxId, { apiKey: process.env.E2B_API_KEY! });
}
