import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useChat } from "../context/ChatContext";

const { width: SCREEN_W } = Dimensions.get("window");
const IS_TABLET = SCREEN_W >= 768;

interface Skill {
  id: string;
  title: string;
  description: string;
  prompt: string;
  icon: string;
  color: string;
  category: string;
  free: boolean;
  custom?: boolean;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  url: string;
  badge: string;
  connected: boolean;
  free: boolean;
}

const DEFAULT_SKILLS: Skill[] = [
  // ── تطوير ──────────────────────────────────────────────────────────────────
  {
    id: "code-review",
    title: "مراجعة الكود",
    description: "راجع كودك وأصلح الأخطاء والثغرات الأمنية",
    prompt: "قم بمراجعة شاملة للكود التالي وأعطني: 1) الأخطاء والثغرات 2) تحسينات الأداء 3) أفضل الممارسات المفقودة 4) كود مُحسَّن وجاهز للإنتاج",
    icon: "check-circle", color: "#22C55E", category: "تطوير", free: true,
  },
  {
    id: "unit-tests",
    title: "اختبارات تلقائية",
    description: "توليد اختبارات Jest/Vitest كاملة",
    prompt: "اكتب اختبارات وحدة شاملة باستخدام Jest وReact Testing Library. شمّل edge cases وmocking وsnapshot tests.",
    icon: "shield", color: "#3B82F6", category: "تطوير", free: true,
  },
  {
    id: "docs-gen",
    title: "توثيق تلقائي",
    description: "أضف JSDoc وREADME تلقائياً",
    prompt: "أضف توثيقاً شاملاً: JSDoc لكل دالة، README.md مُفصَّل، أمثلة استخدام عملية، وتوثيق API.",
    icon: "book-open", color: "#8B5CF6", category: "تطوير", free: true,
  },
  {
    id: "refactor",
    title: "إعادة هيكلة",
    description: "حسّن قابلية القراءة والصيانة",
    prompt: "أعِد هيكلة هذا الكود: استخدم تسميات واضحة، افصل المخاوف، طبّق SOLID principles، قلّل التعقيد الدوري.",
    icon: "refresh-cw", color: "#F59E0B", category: "تطوير", free: true,
  },
  {
    id: "translate-code",
    title: "ترجمة الكود",
    description: "حوّل الكود بين لغات البرمجة",
    prompt: "حوّل هذا الكود مع الحفاظ على نفس المنطق والأداء. اشرح الفروقات الرئيسية والـ idioms الخاصة بكل لغة.",
    icon: "repeat", color: "#0EA5E9", category: "تطوير", free: true,
  },
  {
    id: "debug-fix",
    title: "تصحيح الأخطاء",
    description: "حدّد وأصلح الـ bugs تلقائياً",
    prompt: "حلّل هذا الخطأ بعمق: 1) ما السبب الجذري؟ 2) لماذا يحدث هذا؟ 3) ما الإصلاح الكامل؟ 4) كيف أمنع حدوثه مستقبلاً؟",
    icon: "tool", color: "#EF4444", category: "تطوير", free: true,
  },
  {
    id: "type-safety",
    title: "TypeScript Strict",
    description: "أضف أنواع TypeScript صارمة",
    prompt: "حوّل هذا الكود إلى TypeScript strict mode: أضف interfaces وtypes وgenerics وenums. استخدم Zod للتحقق من البيانات. أزل جميع any types.",
    icon: "code", color: "#3B82F6", category: "تطوير", free: true,
  },
  {
    id: "git-workflow",
    title: "Git Workflow",
    description: "نظام Git احترافي مع Conventional Commits",
    prompt: "ساعدني في إعداد Git workflow احترافي: Conventional Commits، Git hooks مع Husky، Commitlint، Semantic Versioning تلقائي، وCHANGELOG.",
    icon: "git-branch", color: "#F97316", category: "تطوير", free: true,
  },

  // ── بناء تطبيقات ───────────────────────────────────────────────────────────
  {
    id: "expo-app",
    title: "تطبيق Expo كامل",
    description: "أنشئ تطبيقاً كاملاً بـ Expo + TypeScript",
    prompt: "أنشئ تطبيق React Native كامل بـ Expo SDK 54 + TypeScript: Navigation بـ expo-router، UI حديث dark mode، State Management، API Integration، Push Notifications، Offline Support.",
    icon: "smartphone", color: "#06B6D4", category: "موبايل", free: true,
  },
  {
    id: "nextjs-app",
    title: "Next.js 15 App",
    description: "تطبيق Next.js بـ App Router + shadcn/ui",
    prompt: "أنشئ تطبيق Next.js 15 كامل: App Router، shadcn/ui components، Tailwind CSS v4، Server Actions، React Server Components، Auth.js للمصادقة، Prisma + PostgreSQL.",
    icon: "triangle", color: "#EEE", category: "ويب", free: true,
  },
  {
    id: "react-vite",
    title: "React + Vite SPA",
    description: "تطبيق React سريع بـ Vite + TanStack",
    prompt: "أنشئ React SPA بـ Vite: TanStack Router، TanStack Query، Zustand، shadcn/ui، Tailwind، React Hook Form + Zod، Vitest للاختبارات.",
    icon: "zap", color: "#F59E0B", category: "ويب", free: true,
  },
  {
    id: "api-design",
    title: "REST API Express",
    description: "بناء API بـ Express + TypeScript + Zod",
    prompt: "صمّم REST API بـ Express + TypeScript: Routes، Middleware، Error Handling، Validation بـ Zod، OpenAPI/Swagger Docs، Rate Limiting، JWT Auth، Prisma ORM.",
    icon: "server", color: "#EF4444", category: "backend", free: true,
  },
  {
    id: "fastapi",
    title: "FastAPI Python",
    description: "API سريع بـ Python FastAPI + SQLModel",
    prompt: "أنشئ FastAPI project كامل: SQLModel + Alembic migrations، JWT authentication، Pydantic v2 schemas، Background tasks، WebSocket support، Docker setup، pytest tests.",
    icon: "server", color: "#009688", category: "backend", free: true,
  },
  {
    id: "trpc-stack",
    title: "tRPC Full Stack",
    description: "Type-safe API بـ tRPC + Drizzle + Next.js",
    prompt: "أنشئ full-stack app بـ tRPC: Next.js 15 + tRPC v11 + Drizzle ORM + PostgreSQL + Clerk Auth + Tanstack Query. كل شيء type-safe end-to-end.",
    icon: "layers", color: "#3B82F6", category: "full-stack", free: true,
  },
  {
    id: "graphql-api",
    title: "GraphQL API",
    description: "API بـ GraphQL + Apollo Server + Prisma",
    prompt: "أنشئ GraphQL API: Apollo Server 4 + Prisma ORM + DataLoader للأداء + subscriptions real-time + authentication + rate limiting + error handling.",
    icon: "share-2", color: "#E535AB", category: "backend", free: true,
  },
  {
    id: "ui-component",
    title: "مكوّن UI متقدم",
    description: "مكوّنات React Native مع Animations",
    prompt: "أنشئ مكوّن React Native متقدم: TypeScript Props، Reanimated 3 Animations، Gesture Handler، Dark/Light Mode، RTL Support، Accessibility (a11y)، Storybook story.",
    icon: "layers", color: "#EC4899", category: "موبايل", free: true,
  },
  {
    id: "shadcn-ui",
    title: "shadcn/ui Design System",
    description: "نظام تصميم كامل بـ shadcn/ui",
    prompt: "أنشئ Design System شاملاً بـ shadcn/ui + Tailwind CSS v4: Custom theme، Dark mode، Typography scale، Color palette، Component variants، Storybook documentation.",
    icon: "layout", color: "#8B5CF6", category: "ويب", free: true,
  },

  // ── قواعد البيانات ──────────────────────────────────────────────────────────
  {
    id: "prisma-schema",
    title: "Prisma Schema",
    description: "قاعدة بيانات Prisma + PostgreSQL كاملة",
    prompt: "صمّم Prisma schema شاملاً: relations، indexes، soft delete، timestamps، migrations، seeding، مع query optimization وPrisma Client type safety.",
    icon: "database", color: "#4A90D9", category: "قاعدة بيانات", free: true,
  },
  {
    id: "drizzle-orm",
    title: "Drizzle ORM",
    description: "Type-safe SQL بـ Drizzle + PostgreSQL",
    prompt: "أنشئ Drizzle ORM setup: schema definitions، relations، migrations، queries، transactions، connection pooling، وtype-safe operations مع TypeScript.",
    icon: "database", color: "#C5F74F", category: "قاعدة بيانات", free: true,
  },
  {
    id: "db-schema",
    title: "Convex Database",
    description: "Schema + Queries + Mutations + Real-time",
    prompt: "صمّم Convex database كاملة: Schema definitions، Queries، Mutations، Actions، Real-time subscriptions، Indexes، File storage، Cron jobs.",
    icon: "database", color: "#76C442", category: "قاعدة بيانات", free: true,
  },
  {
    id: "supabase-full",
    title: "Supabase Full Stack",
    description: "Auth + DB + Storage + Real-time بـ Supabase",
    prompt: "أنشئ Supabase project كامل: PostgreSQL schema، Row Level Security (RLS)، Auth مع Social Login، Storage buckets، Real-time subscriptions، Edge Functions.",
    icon: "layers", color: "#10B981", category: "قاعدة بيانات", free: true,
  },
  {
    id: "redis-cache",
    title: "Redis Caching",
    description: "تخزين مؤقت احترافي بـ Redis + Upstash",
    prompt: "أضف Redis caching احترافياً: Cache-aside pattern، Write-through، Cache invalidation، Rate limiting، Session storage، Pub/Sub، مع Upstash Redis للسحابة.",
    icon: "database", color: "#DC382D", category: "قاعدة بيانات", free: true,
  },

  // ── Real-time ────────────────────────────────────────────────────────────────
  {
    id: "socketio",
    title: "Socket.io Real-time",
    description: "دردشة وإشعارات فورية بـ Socket.io",
    prompt: "أنشئ Socket.io server + client: Rooms، Namespaces، Authentication، Broadcasting، Presence system، Typing indicators، Message delivery receipts، reconnection handling.",
    icon: "radio", color: "#F3E500", category: "real-time", free: true,
  },
  {
    id: "webrtc",
    title: "WebRTC Video Calls",
    description: "مكالمات فيديو بـ WebRTC + Daily.co",
    prompt: "أنشئ video calling feature: WebRTC peer connections، Daily.co/LiveKit integration، Screen sharing، Mute controls، Room management، Recording، Mobile support.",
    icon: "video", color: "#00D4AA", category: "real-time", free: true,
  },
  {
    id: "pusher-realtime",
    title: "Pusher Channels",
    description: "إشعارات فورية بـ Pusher + Ably",
    prompt: "أضف real-time notifications بـ Pusher: Channel subscriptions، Private channels، Presence channels، Event triggers من Backend، Webhook events.",
    icon: "bell", color: "#300D4F", category: "real-time", free: true,
  },

  // ── AI وذكاء اصطناعي ────────────────────────────────────────────────────────
  {
    id: "langchain",
    title: "LangChain Agent",
    description: "بناء وكيل ذكي بـ LangChain",
    prompt: "استخدم LangChain لبناء وكيل ذكاء اصطناعي: Tools، Memory، Chains، RAG pipeline، Vector store، OpenRouter للنماذج، Streaming responses.",
    icon: "link", color: "#F59E0B", category: "ذكاء اصطناعي", free: true,
  },
  {
    id: "llamaindex",
    title: "LlamaIndex RAG",
    description: "بناء RAG pipeline بـ LlamaIndex",
    prompt: "أنشئ RAG (Retrieval Augmented Generation) pipeline بـ LlamaIndex: Document loading، Chunking، Embeddings، Vector store (Chroma/Pinecone)، Query engine، Response synthesis.",
    icon: "book", color: "#7C3AED", category: "ذكاء اصطناعي", free: true,
  },
  {
    id: "autogen",
    title: "AutoGen Multi-Agent",
    description: "نظام متعدد الوكلاء بـ AutoGen",
    prompt: "بناء نظام AutoGen multi-agent: AssistantAgent + UserProxyAgent + GroupChat. CoderAgent، ReviewerAgent، PlannerAgent للتعاون في حل المشكلات البرمجية.",
    icon: "users", color: "#8B5CF6", category: "ذكاء اصطناعي", free: true,
  },
  {
    id: "crewai",
    title: "CrewAI Workflow",
    description: "فريق وكلاء متخصصين بـ CrewAI",
    prompt: "أنشئ CrewAI workflow: ResearchAgent + CoderAgent + ReviewerAgent + WriterAgent. كل وكيل له role، goal، backstory، tools محددة. استخدم Sequential/Hierarchical process.",
    icon: "cpu", color: "#EC4899", category: "ذكاء اصطناعي", free: true,
  },
  {
    id: "dspy",
    title: "DSPy Programming",
    description: "برمجة LLM بـ DSPy من Stanford",
    prompt: "استخدم DSPy لبناء LLM programs: Signatures، Modules (Predict، ChainOfThought، ReAct)، Optimizers (BootstrapFewShot، MIPRO)، Evaluation metrics، Compilation.",
    icon: "cpu", color: "#1E88E5", category: "ذكاء اصطناعي", free: true,
  },
  {
    id: "pydantic-ai",
    title: "Pydantic AI Agent",
    description: "وكلاء آمنة بـ Pydantic AI",
    prompt: "أنشئ Pydantic AI agent: Type-safe structured outputs، Tool definitions، Agent dependencies، Result validators، Streaming، Multi-turn conversations، Retry logic.",
    icon: "shield", color: "#E92B2B", category: "ذكاء اصطناعي", free: true,
  },
  {
    id: "opendevin",
    title: "SWE-Agent Pattern",
    description: "وكيل برمجة تلقائية بنمط SWE-bench",
    prompt: "طبّق SWE-agent pattern: قراءة codebase، فهم المشكلة، التخطيط، تنفيذ التعديلات، تشغيل الاختبارات، التحقق من الحل. استخدم نفس نهج Stanford SWE-bench.",
    icon: "terminal", color: "#22C55E", category: "ذكاء اصطناعي", free: true,
  },
  {
    id: "babyagi",
    title: "BabyAGI Task Manager",
    description: "نظام مهام ذاتي بنمط BabyAGI",
    prompt: "أنشئ BabyAGI-style task manager: Task creation، Prioritization، Execution، Result storage، New task generation. استخدم LLM للتخطيط والتنفيذ الذاتي.",
    icon: "list", color: "#FF6B6B", category: "ذكاء اصطناعي", free: true,
  },
  {
    id: "instructor",
    title: "Instructor Structured Output",
    description: "استخراج بيانات منظمة بـ Instructor",
    prompt: "استخدم Instructor library لاستخراج بيانات منظمة من النصوص: Pydantic models، Validation، Retry logic، Partial streaming، Multi-label classification.",
    icon: "filter", color: "#FF9800", category: "ذكاء اصطناعي", free: true,
  },
  {
    id: "semantic-kernel",
    title: "Semantic Kernel",
    description: "إطار AI من Microsoft بـ .NET/Python",
    prompt: "استخدم Microsoft Semantic Kernel: Plugins، Planners، Memory stores، AI connectors، Prompt templates، Function calling، Agents. دمج مع Azure OpenAI أو OpenRouter.",
    icon: "cpu", color: "#0078D4", category: "ذكاء اصطناعي", free: true,
  },
  {
    id: "tree-of-thoughts",
    title: "Tree of Thoughts",
    description: "استدلال متقدم بـ Tree of Thoughts",
    prompt: "طبّق Tree of Thoughts (ToT): BFS/DFS للتفكير، Value estimation لكل خطوة، Backtracking، Multiple reasoning paths، Final answer synthesis. أفضل من Chain-of-Thought.",
    icon: "git-branch", color: "#9333EA", category: "ذكاء اصطناعي", free: true,
  },
  {
    id: "reflexion",
    title: "Reflexion Agent",
    description: "وكيل بتعلم ذاتي بـ Reflexion",
    prompt: "أنشئ Reflexion agent: Actor يحاول، Evaluator يقيّم، Self-Reflection يتعلم من الأخطاء، Memory buffer للتجارب السابقة. يتحسن تلقائياً من خلال التكرار.",
    icon: "rotate-cw", color: "#06B6D4", category: "ذكاء اصطناعي", free: true,
  },
  {
    id: "react-agent",
    title: "ReAct Agent",
    description: "وكيل Reasoning + Acting",
    prompt: "أنشئ ReAct agent: Thought (تفكير) → Action (تنفيذ) → Observation (ملاحظة). أضف tools: web search، code execution، calculator، file reader. Streaming output.",
    icon: "zap", color: "#F43F5E", category: "ذكاء اصطناعي", free: true,
  },
  {
    id: "embeddings-rag",
    title: "Embeddings + Vector DB",
    description: "RAG بـ Embeddings + Chroma/Pinecone",
    prompt: "أنشئ Embeddings pipeline: Document chunking، Embedding generation، Vector store (Chroma أو Pinecone أو Qdrant)، Semantic search، MMR retrieval، Reranking.",
    icon: "database", color: "#10B981", category: "ذكاء اصطناعي", free: true,
  },
  {
    id: "multimodal-ai",
    title: "Multimodal AI",
    description: "معالجة الصور والصوت والنص معاً",
    prompt: "أنشئ multimodal AI pipeline: Image + Text understanding بـ GPT-4V/Gemini Vision، Audio transcription بـ Whisper، Document parsing، Video analysis، Structured extraction.",
    icon: "image", color: "#F59E0B", category: "ذكاء اصطناعي", free: true,
  },
  {
    id: "fine-tuning",
    title: "Fine-tuning Pipeline",
    description: "تدريب نماذج مخصصة بـ LoRA/QLoRA",
    prompt: "أعدّ Fine-tuning pipeline: Dataset preparation، LoRA/QLoRA config، Training بـ Unsloth، Evaluation metrics، Model merging، Quantization، Deployment بـ vLLM.",
    icon: "sliders", color: "#8B5CF6", category: "ذكاء اصطناعي", free: true,
  },

  // ── المصادقة والأمان ────────────────────────────────────────────────────────
  {
    id: "clerk-auth",
    title: "Clerk Authentication",
    description: "مصادقة متكاملة بـ Clerk",
    prompt: "أضف Clerk auth كاملاً: Social login (Google، GitHub، Apple)، Magic links، OTP، MFA، Webhooks، Organizations، Role-based permissions، Middleware protection.",
    icon: "user-check", color: "#6C47FF", category: "أمان", free: true,
  },
  {
    id: "auth-js",
    title: "Auth.js (NextAuth v5)",
    description: "مصادقة Next.js بـ Auth.js v5",
    prompt: "أضف Auth.js v5 لـ Next.js: Credentials provider، GitHub/Google OAuth، Database sessions بـ Prisma، JWT، Callbacks، Protected routes، Role system.",
    icon: "lock", color: "#EEE", category: "أمان", free: true,
  },
  {
    id: "security",
    title: "تدقيق الأمان",
    description: "فحص ثغرات الأمان الشاملة",
    prompt: "افحص أمنياً بـ OWASP: SQL Injection، XSS، CSRF، Insecure Direct Object Reference، API key exposure، Auth bypass، Race conditions، وقدّم الإصلاحات الفورية.",
    icon: "shield", color: "#EF4444", category: "أمان", free: true,
  },
  {
    id: "rbac",
    title: "Role-Based Access Control",
    description: "نظام صلاحيات متقدم RBAC + ABAC",
    prompt: "أنشئ نظام RBAC كامل: Roles، Permissions، Resource-based rules، Middleware، API protection، UI conditional rendering، Audit logging، مع Casbin أو Oso.",
    icon: "user-check", color: "#F97316", category: "أمان", free: true,
  },

  // ── DevOps ───────────────────────────────────────────────────────────────────
  {
    id: "cicd",
    title: "GitHub Actions CI/CD",
    description: "Pipeline نشر تلقائي احترافي",
    prompt: "أنشئ GitHub Actions workflow: Tests، ESLint، TypeScript check، EAS Build لـ Android/iOS، Deploy Next.js لـ Vercel، Docker build وpush، Slack notifications.",
    icon: "git-merge", color: "#F97316", category: "DevOps", free: true,
  },
  {
    id: "docker-compose",
    title: "Docker Compose Stack",
    description: "بيئة تطوير كاملة بـ Docker",
    prompt: "أنشئ Docker Compose stack كامل: App container، PostgreSQL، Redis، Nginx reverse proxy، SSL، Health checks، Environment variables، Development + Production configs.",
    icon: "box", color: "#2496ED", category: "DevOps", free: true,
  },
  {
    id: "terraform",
    title: "Terraform IaC",
    description: "بنية تحتية كـ كود بـ Terraform",
    prompt: "أنشئ Terraform configuration: AWS/GCP/Azure resources، VPC، ECS/GKE، RDS، S3، CloudFront، Variables، Outputs، Modules، Remote state بـ S3.",
    icon: "server", color: "#7B42BC", category: "DevOps", free: true,
  },
  {
    id: "kubernetes",
    title: "Kubernetes Deployment",
    description: "نشر على Kubernetes بـ Helm",
    prompt: "أنشئ Kubernetes manifests: Deployment، Service، Ingress، ConfigMap، Secrets، HPA autoscaling، PersistentVolume، Helm chart، Kustomize overlays.",
    icon: "cloud", color: "#326CE5", category: "DevOps", free: true,
  },
  {
    id: "turborepo",
    title: "Turborepo Monorepo",
    description: "Monorepo سريع بـ Turborepo + pnpm",
    prompt: "أعدّ Turborepo monorepo: pnpm workspaces، shared packages، Pipeline tasks، Remote caching، TypeScript project references، Changeset for versioning.",
    icon: "package", color: "#FF1E56", category: "DevOps", free: true,
  },

  // ── الأداء ───────────────────────────────────────────────────────────────────
  {
    id: "perf-opt",
    title: "تحسين الأداء",
    description: "تحليل وتحسين أداء التطبيق",
    prompt: "حلّل وحسّن الأداء: React.memo/useMemo/useCallback، FlatList optimizations، Bundle splitting، Lazy loading، Network caching، Image optimization، Lighthouse score.",
    icon: "zap", color: "#10B981", category: "أداء", free: true,
  },
  {
    id: "core-web-vitals",
    title: "Core Web Vitals",
    description: "تحسين LCP وFID وCLS",
    prompt: "حسّن Core Web Vitals: LCP < 2.5s، FID < 100ms، CLS < 0.1. Image optimization، Font loading، Critical CSS، Resource hints، Server-side rendering.",
    icon: "activity", color: "#4CAF50", category: "أداء", free: true,
  },
  {
    id: "react-native-perf",
    title: "React Native Performance",
    description: "تحسين أداء تطبيق الموبايل",
    prompt: "حسّن أداء React Native: Hermes engine، New Architecture، Reanimated 3 worklets، Flash List، Image caching، Bundle size، JS thread optimization.",
    icon: "trending-up", color: "#FF6B35", category: "أداء", free: true,
  },

  // ── الدفع والتجارة ────────────────────────────────────────────────────────────
  {
    id: "stripe",
    title: "Stripe Payments",
    description: "دفع إلكتروني كامل بـ Stripe",
    prompt: "أضف Stripe كاملاً: Checkout، Payment intents، Subscriptions، Webhooks، Customer portal، Refunds، Multiple currencies، Mobile payments (Apple/Google Pay).",
    icon: "credit-card", color: "#635BFF", category: "تجارة", free: true,
  },
  {
    id: "revenuecat",
    title: "RevenueCat Subscriptions",
    description: "اشتراكات موبايل بـ RevenueCat",
    prompt: "أضف RevenueCat للموبايل: In-app purchases، Subscriptions، Free trial، Paywall UI، Purchase restoration، Entitlements، A/B testing للأسعار.",
    icon: "dollar-sign", color: "#F04E23", category: "تجارة", free: true,
  },

  // ── Cursor Rules من GitHub ─────────────────────────────────────────────────
  {
    id: "cursor-rules-expo",
    title: "Cursor Rules - Expo",
    description: "قواعد Cursor AI لتطوير Expo",
    prompt: "طبّق Cursor AI rules لـ Expo: استخدم expo-router للnavigation، @expo/vector-icons للأيقونات، expo-image للصور، react-native-reanimated للanimations، NativeWind أو StyleSheet للتنسيق. لا تستخدم deprecated APIs.",
    icon: "edit", color: "#A855F7", category: "أدوات AI", free: true,
  },
  {
    id: "cursor-rules-nextjs",
    title: "Cursor Rules - Next.js",
    description: "قواعد Cursor AI لـ Next.js 15",
    prompt: "طبّق Cursor rules لـ Next.js 15: App Router فقط، Server Components بالافتراضي، استخدم 'use client' فقط عند الحاجة، Server Actions، Metadata API، Image Optimization، Streaming UI.",
    icon: "edit", color: "#EEE", category: "أدوات AI", free: true,
  },
  {
    id: "cursor-rules-python",
    title: "Cursor Rules - Python",
    description: "قواعد Cursor AI لـ Python احترافي",
    prompt: "طبّق Cursor rules لـ Python: Type hints دائماً، Pydantic للdata validation، async/await، Ruff للـ linting، Black للتنسيق، pytest للاختبارات، Poetry أو uv للـ packages.",
    icon: "edit", color: "#3B7CC9", category: "أدوات AI", free: true,
  },
  {
    id: "bolt-new",
    title: "Bolt.new Style App",
    description: "أنشئ تطبيقاً كاملاً بنمط Bolt.new",
    prompt: "بنمط Bolt.new: أنشئ تطبيقاً ويب كاملاً في ملفات واضحة - index.html، styles.css، app.js أو React components. اجعله جاهزاً للنشر فوراً على StackBlitz أو CodeSandbox.",
    icon: "zap", color: "#7C3AED", category: "أدوات AI", free: true,
  },
  {
    id: "v0-vercel",
    title: "v0 by Vercel Style",
    description: "مكوّنات UI بنمط v0.dev",
    prompt: "أنشئ مكوّن بنمط v0.dev من Vercel: shadcn/ui + Tailwind CSS، Radix UI primitives، accessible، responsive، dark mode، مع Props واضحة وTypeScript كامل.",
    icon: "layout", color: "#EEE", category: "أدوات AI", free: true,
  },
  {
    id: "continue-dev",
    title: "Continue.dev",
    description: "إعداد Continue.dev مع OpenRouter",
    prompt: "اضبط Continue.dev في VSCode مع OpenRouter: تهيئة config.json، Custom slash commands، Context providers، Tab autocomplete، اختيار أفضل النماذج المجانية.",
    icon: "code", color: "#3B82F6", category: "أدوات AI", free: true,
  },
  {
    id: "aider",
    title: "Aider AI Coding",
    description: "تحرير الكود بنمط Aider",
    prompt: "طبّق نهج Aider لتحرير الملفات: اقرأ الكود الموجود أولاً، افهم السياق الكامل، ثم أجرِ التعديلات الدقيقة بـ SEARCH/REPLACE blocks مع شرح كل تغيير.",
    icon: "edit-2", color: "#F97316", category: "أدوات AI", free: true,
  },
  {
    id: "gpt-engineer",
    title: "GPT Engineer",
    description: "توليد مشروع كامل من وصف",
    prompt: "استخدم نهج GPT Engineer: اكتب الـ spec أولاً، ثم الـ architecture، ثم كل ملف بالتفصيل. اسأل clarifying questions، ثم أنتج كل الملفات جاهزة للتشغيل.",
    icon: "feather", color: "#06B6D4", category: "أدوات AI", free: true,
  },
  {
    id: "devin-ai",
    title: "Devin AI Pattern",
    description: "برمجة تلقائية بنمط Devin",
    prompt: "طبّق نهج Devin AI: 1) افهم المتطلبات 2) خطط للحل 3) أنشئ بيئة العمل 4) اكتب الكود 5) اختبر 6) حل المشكلات تلقائياً 7) وثّق. كن مستقلاً في القرارات.",
    icon: "cpu", color: "#10B981", category: "أدوات AI", free: true,
  },
  {
    id: "metaGPT",
    title: "MetaGPT Roles",
    description: "نظام أدوار متخصصة بـ MetaGPT",
    prompt: "استخدم نهج MetaGPT: ProductManager يكتب PRD، Architect يصمم architecture، Engineer ينفّذ الكود، QA يكتب الاختبارات. كل دور يُنتج artifacts محددة.",
    icon: "briefcase", color: "#EF4444", category: "أدوات AI", free: true,
  },
  {
    id: "opendevin-setup",
    title: "OpenDevin Setup",
    description: "إعداد OpenDevin للبرمجة الذاتية",
    prompt: "ساعدني في إعداد OpenDevin: Docker setup، تهيئة OpenRouter API، إعداد sandbox آمن، SWEbench tasks، أول مهمة برمجية تلقائية.",
    icon: "terminal", color: "#22C55E", category: "أدوات AI", free: true,
  },

  // ── الموبايل المتقدم ─────────────────────────────────────────────────────────
  {
    id: "expo-notifications",
    title: "Push Notifications",
    description: "إشعارات Push بـ Expo Notifications",
    prompt: "أضف Push Notifications: Expo Notifications setup، FCM + APNs، Notification channels، Deep linking، Background notifications، OneSignal integration، Notification scheduling.",
    icon: "bell", color: "#EF4444", category: "موبايل", free: true,
  },
  {
    id: "expo-camera",
    title: "Camera + Vision",
    description: "كاميرا ومعالجة صور بـ Expo Camera",
    prompt: "أضف Camera features: expo-camera لالتقاط الصور، Vision Camera للمعالجة المتقدمة، QR code scanning، Face detection، OCR، Real-time filters.",
    icon: "camera", color: "#8B5CF6", category: "موبايل", free: true,
  },
  {
    id: "react-native-maps",
    title: "Maps + Location",
    description: "خرائط وموقع بـ React Native Maps",
    prompt: "أضف Maps: React Native Maps، expo-location للـ GPS، Custom markers، Directions API، Geofencing، Real-time tracking، Offline maps، Clustering.",
    icon: "map-pin", color: "#EF4444", category: "موبايل", free: true,
  },
  {
    id: "reanimated-animations",
    title: "Reanimated 3 Animations",
    description: "أنيميشن سلس بـ Reanimated 3",
    prompt: "أنشئ animations بـ Reanimated 3: useSharedValue، useAnimatedStyle، withSpring، withTiming، Gesture Handler integration، Shared Element Transitions، Skia animations.",
    icon: "activity", color: "#F43F5E", category: "موبايل", free: true,
  },
  {
    id: "sentry-monitoring",
    title: "Sentry + Analytics",
    description: "مراقبة الأخطاء والأداء بـ Sentry",
    prompt: "أضف Sentry: Error tracking، Performance monitoring، Session replay، User feedback، Release tracking، Source maps، Expo integration، Custom breadcrumbs.",
    icon: "alert-circle", color: "#F04234", category: "موبايل", free: true,
  },

  // ── تقنيات أخرى ─────────────────────────────────────────────────────────────
  {
    id: "threejs",
    title: "Three.js / R3F 3D",
    description: "مشاهد ثلاثية الأبعاد بـ Three.js",
    prompt: "أنشئ 3D scene بـ React Three Fiber: Scene setup، Lighting، Materials، Geometries، Animations، Physics بـ Rapier، Post-processing effects، GLTF models.",
    icon: "box", color: "#049EF4", category: "3D", free: true,
  },
  {
    id: "electron-desktop",
    title: "Electron Desktop App",
    description: "تطبيق سطح مكتب بـ Electron + React",
    prompt: "أنشئ Electron app بـ React + Vite: Main process، Renderer process، IPC communication، Native file system، System tray، Auto-updater، Native menus، Packaging.",
    icon: "monitor", color: "#47848F", category: "desktop", free: true,
  },
  {
    id: "telegram-bot",
    title: "Telegram Bot",
    description: "بوت Telegram بـ grammY + Webhooks",
    prompt: "أنشئ Telegram bot: grammY framework، Commands، Inline keyboards، Callback queries، Media handling، Webhooks، Middleware، State management، Deploy to Vercel.",
    icon: "send", color: "#0088CC", category: "bots", free: true,
  },
  {
    id: "discord-bot",
    title: "Discord Bot",
    description: "بوت Discord بـ Discord.js v14",
    prompt: "أنشئ Discord bot: Slash commands، Context menus، Embeds، Buttons، Select menus، Modals، Role management، Event handlers، Database integration.",
    icon: "message-square", color: "#5865F2", category: "bots", free: true,
  },
  {
    id: "cloudflare-workers",
    title: "Cloudflare Workers",
    description: "Edge API بـ Cloudflare Workers + Hono",
    prompt: "أنشئ Cloudflare Workers API: Hono framework، KV storage، D1 database، R2 object storage، Durable Objects، Queues، Cron triggers، Edge caching.",
    icon: "cloud", color: "#F6821F", category: "edge", free: true,
  },
  {
    id: "pwa-app",
    title: "Progressive Web App",
    description: "PWA كامل بـ Service Worker + Cache",
    prompt: "حوّل التطبيق إلى PWA: Service Worker، Cache strategies، Offline support، App manifest، Install prompt، Background sync، Push notifications، Web Vitals optimization.",
    icon: "smartphone", color: "#5A0FC8", category: "ويب", free: true,
  },
  {
    id: "openapi-codegen",
    title: "OpenAPI Code Generation",
    description: "توليد Client SDK من OpenAPI spec",
    prompt: "أنشئ OpenAPI spec وgenerate client: Zod schema، TypeScript types، React Query hooks، Tanstack Query integration، مع orval أو openapi-generator.",
    icon: "code", color: "#85EA2D", category: "أدوات", free: true,
  },
  {
    id: "monorepo-shared",
    title: "Shared Libraries",
    description: "مكتبات مشتركة في Monorepo",
    prompt: "أنشئ shared packages في monorepo: @myapp/ui مكوّنات مشتركة، @myapp/utils helper functions، @myapp/types TypeScript types، @myapp/api-client، مع proper exports.",
    icon: "package", color: "#8B5CF6", category: "هندسة", free: true,
  },
  {
    id: "micro-frontend",
    title: "Micro-Frontend",
    description: "بنية Micro-Frontend بـ Module Federation",
    prompt: "أنشئ Micro-Frontend architecture: Webpack Module Federation، Host app، Remote apps، Shared state، Shell application، Independent deployment، Type sharing.",
    icon: "grid", color: "#3B82F6", category: "هندسة", free: true,
  },
  {
    id: "event-driven",
    title: "Event-Driven Architecture",
    description: "نظام قائم على الأحداث بـ BullMQ",
    prompt: "أنشئ event-driven system: BullMQ queues، Job processors، Retry strategies، Dead letter queues، Priority queues، Scheduled jobs، Real-time monitoring بـ Bull Board.",
    icon: "radio", color: "#DC2626", category: "هندسة", free: true,
  },
  {
    id: "observability",
    title: "Observability Stack",
    description: "مراقبة شاملة بـ OpenTelemetry",
    prompt: "أضف Observability: OpenTelemetry traces، Prometheus metrics، Grafana dashboards، Structured logging بـ Pino، Distributed tracing، Alerting، SLOs.",
    icon: "bar-chart-2", color: "#E6522C", category: "DevOps", free: true,
  },
  {
    id: "caching-strategy",
    title: "Caching Strategies",
    description: "استراتيجيات تخزين مؤقت متقدمة",
    prompt: "صمّم caching strategy: Browser cache، CDN caching، API response cache، Database query cache، Full-page cache، Stale-while-revalidate، Cache invalidation patterns.",
    icon: "save", color: "#059669", category: "أداء", free: true,
  },
  {
    id: "accessibility",
    title: "Accessibility (a11y)",
    description: "إمكانية الوصول WCAG 2.1 AA",
    prompt: "أضف Accessibility كاملاً: WCAG 2.1 AA compliance، ARIA labels، Screen reader support، Keyboard navigation، Focus management، Color contrast، Skip links، VoiceOver/TalkBack.",
    icon: "eye", color: "#0EA5E9", category: "تطوير", free: true,
  },
  {
    id: "i18n",
    title: "Internationalization",
    description: "دعم متعدد اللغات i18n + RTL",
    prompt: "أضف i18n كاملاً: i18next أو react-i18next، Translation files، Pluralization، Date/Number formatting، RTL support للعربية، Locale detection، Dynamic loading.",
    icon: "globe", color: "#6366F1", category: "تطوير", free: true,
  },
  {
    id: "dark-mode",
    title: "Dark/Light Mode System",
    description: "نظام Theme متكامل Dark/Light",
    prompt: "أضف Theme system: Dark/Light/System mode، CSS variables، React context، Local storage persistence، Smooth transitions، Component-level theming، NativeWind للموبايل.",
    icon: "moon", color: "#8B5CF6", category: "UI/UX", free: true,
  },
  {
    id: "storybook",
    title: "Storybook Components",
    description: "توثيق مكوّنات بـ Storybook",
    prompt: "أضف Storybook: Component stories، Controls، Actions، Docs، Testing بـ play functions، Chromatic visual testing، Design tokens integration.",
    icon: "book", color: "#FF4785", category: "أدوات", free: true,
  },
];

