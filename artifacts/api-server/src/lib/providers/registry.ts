export type ProviderType = 'openrouter' | 'ollama' | 'anthropic' | 'openai' | 'custom';

export interface ProviderConfig {
  type:     ProviderType;
  baseUrl:  string;
  apiKey?:  string;
  model:    string;
  headers?: Record<string, string>;
}

export const BUILTIN_PROVIDERS: Record<string, ProviderConfig> = {
  openrouter: {
    type:    'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey:  process.env.OPENROUTER_API_KEY!,
    model:   'openrouter/auto',
  },
  anthropic_via_openrouter: {
    type:    'anthropic',
    baseUrl: 'https://openrouter.ai/api',
    apiKey:  process.env.OPENROUTER_API_KEY!,
    model:   'anthropic/claude-3-7-sonnet',
  },
  openai_via_openrouter: {
    type:    'openai',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey:  process.env.OPENROUTER_API_KEY!,
    model:   'openai/gpt-4o',
  },
  ollama_local: {
    type:    'ollama',
    baseUrl: process.env.OLLAMA_URL ?? 'http://localhost:11434',
    apiKey:  undefined,
    model:   process.env.OLLAMA_DEFAULT_MODEL ?? 'llama3.2',
  },
  ollama_remote: {
    type:    'ollama',
    baseUrl: process.env.OLLAMA_REMOTE_URL ?? 'http://localhost:11434',
    apiKey:  process.env.OLLAMA_API_KEY,
    model:   process.env.OLLAMA_DEFAULT_MODEL ?? 'llama3.2',
  },
};

export function buildHeaders(provider: ProviderConfig): Record<string, string> {
  const base: Record<string, string> = { 'Content-Type': 'application/json' };
  if (provider.type === 'openrouter') {
    base['Authorization'] = `Bearer ${provider.apiKey}`;
    base['HTTP-Referer']  = 'https://vibcode.app';
    base['X-Title']       = 'VibraCode';
  } else if (provider.type === 'anthropic') {
    base['x-api-key']         = provider.apiKey ?? '';
    base['anthropic-version'] = '2023-06-01';
  } else if (provider.type === 'openai' || provider.type === 'custom') {
    if (provider.apiKey) base['Authorization'] = `Bearer ${provider.apiKey}`;
  } else if (provider.type === 'ollama') {
    if (provider.apiKey) base['Authorization'] = `Bearer ${provider.apiKey}`;
  }
  if (provider.headers) Object.assign(base, provider.headers);
  return base;
}

export function getChatEndpoint(provider: ProviderConfig): string {
  if (provider.type === 'ollama') {
    return `${provider.baseUrl}/v1/chat/completions`;
  }
  if (provider.type === 'anthropic') {
    return `${provider.baseUrl}/v1/messages`;
  }
  return `${provider.baseUrl}/chat/completions`;
}

export function formatMessages(
  messages: Array<{ role: string; content: string }>,
  provider: ProviderConfig
): object {
  if (provider.type === 'anthropic') {
    const system = messages.find(m => m.role === 'system')?.content;
    const human  = messages.filter(m => m.role !== 'system');
    return { model: provider.model, max_tokens: 8192, system, messages: human };
  }
  return { model: provider.model, messages, stream: true };
}

export async function testOllamaProvider(baseUrl: string, _model?: string): Promise<{
  ok: boolean;
  models: string[];
  error?: string;
}> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { models } = await res.json() as { models: Array<{ name: string }> };
    const names = (models ?? []).map(m => m.name);
    return { ok: true, models: names };
  } catch (err) {
    return { ok: false, models: [], error: String(err) };
  }
}

export async function testCustomProvider(cfg: ProviderConfig): Promise<{ ok: boolean; error?: string }> {
  try {
    const endpoint = cfg.type === 'ollama'
      ? `${cfg.baseUrl}/api/tags`
      : `${cfg.baseUrl}/models`;
    const headers = buildHeaders(cfg);
    delete headers['Content-Type'];
    const res = await fetch(endpoint, { headers, signal: AbortSignal.timeout(5000) });
    return { ok: res.ok };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
