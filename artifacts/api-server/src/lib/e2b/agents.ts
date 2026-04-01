export type AgentId = 'claude' | 'opencode' | 'kilocode' | 'codex' | 'amp' | 'junie' | 'openclaw';

export interface AgentConfig {
  id:          AgentId;
  label:       string;
  icon:        string;
  color:       string;
  e2bTemplate: string;
  envs:        Record<string, string>;
  install?:    string;
  command:     (prompt: string) => string;
  outputFormat: 'stream-json' | 'json-lines' | 'plain' | 'amp-json';
}

function getKey() {
  return process.env.OPENROUTER_API_KEY ?? '';
}

function esc(s: string) {
  return s.replace(/"/g, '\\"').replace(/\n/g, ' ');
}

function getAgents(): Record<AgentId, AgentConfig> {
  const OR = getKey();
  return {
    claude: {
      id: 'claude', label: 'Claude Code', icon: '🤖', color: '#D97706',
      e2bTemplate: 'claude',
      envs: { ANTHROPIC_API_KEY: OR, ANTHROPIC_BASE_URL: 'https://openrouter.ai/api', ANTHROPIC_AUTH_TOKEN: OR },
      command: (p) => `claude --dangerously-skip-permissions --output-format stream-json -p "${esc(p)}"`,
      outputFormat: 'stream-json',
    },

    opencode: {
      id: 'opencode', label: 'OpenCode', icon: '🌐', color: '#7C3AED',
      e2bTemplate: 'opencode',
      envs: { ANTHROPIC_API_KEY: OR, ANTHROPIC_BASE_URL: 'https://openrouter.ai/api' },
      command: (p) => `opencode run "${esc(p)}"`,
      outputFormat: 'plain',
    },

    kilocode: {
      id: 'kilocode', label: 'Kilo Code', icon: '⚖️', color: '#DC2626',
      e2bTemplate: 'claude',
      envs: { ANTHROPIC_API_KEY: OR, ANTHROPIC_BASE_URL: 'https://openrouter.ai/api', ANTHROPIC_AUTH_TOKEN: OR },
      command: (p) => `claude --dangerously-skip-permissions --output-format stream-json -p "[KiloCode Mode] ${esc(p)}"`,
      outputFormat: 'stream-json',
    },

    codex: {
      id: 'codex', label: 'Codex CLI', icon: '⚡', color: '#2563EB',
      e2bTemplate: 'codex',
      envs: { OPENAI_API_KEY: OR, OPENAI_BASE_URL: 'https://openrouter.ai/api/v1' },
      command: (p) => `codex exec --full-auto --skip-git-repo-check --json -C /home/user/project "${esc(p)}"`,
      outputFormat: 'json-lines',
    },

    amp: {
      id: 'amp', label: 'Amp', icon: '🔊', color: '#059669',
      e2bTemplate: 'amp',
      envs: { ANTHROPIC_API_KEY: OR, ANTHROPIC_BASE_URL: 'https://openrouter.ai/api' },
      command: (p) => `amp --json "${esc(p)}"`,
      outputFormat: 'amp-json',
    },

    junie: {
      id: 'junie', label: 'Junie', icon: '🧩', color: '#6D28D9',
      e2bTemplate: 'base',
      envs: { JUNIE_OPENROUTER_API_KEY: OR, OPENROUTER_API_KEY: OR },
      install: 'curl -fsSL https://junie.jetbrains.com/install.sh | bash 2>/dev/null || true',
      command: (p) => `junie --headless "${esc(p)}" 2>&1`,
      outputFormat: 'plain',
    },

    openclaw: {
      id: 'openclaw', label: 'OpenClaw', icon: '🦞', color: '#EA580C',
      e2bTemplate: 'base',
      envs: { OPENROUTER_API_KEY: OR },
      install: 'npm install -g openclaw 2>/dev/null || true',
      command: (p) => `openclaw run "${esc(p)}" 2>&1`,
      outputFormat: 'plain',
    },
  };
}

export function getAgentConfig(id: AgentId): AgentConfig {
  return getAgents()[id];
}

export const AGENT_IDS: AgentId[] = ['claude', 'opencode', 'kilocode', 'codex', 'amp', 'junie', 'openclaw'];
