export type AgentType = "claude-code" | "codex" | "gemini" | "cursor";

export const CONFIG = {
  // OpenRouter — free AI models
  OPENROUTER_API_KEY:
    process.env.EXPO_PUBLIC_OPENROUTER_KEY ??
    "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",
  OPENROUTER_BASE_URL: "https://openrouter.ai/api/v1",

  // Clerk Auth
  CLERK_PUBLISHABLE_KEY:
    process.env.EXPO_PUBLIC_CLERK_KEY ??
    "pk_test_bWVhc3VyZWQtYWlyZWRhbGUtNjEuY2xlcmsuYWNjb3VudHMuZGV2JA",

  // Backend
  BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL ?? "",
  E2B_API_KEY: process.env.EXPO_PUBLIC_E2B_KEY ?? "e2b_51e98476ce3cdfff4768678430d5527df28b169a",

  // AI Agents (matching Vibra Code original)
  AGENTS: [
    {
      id: "claude-code" as AgentType,
      label: "Claude Code",
      icon: "cpu" as const,
      color: "#A855F7",
      model: "anthropic/claude-3.5-sonnet:free",
      fallback: "qwen/qwen-2.5-coder-32b:free",
    },
    {
      id: "codex" as AgentType,
      label: "Cursor",
      icon: "zap" as const,
      color: "#F59E0B",
      model: "deepseek/deepseek-coder:free",
      fallback: "deepseek/deepseek-coder:free",
    },
    {
      id: "gemini" as AgentType,
      label: "Gemini",
      icon: "star" as const,
      color: "#3B82F6",
      model: "google/gemini-2.0-flash-exp:free",
      fallback: "meta-llama/llama-3.1-8b-instruct:free",
    },
    {
      id: "cursor" as AgentType,
      label: "Qwen Coder",
      icon: "code" as const,
      color: "#22C55E",
      model: "qwen/qwen-2.5-coder-32b:free",
      fallback: "qwen/qwen-2.5-coder-32b:free",
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

  SYSTEM_PROMPT: `You are Claude Code, an expert AI coding assistant specialized in building React Native and Expo mobile apps. 

When the user describes an app:
1. First outline a TASKS list with 3-4 specific tasks
2. Then describe the files you'll create (Read/Edit operations)  
3. Generate clean, production-ready code
4. Explain what was built

You build apps using:
- React Native / Expo (SDK 54)
- TypeScript
- expo-router for navigation
- @tanstack/react-query for data fetching
- AsyncStorage for persistence
- @expo/vector-icons for icons

Always write complete, working code. Use markdown code blocks for code.`,
};
