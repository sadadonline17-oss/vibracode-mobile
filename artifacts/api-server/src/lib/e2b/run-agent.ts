import { Sandbox } from 'e2b';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';
import { AgentId, E2B_TEMPLATES, getAgentEnv } from './agent-envs';
import { ProviderConfig } from '../providers/registry';
import { Skill, SKILLS, detectSkills } from '../skills/registry';
import { Integration, INTEGRATIONS, detectIntegrations, getAvailableEnvVars } from '../integrations/registry';
import { publishPreview } from './preview';
import { parseLine } from './parser';

const convex = new ConvexHttpClient(process.env.CONVEX_URL!);

async function sendMsg(
  sessionId: string,
  type: string,
  content: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await convex.mutation(api.messages.send, {
    sessionId: sessionId as any,
    role: 'assistant',
    type,
    content,
    ...(metadata ? { metadata } : {}),
  }).catch(() => {});
}

function buildSystemPrompt(
  skills: Skill[],
  integrations: Integration[],
  envVars: Record<string, string>
): string {
  let system = '';

  for (const skill of skills) {
    system += `\n\n## Skill: ${skill.name}\n${skill.prompt}`;
  }

  for (const integ of integrations) {
    const available = integ.envVars.filter(k => envVars[k]);
    if (available.length > 0) {
      system += `\n\n## Integration: ${integ.name} (${integ.icon})\nAvailable: ${available.join(', ')}\n${integ.description}`;
    }
  }

  system += `\n\n## Preview Rules
After finishing the app, ALWAYS start the dev server so users can preview it:
- Next.js: npx next dev --port 3000 --hostname 0.0.0.0
- Vite: npm run dev -- --host 0.0.0.0 --port 5173
- Expo: npx expo start --port 8081 --non-interactive
- FastAPI: uvicorn main:app --host 0.0.0.0 --port 8000
- Express: node dist/index.js (bind to 0.0.0.0)
The app will be accessible via a public HTTPS URL automatically.`;

  return system;
}

async function setupMcpServers(
  sandbox: Sandbox,
  integrations: Integration[],
  envVars: Record<string, string>
): Promise<void> {
  const mcpConfig: any = { mcpServers: {} };

  for (const integ of integrations) {
    if (!integ.mcpServer) continue;
    const hasKey = integ.envVars.some(k => envVars[k]);
    if (!hasKey) continue;

    const parts = integ.mcpServer.split(' ');
    const cmd   = parts[0];
    const args  = parts.slice(1);
    mcpConfig.mcpServers[integ.id] = {
      command: cmd,
      args,
      env: Object.fromEntries(
        integ.envVars.filter(k => envVars[k]).map(k => [k, envVars[k]])
      ),
    };
  }

  if (Object.keys(mcpConfig.mcpServers).length > 0) {
    await sandbox.commands.run('mkdir -p /root/.claude');
    await sandbox.files.write('/root/.claude/settings.json', JSON.stringify(mcpConfig, null, 2));
  }
}

