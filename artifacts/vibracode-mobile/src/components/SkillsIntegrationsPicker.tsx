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

// ── Local skill + integration data (mirrors backend registry) ────────────────
interface SkillItem {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  example: string;
}

interface IntegrationItem {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  envVars: string[];
}

const SKILLS: SkillItem[] = [
  { id: "expo-app",       name: "Expo React Native",   icon: "📱", category: "Mobile",   description: "تطبيق موبايل كامل", example: "Build a todo app" },
  { id: "react-native-ui",name: "RN UI Kit",           icon: "🎨", category: "Mobile",   description: "واجهة مستخدم احترافية", example: "Animated card swiper" },
  { id: "nextjs-app",     name: "Next.js 15",          icon: "▲",  category: "Web",      description: "App Router + shadcn/ui", example: "SaaS landing page" },
  { id: "vite-react",     name: "Vite + React SPA",    icon: "⚡", category: "Web",      description: "Single Page App سريع", example: "Dashboard with charts" },
  { id: "astro-site",     name: "Astro Static Site",   icon: "🚀", category: "Web",      description: "موقع سريع", example: "Portfolio site" },
  { id: "express-api",    name: "Express REST API",    icon: "🛠️", category: "Backend",  description: "REST API كامل", example: "CRUD API for products" },
  { id: "fastapi",        name: "FastAPI Python",      icon: "🐍", category: "Backend",  description: "API Python سريع", example: "ML model serving API" },
  { id: "supabase",       name: "Supabase",            icon: "🗄️", category: "Database", description: "DB + Auth + Storage", example: "Real-time chat" },
  { id: "prisma",         name: "Prisma ORM",          icon: "🔷", category: "Database", description: "Type-safe ORM", example: "User + Post schema" },
  { id: "drizzle",        name: "Drizzle ORM",         icon: "💧", category: "Database", description: "Lightweight ORM", example: "Blog database schema" },
  { id: "stripe",         name: "Stripe Payments",     icon: "💳", category: "Payments", description: "مدفوعات حقيقية", example: "Payment + subscription" },
  { id: "polar",          name: "Polar Payments",      icon: "🧊", category: "Payments", description: "Open source billing", example: "SaaS billing" },
  { id: "clerk-auth",     name: "Clerk Auth",          icon: "🔐", category: "Auth",     description: "Auth جاهز", example: "Google + GitHub login" },
  { id: "better-auth",    name: "Better Auth",         icon: "🔑", category: "Auth",     description: "Open source auth", example: "Email + OAuth" },
  { id: "vercel-ai",      name: "Vercel AI SDK",       icon: "🤖", category: "AI",       description: "AI streaming", example: "AI chatbot" },
  { id: "langchain",      name: "LangChain / LangGraph",icon: "🦜",category: "AI",       description: "AI Agents و Chains", example: "RAG Q&A system" },
  { id: "rag-builder",    name: "RAG System",          icon: "🔍", category: "AI",       description: "Vector search + RAG", example: "Document Q&A" },
  { id: "docker",         name: "Docker",              icon: "🐳", category: "Deploy",   description: "Containerize app", example: "Dockerize Node.js" },
  { id: "github-actions", name: "GitHub Actions",      icon: "⚙️", category: "Deploy",   description: "CI/CD تلقائي", example: "Auto-deploy to Vercel" },
  { id: "playwright",     name: "Playwright E2E",      icon: "🎭", category: "Testing",  description: "اختبارات E2E", example: "Test login flow" },
  { id: "vitest",         name: "Vitest Unit Tests",   icon: "✅", category: "Testing",  description: "اختبارات الوحدة", example: "Test React components" },
  { id: "tdd",            name: "TDD",                 icon: "🧪", category: "Testing",  description: "Test-Driven Dev", example: "Build with TDD" },
  { id: "data-viz",       name: "Charts & Data Viz",   icon: "📊", category: "Data",     description: "رسوم بيانية", example: "Analytics dashboard" },
  { id: "shadcn",         name: "shadcn/ui",           icon: "🪄", category: "Design",   description: "UI Components", example: "Modal form" },
  { id: "security-audit", name: "Security Audit",      icon: "🛡️", category: "Security", description: "OWASP Top 10 scan", example: "Audit Express API" },
];

