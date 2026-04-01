export type AgentType =
  | "auto"
  | "qwen"
  | "nemotron"
  | "gemma"
  | "hermes"
  | "llama"
  | "minimax"
  | "glm"
  | "qwen_next"
  | "nvidia_nano"
  | "stepfun"
  | "arcee"
  | "qwen_coder";

export type ProviderType = "openrouter" | "e2b" | "groq";

export const E2B_AGENT_MAP: Partial<Record<AgentType, string>> = {};

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
  systemPrompt?: string;
}

const CODING_PROMPT = `You are Vibra Code, an expert AI coding assistant specializing in React Native and Expo mobile apps.

When a user describes an app or asks for code:
1. Think step-by-step about the architecture
2. Write COMPLETE, working code — never truncate or use placeholders
3. Use TypeScript with proper types
4. Follow React Native best practices

Tech stack you use:
- React Native / Expo SDK 54 + TypeScript
- expo-router for navigation
- @tanstack/react-query for server state
- AsyncStorage for local persistence
- @expo/vector-icons (Feather set)
- react-native-safe-area-context
- expo-haptics, expo-image-picker

Code style:
- StyleSheet.create() for all styles
- Functional components with hooks
- Dark theme: background #0A0A0A, accent #6C47FF
- No placeholder comments like "// add logic here"
- Production-ready, no mock data`;

const REASONING_PROMPT = `You are Vibra Code, an advanced reasoning AI for mobile app development.

Before writing code, reason through:
- The user's core requirement
- Best architectural pattern
- Potential edge cases and solutions
- Optimal component structure

Then produce complete, production-ready React Native / Expo SDK 54 code.
Use TypeScript, expo-router, StyleSheet.create(), dark theme (#0A0A0A / #6C47FF accent).
Never use placeholder comments. Always write the full implementation.`;

const FAST_PROMPT = `You are Vibra Code. Build React Native / Expo SDK 54 apps instantly.
Rules: Complete TypeScript code only. Dark theme (#0A0A0A). expo-router navigation. StyleSheet.create() styles. No placeholders.`;