const INTEGRATIONS: Integration[] = [
  { id: "openrouter", name: "OpenRouter", description: "200+ نموذج ذكاء اصطناعي مجاني", icon: "globe", color: "#6C47FF", url: "https://openrouter.ai/keys", badge: "مجاني", connected: true, free: true },
  { id: "e2b", name: "E2B Sandbox", description: "تنفيذ الكود في بيئة سحابية آمنة حقيقية", icon: "box", color: "#F43F5E", url: "https://e2b.dev", badge: "مجاني", connected: true, free: true },
  { id: "convex", name: "Convex", description: "قاعدة بيانات فورية Real-time", icon: "database", color: "#F97316", url: "https://convex.dev", badge: "مجاني", connected: true, free: true },
  { id: "expo", name: "Expo EAS", description: "نشر APK وتحديثات OTA", icon: "smartphone", color: "#3B82F6", url: "https://expo.dev", badge: "مجاني", connected: true, free: true },
  { id: "clerk", name: "Clerk Auth", description: "تسجيل دخول مع Social Login", icon: "user-check", color: "#22C55E", url: "https://clerk.com", badge: "مجاني", connected: true, free: true },
  { id: "github", name: "GitHub", description: "مستودعات، Issues، PRs، Actions", icon: "github", color: "#EEE", url: "https://github.com/settings/tokens", badge: "مجاني", connected: false, free: true },
  { id: "huggingface", name: "Hugging Face", description: "نماذج AI مفتوحة المصدر مجاناً", icon: "cpu", color: "#FFD21E", url: "https://huggingface.co/settings/tokens", badge: "مجاني", connected: false, free: true },
  { id: "vercel", name: "Vercel", description: "نشر تطبيقات Next.js تلقائياً", icon: "triangle", color: "#EEE", url: "https://vercel.com", badge: "مجاني", connected: false, free: true },
  { id: "supabase", name: "Supabase", description: "Postgres + Auth + Storage مجاناً", icon: "layers", color: "#10B981", url: "https://supabase.com", badge: "مجاني", connected: false, free: true },
  { id: "railway", name: "Railway", description: "نشر Servers و Databases مجاناً", icon: "server", color: "#7B3FC4", url: "https://railway.app", badge: "مجاني", connected: false, free: true },
  { id: "render", name: "Render", description: "استضافة مجانية مع SSL تلقائي", icon: "cloud", color: "#46E3B7", url: "https://render.com", badge: "مجاني", connected: false, free: true },
  { id: "upstash", name: "Upstash Redis", description: "Redis مجاني للـ rate limiting والـ cache", icon: "database", color: "#00E9A3", url: "https://upstash.com", badge: "مجاني", connected: false, free: true },
  { id: "cloudinary", name: "Cloudinary", description: "تخزين ومعالجة الصور والفيديو", icon: "image", color: "#3448C5", url: "https://cloudinary.com", badge: "مجاني", connected: false, free: true },
  { id: "appwrite", name: "Appwrite", description: "Backend كامل: Auth، DB، Storage", icon: "shield", color: "#FD366E", url: "https://appwrite.io", badge: "مجاني", connected: false, free: true },
  { id: "netlify", name: "Netlify", description: "نشر تطبيقات الويب مجاناً", icon: "upload-cloud", color: "#00C7B7", url: "https://netlify.com", badge: "مجاني", connected: false, free: true },
  { id: "neon", name: "Neon Postgres", description: "Postgres بدون خادم — Serverless", icon: "database", color: "#00E599", url: "https://neon.tech", badge: "مجاني", connected: false, free: true },
  { id: "liveblocks", name: "Liveblocks", description: "تعاون فوري — Multiplayer apps", icon: "users", color: "#7C3AED", url: "https://liveblocks.io", badge: "مجاني", connected: false, free: true },
  { id: "pinecone", name: "Pinecone", description: "قاعدة بيانات متجهية Vector DB", icon: "database", color: "#1FCC83", url: "https://pinecone.io", badge: "مجاني", connected: false, free: true },
  { id: "resend", name: "Resend Email", description: "إرسال بريد إلكتروني بـ API", icon: "mail", color: "#EEE", url: "https://resend.com", badge: "مجاني", connected: false, free: true },
  { id: "sentry", name: "Sentry", description: "مراقبة الأخطاء في الإنتاج", icon: "alert-circle", color: "#F04234", url: "https://sentry.io", badge: "مجاني", connected: false, free: true },
  { id: "cloudflare", name: "Cloudflare Workers", description: "Edge computing مجاني", icon: "cloud", color: "#F6821F", url: "https://workers.cloudflare.com", badge: "مجاني", connected: false, free: true },
  { id: "daily", name: "Daily.co Video", description: "مكالمات فيديو بـ WebRTC", icon: "video", color: "#4D9FFF", url: "https://daily.co", badge: "مجاني", connected: false, free: true },
];

