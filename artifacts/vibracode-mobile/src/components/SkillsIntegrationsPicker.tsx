import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SkillItem {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
}

interface IntegrationItem {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  envVars: string[];
}

// ── v7.0.0 Complete Skills Library ──────────────────────────────────────────
const SKILLS: SkillItem[] = [
  // Mobile
  { id: "expo-app",             name: "Expo React Native",    icon: "📱", category: "Mobile",       description: "تطبيق موبايل كامل بـ Expo SDK" },
  { id: "react-native-ui",      name: "RN UI Kit",            icon: "🎨", category: "Mobile",       description: "واجهة مستخدم احترافية مع Reanimated" },
  { id: "expo-eas-publish",     name: "EAS Publish",          icon: "🚀", category: "Mobile",       description: "نشر لـ App Store و Play Store" },
  { id: "rn-animations",        name: "RN Animations",        icon: "🎬", category: "Mobile",       description: "Animations سلسة مع Reanimated v3" },

  // Web
  { id: "nextjs-app",           name: "Next.js 15",           icon: "▲",  category: "Web",          description: "App Router + shadcn/ui + Tailwind v4" },
  { id: "vite-react",           name: "Vite + React SPA",     icon: "⚡", category: "Web",          description: "Single Page App سريع بـ Vite" },
  { id: "astro-site",           name: "Astro Static Site",    icon: "🌐", category: "Web",          description: "موقع سريع بـ Astro 5" },
  { id: "shadcn",               name: "shadcn/ui",            icon: "🪄", category: "Web",          description: "مكوّنات UI جاهزة وقابلة للتخصيص" },

  // Backend
  { id: "express-api",          name: "Express REST API",     icon: "🛠️", category: "Backend",      description: "REST API كامل بـ Express 5 + TypeScript" },
  { id: "fastapi",              name: "FastAPI Python",       icon: "🐍", category: "Backend",      description: "API Python سريع مع Pydantic" },

  // Database
  { id: "supabase",             name: "Supabase",             icon: "🗄️", category: "Database",     description: "PostgreSQL + Auth + Storage + Realtime" },
  { id: "prisma",               name: "Prisma ORM",           icon: "🔷", category: "Database",     description: "ORM مع type-safety كاملة" },
  { id: "drizzle",              name: "Drizzle ORM",          icon: "💧", category: "Database",     description: "ORM خفيف مع TypeScript" },
  { id: "duckdb",               name: "DuckDB Analytics",     icon: "🦆", category: "Database",     description: "SQL سريع على CSV/Parquet" },

  // Payments
  { id: "stripe",               name: "Stripe Payments",      icon: "💳", category: "Payments",     description: "مدفوعات حقيقية + Subscriptions" },
  { id: "polar",                name: "Polar Payments",       icon: "🧊", category: "Payments",     description: "مدفوعات مفتوحة المصدر" },

  // Auth
  { id: "clerk-auth",           name: "Clerk Auth",           icon: "🔐", category: "Auth",         description: "Auth جاهز مع Social Login" },
  { id: "better-auth",          name: "Better Auth",          icon: "🔑", category: "Auth",         description: "Auth مفتوح المصدر" },

  // AI
  { id: "vercel-ai",            name: "Vercel AI SDK",        icon: "🤖", category: "AI",           description: "AI streaming + useChat hook" },
  { id: "langchain",            name: "LangChain / LangGraph",icon: "🦜", category: "AI",           description: "AI Agents و Chains" },
  { id: "rag-builder",          name: "RAG System",           icon: "🔍", category: "AI",           description: "Vector search + RAG pipeline" },
  { id: "ai-agent-builder",     name: "AI Agent Builder",     icon: "🦾", category: "AI",           description: "بناء AI Agents بأدوات مخصصة" },
  { id: "senior-data-scientist",name: "Data Scientist",       icon: "🧬", category: "AI",           description: "EDA → Modeling → Deployment" },
  { id: "hugging-face",         name: "Hugging Face",         icon: "🤗", category: "AI",           description: "Inference API + Embeddings" },

  // DevOps
  { id: "docker",               name: "Docker",               icon: "🐳", category: "DevOps",       description: "Multi-stage Dockerfile + Compose" },
  { id: "github-actions",       name: "GitHub Actions CI/CD", icon: "⚙️", category: "DevOps",       description: "CI/CD تلقائي على كل push" },
  { id: "k8s-deploy",           name: "Kubernetes",           icon: "☸️", category: "DevOps",       description: "نشر على Kubernetes Clusters" },
  { id: "nginx-config",         name: "Nginx Config",         icon: "🔧", category: "DevOps",       description: "Reverse Proxy + SSL + Rate Limiting" },
  { id: "ci-cd-pipeline",       name: "CI/CD Pipeline",       icon: "🔄", category: "DevOps",       description: "GitHub Actions أو GitLab CI" },

  // Testing
  { id: "playwright",           name: "Playwright E2E",       icon: "🎭", category: "Testing",      description: "اختبارات End-to-End حقيقية" },
  { id: "vitest",               name: "Vitest Unit Tests",    icon: "✅", category: "Testing",      description: "اختبارات الوحدة السريعة" },
  { id: "tdd",                  name: "TDD",                  icon: "🧪", category: "Testing",      description: "اكتب الاختبار أولاً ثم نفّذ" },

  // Development Tools
  { id: "debug-pro",            name: "Debug Pro",            icon: "🐛", category: "Dev Tools",    description: "منهجية Debugging احترافية" },
  { id: "code-review",          name: "Code Review",          icon: "👀", category: "Dev Tools",    description: "مراجعة كود كـ Senior Engineer" },
  { id: "refactor",             name: "Smart Refactor",       icon: "♻️", category: "Dev Tools",    description: "إعادة هيكلة بدون تغيير السلوك" },
  { id: "performance",          name: "Performance",          icon: "🏎️", category: "Dev Tools",    description: "تحسين الأداء مع تحليل المقاييس" },
  { id: "security-audit",       name: "Security Audit",       icon: "🛡️", category: "Dev Tools",    description: "فحص OWASP Top 10 شامل" },
  { id: "documentation",        name: "Auto Docs",            icon: "📚", category: "Dev Tools",    description: "توليد تلقائي للتوثيق والـ README" },
  { id: "git-workflow",         name: "Git Workflow",         icon: "🌿", category: "Dev Tools",    description: "Conventional Commits + PR templates" },
  { id: "cc-godmode",           name: "CC GodMode",           icon: "⚡", category: "Dev Tools",    description: "Multi-Agent لمهام البرمجة الكبيرة" },

  // Search & Research
  { id: "tavily-web-search",    name: "Tavily Web Search",    icon: "🔎", category: "Search",       description: "بحث ويب مُحسَّن بالذكاء الاصطناعي" },
  { id: "arxiv-watcher",        name: "ArXiv Watcher",        icon: "📄", category: "Search",       description: "البحث في الأوراق البحثية العلمية" },
  { id: "web-scraper",          name: "Web Scraper",          icon: "🕷️", category: "Search",       description: "استخراج بيانات منظمة من المواقع" },

  // Productivity
  { id: "summarize",            name: "Content Summarizer",   icon: "📝", category: "Productivity", description: "ملخص URLs وPDFs ومقاطع YouTube" },
  { id: "meeting-analyzer",     name: "Meeting Analyzer",     icon: "📅", category: "Productivity", description: "تحويل محاضر الاجتماعات لبنود عمل" },
  { id: "brainstorm",           name: "Brainstorming",        icon: "💡", category: "Productivity", description: "SCAMPER لتوليد الأفكار الإبداعية" },

  // Communication
  { id: "agent-mail",           name: "Email Agent",          icon: "📧", category: "Comms",        description: "إرسال إيميلات عبر Resend + Templates" },
  { id: "discord-bot",          name: "Discord Bot",          icon: "🎮", category: "Comms",        description: "بوت Discord مع Slash Commands" },
  { id: "telegram-bot",         name: "Telegram Bot",         icon: "✈️", category: "Comms",        description: "بوت Telegram بـ grammy framework" },

  // Security
  { id: "agentguard",           name: "Agent Guard",          icon: "🔏", category: "Security",     description: "حماية وحراسة عمليات الـ Agent" },
  { id: "prompt-guard",         name: "Prompt Guard",         icon: "🔒", category: "Security",     description: "الكشف عن Prompt Injection attacks" },

  // Data
  { id: "data-viz",             name: "Charts & Data Viz",    icon: "📊", category: "Data",         description: "رسوم بيانية تفاعلية مع Recharts" },
  { id: "csv-toolkit",          name: "CSV Toolkit",          icon: "📋", category: "Data",         description: "معالجة CSV بـ Miller/xsv/csvkit" },
];