const INTEGRATIONS: IntegrationItem[] = [
  { id: "github",      name: "GitHub",         icon: "🐙", category: "VCS",      description: "Repos, PRs, Issues",   envVars: ["GITHUB_TOKEN"] },
  { id: "supabase",    name: "Supabase",        icon: "🗄️", category: "Database", description: "PostgreSQL + Realtime", envVars: ["SUPABASE_URL"] },
  { id: "neon",        name: "Neon PostgreSQL", icon: "🌿", category: "Database", description: "Serverless PostgreSQL", envVars: ["DATABASE_URL"] },
  { id: "mongodb",     name: "MongoDB Atlas",   icon: "🍃", category: "Database", description: "Document database",     envVars: ["MONGODB_URI"] },
  { id: "redis",       name: "Redis/Upstash",   icon: "⚡", category: "Database", description: "Cache + Queue",         envVars: ["REDIS_URL"] },
  { id: "stripe",      name: "Stripe",          icon: "💳", category: "Payments", description: "Payments + subscriptions", envVars: ["STRIPE_SECRET_KEY"] },
  { id: "lemonsqueezy",name: "Lemon Squeezy",   icon: "🍋", category: "Payments", description: "Digital products",      envVars: ["LEMONSQUEEZY_API_KEY"] },
  { id: "clerk",       name: "Clerk",           icon: "🔐", category: "Auth",     description: "Auth with social login", envVars: ["CLERK_SECRET_KEY"] },
  { id: "resend",      name: "Resend (Email)",  icon: "📧", category: "Comms",    description: "Transactional emails",  envVars: ["RESEND_API_KEY"] },
  { id: "twilio",      name: "Twilio",          icon: "📱", category: "Comms",    description: "SMS + WhatsApp",        envVars: ["TWILIO_ACCOUNT_SID"] },
  { id: "pusher",      name: "Pusher",          icon: "🔴", category: "Comms",    description: "Real-time WebSocket",   envVars: ["PUSHER_APP_ID"] },
  { id: "s3",          name: "AWS S3 / R2",     icon: "☁️", category: "Storage",  description: "File storage + CDN",    envVars: ["AWS_ACCESS_KEY_ID"] },
  { id: "posthog",     name: "PostHog",         icon: "📊", category: "Analytics",description: "Product analytics",     envVars: ["NEXT_PUBLIC_POSTHOG_KEY"] },
  { id: "sentry",      name: "Sentry",          icon: "🐛", category: "Monitor",  description: "Error tracking",        envVars: ["SENTRY_DSN"] },
  { id: "algolia",     name: "Algolia",         icon: "🔍", category: "Search",   description: "Full-text search",      envVars: ["ALGOLIA_APP_ID"] },
  { id: "openai",      name: "OpenAI",          icon: "🧠", category: "AI",       description: "GPT-4o, DALL-E",        envVars: ["OPENAI_API_KEY"] },
  { id: "anthropic",   name: "Anthropic",       icon: "🤖", category: "AI",       description: "Claude 3.5",            envVars: ["ANTHROPIC_API_KEY"] },
];

