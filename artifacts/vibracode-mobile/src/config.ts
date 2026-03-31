export type AgentType =
  | "claude"
  | "gemini"
  | "qwen"
  | "kimi"
  | "hermes"
  | "codex"
  | "deepseek"
  | "llama"
  | "mistral"
  | "phi"
  | "grok"
  | "nemotron";

export type ProviderType = "openrouter" | "e2b";

// Agents that run inside a real E2B sandbox (code execution)
export const E2B_AGENT_MAP: Partial<Record<AgentType, string>> = {
  claude: "claude-code",
  codex: "codex",
};

export interface Agent {
  id: AgentType;
  label: string;
  icon: string;
  color: string;
  model: string;
  fallback: string;
  description: string;
  provider: ProviderType;
  badge: string;
}

export const CONFIG = {
  // Keys used only as user-supplied overrides; real keys live on the server
  OPENROUTER_API_KEY:
    process.env.EXPO_PUBLIC_OPENROUTER_KEY ??
    "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",

  CLERK_PUBLISHABLE_KEY:
    process.env.EXPO_PUBLIC_CLERK_KEY ??
    "pk_test_bWVhc3VyZWQtYWlyZWRhbGUtNjEuY2xlcmsuYWNjb3VudHMuZGV2JA",

  CONVEX_URL:
    process.env.EXPO_PUBLIC_CONVEX_URL ??
    "https://astute-ladybug-398.convex.cloud",

  // API server base URL (all AI calls are proxied through here)
  BACKEND_URL:
    process.env.EXPO_PUBLIC_BACKEND_URL ??
    (process.env.EXPO_PUBLIC_DOMAIN
      ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
      : ""),

  E2B_API_KEY:
    process.env.EXPO_PUBLIC_E2B_KEY ??
    "e2b_51e98476ce3cdfff4768678430d5527df28b169a",

  // ─── 12 AI Agents ──────────────────────────────────────────────────────────
  AGENTS: [
    {
      id: "claude" as AgentType,
      label: "Claude Code",
      icon: "cpu",
      color: "#A855F7",
      model: "anthropic/claude-3.5-sonnet:free",
      fallback: "anthropic/claude-3-haiku:free",
      description: "Real sandbox · Builds full apps",
      provider: "e2b" as ProviderType,
      badge: "E2B · Anthropic",
    },
    {
      id: "codex" as AgentType,
      label: "Codex CLI",
      icon: "terminal",
      color: "#10B981",
      model: "openai/gpt-4o-mini:free",
      fallback: "deepseek/deepseek-coder:free",
      description: "Real sandbox · OpenAI Codex",
      provider: "e2b" as ProviderType,
      badge: "E2B · OpenAI",
    },
    {
      id: "gemini" as AgentType,
      label: "Gemini 2.0",
      icon: "star",
      color: "#3B82F6",
      model: "google/gemini-2.0-flash-exp:free",
      fallback: "google/gemini-flash-1.5:free",
      description: "Google AI · Fast & free",
      provider: "openrouter" as ProviderType,
      badge: "Google",
    },
    {
      id: "qwen" as AgentType,
      label: "Qwen Coder",
      icon: "code",
      color: "#22C55E",
      model: "qwen/qwen-2.5-coder-32b:free",
      fallback: "qwen/qwen-2.5-72b-instruct:free",
      description: "Best open-source coder",
      provider: "openrouter" as ProviderType,
      badge: "Alibaba",
    },
    {
      id: "deepseek" as AgentType,
      label: "DeepSeek R1",
      icon: "layers",
      color: "#EF4444",
      model: "deepseek/deepseek-r1:free",
      fallback: "deepseek/deepseek-r1-distill-qwen-32b:free",
      description: "Deep reasoning model",
      provider: "openrouter" as ProviderType,
      badge: "DeepSeek",
    },
    {
      id: "kimi" as AgentType,
      label: "Kimi K2",
      icon: "moon",
      color: "#06B6D4",
      model: "moonshotai/kimi-k2:free",
      fallback: "moonshotai/kimi-k2:free",
      description: "Long context · 1M tokens",
      provider: "openrouter" as ProviderType,
      badge: "Moonshot",
    },
    {
      id: "llama" as AgentType,
      label: "Llama 3.3",
      icon: "box",
      color: "#8B5CF6",
      model: "meta-llama/llama-3.3-70b-instruct:free",
      fallback: "meta-llama/llama-3.1-70b-instruct:free",
      description: "Meta open source 70B",
      provider: "openrouter" as ProviderType,
      badge: "Meta",
    },
    {
      id: "hermes" as AgentType,
      label: "Hermes 3",
      icon: "zap",
      color: "#F59E0B",
      model: "nousresearch/hermes-3-llama-3.1-70b:free",
      fallback: "nousresearch/hermes-3-llama-3.1-405b:free",
      description: "Instruction-tuned 70B",
      provider: "openrouter" as ProviderType,
      badge: "NousResearch",
    },
    {
      id: "mistral" as AgentType,
      label: "Mistral Nemo",
      icon: "wind",
      color: "#EC4899",
      model: "mistralai/mistral-nemo:free",
      fallback: "mistralai/mistral-7b-instruct:free",
      description: "Mistral AI · Fast",
      provider: "openrouter" as ProviderType,
      badge: "Mistral",
    },
    {
      id: "phi" as AgentType,
      label: "Phi-3 Medium",
      icon: "triangle",
      color: "#0EA5E9",
      model: "microsoft/phi-3-medium-128k-instruct:free",
      fallback: "microsoft/phi-3-mini-128k-instruct:free",
      description: "Microsoft SLM · Efficient",
      provider: "openrouter" as ProviderType,
      badge: "Microsoft",
    },
    {
      id: "grok" as AgentType,
      label: "Grok 3 Mini",
      icon: "aperture",
      color: "#F97316",
      model: "x-ai/grok-3-mini-beta:free",
      fallback: "x-ai/grok-3-mini-beta:free",
      description: "xAI · Reasoning",
      provider: "openrouter" as ProviderType,
      badge: "xAI",
    },
    {
      id: "nemotron" as AgentType,
      label: "Nemotron 70B",
      icon: "activity",
      color: "#76C442",
      model: "nvidia/llama-3.1-nemotron-70b-instruct:free",
      fallback: "meta-llama/llama-3.1-70b-instruct:free",
      description: "NVIDIA fine-tuned 70B",
      provider: "openrouter" as ProviderType,
      badge: "NVIDIA",
    },
  ] as Agent[],

  DEFAULT_AGENT: "gemini" as AgentType,

  FREE_MODELS: [
    { label: "Gemini 2.0 Flash Exp", value: "google/gemini-2.0-flash-exp:free", badge: "Google" },
    { label: "Gemini Flash 1.5", value: "google/gemini-flash-1.5:free", badge: "Google" },
    { label: "Claude 3.5 Sonnet", value: "anthropic/claude-3.5-sonnet:free", badge: "Anthropic" },
    { label: "Claude 3 Haiku", value: "anthropic/claude-3-haiku:free", badge: "Anthropic" },
    { label: "Qwen 2.5 Coder 32B", value: "qwen/qwen-2.5-coder-32b:free", badge: "Alibaba" },
    { label: "Qwen 2.5 72B", value: "qwen/qwen-2.5-72b-instruct:free", badge: "Alibaba" },
    { label: "DeepSeek R1", value: "deepseek/deepseek-r1:free", badge: "DeepSeek" },
    { label: "DeepSeek R1 Distill 32B", value: "deepseek/deepseek-r1-distill-qwen-32b:free", badge: "DeepSeek" },
    { label: "DeepSeek Coder", value: "deepseek/deepseek-coder:free", badge: "DeepSeek" },
    { label: "Kimi K2", value: "moonshotai/kimi-k2:free", badge: "Moonshot" },
    { label: "Llama 3.3 70B", value: "meta-llama/llama-3.3-70b-instruct:free", badge: "Meta" },
    { label: "Llama 3.1 70B", value: "meta-llama/llama-3.1-70b-instruct:free", badge: "Meta" },
    { label: "Llama 3.1 8B", value: "meta-llama/llama-3.1-8b-instruct:free", badge: "Meta" },
    { label: "Hermes 3 70B", value: "nousresearch/hermes-3-llama-3.1-70b:free", badge: "NousResearch" },
    { label: "Mistral Nemo", value: "mistralai/mistral-nemo:free", badge: "Mistral" },
    { label: "Mistral 7B", value: "mistralai/mistral-7b-instruct:free", badge: "Mistral" },
    { label: "Phi-3 Medium", value: "microsoft/phi-3-medium-128k-instruct:free", badge: "Microsoft" },
    { label: "Phi-3 Mini", value: "microsoft/phi-3-mini-128k-instruct:free", badge: "Microsoft" },
    { label: "GPT-4o Mini", value: "openai/gpt-4o-mini:free", badge: "OpenAI" },
    { label: "Grok 3 Mini", value: "x-ai/grok-3-mini-beta:free", badge: "xAI" },
    { label: "Nemotron 70B", value: "nvidia/llama-3.1-nemotron-70b-instruct:free", badge: "NVIDIA" },
    { label: "GLM-4 9B", value: "thudm/glm-4-9b:free", badge: "THUDM" },
  ],

  DEFAULT_MODEL: "google/gemini-2.0-flash-exp:free",

  SYSTEM_PROMPT: `You are Vibra Code, an expert AI coding assistant that builds React Native and Expo mobile apps.

When a user describes an app:
1. List TASKS (3-5 specific steps)
2. Read existing files if needed
3. Create/edit files with complete, working code
4. Explain what was built

You use:
- React Native / Expo SDK 54 + TypeScript
- expo-router for navigation
- @tanstack/react-query for data
- AsyncStorage for local state
- @expo/vector-icons (Feather)

Write complete, production-ready code. Use markdown code blocks with language tags.
Never use placeholder comments like "// add logic here".
Always produce working, installable React Native code.`,
};
