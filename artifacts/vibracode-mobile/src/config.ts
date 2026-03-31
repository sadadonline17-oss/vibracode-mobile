export type AgentType =
  | "claude"
  | "gemini"
  | "qwen"
  | "kimi"
  | "hermes"
  | "codex"
  | "deepseek"
  | "llama";

export type ProviderType = "openrouter" | "gemini-native";

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
  OPENROUTER_API_KEY:
    process.env.EXPO_PUBLIC_OPENROUTER_KEY ??
    "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",
  OPENROUTER_BASE_URL: "https://openrouter.ai/api/v1",

  GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_KEY ?? "",

  CLERK_PUBLISHABLE_KEY:
    process.env.EXPO_PUBLIC_CLERK_KEY ??
    "pk_test_bWVhc3VyZWQtYWlyZWRhbGUtNjEuY2xlcmsuYWNjb3VudHMuZGV2JA",

  CONVEX_URL:
    process.env.EXPO_PUBLIC_CONVEX_URL ??
    "https://astute-ladybug-398.convex.cloud",

  BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL ?? "",

  E2B_API_KEY:
    process.env.EXPO_PUBLIC_E2B_KEY ??
    "e2b_51e98476ce3cdfff4768678430d5527df28b169a",

  AGENTS: [
    {
      id: "claude" as AgentType,
      label: "Claude Code",
      icon: "cpu",
      color: "#A855F7",
      model: "anthropic/claude-3.5-sonnet:free",
      fallback: "anthropic/claude-3-haiku:free",
      description: "Best for full apps",
      provider: "openrouter" as ProviderType,
      badge: "Anthropic",
    },
    {
      id: "gemini" as AgentType,
      label: "Gemini CLI",
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
      label: "Qwen CLI",
      icon: "code",
      color: "#22C55E",
      model: "qwen/qwen-2.5-coder-32b:free",
      fallback: "qwen/qwen-2.5-72b-instruct:free",
      description: "Best open-source coder",
      provider: "openrouter" as ProviderType,
      badge: "Alibaba",
    },
    {
      id: "kimi" as AgentType,
      label: "Kimi CLI",
      icon: "moon",
      color: "#06B6D4",
      model: "moonshotai/kimi-k2:free",
      fallback: "moonshotai/moonshot-v1-8k:free",
      description: "Long context AI",
      provider: "openrouter" as ProviderType,
      badge: "Moonshot",
    },
    {
      id: "hermes" as AgentType,
      label: "Hermes",
      icon: "zap",
      color: "#F59E0B",
      model: "nousresearch/hermes-3-llama-3.1-70b:free",
      fallback: "nousresearch/hermes-3-llama-3.1-405b:free",
      description: "NousResearch · Instruction tuned",
      provider: "openrouter" as ProviderType,
      badge: "NousResearch",
    },
    {
      id: "codex" as AgentType,
      label: "Codex",
      icon: "terminal",
      color: "#10B981",
      model: "openai/gpt-4o-mini:free",
      fallback: "deepseek/deepseek-coder:free",
      description: "OpenAI code model",
      provider: "openrouter" as ProviderType,
      badge: "OpenAI",
    },
    {
      id: "deepseek" as AgentType,
      label: "DeepSeek",
      icon: "layers",
      color: "#EF4444",
      model: "deepseek/deepseek-coder:free",
      fallback: "deepseek/deepseek-r1:free",
      description: "Deep coding reasoning",
      provider: "openrouter" as ProviderType,
      badge: "DeepSeek",
    },
    {
      id: "llama" as AgentType,
      label: "Llama 3.1",
      icon: "box",
      color: "#8B5CF6",
      model: "meta-llama/llama-3.1-8b-instruct:free",
      fallback: "meta-llama/llama-3.1-70b-instruct:free",
      description: "Meta open source",
      provider: "openrouter" as ProviderType,
      badge: "Meta",
    },
  ] as Agent[],

  DEFAULT_AGENT: "gemini" as AgentType,

  FREE_MODELS: [
    { label: "Gemini 2.0 Flash Exp", value: "google/gemini-2.0-flash-exp:free", badge: "Google" },
    { label: "Qwen 2.5 Coder 32B", value: "qwen/qwen-2.5-coder-32b:free", badge: "Alibaba" },
    { label: "Claude 3.5 Sonnet", value: "anthropic/claude-3.5-sonnet:free", badge: "Anthropic" },
    { label: "Kimi K2", value: "moonshotai/kimi-k2:free", badge: "Moonshot" },
    { label: "Hermes 3 Llama 70B", value: "nousresearch/hermes-3-llama-3.1-70b:free", badge: "NousResearch" },
    { label: "GPT-4o Mini", value: "openai/gpt-4o-mini:free", badge: "OpenAI" },
    { label: "DeepSeek Coder", value: "deepseek/deepseek-coder:free", badge: "DeepSeek" },
    { label: "DeepSeek R1", value: "deepseek/deepseek-r1:free", badge: "DeepSeek" },
    { label: "Llama 3.1 70B", value: "meta-llama/llama-3.1-70b-instruct:free", badge: "Meta" },
    { label: "Llama 3.1 8B", value: "meta-llama/llama-3.1-8b-instruct:free", badge: "Meta" },
    { label: "Mistral 7B", value: "mistralai/mistral-7b-instruct:free", badge: "Mistral" },
    { label: "Phi-3 Mini", value: "microsoft/phi-3-mini-128k-instruct:free", badge: "Microsoft" },
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
