export type AgentType = "claude-code" | "codex" | "gemini" | "cursor";

export const CONFIG = {
  // OpenRouter — free AI models (used as Anthropic proxy)
  OPENROUTER_API_KEY:
    process.env.EXPO_PUBLIC_OPENROUTER_KEY ??
    "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",
  OPENROUTER_BASE_URL: "https://openrouter.ai/api/v1",

  // Clerk Auth
  CLERK_PUBLISHABLE_KEY:
    process.env.EXPO_PUBLIC_CLERK_KEY ??
    "pk_test_bWVhc3VyZWQtYWlyZWRhbGUtNjEuY2xlcmsuYWNjb3VudHMuZGV2JA",

  // Convex real-time DB
  CONVEX_URL:
    process.env.EXPO_PUBLIC_CONVEX_URL ??
    "https://astute-ladybug-398.convex.cloud",

  // Backend API
  BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL ?? "",

  // E2B Cloud Sandboxes
  E2B_API_KEY:
    process.env.EXPO_PUBLIC_E2B_KEY ??
    "e2b_51e98476ce3cdfff4768678430d5527df28b169a",

  // AI Agents (matching Vibra Code original architecture)
  AGENTS: [
    {
      id: "claude-code" as AgentType,
      label: "Claude Code",
      icon: "cpu" as const,
      color: "#A855F7",
      model: "anthropic/claude-3.5-sonnet:free",
      fallback: "qwen/qwen-2.5-coder-32b:free",
      description: "Best for full apps",
    },
    {
      id: "codex" as AgentType,
      label: "Cursor",
      icon: "zap" as const,
      color: "#F59E0B",
      model: "deepseek/deepseek-coder:free",
      fallback: "deepseek/deepseek-coder:free",
      description: "Fast edits",
    },
    {
      id: "gemini" as AgentType,
      label: "Gemini",
      icon: "star" as const,
      color: "#3B82F6",
      model: "google/gemini-2.0-flash-exp:free",
      fallback: "meta-llama/llama-3.1-8b-instruct:free",
      description: "Google AI",
    },
    {
      id: "cursor" as AgentType,
      label: "Qwen Coder",
      icon: "code" as const,
      color: "#22C55E",
      model: "qwen/qwen-2.5-coder-32b:free",
      fallback: "qwen/qwen-2.5-coder-32b:free",
      description: "Open source",
    },
  ],
  DEFAULT_AGENT: "claude-code" as AgentType,

  FREE_MODELS: [
    { label: "Claude 3.5 Sonnet", value: "anthropic/claude-3.5-sonnet:free" },
    { label: "Qwen 2.5 Coder 32B", value: "qwen/qwen-2.5-coder-32b:free" },
    { label: "DeepSeek Coder", value: "deepseek/deepseek-coder:free" },
    { label: "Gemini Flash 2.0", value: "google/gemini-2.0-flash-exp:free" },
    { label: "Llama 3.1 8B", value: "meta-llama/llama-3.1-8b-instruct:free" },
    { label: "Mistral 7B", value: "mistralai/mistral-7b-instruct:free" },
  ],
  DEFAULT_MODEL: "qwen/qwen-2.5-coder-32b:free",

  SYSTEM_PROMPT: `You are Claude Code, an expert AI coding assistant that builds React Native and Expo mobile apps.

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
Never use placeholder comments like "// add logic here".`,
};