const INTEGRATIONS: IntegrationItem[] = [
  { id: "github",       name: "GitHub",          icon: "🐙", category: "VCS",       description: "Repos, PRs, Issues via MCP",        envVars: ["GITHUB_TOKEN"] },
  { id: "supabase",     name: "Supabase",         icon: "🗄️", category: "Database",  description: "PostgreSQL + Realtime + Auth",       envVars: ["SUPABASE_URL"] },
  { id: "neon",         name: "Neon PostgreSQL",  icon: "🌿", category: "Database",  description: "Serverless PostgreSQL",              envVars: ["DATABASE_URL"] },
  { id: "mongodb",      name: "MongoDB Atlas",    icon: "🍃", category: "Database",  description: "Document database",                 envVars: ["MONGODB_URI"] },
  { id: "redis",        name: "Redis / Upstash",  icon: "⚡", category: "Database",  description: "Cache + Queue + Rate limiting",      envVars: ["REDIS_URL"] },
  { id: "stripe",       name: "Stripe",           icon: "💳", category: "Payments",  description: "Payments + Subscriptions + Webhooks",envVars: ["STRIPE_SECRET_KEY"] },
  { id: "lemonsqueezy", name: "Lemon Squeezy",    icon: "🍋", category: "Payments",  description: "Digital products + subscriptions",   envVars: ["LEMONSQUEEZY_API_KEY"] },
  { id: "clerk",        name: "Clerk",            icon: "🔐", category: "Auth",      description: "Auth with Social login",             envVars: ["CLERK_SECRET_KEY"] },
  { id: "auth0",        name: "Auth0",            icon: "🔒", category: "Auth",      description: "Enterprise authentication",          envVars: ["AUTH0_DOMAIN"] },
  { id: "resend",       name: "Resend (Email)",   icon: "📧", category: "Comms",     description: "Transactional emails w/ React",      envVars: ["RESEND_API_KEY"] },
  { id: "twilio",       name: "Twilio",           icon: "📱", category: "Comms",     description: "SMS + WhatsApp + Voice",             envVars: ["TWILIO_ACCOUNT_SID"] },
  { id: "pusher",       name: "Pusher",           icon: "🔴", category: "Comms",     description: "Real-time WebSocket events",         envVars: ["PUSHER_APP_ID"] },
  { id: "s3",           name: "AWS S3 / R2",      icon: "☁️", category: "Storage",   description: "File storage + CDN",                 envVars: ["AWS_ACCESS_KEY_ID"] },
  { id: "uploadthing",  name: "UploadThing",      icon: "📤", category: "Storage",   description: "File upload for Next.js",            envVars: ["UPLOADTHING_SECRET"] },
  { id: "posthog",      name: "PostHog",          icon: "📊", category: "Analytics", description: "Product analytics + Feature flags",  envVars: ["NEXT_PUBLIC_POSTHOG_KEY"] },
  { id: "sentry",       name: "Sentry",           icon: "🐛", category: "Monitor",   description: "Error tracking + performance",       envVars: ["SENTRY_DSN"] },
  { id: "algolia",      name: "Algolia",          icon: "🔍", category: "Search",    description: "Full-text instant search",           envVars: ["ALGOLIA_APP_ID"] },
  { id: "openai",       name: "OpenAI",           icon: "🧠", category: "AI",        description: "GPT-4o, DALL-E 3, Whisper",         envVars: ["OPENAI_API_KEY"] },
  { id: "anthropic",    name: "Anthropic",        icon: "🤖", category: "AI",        description: "Claude 3.5 Sonnet & Haiku",          envVars: ["ANTHROPIC_API_KEY"] },
  { id: "huggingface",  name: "Hugging Face",     icon: "🤗", category: "AI",        description: "Model Inference API + Embeddings",   envVars: ["HF_TOKEN"] },
  { id: "tavily",       name: "Tavily Search",    icon: "🔎", category: "Search",    description: "AI-optimized web search API",        envVars: ["TAVILY_API_KEY"] },
];

