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
    id: "expo-app",
    title: "تطبيق Expo كامل",
    description: "أنشئ تطبيقاً كاملاً بـ Expo + TypeScript",
    prompt: "أنشئ تطبيق React Native كامل بـ Expo SDK 54 + TypeScript: Navigation بـ expo-router، UI حديث، State Management، API Integration، Dark Mode.",
    icon: "smartphone", color: "#06B6D4", category: "بناء", free: true,
  },
  {
    id: "api-design",
    title: "تصميم REST API",
    description: "بناء API بـ Express + TypeScript + Zod",
    prompt: "صمّم REST API بـ Express + TypeScript: Routes، Middleware، Error Handling، Validation بـ Zod، OpenAPI Docs، Rate Limiting.",
    icon: "server", color: "#EF4444", category: "بناء", free: true,
  },
  {
    id: "ui-component",
    title: "مكوّن UI متقدم",
    description: "مكوّنات React Native مع Animations",
    prompt: "أنشئ مكوّن React Native: TypeScript Props، Reanimated Animations، Dark Mode، RTL Support، Accessibility، Storybook story.",
    icon: "layers", color: "#EC4899", category: "بناء", free: true,
  },
  {
    id: "perf-opt",
    title: "تحسين الأداء",
    description: "تحليل وتحسين أداء التطبيق",
    prompt: "حلّل ووحسّن الأداء: React.memo/useMemo/useCallback، FlatList optimizations، Bundle splitting، Lazy loading، Network caching.",
    icon: "zap", color: "#10B981", category: "تحسين", free: true,
  },
  {
    id: "security",
    title: "تدقيق الأمان",
    description: "فحص ثغرات الأمان الشاملة",
    prompt: "افحص أمنياً: SQL Injection، XSS، Insecure Storage، API Key Exposure، Auth Issues، OWASP Mobile Top 10، وقدّم الإصلاحات.",
    icon: "lock", color: "#6C47FF", category: "أمان", free: true,
  },
  {
    id: "cicd",
    title: "CI/CD Pipeline",
    description: "GitHub Actions للنشر التلقائي",
    prompt: "أنشئ GitHub Actions workflow: اختبارات تلقائية، ESLint، TypeScript check، EAS Build لـ Android/iOS، نشر Expo OTA، إشعارات Slack.",
    icon: "git-merge", color: "#F97316", category: "DevOps", free: true,
  },
  {
    id: "db-schema",
    title: "قاعدة بيانات Convex",
    description: "Schema + Queries + Mutations + Real-time",
    prompt: "صمّم Convex database كاملة: Schema definitions، Queries، Mutations، Actions، Real-time subscriptions، Indexes للأداء.",
    icon: "database", color: "#76C442", category: "بناء", free: true,
  },
  {
    id: "translate",
    title: "ترجمة الكود",
    description: "حوّل الكود بين لغات البرمجة",
    prompt: "حوّل هذا الكود مع الحفاظ على نفس المنطق والأداء. اشرح الفروقات الرئيسية والـ idioms الخاصة بكل لغة.",
    icon: "repeat", color: "#0EA5E9", category: "تطوير", free: true,
  },
  // GitHub Tools
  {
    id: "langchain",
    title: "LangChain Agent",
    description: "بناء وكيل ذكي بـ LangChain",
    prompt: "استخدم LangChain لبناء وكيل ذكاء اصطناعي يمكنه: البحث على الويب، تشغيل الكود، قراءة الملفات، واستخدام APIs خارجية. استخدم OpenRouter للنماذج.",
    icon: "link", color: "#F59E0B", category: "ذكاء اصطناعي", free: true,
  },
  {
    id: "autogen",
    title: "AutoGen Multi-Agent",
    description: "نظام متعدد الوكلاء بـ AutoGen",
    prompt: "بناء نظام AutoGen multi-agent بـ Python: AssistantAgent + UserProxyAgent + GroupChat. ضمّن CoderAgent وCriticAgent للتعاون في حل المشكلات.",
    icon: "users", color: "#8B5CF6", category: "ذكاء اصطناعي", free: true,
  },
  {
    id: "crewai",
    title: "CrewAI Workflow",
    description: "فريق وكلاء متخصصين بـ CrewAI",
    prompt: "أنشئ CrewAI workflow بفريق متخصص: ResearchAgent + CoderAgent + ReviewerAgent + WriterAgent. كل وكيل له دور ومهمة محددة.",
    icon: "cpu", color: "#EC4899", category: "ذكاء اصطناعي", free: true,
  },
  {
    id: "opendevin",
    title: "OpenDevin Setup",
    description: "إعداد OpenDevin للبرمجة الذاتية",
    prompt: "ساعدني في إعداد OpenDevin محلياً: Docker setup، تهيئة OpenRouter API، إعداد sandbox آمن، وأول مهمة برمجية تلقائية.",
    icon: "terminal", color: "#22C55E", category: "ذكاء اصطناعي", free: true,
  },
  {
    id: "continue-dev",
    title: "Continue.dev",
    description: "إعداد Continue.dev مع OpenRouter",
    prompt: "اضبط Continue.dev في VSCode مع OpenRouter: تهيئة config.json، اختيار أفضل النماذج المجانية، custom prompts لمشروعي.",
    icon: "code", color: "#3B82F6", category: "أدوات", free: true,
  },
  {
    id: "gpt-engineer",
    title: "GPT Engineer",
    description: "توليد مشروع كامل من وصف",
    prompt: "استخدم نهج GPT Engineer لتوليد مشروع كامل من هذا الوصف: اكتب الـ spec أولاً، ثم الـ architecture، ثم كل ملف بالتفصيل.",
    icon: "feather", color: "#06B6D4", category: "ذكاء اصطناعي", free: true,
  },
  {
    id: "aider",
    title: "Aider AI Coding",
    description: "تحرير الكود بنمط Aider",
    prompt: "طبّق نهج Aider لتحرير الملفات: اقرأ الكود الموجود، افهم السياق الكامل، ثم أجرِ التعديلات الدقيقة مع شرح كل تغيير.",
    icon: "edit-2", color: "#F97316", category: "أدوات", free: true,
  },
  {
    id: "metaGPT",
    title: "MetaGPT Roles",
    description: "نظام أدوار متخصصة بـ MetaGPT",
    prompt: "استخدم نهج MetaGPT: ProductManager يكتب PRD، Architect يصمم الـ architecture، Engineer ينفّذ الكود، QA يكتب الاختبارات.",
    icon: "briefcase", color: "#EF4444", category: "ذكاء اصطناعي", free: true,
  },
];

