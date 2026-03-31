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
  | "nemotron"
  | "openclaw"
  | "groq"
  | "perplexity"
  | "cohere"
  | "command"
  | "pixtral";

export type ProviderType = "openrouter" | "e2b" | "groq";

export const E2B_AGENT_MAP: Partial<Record<AgentType, string>> = {
  claude: "claude-code",
  codex: "codex",
  openclaw: "openclaw",
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
- expo-haptics, expo-image-picker, expo-av

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
    // ── E2B Real Sandbox Agents ─────────────────────────────────────────────
    {
      id: "claude" as AgentType,
      label: "Claude Code",
      icon: "cpu",
      color: "#A855F7",
      model: "anthropic/claude-3.5-sonnet",
      fallback: "anthropic/claude-3-haiku",
      description: "صندوق حماية حقيقي · يبني تطبيقات كاملة",
      provider: "e2b" as ProviderType,
      badge: "E2B · Anthropic",
      systemPrompt: CODING_PROMPT,
    },
    {
      id: "codex" as AgentType,
      label: "Codex CLI",
      icon: "terminal",
      color: "#10B981",
      model: "openai/gpt-4o",
      fallback: "openai/gpt-4o-mini",
      description: "صندوق حماية حقيقي · OpenAI Codex",
      provider: "e2b" as ProviderType,
      badge: "E2B · OpenAI",
      systemPrompt: CODING_PROMPT,
    },
    {
      id: "openclaw" as AgentType,
      label: "OpenClaw",
      icon: "git-branch",
      color: "#F43F5E",
      model: "openrouter/auto",
      fallback: "qwen/qwen-2.5-coder-32b:free",
      description: "صندوق حماية حقيقي · متعدد الوكلاء",
      provider: "e2b" as ProviderType,
      badge: "E2B · Multi-Agent",
      systemPrompt: CODING_PROMPT,
    },
    // ── OpenRouter Agents ───────────────────────────────────────────────────
    {
      id: "gemini" as AgentType,
      label: "Gemini 2.5",
      icon: "star",
      color: "#3B82F6",
      model: "google/gemini-2.5-flash-preview:free",
      fallback: "google/gemini-2.0-flash-exp:free",
      description: "Google AI · سريع ومجاني",
      provider: "openrouter" as ProviderType,
      badge: "Google",
      systemPrompt: CODING_PROMPT,
    },
    {
      id: "qwen" as AgentType,
      label: "Qwen 3 Coder",
      icon: "code",
      color: "#22C55E",
      model: "qwen/qwen3-235b-a22b:free",
      fallback: "qwen/qwen-2.5-coder-32b:free",
      description: "أفضل مبرمج مفتوح المصدر",
      provider: "openrouter" as ProviderType,
      badge: "Alibaba",
      systemPrompt: CODING_PROMPT,
    },
    {
      id: "deepseek" as AgentType,
      label: "DeepSeek R1",
      icon: "layers",
      color: "#EF4444",
      model: "deepseek/deepseek-r1:free",
      fallback: "deepseek/deepseek-chat:free",
      description: "تفكير عميق ومنطق متقدم",
      provider: "openrouter" as ProviderType,
      badge: "DeepSeek",
      systemPrompt: REASONING_PROMPT,
    },
    {
      id: "kimi" as AgentType,
      label: "Kimi K2",
      icon: "moon",
      color: "#06B6D4",
      model: "moonshotai/kimi-k2:free",
      fallback: "moonshotai/kimi-k2:free",
      description: "سياق طويل · مليون رمز",
      provider: "openrouter" as ProviderType,
      badge: "Moonshot",
      systemPrompt: CODING_PROMPT,
    },
    {
      id: "llama" as AgentType,
      label: "Llama 4 Scout",
      icon: "box",
      color: "#8B5CF6",
      model: "meta-llama/llama-4-scout:free",
      fallback: "meta-llama/llama-3.3-70b-instruct:free",
      description: "Meta مفتوح المصدر",
      provider: "openrouter" as ProviderType,
      badge: "Meta",
      systemPrompt: CODING_PROMPT,
    },
    {
      id: "groq" as AgentType,
      label: "Groq Llama",
      icon: "zap",
      color: "#F59E0B",
      model: "meta-llama/llama-3.3-70b-versatile:free",
      fallback: "meta-llama/llama-3.1-8b-instant:free",
      description: "Groq · أسرع استجابة",
      provider: "openrouter" as ProviderType,
      badge: "Groq",
      systemPrompt: FAST_PROMPT,
    },
    {
      id: "hermes" as AgentType,
      label: "Hermes 3",
      icon: "feather",
      color: "#F59E0B",
      model: "nousresearch/hermes-3-llama-3.1-70b:free",
      fallback: "nousresearch/hermes-3-llama-3.1-405b:free",
      description: "مضبوط على التعليمات · 70B",
      provider: "openrouter" as ProviderType,
      badge: "NousResearch",
      systemPrompt: CODING_PROMPT,
    },
    {
      id: "mistral" as AgentType,
      label: "Mistral Small",
      icon: "wind",
      color: "#EC4899",
      model: "mistralai/mistral-small:free",
      fallback: "mistralai/mistral-nemo:free",
      description: "Mistral AI · سريع",
      provider: "openrouter" as ProviderType,
      badge: "Mistral",
      systemPrompt: FAST_PROMPT,
    },
    {
      id: "pixtral" as AgentType,
      label: "Pixtral Large",
      icon: "eye",
      color: "#EC4899",
      model: "mistralai/pixtral-large-2411:free",
      fallback: "mistralai/mistral-small:free",
      description: "Mistral · رؤية + كود",
      provider: "openrouter" as ProviderType,
      badge: "Mistral Vision",
      systemPrompt: CODING_PROMPT,
    },
    {
      id: "phi" as AgentType,
      label: "Phi-4",
      icon: "triangle",
      color: "#0EA5E9",
      model: "microsoft/phi-4:free",
      fallback: "microsoft/phi-3-medium-128k-instruct:free",
      description: "Microsoft SLM · فعّال",
      provider: "openrouter" as ProviderType,
      badge: "Microsoft",
      systemPrompt: FAST_PROMPT,
    },
    {
      id: "grok" as AgentType,
      label: "Grok 3 Mini",
      icon: "aperture",
      color: "#F97316",
      model: "x-ai/grok-3-mini-beta:free",
      fallback: "x-ai/grok-3-mini-beta:free",
      description: "xAI · تفكير",
      provider: "openrouter" as ProviderType,
      badge: "xAI",
      systemPrompt: REASONING_PROMPT,
    },
    {
      id: "nemotron" as AgentType,
      label: "Nemotron 70B",
      icon: "activity",
      color: "#76C442",
      model: "nvidia/llama-3.1-nemotron-70b-instruct:free",
      fallback: "meta-llama/llama-3.1-70b-instruct:free",
      description: "NVIDIA مضبوط · 70B",
      provider: "openrouter" as ProviderType,
      badge: "NVIDIA",
      systemPrompt: CODING_PROMPT,
    },
    {
      id: "cohere" as AgentType,
      label: "Command R+",
      icon: "bar-chart",
      color: "#FF7F50",
      model: "cohere/command-r-plus:free",
      fallback: "cohere/command-r:free",
      description: "Cohere · RAG متقدم",
      provider: "openrouter" as ProviderType,
      badge: "Cohere",
      systemPrompt: CODING_PROMPT,
    },
    {
      id: "command" as AgentType,
      label: "GLM Z1 32B",
      icon: "grid",
      color: "#14B8A6",
      model: "thudm/glm-z1-32b:free",
      fallback: "thudm/glm-4-9b:free",
      description: "THUDM · تفكير مفتوح",
      provider: "openrouter" as ProviderType,
      badge: "THUDM",
      systemPrompt: REASONING_PROMPT,
    },
    {
      id: "perplexity" as AgentType,
      label: "Perplexity",
      icon: "search",
      color: "#6366F1",
      model: "perplexity/llama-3.1-sonar-large-128k-online:free",
      fallback: "perplexity/llama-3.1-sonar-small-128k-online:free",
      description: "بحث + كود · في الوقت الفعلي",
      provider: "openrouter" as ProviderType,
      badge: "Perplexity",
      systemPrompt: CODING_PROMPT,
    },
  ] as Agent[],

  DEFAULT_AGENT: "gemini" as AgentType,

  FREE_MODELS: [
    // ── Google ──────────────────────────────────────────────────────────────
    { label: "Gemini 2.5 Flash Preview", value: "google/gemini-2.5-flash-preview:free", badge: "Google" },
    { label: "Gemini 2.0 Flash Exp", value: "google/gemini-2.0-flash-exp:free", badge: "Google" },
    { label: "Gemini Flash 1.5 8B", value: "google/gemini-flash-1.5-8b:free", badge: "Google" },
    { label: "Gemini Flash 1.5", value: "google/gemini-flash-1.5:free", badge: "Google" },
    // ── Anthropic ───────────────────────────────────────────────────────────
    { label: "Claude 3.5 Sonnet", value: "anthropic/claude-3.5-sonnet:free", badge: "Anthropic" },
    { label: "Claude 3.5 Haiku", value: "anthropic/claude-3.5-haiku:free", badge: "Anthropic" },
    { label: "Claude 3 Haiku", value: "anthropic/claude-3-haiku:free", badge: "Anthropic" },
    // ── OpenAI ──────────────────────────────────────────────────────────────
    { label: "GPT-4o", value: "openai/gpt-4o:free", badge: "OpenAI" },
    { label: "GPT-4o Mini", value: "openai/gpt-4o-mini:free", badge: "OpenAI" },
    { label: "o1 Mini", value: "openai/o1-mini:free", badge: "OpenAI" },
    { label: "o3 Mini", value: "openai/o3-mini:free", badge: "OpenAI" },
    // ── Alibaba / Qwen ──────────────────────────────────────────────────────
    { label: "Qwen 3 235B A22B", value: "qwen/qwen3-235b-a22b:free", badge: "Alibaba" },
    { label: "Qwen 3 30B A3B", value: "qwen/qwen3-30b-a3b:free", badge: "Alibaba" },
    { label: "Qwen 2.5 Coder 32B", value: "qwen/qwen-2.5-coder-32b:free", badge: "Alibaba" },
    { label: "Qwen 2.5 72B", value: "qwen/qwen-2.5-72b-instruct:free", badge: "Alibaba" },
    { label: "Qwen 2.5 VL 72B", value: "qwen/qwen-2.5-vl-72b-instruct:free", badge: "Alibaba" },
    // ── DeepSeek ────────────────────────────────────────────────────────────
    { label: "DeepSeek R1", value: "deepseek/deepseek-r1:free", badge: "DeepSeek" },
    { label: "DeepSeek V3", value: "deepseek/deepseek-chat:free", badge: "DeepSeek" },
    { label: "DeepSeek R1 Distill 32B", value: "deepseek/deepseek-r1-distill-qwen-32b:free", badge: "DeepSeek" },
    { label: "DeepSeek R1 Distill Llama 70B", value: "deepseek/deepseek-r1-distill-llama-70b:free", badge: "DeepSeek" },
    { label: "DeepSeek Coder", value: "deepseek/deepseek-coder:free", badge: "DeepSeek" },
    // ── Moonshot ────────────────────────────────────────────────────────────
    { label: "Kimi K2", value: "moonshotai/kimi-k2:free", badge: "Moonshot" },
    // ── Meta / Llama ────────────────────────────────────────────────────────
    { label: "Llama 4 Scout", value: "meta-llama/llama-4-scout:free", badge: "Meta" },
    { label: "Llama 4 Maverick", value: "meta-llama/llama-4-maverick:free", badge: "Meta" },
    { label: "Llama 3.3 70B", value: "meta-llama/llama-3.3-70b-instruct:free", badge: "Meta" },
    { label: "Llama 3.1 70B", value: "meta-llama/llama-3.1-70b-instruct:free", badge: "Meta" },
    { label: "Llama 3.1 8B", value: "meta-llama/llama-3.1-8b-instruct:free", badge: "Meta" },
    // ── NousResearch ────────────────────────────────────────────────────────
    { label: "Hermes 3 70B", value: "nousresearch/hermes-3-llama-3.1-70b:free", badge: "NousResearch" },
    { label: "Hermes 3 405B", value: "nousresearch/hermes-3-llama-3.1-405b:free", badge: "NousResearch" },
    // ── Mistral ─────────────────────────────────────────────────────────────
    { label: "Pixtral Large", value: "mistralai/pixtral-large-2411:free", badge: "Mistral" },
    { label: "Mistral Small", value: "mistralai/mistral-small:free", badge: "Mistral" },
    { label: "Mistral Nemo", value: "mistralai/mistral-nemo:free", badge: "Mistral" },
    { label: "Mistral 7B", value: "mistralai/mistral-7b-instruct:free", badge: "Mistral" },
    { label: "Mixtral 8x7B", value: "mistralai/mixtral-8x7b-instruct:free", badge: "Mistral" },
    // ── Microsoft ───────────────────────────────────────────────────────────
    { label: "Phi-4", value: "microsoft/phi-4:free", badge: "Microsoft" },
    { label: "Phi-3 Medium 128K", value: "microsoft/phi-3-medium-128k-instruct:free", badge: "Microsoft" },
    { label: "Phi-3 Mini 128K", value: "microsoft/phi-3-mini-128k-instruct:free", badge: "Microsoft" },
    // ── xAI ─────────────────────────────────────────────────────────────────
    { label: "Grok 3 Mini", value: "x-ai/grok-3-mini-beta:free", badge: "xAI" },
    { label: "Grok 2", value: "x-ai/grok-2:free", badge: "xAI" },
    // ── NVIDIA ──────────────────────────────────────────────────────────────
    { label: "Nemotron 70B", value: "nvidia/llama-3.1-nemotron-70b-instruct:free", badge: "NVIDIA" },
    { label: "Nemotron Ultra 253B", value: "nvidia/llama-3.3-nemotron-super-49b-v1:free", badge: "NVIDIA" },
    // ── THUDM ───────────────────────────────────────────────────────────────
    { label: "GLM Z1 32B", value: "thudm/glm-z1-32b:free", badge: "THUDM" },
    { label: "GLM-4 9B", value: "thudm/glm-4-9b:free", badge: "THUDM" },
    // ── Cohere ──────────────────────────────────────────────────────────────
    { label: "Command R+", value: "cohere/command-r-plus:free", badge: "Cohere" },
    { label: "Command R", value: "cohere/command-r:free", badge: "Cohere" },
    // ── Perplexity ──────────────────────────────────────────────────────────
    { label: "Sonar Large Online", value: "perplexity/llama-3.1-sonar-large-128k-online:free", badge: "Perplexity" },
    { label: "Sonar Small Online", value: "perplexity/llama-3.1-sonar-small-128k-online:free", badge: "Perplexity" },
    // ── Groq (via OpenRouter) ────────────────────────────────────────────────
    { label: "Llama 3.3 70B (Groq)", value: "groq/llama-3.3-70b-versatile:free", badge: "Groq" },
    { label: "Llama 3.1 8B Instant (Groq)", value: "groq/llama-3.1-8b-instant:free", badge: "Groq" },
    { label: "Gemma 2 9B (Groq)", value: "groq/gemma2-9b-it:free", badge: "Groq" },
    // ── Together AI ─────────────────────────────────────────────────────────
    { label: "Llama 3.1 405B (Together)", value: "together-ai/llama-3.1-405b:free", badge: "Together" },
    { label: "DBRX Instruct", value: "databricks/dbrx-instruct:free", badge: "Databricks" },
    // ── AI21 ────────────────────────────────────────────────────────────────
    { label: "Jamba Instruct", value: "ai21/jamba-instruct:free", badge: "AI21" },
    // ── Inflection ──────────────────────────────────────────────────────────
    { label: "Inflection 3 Pi", value: "inflection/inflection-3-pi:free", badge: "Inflection" },
    // ── Liquid ──────────────────────────────────────────────────────────────
    { label: "LFM 40B MoE", value: "liquid/lfm-40b:free", badge: "Liquid" },
    // ── 01.AI ───────────────────────────────────────────────────────────────
    { label: "Yi Large", value: "01-ai/yi-large:free", badge: "01.AI" },
    { label: "Yi 1.5 34B Chat", value: "01-ai/yi-1.5-34b-chat:free", badge: "01.AI" },
    // ── Nous ────────────────────────────────────────────────────────────────
    { label: "DeepHermes 3 Llama 8B", value: "nousresearch/deephermes-3-llama-3-8b-preview:free", badge: "Nous" },
  ],

  DEFAULT_MODEL: "google/gemini-2.5-flash-preview:free",

  SYSTEM_PROMPT: CODING_PROMPT,
};