function buildAgentCmd(agent: AgentId, prompt: string, provider: ProviderConfig): string {
  const esc = prompt.replace(/"/g, '\\"').replace(/\n/g, ' ').slice(0, 8000);
  const m   = provider.model;
  const cmds: Record<AgentId, string> = {
    'claude':   `claude --dangerously-skip-permissions --output-format stream-json -p "${esc}"`,
    'kilocode': `claude --dangerously-skip-permissions --output-format stream-json --model ${m} -p "${esc}"`,
    'opencode': `opencode run "${esc}"`,
    'codex':    `codex exec --full-auto --skip-git-repo-check --json -C /home/user/project "${esc}"`,
    'amp':      `amp --json "${esc}"`,
    'junie':    `junie --headless "${esc}" 2>&1`,
    'openclaw': `openclaw run "${esc}" 2>&1`,
  };
  return cmds[agent];
}

async function runOpenCodeAgent(sandbox: Sandbox, prompt: string, sessionId: string): Promise<void> {
  sandbox.commands.run('opencode serve --hostname 0.0.0.0 --port 4096', { background: true } as any);

  const base = `https://${sandbox.getHost(4096)}`;
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(`${base}/global/health`);
      if (r.ok) break;
    } catch { }
    await new Promise(r => setTimeout(r, 500));
  }

  try {
    const sessRes  = await fetch(`${base}/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'vibcode' }) });
    const sess     = await sessRes.json();
    const promptRes = await fetch(`${base}/session/${sess.id}/prompt`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parts: [{ type: 'text', text: prompt }] }) });
    const result   = await promptRes.json();
    await sendMsg(sessionId, 'message', typeof result === 'string' ? result : JSON.stringify(result));
  } catch (err) {
    await sendMsg(sessionId, 'error', `OpenCode error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function runAgentInSandbox(
  prompt:         string,
  agent:          AgentId,
  sessionId:      string,
  provider:       ProviderConfig,
  integrationIds?: string[],
  skillIds?:       string[]
): Promise<void> {

  const activeSkills = skillIds
    ? SKILLS.filter(s => skillIds.includes(s.id))
    : detectSkills(prompt);

  const activeIntegrations = integrationIds
    ? INTEGRATIONS.filter(i => integrationIds.includes(i.id))
    : detectIntegrations(prompt);

  const baseEnv   = getAgentEnv(agent, provider);
  const integEnv: Record<string, string> = {};
  for (const integ of activeIntegrations) {
    for (const key of integ.envVars) {
      if (process.env[key]) integEnv[key] = process.env[key]!;
    }
  }
  const allEnvs = { ...baseEnv, ...integEnv };

  const sandbox = await Sandbox.create(E2B_TEMPLATES[agent], {
    envs: allEnvs,
    timeoutMs: 20 * 60 * 1000,
  });

  await convex.mutation(api.sessions.setStatus, {
    sessionId: sessionId as any,
    status:    'working',
    sandboxId: sandbox.sandboxId,
  });

  try {
    await sandbox.commands.run('mkdir -p /home/user/project');

    await setupMcpServers(sandbox, activeIntegrations, allEnvs);

    for (const integ of activeIntegrations) {
      if (integ.setupCmd) {
        await sandbox.commands.run(`cd /home/user/project && ${integ.setupCmd} 2>/dev/null || true`);
      }
    }

    const systemPrompt = buildSystemPrompt(activeSkills, activeIntegrations, allEnvs);
    const fullPrompt   = systemPrompt ? `${systemPrompt}\n\n## Task\n${prompt}` : prompt;

    if (activeSkills.length > 0) {
      await sendMsg(sessionId, 'status', `🎯 Using skills: ${activeSkills.map(s => `${s.icon} ${s.name}`).join(', ')}`);
    }
    if (activeIntegrations.length > 0) {
      const available = activeIntegrations.filter(i => getAvailableEnvVars(i).length > 0);
      if (available.length > 0) {
        await sendMsg(sessionId, 'status', `🔌 Integrations: ${available.map(i => `${i.icon} ${i.name}`).join(', ')}`);
      }
    }

    if (agent === 'opencode') {
      await runOpenCodeAgent(sandbox, fullPrompt, sessionId);
    } else {
      const cmd = buildAgentCmd(agent, fullPrompt, provider);
      await sandbox.commands.run(cmd, {
        cwd: '/home/user/project',
        onStdout: async (data: string) => {
          for (const line of data.split('\n').filter(Boolean)) {
            const parsed = parseLine(line, agent);
            if (!parsed) continue;
            await sendMsg(sessionId, parsed.type, parsed.content);
          }
        },
      });
    }

    await sendMsg(sessionId, 'status', '🔍 Detecting preview server...');
    const previewUrl = await publishPreview(sandbox, sessionId);
    if (!previewUrl) {
      await sendMsg(sessionId, 'bash', '⚠️ No preview server detected. App may need manual start.');
    }

    await convex.mutation(api.sessions.setStatus, {
      sessionId: sessionId as any,
      status:    'done',
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await sendMsg(sessionId, 'error', msg);
    await convex.mutation(api.sessions.setStatus, {
      sessionId: sessionId as any,
      status:    'error',
    });
  } finally {
    try { await sandbox.pause(); } catch { }
  }
}