const INTEGRATIONS: Integration[] = [
  // Active
  { id: "openrouter", name: "OpenRouter", description: "200+ نموذج ذكاء اصطناعي مجاني", icon: "globe", color: "#6C47FF", url: "https://openrouter.ai/keys", badge: "مجاني", connected: true, free: true },
  { id: "e2b", name: "E2B Sandbox", description: "تنفيذ الكود في بيئة سحابية آمنة", icon: "box", color: "#F43F5E", url: "https://e2b.dev", badge: "مجاني", connected: true, free: true },
  { id: "convex", name: "Convex", description: "قاعدة بيانات فورية Real-time", icon: "database", color: "#F97316", url: "https://convex.dev", badge: "مجاني", connected: true, free: true },
  { id: "expo", name: "Expo EAS", description: "نشر APK وتحديثات OTA", icon: "smartphone", color: "#3B82F6", url: "https://expo.dev", badge: "مجاني", connected: true, free: true },
  { id: "clerk", name: "Clerk Auth", description: "تسجيل دخول مع Social Login", icon: "user-check", color: "#22C55E", url: "https://clerk.com", badge: "مجاني", connected: true, free: true },
  // Free additions
  { id: "github", name: "GitHub", description: "مستودعات، Issues، PRs، Actions", icon: "github", color: "#EEE", url: "https://github.com/settings/tokens", badge: "مجاني", connected: false, free: true },
  { id: "huggingface", name: "Hugging Face", description: "نماذج AI مفتوحة المصدر مجاناً", icon: "cpu", color: "#FFD21E", url: "https://huggingface.co/settings/tokens", badge: "مجاني", connected: false, free: true },
  { id: "vercel", name: "Vercel", description: "نشر تطبيقات Next.js تلقائياً", icon: "triangle", color: "#EEE", url: "https://vercel.com", badge: "مجاني", connected: false, free: true },
  { id: "supabase", name: "Supabase", description: "Postgres + Auth + Storage مجاناً", icon: "layers", color: "#10B981", url: "https://supabase.com", badge: "مجاني", connected: false, free: true },
  { id: "railway", name: "Railway", description: "نشر Servers و Databases مجاناً", icon: "server", color: "#7B3FC4", url: "https://railway.app", badge: "مجاني", connected: false, free: true },
  { id: "render", name: "Render", description: "استضافة مجانية مع SSL تلقائي", icon: "cloud", color: "#46E3B7", url: "https://render.com", badge: "مجاني", connected: false, free: true },
  { id: "upstash", name: "Upstash Redis", description: "Redis مجاني للـ rate limiting والـ cache", icon: "database", color: "#00E9A3", url: "https://upstash.com", badge: "مجاني", connected: false, free: true },
  { id: "cloudinary", name: "Cloudinary", description: "تخزين ومعالجة الصور والفيديو", icon: "image", color: "#3448C5", url: "https://cloudinary.com", badge: "مجاني", connected: false, free: true },
  { id: "appwrite", name: "Appwrite", description: "Backend كامل: Auth، DB، Storage، Functions", icon: "shield", color: "#FD366E", url: "https://appwrite.io", badge: "مجاني", connected: false, free: true },
  { id: "netlify", name: "Netlify", description: "نشر تطبيقات الويب مجاناً", icon: "upload-cloud", color: "#00C7B7", url: "https://netlify.com", badge: "مجاني", connected: false, free: true },
  { id: "planetscale", name: "PlanetScale", description: "MySQL سحابي مع branching", icon: "git-branch", color: "#FF6154", url: "https://planetscale.com", badge: "مجاني", connected: false, free: true },
  { id: "neon", name: "Neon Postgres", description: "Postgres بدون خادم — Serverless", icon: "database", color: "#00E599", url: "https://neon.tech", badge: "مجاني", connected: false, free: true },
  { id: "liveblocks", name: "Liveblocks", description: "تعاون فوري — Multiplayer apps", icon: "users", color: "#7C3AED", url: "https://liveblocks.io", badge: "مجاني", connected: false, free: true },
];