const SKILL_TABS = ["All", "Mobile", "Web", "Backend", "Database", "Payments", "Auth", "AI", "Deploy", "Testing", "Data", "Design", "Security"];

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
  const [activeTab, setActiveTab] = useState<"Skills" | "Integrations">("Skills");
  const [activeCategory, setActiveCategory] = useState("All");

  const autoSuggested = useMemo(() => {
    const p = prompt.toLowerCase();
    return SKILLS.filter(s =>
      p.includes(s.id) || p.includes(s.name.toLowerCase()) || p.includes(s.category.toLowerCase())
    ).map(s => s.id);
  }, [prompt]);

  const filteredSkills = useMemo(() =>
    activeCategory === "All"
      ? SKILLS
      : SKILLS.filter(s => s.category === activeCategory),
    [activeCategory]
  );

  const totalSelected = selectedSkillIds.length + selectedIntegIds.length;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={S.backdrop} onPress={onClose} />
      <View style={S.sheet}>
        {/* Header */}
        <View style={S.header}>
          <View style={S.handle} />
          <Text style={S.title}>Skills & Integrations</Text>
          {totalSelected > 0 && (
            <View style={S.badge}>
              <Text style={S.badgeTxt}>{totalSelected}</Text>
            </View>
          )}
          <TouchableOpacity onPress={onClose} style={S.closeBtn}>
            <Feather name="x" size={18} color="#888" />
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={S.tabRow}>
          {(["Skills", "Integrations"] as const).map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => setActiveTab(t)}
              style={[S.tab, activeTab === t && S.tabActive]}
            >
              <Text style={[S.tabTxt, activeTab === t && S.tabTxtActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "Skills" ? (
          <>
            {/* Category scroll */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.catScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
              {SKILL_TABS.map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  style={[S.catPill, activeCategory === cat && S.catPillActive]}
                >
                  <Text style={[S.catPillTxt, activeCategory === cat && S.catPillTxtActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Suggested banner */}
            {autoSuggested.length > 0 && (
              <View style={S.suggBanner}>
                <Feather name="zap" size={12} color="#F59E0B" />
                <Text style={S.suggTxt}>Suggested from your prompt: {autoSuggested.slice(0, 3).join(", ")}</Text>
              </View>
            )}

            {/* Skills grid */}
            <ScrollView style={S.list} contentContainerStyle={S.grid}>
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
                    <Text style={[S.cardName, selected && S.cardNameSelected]} numberOfLines={1}>{skill.name}</Text>
                    <Text style={S.cardDesc} numberOfLines={2}>{skill.description}</Text>
                    {selected && (
                      <View style={S.checkBadge}>
                        <Feather name="check" size={10} color="#fff" />
                      </View>
                    )}
                    {suggested && !selected && (
                      <View style={S.suggBadge}>
                        <Text style={S.suggBadgeTxt}>✨</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        ) : (
          <ScrollView style={S.list} contentContainerStyle={S.integList}>
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
                    {selected && <Feather name="check" size={14} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Apply Button */}
        <View style={S.footer}>
          <TouchableOpacity style={S.applyBtn} onPress={onApply} activeOpacity={0.8}>
            <Feather name="check-circle" size={18} color="#fff" />
            <Text style={S.applyTxt}>
              Apply{totalSelected > 0 ? ` (${totalSelected} selected)` : ""}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const S = StyleSheet.create({
  backdrop:        { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet:           { position: "absolute", bottom: 0, left: 0, right: 0, height: "80%", backgroundColor: "#111", borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
  header:          { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#222", gap: 8 },
  handle:          { width: 36, height: 4, backgroundColor: "#333", borderRadius: 2, position: "absolute", top: 8, alignSelf: "center", left: "50%", marginLeft: -18 },
  title:           { flex: 1, color: "#fff", fontSize: 16, fontWeight: "700", marginTop: 12 },
  badge:           { backgroundColor: "#7C3AED", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, marginTop: 12 },
  badgeTxt:        { color: "#fff", fontSize: 12, fontWeight: "700" },
  closeBtn:        { padding: 8, marginTop: 12 },
  tabRow:          { flexDirection: "row", margin: 12, backgroundColor: "#1A1A1A", borderRadius: 12, padding: 3 },
  tab:             { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
  tabActive:       { backgroundColor: "#7C3AED" },
  tabTxt:          { color: "#666", fontSize: 13, fontWeight: "600" },
  tabTxtActive:    { color: "#fff" },
  catScroll:       { maxHeight: 40, marginBottom: 8 },
  catPill:         { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: "#1A1A1A", borderRadius: 20, borderWidth: 1, borderColor: "#333" },
  catPillActive:   { backgroundColor: "#7C3AED22", borderColor: "#7C3AED" },
  catPillTxt:      { color: "#666", fontSize: 12, fontWeight: "600" },
  catPillTxtActive:{ color: "#7C3AED" },
  suggBanner:      { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 6, backgroundColor: "#F59E0B11" },
  suggTxt:         { color: "#F59E0B", fontSize: 11 },
  list:            { flex: 1 },
  grid:            { flexDirection: "row", flexWrap: "wrap", padding: 12, gap: 10 },
  card:            { width: "47%", backgroundColor: "#1A1A1A", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#2A2A2A", position: "relative" },
  cardSelected:    { borderColor: "#7C3AED", backgroundColor: "#7C3AED18" },
  cardSuggested:   { borderColor: "#F59E0B55", backgroundColor: "#F59E0B08" },
  cardIcon:        { fontSize: 24, marginBottom: 6 },
  cardName:        { color: "#ddd", fontSize: 13, fontWeight: "700", marginBottom: 4 },
  cardNameSelected:{ color: "#A78BFA" },
  cardDesc:        { color: "#666", fontSize: 11, lineHeight: 15 },
  checkBadge:      { position: "absolute", top: 8, right: 8, backgroundColor: "#7C3AED", borderRadius: 10, width: 20, height: 20, alignItems: "center", justifyContent: "center" },
  suggBadge:       { position: "absolute", top: 6, right: 6 },
  suggBadgeTxt:    { fontSize: 12 },
  integList:       { padding: 12, gap: 8 },
  integRow:        { flexDirection: "row", alignItems: "center", backgroundColor: "#1A1A1A", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#2A2A2A", gap: 12 },
  integRowSelected:{ borderColor: "#7C3AED", backgroundColor: "#7C3AED12" },
  integIcon:       { fontSize: 28 },
  integInfo:       { flex: 1, gap: 2 },
  integName:       { color: "#ddd", fontSize: 14, fontWeight: "700" },
  integNameSel:    { color: "#A78BFA" },
  integDesc:       { color: "#666", fontSize: 12 },
  integEnv:        { color: "#444", fontSize: 10, fontFamily: "monospace" },
  integCheck:      { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: "#333", alignItems: "center", justifyContent: "center" },
  integCheckSel:   { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
  footer:          { padding: 16, paddingBottom: 34, borderTopWidth: 1, borderTopColor: "#222" },
  applyBtn:        { backgroundColor: "#7C3AED", borderRadius: 16, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 10 },
  applyTxt:        { color: "#fff", fontSize: 16, fontWeight: "700" },
});