export const CONFIG = {
  OPENROUTER_API_KEY:
    process.env.EXPO_PUBLIC_OPENROUTER_KEY ??
    "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",

  CLERK_PUBLISHABLE_KEY:
    process.env.EXPO_PUBLIC_CLERK_KEY ??
    "pk_test_bWVhc3VyZWQtYWlyZWRhbGUtNjEuY2xlcmsuYWNjb3VudHMuZGV2JA",

  CONVEX_URL:
    process.env.EXPO_PUBLIC_CONVEX_URL ??
    "https://astute-ladybug-398.convex.cloud",

  BACKEND_URL:
    process.env.EXPO_PUBLIC_BACKEND_URL ??
    (process.env.EXPO_PUBLIC_DOMAIN
      ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
      : ""),

  E2B_API_KEY:
    process.env.EXPO_PUBLIC_E2B_KEY ??
    "e2b_51e98476ce3cdfff4768678430d5527df28b169a",

  GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_KEY ?? "",
  ANTHROPIC_API_KEY: process.env.EXPO_PUBLIC_ANTHROPIC_KEY ?? "",
  OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_KEY ?? "",
  MISTRAL_API_KEY: process.env.EXPO_PUBLIC_MISTRAL_KEY ?? "",
  GROQ_API_KEY: process.env.EXPO_PUBLIC_GROQ_KEY ?? "",
  COHERE_API_KEY: process.env.EXPO_PUBLIC_COHERE_KEY ?? "",
  TOGETHER_API_KEY: process.env.EXPO_PUBLIC_TOGETHER_KEY ?? "",
  PERPLEXITY_API_KEY: process.env.EXPO_PUBLIC_PERPLEXITY_KEY ?? "",

  AGENTS: [
    {
      id: "auto" as AgentType,
      label: "Auto Free",
      icon: "zap",
      color: "#6C47FF",
      model: "openrouter/free",
      fallback: "qwen/qwen3.6-plus-preview:free",
      description: "يختار أفضل نموذج مجاني تلقائياً",
      provider: "openrouter" as ProviderType,
      badge: "Auto",
      systemPrompt: CODING_PROMPT,
    },
    {
      id: "qwen" as AgentType,
      label: "Qwen 3 Coder",
      icon: "code",
      color: "#22C55E",
      model: "qwen/qwen3-coder:free",
      fallback: "openrouter/free",
      description: "Qwen3 Coder 480B · أفضل للكود",
      provider: "openrouter" as ProviderType,
      badge: "Alibaba",
      systemPrompt: CODING_PROMPT,
    },
    {
      id: "qwen_next" as AgentType,
      label: "Qwen3.6 Plus",
      icon: "star",
      color: "#3B82F6",
      model: "qwen/qwen3.6-plus-preview:free",
      fallback: "openrouter/free",
      description: "Qwen 3.6 Plus · متقدم ومجاني",
      provider: "openrouter" as ProviderType,
      badge: "Alibaba",
      systemPrompt: CODING_PROMPT,
    },
    {
      id: "nemotron" as AgentType,
      label: "Nemotron 120B",
      icon: "activity",
      color: "#76C442",
      model: "nvidia/nemotron-3-super-120b-a12b:free",
      fallback: "openrouter/free",
      description: "NVIDIA 120B · قوة عالية",
      provider: "openrouter" as ProviderType,
      badge: "NVIDIA",
      systemPrompt: CODING_PROMPT,
    },
    {
      id: "gemma" as AgentType,
      label: "Gemma 3 27B",
      icon: "star",
      color: "#4285F4",
      model: "google/gemma-3-27b-it:free",
      fallback: "openrouter/free",
      description: "Google Gemma 3 · مفتوح المصدر",
      provider: "openrouter" as ProviderType,
      badge: "Google",
      systemPrompt: CODING_PROMPT,
    },
    {
      id: "hermes" as AgentType,
      label: "Hermes 3 405B",
      icon: "feather",
      color: "#F59E0B",
      model: "nousresearch/hermes-3-llama-3.1-405b:free",
      fallback: "openrouter/free",
      description: "Nous Hermes 405B · ضخم",
      provider: "openrouter" as ProviderType,
      badge: "NousResearch",
      systemPrompt: CODING_PROMPT,
    },
    {
      id: "llama" as AgentType,
      label: "Llama 3.3 70B",
      icon: "box",
      color: "#8B5CF6",
      model: "meta-llama/llama-3.3-70b-instruct:free",
      fallback: "openrouter/free",
      description: "Meta Llama 3.3 · مفتوح المصدر",
      provider: "openrouter" as ProviderType,
      badge: "Meta",
      systemPrompt: CODING_PROMPT,
    },
    {
      id: "nvidia_nano" as AgentType,
      label: "Nemotron Nano",
      icon: "cpu",
      color: "#10B981",
      model: "nvidia/nemotron-nano-12b-v2-vl:free",
      fallback: "openrouter/free",
      description: "NVIDIA 12B رؤية + كود",
      provider: "openrouter" as ProviderType,
      badge: "NVIDIA Vision",
      systemPrompt: CODING_PROMPT,
    },
    {
      id: "glm" as AgentType,
      label: "GLM 4.5 Air",
      icon: "grid",
      color: "#14B8A6",
      model: "z-ai/glm-4.5-air:free",
      fallback: "openrouter/free",
      description: "Z.ai GLM 4.5 · سريع",
      provider: "openrouter" as ProviderType,
      badge: "Z.ai",
      systemPrompt: REASONING_PROMPT,
    },
    {
      id: "minimax" as AgentType,
      label: "MiniMax M2.5",
      icon: "layers",
      color: "#EF4444",
      model: "minimax/minimax-m2.5:free",
      fallback: "openrouter/free",
      description: "MiniMax M2.5 · سياق طويل",
      provider: "openrouter" as ProviderType,
      badge: "MiniMax",
      systemPrompt: CODING_PROMPT,
    },
    {
      id: "stepfun" as AgentType,
      label: "Step 3.5 Flash",
      icon: "wind",
      color: "#EC4899",
      model: "stepfun/step-3.5-flash:free",
      fallback: "openrouter/free",
      description: "StepFun Flash · خفيف وسريع",
      provider: "openrouter" as ProviderType,
      badge: "StepFun",
      systemPrompt: FAST_PROMPT,
    },
    {
      id: "arcee" as AgentType,
      label: "Trinity Large",
      icon: "triangle",
      color: "#0EA5E9",
      model: "arcee-ai/trinity-large-preview:free",
      fallback: "openrouter/free",
      description: "Arcee AI Trinity · متعدد المهام",
      provider: "openrouter" as ProviderType,
      badge: "Arcee AI",
      systemPrompt: FAST_PROMPT,
    },
    {
      id: "qwen_coder" as AgentType,
      label: "Qwen3 Next 80B",
      icon: "terminal",
      color: "#F97316",
      model: "qwen/qwen3-next-80b-a3b-instruct:free",
      fallback: "openrouter/free",
      description: "Qwen 3 Next 80B · توازن مثالي",
      provider: "openrouter" as ProviderType,
      badge: "Alibaba",
      systemPrompt: CODING_PROMPT,
    },
  ] as Agent[],

  DEFAULT_AGENT: "auto" as AgentType,

  FREE_MODELS: [
    { label: "🔀 Auto (أفضل نموذج تلقائياً)", value: "openrouter/free", badge: "Auto" },
    { label: "Qwen 3.6 Plus Preview", value: "qwen/qwen3.6-plus-preview:free", badge: "Alibaba" },
    { label: "Qwen 3 Coder 480B", value: "qwen/qwen3-coder:free", badge: "Alibaba" },
    { label: "Qwen3 Next 80B", value: "qwen/qwen3-next-80b-a3b-instruct:free", badge: "Alibaba" },
    { label: "NVIDIA Nemotron 120B Super", value: "nvidia/nemotron-3-super-120b-a12b:free", badge: "NVIDIA" },
    { label: "NVIDIA Nemotron Nano 30B", value: "nvidia/nemotron-3-nano-30b-a3b:free", badge: "NVIDIA" },
    { label: "NVIDIA Nemotron Nano 12B VL", value: "nvidia/nemotron-nano-12b-v2-vl:free", badge: "NVIDIA" },
    { label: "NVIDIA Nemotron Nano 9B", value: "nvidia/nemotron-nano-9b-v2:free", badge: "NVIDIA" },
    { label: "Google Gemma 3 27B", value: "google/gemma-3-27b-it:free", badge: "Google" },
    { label: "Google Gemma 3 12B", value: "google/gemma-3-12b-it:free", badge: "Google" },
    { label: "Google Gemma 3 4B", value: "google/gemma-3-4b-it:free", badge: "Google" },
    { label: "Google Gemma 3n 4B", value: "google/gemma-3n-e4b-it:free", badge: "Google" },
    { label: "Meta Llama 3.3 70B", value: "meta-llama/llama-3.3-70b-instruct:free", badge: "Meta" },
    { label: "Meta Llama 3.2 3B", value: "meta-llama/llama-3.2-3b-instruct:free", badge: "Meta" },
    { label: "Nous Hermes 3 405B", value: "nousresearch/hermes-3-llama-3.1-405b:free", badge: "NousResearch" },
    { label: "MiniMax M2.5", value: "minimax/minimax-m2.5:free", badge: "MiniMax" },
    { label: "Z.ai GLM 4.5 Air", value: "z-ai/glm-4.5-air:free", badge: "Z.ai" },
    { label: "StepFun Step 3.5 Flash", value: "stepfun/step-3.5-flash:free", badge: "StepFun" },
    { label: "Arcee AI Trinity Large", value: "arcee-ai/trinity-large-preview:free", badge: "Arcee AI" },
    { label: "Arcee AI Trinity Mini", value: "arcee-ai/trinity-mini:free", badge: "Arcee AI" },
    { label: "LiquidAI LFM2.5 Thinking", value: "liquid/lfm-2.5-1.2b-thinking:free", badge: "Liquid" },
    { label: "LiquidAI LFM2.5 Instruct", value: "liquid/lfm-2.5-1.2b-instruct:free", badge: "Liquid" },
    { label: "Venice Uncensored 24B", value: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free", badge: "Venice" },
  ],

  DEFAULT_MODEL: "openrouter/free",

  SYSTEM_PROMPT: CODING_PROMPT,
};