const CUSTOM_SKILLS_KEY = "vibracode_custom_skills_v1";

export default function SkillsScreen() {
  const insets = useSafeAreaInsets();
  const { sendMessage } = useChat();
  const [tab, setTab] = useState<"skills" | "integrations">("skills");
  const [selectedCat, setSelectedCat] = useState("الكل");
  const [customSkills, setCustomSkills] = useState<Skill[]>([]);
  const [showAddSkill, setShowAddSkill] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CUSTOM_SKILLS_KEY).then((val) => {
      if (val) {
        try { setCustomSkills(JSON.parse(val)); } catch {}
      }
    });
  }, []);

  const allSkills = [...DEFAULT_SKILLS, ...customSkills];
  const categories = ["الكل", ...new Set(allSkills.map((s) => s.category))];
  const filteredSkills = selectedCat === "الكل" ? allSkills : allSkills.filter((s) => s.category === selectedCat);

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
        { text: "إرسال", onPress: () => sendMessage(skill.prompt) },
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
            {customSkills.length > 0 && selectedCat === "الكل" && (
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
                        {skill.custom ? "مخصص" : "مجاني"}
                      </Text>
                    </View>
                  </View>
                  <Text style={s.skillDesc} numberOfLines={2}>{skill.description}</Text>
                  <Text style={s.skillCat}>{skill.category}</Text>
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

      {/* Add Custom Skill Modal */}
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
const ICONS = ["zap", "code", "cpu", "terminal", "shield", "book-open", "feather", "link", "layers", "star", "tool", "git-branch"];

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
              <Text style={ms.saveBtnText}>حفظ المهارة</Text>
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
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: "#111",
  },
  headerTitle: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  headerSub: { color: "#444", fontSize: 11, marginTop: 3 },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: "#6C47FF18", borderWidth: 1, borderColor: "#6C47FF40",
  },
  addBtnText: { color: "#6C47FF", fontSize: 12, fontWeight: "700" },
  mainTabs: {
    flexDirection: "row", marginHorizontal: 16, marginTop: 12,
    backgroundColor: "#0F0F0F", borderRadius: 14, padding: 3,
    borderWidth: 1, borderColor: "#181818",
  },
  mainTab: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 11,
  },
  mainTabActive: { backgroundColor: "#1E1E1E" },
  mainTabText: { color: "#444", fontSize: 12, fontWeight: "600" },
  mainTabTextActive: { color: "#EEE" },
  catScroll: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: "#111", borderWidth: 1, borderColor: "#1A1A1A",
  },
  catChipActive: { backgroundColor: "#6C47FF18", borderColor: "#6C47FF50" },
  catChipText: { color: "#444", fontSize: 12, fontWeight: "600" },
  catChipTextActive: { color: "#6C47FF" },
  sectionLabel: {
    color: "#333", fontSize: 10, fontWeight: "700",
    textTransform: "uppercase", letterSpacing: 1,
    marginBottom: 8, marginHorizontal: 4,
  },
  skillsGrid: {
    padding: 12, paddingBottom: 110, gap: 8,
    flexDirection: IS_TABLET ? "row" : "column",
    flexWrap: IS_TABLET ? "wrap" : undefined,
  },
  skillCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#0D0D0D", borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: "#161616",
  },
  skillCardTablet: { width: "48%" },
  skillCardCustom: { borderColor: "#6C47FF30" },
  skillIcon: { width: 44, height: 44, borderRadius: 13, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  skillTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  skillTitle: { color: "#DDD", fontSize: 14, fontWeight: "700", flex: 1 },
  freeBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  freeBadgeText: { fontSize: 9, fontWeight: "700" },
  skillDesc: { color: "#444", fontSize: 12, lineHeight: 17 },
  skillCat: { color: "#2A2A2A", fontSize: 10 },
  integList: { padding: 16, paddingBottom: 110, gap: 8 },
  integCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#0D0D0D", borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: "#161616",
  },
  integIcon: { width: 44, height: 44, borderRadius: 13, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  integTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  integName: { color: "#DDD", fontSize: 14, fontWeight: "700", flex: 1 },
  integBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  integDot: { width: 5, height: 5, borderRadius: 3 },
  integBadgeText: { fontSize: 10, fontWeight: "700" },
  integDesc: { color: "#444", fontSize: 12, lineHeight: 17 },
});

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#0F0F0F", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 22, borderTopWidth: 1, borderColor: "#1E1E1E", maxHeight: "90%",
  },
  handle: { width: 36, height: 4, backgroundColor: "#2A2A2A", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  title: { color: "#FFF", fontSize: 18, fontWeight: "700", marginBottom: 16 },
  label: { color: "#555", fontSize: 11, fontWeight: "700", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    backgroundColor: "#141414", borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, color: "#FFF", fontSize: 14, borderWidth: 1,
    borderColor: "#1E1E1E", marginBottom: 14,
  },
  colorRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 14 },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotActive: { borderWidth: 3, borderColor: "#FFF" },
  iconBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  iconBtnActive: { borderWidth: 2, borderColor: "#FFF" },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#6C47FF", borderRadius: 14, paddingVertical: 14, marginTop: 16,
  },
  saveBtnText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
});
