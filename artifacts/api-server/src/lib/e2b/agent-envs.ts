import { ProviderConfig } from '../providers/registry';

export type AgentId =
  | 'claude' | 'opencode' | 'kilocode'
  | 'codex'  | 'amp'      | 'junie' | 'openclaw';

export const E2B_TEMPLATES: Record<AgentId, string> = {
  claude:   'claude',
  opencode: 'opencode',
  kilocode: 'claude',
  codex:    'codex',
  amp:      'amp',
  junie:    'base',
  openclaw: 'base',
};

export function getAgentEnv(agent: AgentId, provider: ProviderConfig): Record<string, string> {
  const env: Record<string, string> = {};

  const isOllama      = provider.type === 'ollama';
  const ollamaBaseUrl = provider.baseUrl;
  const openrouterKey = process.env.OPENROUTER_API_KEY ?? '';
  const apiKey        = provider.apiKey ?? openrouterKey;

  switch (agent) {
    case 'claude':
    case 'kilocode': {
      if (isOllama) {
        env.ANTHROPIC_API_KEY    = 'ollama';
        env.ANTHROPIC_BASE_URL   = `${ollamaBaseUrl}/v1`;
        env.ANTHROPIC_AUTH_TOKEN = 'ollama';
      } else {
        env.ANTHROPIC_API_KEY    = apiKey;
        env.ANTHROPIC_BASE_URL   = provider.baseUrl.replace('/v1', '');
        env.ANTHROPIC_AUTH_TOKEN = apiKey;
      }
      break;
    }
    case 'opencode': {
      if (isOllama) {
        env.ANTHROPIC_API_KEY  = 'ollama';
        env.ANTHROPIC_BASE_URL = `${ollamaBaseUrl}/v1`;
        env.OPENAI_API_KEY     = 'ollama';
        env.OPENAI_BASE_URL    = `${ollamaBaseUrl}/v1`;
      } else {
        env.ANTHROPIC_API_KEY  = apiKey;
        env.ANTHROPIC_BASE_URL = provider.baseUrl.replace('/v1', '');
        env.OPENAI_API_KEY     = apiKey;
        env.OPENAI_BASE_URL    = provider.baseUrl;
      }
      break;
    }
    case 'codex': {
      env.OPENAI_API_KEY  = isOllama ? 'ollama' : apiKey;
      env.OPENAI_BASE_URL = isOllama ? `${ollamaBaseUrl}/v1` : provider.baseUrl;
      break;
    }
    case 'amp': {
      env.ANTHROPIC_API_KEY  = isOllama ? 'ollama' : apiKey;
      env.ANTHROPIC_BASE_URL = isOllama
        ? `${ollamaBaseUrl}/v1`
        : provider.baseUrl.replace('/v1', '');
      break;
    }
    case 'junie': {
      env.JUNIE_OPENROUTER_API_KEY = apiKey;
      if (provider.type === 'custom' || isOllama) {
        env.JUNIE_BASE_URL = isOllama ? `${ollamaBaseUrl}/v1` : provider.baseUrl;
      }
      break;
    }
    case 'openclaw': {
      env.OPENROUTER_API_KEY = apiKey;
      if (isOllama) {
        env.OPENCLAW_BASE_URL = `${ollamaBaseUrl}/v1`;
        env.OPENCLAW_API_KEY  = 'ollama';
      } else if (provider.type === 'custom') {
        env.OPENCLAW_BASE_URL = provider.baseUrl;
        env.OPENCLAW_API_KEY  = apiKey;
      }
      break;
    }
  }

  env.E2B_API_KEY   = process.env.E2B_API_KEY ?? '';
  env.CONVEX_URL    = process.env.CONVEX_URL ?? '';
  env.DEFAULT_MODEL = provider.model;

  return env;
}
