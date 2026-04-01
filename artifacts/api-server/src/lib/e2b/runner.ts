import { Sandbox } from 'e2b';
import { AgentId } from './agents';
import { parseLine, ParsedEvent } from './parser';
import { getAgentEnv, E2B_TEMPLATES } from './agent-envs';
import { ProviderConfig } from '../providers/registry';

export type { ProviderConfig };

export type { AgentId };
export type { ParsedEvent };

function getDefaultProvider(): ProviderConfig {
  return {
    type:    'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey:  process.env.OPENROUTER_API_KEY ?? '',
    model:   'openrouter/auto',
  };
}

async function setupCustomAgent(sandbox: Sandbox, agent: AgentId, provider: ProviderConfig): Promise<void> {
  const cmds: Partial<Record<AgentId, string>> = {
    junie:    'curl -fsSL https://junie.jetbrains.com/install.sh | bash 2>/dev/null || true',
    openclaw: 'npm install -g openclaw 2>/dev/null || true',
  };
  if (cmds[agent]) await sandbox.commands.run(cmds[agent]!);

  if (agent === 'openclaw') {
    const config = {
      env: { OPENROUTER_API_KEY: provider.apiKey ?? '' },
      agents: {
        defaults: {
          model: {
            primary: provider.type === 'ollama'
              ? `ollama/${provider.model}`
              : provider.model,
          },
        },
      },
      ...(provider.type === 'ollama' ? {
        providers: [{ name: 'ollama', baseUrl: `${provider.baseUrl}/v1`, apiKey: 'ollama' }],
      } : {}),
      ...(provider.type === 'custom' ? {
        providers: [{ name: 'custom', baseUrl: provider.baseUrl, apiKey: provider.apiKey }],
      } : {}),
    };
    await sandbox.files.write('/root/.openclaw/openclaw.json', JSON.stringify(config, null, 2));
  }

  if (provider.type === 'ollama' && provider.baseUrl.includes('localhost')) {
    await sandbox.commands.run('curl -fsSL https://ollama.com/install.sh | sh && ollama serve &');
    await new Promise(r => setTimeout(r, 3000));
    await sandbox.commands.run(`ollama pull ${provider.model} 2>/dev/null || true`);
  }
}

function buildCmd(agent: AgentId, prompt: string, provider: ProviderConfig): string {
  const p = prompt.replace(/"/g, '\\"').replace(/\n/g, ' ');
  const m = provider.model;
  switch (agent) {
    case 'claude':   return `claude --dangerously-skip-permissions --output-format stream-json -p "${p}"`;
    case 'kilocode': return `claude --dangerously-skip-permissions --output-format stream-json --model ${m} -p "${p}"`;
    case 'opencode': return `opencode run "${p}"`;
    case 'codex':    return `codex exec --full-auto --skip-git-repo-check --json -C /home/user/project "${p}"`;
    case 'amp':      return `amp --json "${p}"`;
    case 'junie':    return `junie --headless "${p}" 2>&1`;
    case 'openclaw': return `openclaw run "${p}" 2>&1`;
  }
}

export async function runAgent(
  prompt:    string,
  agentId:   AgentId,
  onEvent:   (event: ParsedEvent) => Promise<void>,
  provider?: ProviderConfig
): Promise<{ sandboxId: string; previewUrl?: string }> {

  const resolvedProvider = provider ?? getDefaultProvider();
  const envs             = getAgentEnv(agentId, resolvedProvider);
  const template         = E2B_TEMPLATES[agentId];

  const sandbox = await Sandbox.create(template, {
    apiKey:    process.env.E2B_API_KEY!,
    envs,
    timeoutMs: 15 * 60 * 1000,
  });

  const sandboxId = sandbox.sandboxId;

  try {
    await sandbox.commands.run('mkdir -p /home/user/project');
    await setupCustomAgent(sandbox, agentId, resolvedProvider);

    const cmd = buildCmd(agentId, prompt, resolvedProvider);
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
      const result = await sandbox.commands.run(
        `lsof -i -P -n 2>/dev/null | grep LISTEN | grep -oP ':\\K[0-9]+' | head -1 || echo ''`
      );
      const port = result.stdout.trim();
      if (port) {
        previewUrl = `https://${sandbox.getHost(parseInt(port))}`;
      }
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