const SKILL_CATEGORIES = [
  "All", "Mobile", "Web", "Backend", "Database", "Payments",
  "Auth", "AI", "DevOps", "Testing", "Dev Tools",
  "Search", "Productivity", "Comms", "Security", "Data",
];

interface Props {
  visible:             boolean;
  onClose:             () => void;
  selectedSkillIds:    string[];
  selectedIntegIds:    string[];
  onSkillToggle:       (id: string) => void;
  onIntegToggle:       (id: string) => void;
  onApply:             () => void;
  prompt?:             string;
}

export default function SkillsIntegrationsPicker({
  visible, onClose, selectedSkillIds, selectedIntegIds,
  onSkillToggle, onIntegToggle, onApply, prompt = "",
}: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"Skills" | "Integrations">("Skills");
  const [activeCategory, setActiveCategory] = useState("All");

  const autoSuggested = useMemo(() => {
    const p = prompt.toLowerCase();
    return SKILLS.filter(s =>
      p.includes(s.id) ||
      p.includes(s.name.toLowerCase()) ||
      p.includes(s.category.toLowerCase())
    ).map(s => s.id);
  }, [prompt]);

  const filteredSkills = useMemo(() =>
    activeCategory === "All"
      ? SKILLS
      : SKILLS.filter(s => s.category === activeCategory),
    [activeCategory]
  );

  const totalSelected = selectedSkillIds.length + selectedIntegIds.length;
  const bottomPad = Math.max(insets.bottom, 12);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={S.backdrop} onPress={onClose} />
      <View style={[S.sheet, { paddingBottom: 0 }]}>
        {/* ── Handle ── */}
        <View style={S.handleWrap}>
          <View style={S.handle} />
        </View>

        {/* ── Header ── */}
        <View style={S.header}>
          <Text style={S.title}>Skills & Integrations</Text>
          {totalSelected > 0 && (
            <View style={S.badge}>
              <Text style={S.badgeTxt}>{totalSelected} selected</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={onClose}
            style={S.closeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="x" size={18} color="#888" />
          </TouchableOpacity>
        </View>

        {/* ── Tab Switcher ── */}
        <View style={S.tabRow}>
          {(["Skills", "Integrations"] as const).map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => setActiveTab(t)}
              style={[S.tab, activeTab === t && S.tabActive]}
            >
              <Text style={[S.tabTxt, activeTab === t && S.tabTxtActive]}>
                {t === "Skills" ? `Skills (${SKILLS.length})` : `Integrations (${INTEGRATIONS.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "Skills" ? (
          <>
            {/* ── Category Filter ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={S.catScroll}
              contentContainerStyle={S.catScrollContent}
            >
              {SKILL_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  style={[S.catPill, activeCategory === cat && S.catPillActive]}
                >
                  <Text style={[S.catPillTxt, activeCategory === cat && S.catPillTxtActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ── Suggested Banner ── */}
            {autoSuggested.length > 0 && (
              <View style={S.suggBanner}>
                <Feather name="zap" size={11} color="#F59E0B" />
                <Text style={S.suggTxt} numberOfLines={1}>
                  Suggested: {autoSuggested.slice(0, 3).join(", ")}
                </Text>
              </View>
            )}

            {/* ── Skills Grid ── */}
            <ScrollView
              style={S.list}
              contentContainerStyle={S.grid}
              showsVerticalScrollIndicator={false}
            >
              {filteredSkills.map(skill => {
                const selected  = selectedSkillIds.includes(skill.id);
                const suggested = autoSuggested.includes(skill.id);
                return (
                  <TouchableOpacity
                    key={skill.id}
                    onPress={() => onSkillToggle(skill.id)}
                    style={[S.card, selected && S.cardSelected, suggested && !selected && S.cardSuggested]}
                    activeOpacity={0.7}
                  >
                    <Text style={S.cardIcon}>{skill.icon}</Text>
                    <Text style={[S.cardName, selected && S.cardNameSelected]} numberOfLines={1}>
                      {skill.name}
                    </Text>
                    <Text style={S.cardDesc} numberOfLines={2}>{skill.description}</Text>
                    <View style={S.cardCatRow}>
                      <Text style={S.cardCat}>{skill.category}</Text>
                    </View>
                    {selected && (
                      <View style={S.checkBadge}>
                        <Feather name="check" size={9} color="#fff" />
                      </View>
                    )}
                    {suggested && !selected && (
                      <View style={S.suggBadge}>
                        <Text style={S.suggBadgeTxt}>⚡</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        ) : (
          <ScrollView
            style={S.list}
            contentContainerStyle={S.integList}
            showsVerticalScrollIndicator={false}
          >
            {INTEGRATIONS.map(integ => {
              const selected = selectedIntegIds.includes(integ.id);
              return (
                <TouchableOpacity
                  key={integ.id}
                  onPress={() => onIntegToggle(integ.id)}
                  style={[S.integRow, selected && S.integRowSelected]}
                  activeOpacity={0.7}
                >
                  <Text style={S.integIcon}>{integ.icon}</Text>
                  <View style={S.integInfo}>
                    <Text style={[S.integName, selected && S.integNameSel]}>{integ.name}</Text>
                    <Text style={S.integDesc}>{integ.description}</Text>
                    <Text style={S.integEnv}>{integ.envVars[0]}</Text>
                  </View>
                  <View style={[S.integCheck, selected && S.integCheckSel]}>
                    {selected && <Feather name="check" size={13} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* ── Apply Footer ── */}
        <View style={[S.footer, { paddingBottom: bottomPad }]}>
          <TouchableOpacity style={S.applyBtn} onPress={onApply} activeOpacity={0.8}>
            <Feather name="check-circle" size={18} color="#fff" />
            <Text style={S.applyTxt}>
              {totalSelected > 0 ? `Apply (${totalSelected})` : "Apply"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const S = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    height: "82%",
    backgroundColor: "#111",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 38, height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E1E",
    gap: 8,
  },
  title: { flex: 1, color: "#fff", fontSize: 16, fontWeight: "700" },
  badge: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeTxt: { color: "#fff", fontSize: 11, fontWeight: "700" },
  closeBtn: {
    width: 34, height: 34,
    justifyContent: "center", alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 17,
  },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: 12,
    marginVertical: 10,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 10,
  },
  tabActive: { backgroundColor: "#7C3AED" },
  tabTxt: { color: "#555", fontSize: 12, fontWeight: "600" },
  tabTxtActive: { color: "#fff" },

  catScroll: { maxHeight: 38, marginBottom: 6 },
  catScrollContent: { paddingHorizontal: 12, gap: 7, alignItems: "center" },
  catPill: {
    paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    borderWidth: 1, borderColor: "#2A2A2A",
  },
  catPillActive: { backgroundColor: "#7C3AED22", borderColor: "#7C3AED" },
  catPillTxt: { color: "#555", fontSize: 11, fontWeight: "600" },
  catPillTxtActive: { color: "#7C3AED" },

  suggBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 5,
    backgroundColor: "#F59E0B0D",
    marginHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  suggTxt: { color: "#F59E0B", fontSize: 11, flex: 1 },

  list: { flex: 1 },
  grid: {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: 12, paddingVertical: 8,
    gap: 8,
  },
  card: {
    width: "47.5%",
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#242424",
    position: "relative",
    minHeight: 100,
  },
  cardSelected: { borderColor: "#7C3AED", backgroundColor: "#7C3AED14" },
  cardSuggested: { borderColor: "#F59E0B55", backgroundColor: "#F59E0B08" },
  cardIcon: { fontSize: 22, marginBottom: 5 },
  cardName: { color: "#ddd", fontSize: 12, fontWeight: "700", marginBottom: 3 },
  cardNameSelected: { color: "#A78BFA" },
  cardDesc: { color: "#555", fontSize: 10, lineHeight: 14, flex: 1 },
  cardCatRow: { marginTop: 4 },
  cardCat: {
    color: "#383838",
    fontSize: 9,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  checkBadge: {
    position: "absolute", top: 7, right: 7,
    backgroundColor: "#7C3AED",
    borderRadius: 9, width: 18, height: 18,
    alignItems: "center", justifyContent: "center",
  },
  suggBadge: { position: "absolute", top: 5, right: 6 },
  suggBadgeTxt: { fontSize: 11 },

  integList: { padding: 12, gap: 8 },
  integRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1, borderColor: "#242424",
    gap: 12,
    minHeight: 64,
  },
  integRowSelected: { borderColor: "#7C3AED", backgroundColor: "#7C3AED10" },
  integIcon: { fontSize: 26 },
  integInfo: { flex: 1, gap: 2 },
  integName: { color: "#ddd", fontSize: 14, fontWeight: "700" },
  integNameSel: { color: "#A78BFA" },
  integDesc: { color: "#555", fontSize: 12 },
  integEnv: { color: "#383838", fontSize: 10, fontFamily: "monospace" },
  integCheck: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: "#2A2A2A",
    alignItems: "center", justifyContent: "center",
  },
  integCheckSel: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },

  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1, borderTopColor: "#1E1E1E",
    backgroundColor: "#111",
  },
  applyBtn: {
    backgroundColor: "#7C3AED",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    minHeight: 50,
  },
  applyTxt: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
