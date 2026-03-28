export type AgentType = "claude-code" | "codex" | "junie" | "openclaw";

export const CONFIG = {
  CONVEX_URL: process.env.EXPO_PUBLIC_CONVEX_URL ?? "",
  CLERK_PUBLISHABLE_KEY:
    process.env.EXPO_PUBLIC_CLERK_KEY ??
    "pk_test_bWVhc3VyZWQtYWlyZWRhbGUtNjEuY2xlcmsuYWNjb3VudHMuZGV2JA",
  BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL ?? "http://localhost:3000",
  OPENROUTER_API_KEY:
    process.env.EXPO_PUBLIC_OPENROUTER_KEY ??
    "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",

  AGENTS: [
    {
      id: "claude-code" as AgentType,
      label: "Claude Code",
      icon: "cpu" as const,
      color: "#A855F7",
      model: "qwen/qwen-2.5-coder-32b:free",
    },
    {
      id: "codex" as AgentType,
      label: "Codex CLI",
      icon: "zap" as const,
      color: "#F59E0B",
      model: "openai/gpt-4o",
    },
    {
      id: "junie" as AgentType,
      label: "Junie CLI",
      icon: "box" as const,
      color: "#3B82F6",
      model: "openrouter/auto",
    },
    {
      id: "openclaw" as AgentType,
      label: "OpenClaw",
      icon: "code" as const,
      color: "#22C55E",
      model: "openrouter/auto",
    },
  ],
  DEFAULT_AGENT: "claude-code" as AgentType,

  FREE_MODELS: [
    { label: "Qwen 2.5 Coder (Free)", value: "qwen/qwen-2.5-coder-32b:free" },
    { label: "DeepSeek Coder (Free)", value: "deepseek/deepseek-coder:free" },
    {
      label: "Llama 3.1 8B (Free)",
      value: "meta-llama/llama-3.1-8b-instruct:free",
    },
    { label: "Auto (OpenRouter)", value: "openrouter/auto" },
  ],
  DEFAULT_MODEL: "qwen/qwen-2.5-coder-32b:free",
};