const CUSTOM_SKILLS_KEY = "vibracode_custom_skills_v2";

export default function SkillsScreen() {
  const insets = useSafeAreaInsets();
  const { sendMessage } = useChat();
  const [tab, setTab] = useState<"skills" | "integrations">("skills");
  const [selectedCat, setSelectedCat] = useState("الكل");
  const [customSkills, setCustomSkills] = useState<Skill[]>([]);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    AsyncStorage.getItem(CUSTOM_SKILLS_KEY).then((val) => {
      if (val) {
        try { setCustomSkills(JSON.parse(val)); } catch {}
      }
    });
  }, []);

  const allSkills = [...DEFAULT_SKILLS, ...customSkills];
  const categories = ["الكل", ...new Set(allSkills.map((s) => s.category))];

  const filteredSkills = allSkills.filter((s) => {
    const matchCat = selectedCat === "الكل" || s.category === selectedCat;
    const matchSearch = !search.trim() ||
      s.title.includes(search) ||
      s.description.includes(search) ||
      s.category.includes(search);
    return matchCat && matchSearch;
  });

  const saveCustomSkill = async (skill: Skill) => {
    const updated = [...customSkills, { ...skill, custom: true }];
    setCustomSkills(updated);
    await AsyncStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(updated));
  };

  const deleteCustomSkill = async (id: string) => {
    const updated = customSkills.filter((s) => s.id !== id);
    setCustomSkills(updated);
    await AsyncStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(updated));
  };

  const handleSkill = (skill: Skill) => {
    Alert.alert(
      skill.title,
      "هل تريد إرسال هذا الطلب للذكاء الاصطناعي الآن؟",
      [
        { text: "إلغاء", style: "cancel" },
        ...(skill.custom ? [{ text: "حذف", style: "destructive" as const, onPress: () => deleteCustomSkill(skill.id) }] : []),
        { text: "إرسال ✦", onPress: () => sendMessage(skill.prompt) },
      ]
    );
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>المهارات والتكاملات</Text>
          <Text style={s.headerSub}>
            {allSkills.length} مهارة · {INTEGRATIONS.filter(i => i.connected).length} تكامل فعّال · كلها مجانية
          </Text>
        </View>
        {tab === "skills" && (
          <TouchableOpacity style={s.addBtn} onPress={() => setShowAddSkill(true)} activeOpacity={0.8}>
            <Feather name="plus" size={16} color="#6C47FF" />
            <Text style={s.addBtnText}>مخصصة</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={s.mainTabs}>
        {(["skills", "integrations"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[s.mainTab, tab === t && s.mainTabActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.7}
          >
            <Feather name={t === "skills" ? "zap" : "link"} size={14} color={tab === t ? "#EEE" : "#444"} />
            <Text style={[s.mainTabText, tab === t && s.mainTabTextActive]}>
              {t === "skills" ? `المهارات (${allSkills.length})` : `التكاملات (${INTEGRATIONS.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "skills" ? (
        <>
          {/* Search */}
          <View style={s.searchBar}>
            <Feather name="search" size={14} color="#444" />
            <TextInput
              style={s.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="ابحث في المهارات..."
              placeholderTextColor="#333"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Feather name="x" size={14} color="#555" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catScroll}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[s.catChip, selectedCat === cat && s.catChipActive]}
                onPress={() => setSelectedCat(cat)}
                activeOpacity={0.7}
              >
                <Text style={[s.catChipText, selectedCat === cat && s.catChipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView contentContainerStyle={s.skillsGrid} showsVerticalScrollIndicator={false}>
            {filteredSkills.length === 0 && (
              <View style={{ alignItems: "center", paddingTop: 40 }}>
                <Feather name="search" size={32} color="#222" />
                <Text style={{ color: "#444", marginTop: 12 }}>لا توجد نتائج</Text>
              </View>
            )}
            {customSkills.length > 0 && selectedCat === "الكل" && !search && (
              <Text style={s.sectionLabel}>مهاراتي المخصصة</Text>
            )}
            {filteredSkills.map((skill) => (
              <TouchableOpacity
                key={skill.id}
                style={[s.skillCard, IS_TABLET && s.skillCardTablet, skill.custom && s.skillCardCustom]}
                onPress={() => handleSkill(skill)}
                activeOpacity={0.7}
              >
                <View style={[s.skillIcon, { backgroundColor: skill.color + "20" }]}>
                  <Feather name={skill.icon as any} size={20} color={skill.color} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={s.skillTitleRow}>
                    <Text style={s.skillTitle}>{skill.title}</Text>
                    <View style={[s.freeBadge, { backgroundColor: skill.custom ? "#6C47FF20" : "#22C55E20" }]}>
                      <Text style={[s.freeBadgeText, { color: skill.custom ? "#6C47FF" : "#22C55E" }]}>
                        {skill.custom ? "مخصص" : skill.category}
                      </Text>
                    </View>
                  </View>
                  <Text style={s.skillDesc} numberOfLines={2}>{skill.description}</Text>
                </View>
                <Feather name="send" size={14} color="#2A2A2A" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      ) : (
        <ScrollView contentContainerStyle={s.integList} showsVerticalScrollIndicator={false}>
          <Text style={s.sectionLabel}>التكاملات الفعّالة</Text>
          {INTEGRATIONS.filter((i) => i.connected).map((integ) => (
            <IntegrationCard key={integ.id} integ={integ} />
          ))}
          <Text style={[s.sectionLabel, { marginTop: 20 }]}>تكاملات مجانية إضافية</Text>
          {INTEGRATIONS.filter((i) => !i.connected).map((integ) => (
            <IntegrationCard key={integ.id} integ={integ} />
          ))}
        </ScrollView>
      )}

      <AddSkillModal
        visible={showAddSkill}
        onClose={() => setShowAddSkill(false)}
        onSave={saveCustomSkill}
      />
    </View>
  );
}

function IntegrationCard({ integ }: { integ: Integration }) {
  return (
    <TouchableOpacity
      style={s.integCard}
      onPress={() => Linking.openURL(integ.url).catch(() => {})}
      activeOpacity={0.7}
    >
      <View style={[s.integIcon, { backgroundColor: integ.color + "18" }]}>
        <Feather name={integ.icon as any} size={20} color={integ.color} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <View style={s.integTitleRow}>
          <Text style={s.integName}>{integ.name}</Text>
          <View style={[s.integBadge, { backgroundColor: integ.connected ? "#22C55E20" : "#1A1A1A" }]}>
            <View style={[s.integDot, { backgroundColor: integ.connected ? "#22C55E" : "#333" }]} />
            <Text style={[s.integBadgeText, { color: integ.connected ? "#22C55E" : "#444" }]}>
              {integ.connected ? "مُتّصل" : integ.badge}
            </Text>
          </View>
        </View>
        <Text style={s.integDesc}>{integ.description}</Text>
      </View>
      <Feather name="external-link" size={14} color="#333" />
    </TouchableOpacity>
  );
}

const COLORS = ["#22C55E", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899", "#06B6D4", "#F97316", "#6C47FF", "#10B981"];
const ICONS = ["zap", "code", "cpu", "terminal", "shield", "book-open", "feather", "link", "layers", "star", "tool", "git-branch", "database", "globe", "send", "edit"];

function AddSkillModal({ visible, onClose, onSave }: {
  visible: boolean;
  onClose: () => void;
  onSave: (s: Skill) => void;
}) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("مخصص");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);

  const handleSave = () => {
    if (!title.trim() || !prompt.trim()) {
      Alert.alert("خطأ", "الاسم والـ Prompt مطلوبان");
      return;
    }
    onSave({
      id: `custom_${Date.now()}`,
      title: title.trim(),
      description: description.trim() || title.trim(),
      prompt: prompt.trim(),
      icon: selectedIcon,
      color: selectedColor,
      category: category.trim() || "مخصص",
      free: true,
      custom: true,
    });
    setTitle(""); setDescription(""); setPrompt(""); setCategory("مخصص");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={ms.overlay} onPress={onClose}>
        <Pressable style={[ms.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={e => e.stopPropagation()}>
          <View style={ms.handle} />
          <Text style={ms.title}>إضافة مهارة مخصصة</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={ms.label}>الاسم *</Text>
            <TextInput style={ms.input} value={title} onChangeText={setTitle} placeholder="مثال: تحليل الكود" placeholderTextColor="#333" />

            <Text style={ms.label}>الوصف</Text>
            <TextInput style={ms.input} value={description} onChangeText={setDescription} placeholder="وصف قصير للمهارة" placeholderTextColor="#333" />

            <Text style={ms.label}>التصنيف</Text>
            <TextInput style={ms.input} value={category} onChangeText={setCategory} placeholder="مثال: تطوير، أمان، DevOps" placeholderTextColor="#333" />

            <Text style={ms.label}>Prompt (الأمر) *</Text>
            <TextInput
              style={[ms.input, { height: 100, textAlignVertical: "top" }]}
              value={prompt}
              onChangeText={setPrompt}
              placeholder="اكتب الأمر الذي سيُرسَل للذكاء الاصطناعي..."
              placeholderTextColor="#333"
              multiline
            />

            <Text style={ms.label}>اللون</Text>
            <View style={ms.colorRow}>
              {COLORS.map(c => (
                <TouchableOpacity key={c} style={[ms.colorDot, { backgroundColor: c }, selectedColor === c && ms.colorDotActive]} onPress={() => setSelectedColor(c)} />
              ))}
            </View>

            <Text style={ms.label}>الأيقونة</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {ICONS.map(ic => (
                <TouchableOpacity key={ic} style={[ms.iconBtn, { backgroundColor: selectedColor + "20" }, selectedIcon === ic && ms.iconBtnActive]} onPress={() => setSelectedIcon(ic)}>
                  <Feather name={ic as any} size={18} color={selectedColor} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={ms.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Feather name="plus" size={16} color="#FFF" />
              <Text style={ms.saveBtnText}>إضافة المهارة</Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#111",
  },
  headerTitle: { color: "#FFF", fontSize: 17, fontWeight: "800" },
  headerSub: { color: "#444", fontSize: 11, marginTop: 2 },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: "#6C47FF15",
    borderRadius: 20, borderWidth: 1, borderColor: "#6C47FF30",
  },
  addBtnText: { color: "#6C47FF", fontSize: 12, fontWeight: "700" },

  mainTabs: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  mainTab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 9, borderRadius: 12,
    backgroundColor: "#111", borderWidth: 1, borderColor: "#1A1A1A",
  },
  mainTabActive: { backgroundColor: "#1E1E1E", borderColor: "#2A2A2A" },
  mainTabText: { color: "#444", fontSize: 13, fontWeight: "600" },
  mainTabTextActive: { color: "#EEE" },

  searchBar: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 12, marginBottom: 6,
    backgroundColor: "#111", borderRadius: 12,
    borderWidth: 1, borderColor: "#1E1E1E",
    paddingHorizontal: 10, gap: 8,
  },
  searchInput: { flex: 1, color: "#FFF", fontSize: 13, paddingVertical: 9 },

  catScroll: { paddingHorizontal: 12, paddingBottom: 10, gap: 6 },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: "#111", borderRadius: 20,
    borderWidth: 1, borderColor: "#1A1A1A",
  },
  catChipActive: { backgroundColor: "#6C47FF20", borderColor: "#6C47FF40" },
  catChipText: { color: "#444", fontSize: 12, fontWeight: "600" },
  catChipTextActive: { color: "#8B6FFF" },

  skillsGrid: { padding: 12, gap: 8 },
  sectionLabel: { color: "#444", fontSize: 12, fontWeight: "700", marginBottom: 4, marginTop: 4 },
  skillCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#0F0F0F", borderRadius: 14,
    borderWidth: 1, borderColor: "#161616",
    padding: 12,
  },
  skillCardTablet: { width: "48%" },
  skillCardCustom: { borderColor: "#6C47FF25" },
  skillIcon: {
    width: 42, height: 42, borderRadius: 12,
    justifyContent: "center", alignItems: "center",
  },
  skillTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  skillTitle: { color: "#DDD", fontSize: 14, fontWeight: "700" },
  freeBadge: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
  },
  freeBadgeText: { fontSize: 10, fontWeight: "700" },
  skillDesc: { color: "#444", fontSize: 12, lineHeight: 16 },

  integList: { padding: 12, gap: 8 },
  integCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#0F0F0F", borderRadius: 14,
    borderWidth: 1, borderColor: "#161616",
    padding: 12,
  },
  integIcon: {
    width: 42, height: 42, borderRadius: 12,
    justifyContent: "center", alignItems: "center",
  },
  integTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  integName: { color: "#DDD", fontSize: 14, fontWeight: "700" },
  integBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
  },
  integDot: { width: 6, height: 6, borderRadius: 3 },
  integBadgeText: { fontSize: 10, fontWeight: "700" },
  integDesc: { color: "#444", fontSize: 12 },
});

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "#00000088", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#0F0F0F", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: "85%",
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: "#222", alignSelf: "center", marginBottom: 16,
  },
  title: { color: "#FFF", fontSize: 17, fontWeight: "800", marginBottom: 16 },
  label: { color: "#666", fontSize: 12, fontWeight: "700", marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: "#161616", borderRadius: 12, borderWidth: 1, borderColor: "#222",
    color: "#FFF", fontSize: 14, paddingHorizontal: 12, paddingVertical: 10,
  },
  colorRow: { flexDirection: "row", gap: 10, flexWrap: "wrap", paddingVertical: 4 },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotActive: { transform: [{ scale: 1.25 }], borderWidth: 2, borderColor: "#FFF" },
  iconBtn: {
    width: 42, height: 42, borderRadius: 12,
    justifyContent: "center", alignItems: "center",
  },
  iconBtnActive: { borderWidth: 2, borderColor: "#FFF" },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#6C47FF", borderRadius: 14,
    paddingVertical: 14, marginTop: 20,
  },
  saveBtnText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
});
