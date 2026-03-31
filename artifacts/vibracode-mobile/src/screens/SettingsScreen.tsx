import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AgentType, CONFIG } from "../config";
import { useChat } from "../context/ChatContext";
import { useSettings } from "../context/SettingsContext";

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Section = "keys" | "agents" | "models";

const PROVIDERS = [
  {
    id: "openrouter",
    label: "OpenRouter",
    icon: "globe" as const,
    color: "#6C47FF",
    description: "يوفر وصولاً موحداً لجميع النماذج (Claude، Gemini، GPT، Qwen...)",
    placeholder: "sk-or-v1-...",
    keyName: "openrouterKey" as const,
    setKey: "setOpenrouterKey" as const,
    docsUrl: "https://openrouter.ai/keys",
  },
  {
    id: "gemini",
    label: "Google Gemini",
    icon: "star" as const,
    color: "#3B82F6",
    description: "مفتاح Gemini النative للوصول المباشر لنماذج Google",
    placeholder: "AIzaSy...",
    keyName: "geminiKey" as const,
    setKey: "setGeminiKey" as const,
    docsUrl: "https://aistudio.google.com/apikey",
  },
];

export default function SettingsScreen({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const settings = useSettings();
  const chat = useChat();
  const [section, setSection] = useState<Section>("agents");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const activeAgent = CONFIG.AGENTS.find((a) => a.id === chat.selectedAgent);

  function toggleShowKey(id: string) {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleResetKeys() {
    Alert.alert(
      "إعادة تعيين",
      "هل تريد إعادة تعيين جميع الإعدادات للقيم الافتراضية؟",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "إعادة تعيين",
          style: "destructive",
          onPress: () => settings.resetKeys(),
        },
      ]
    );
  }

  const sections: { id: Section; label: string; icon: string }[] = [
    { id: "agents", label: "الأداة", icon: "cpu" },
    { id: "models", label: "النموذج", icon: "layers" },
    { id: "keys", label: "المفاتيح", icon: "key" },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[s.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Feather name="x" size={20} color="#888" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>الإعدادات</Text>
          <TouchableOpacity
            style={s.resetBtn}
            onPress={handleResetKeys}
            activeOpacity={0.7}
          >
            <Feather name="refresh-cw" size={15} color="#555" />
          </TouchableOpacity>
        </View>

        {/* Active state badge */}
        {activeAgent && (
          <View style={s.activeBanner}>
            <View
              style={[s.activeBannerIcon, { backgroundColor: activeAgent.color + "22" }]}
            >
              <Feather
                name={activeAgent.icon as any}
                size={16}
                color={activeAgent.color}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.activeBannerLabel}>الأداة النشطة الآن</Text>
              <Text style={[s.activeBannerAgent, { color: activeAgent.color }]}>
                {activeAgent.label} · {activeAgent.badge}
              </Text>
            </View>
            <View style={s.modelPill}>
              <Text style={s.modelPillText} numberOfLines={1}>
                {CONFIG.FREE_MODELS.find((m) => m.value === chat.selectedModel)
                  ?.label ?? chat.selectedModel.split("/").pop()}
              </Text>
            </View>
          </View>
        )}

        {/* Section Tabs */}
        <View style={s.tabs}>
          {sections.map((sec) => (
            <TouchableOpacity
              key={sec.id}
              style={[s.tab, section === sec.id && s.tabActive]}
              onPress={() => setSection(sec.id)}
              activeOpacity={0.7}
            >
              <Feather
                name={sec.icon as any}
                size={14}
                color={section === sec.id ? "#EEE" : "#555"}
              />
              <Text style={[s.tabText, section === sec.id && s.tabTextActive]}>
                {sec.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── AGENTS SECTION ─── */}
          {section === "agents" && (
            <View>
              <Text style={s.sectionHint}>
                اختر الأداة التي ستستخدمها للتحدث مع الذكاء الاصطناعي
              </Text>
              <View style={s.agentGrid}>
                {CONFIG.AGENTS.map((agent) => {
                  const active = chat.selectedAgent === agent.id;
                  return (
                    <TouchableOpacity
                      key={agent.id}
                      style={[
                        s.agentCard,
                        active && {
                          borderColor: agent.color,
                          backgroundColor: agent.color + "12",
                        },
                      ]}
                      onPress={() => chat.setSelectedAgent(agent.id as AgentType)}
                      activeOpacity={0.7}
                    >
                      <View style={s.agentCardTop}>
                        <View
                          style={[
                            s.agentIconCircle,
                            { backgroundColor: agent.color + "22" },
                          ]}
                        >
                          <Feather
                            name={agent.icon as any}
                            size={18}
                            color={agent.color}
                          />
                        </View>
                        {active && (
                          <View
                            style={[s.checkBadge, { backgroundColor: agent.color }]}
                          >
                            <Feather name="check" size={10} color="#FFF" />
                          </View>
                        )}
                      </View>
                      <Text style={s.agentCardTitle} numberOfLines={1}>
                        {agent.label}
                      </Text>
                      <View
                        style={[
                          s.agentBadge,
                          { backgroundColor: agent.color + "18" },
                        ]}
                      >
                        <Text
                          style={[s.agentBadgeText, { color: agent.color }]}
                        >
                          {agent.badge}
                        </Text>
                      </View>
                      <Text style={s.agentDesc} numberOfLines={2}>
                        {agent.description}
                      </Text>
                      <Text style={s.agentModel} numberOfLines={1}>
                        {agent.model.split("/").pop()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ─── MODELS SECTION ─── */}
          {section === "models" && (
            <View>
              <Text style={s.sectionHint}>
                اختر نموذجاً محدداً (يتجاوز نموذج الأداة الافتراضي)
              </Text>
              {CONFIG.FREE_MODELS.map((m) => {
                const active = chat.selectedModel === m.value;
                return (
                  <TouchableOpacity
                    key={m.value}
                    style={[s.modelRow, active && s.modelRowActive]}
                    onPress={() => chat.setSelectedModel(m.value)}
                    activeOpacity={0.7}
                  >
                    <View style={s.modelLeft}>
                      <View
                        style={[
                          s.modelDot,
                          active && { backgroundColor: "#6C47FF" },
                        ]}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={s.modelTitle}>{m.label}</Text>
                        <Text style={s.modelValue} numberOfLines={1}>
                          {m.value}
                        </Text>
                      </View>
                    </View>
                    <View style={s.modelRight}>
                      <View style={s.modelBadge}>
                        <Text style={s.modelBadgeText}>{m.badge}</Text>
                      </View>
                      {active && (
                        <Feather
                          name="check-circle"
                          size={16}
                          color="#6C47FF"
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ─── API KEYS SECTION ─── */}
          {section === "keys" && (
            <View>
              <Text style={s.sectionHint}>
                أضف مفاتيح API الخاصة بك للحصول على حدود استخدام أعلى. إذا تركتها
                فارغة، سيُستخدم المفتاح الافتراضي المشترك.
              </Text>

              {PROVIDERS.map((provider) => {
                const currentKey = settings[provider.keyName] as string;
                const isVisible = showKeys[provider.id] ?? false;
                const hasKey = currentKey.trim().length > 0;

                return (
                  <View key={provider.id} style={s.keyCard}>
                    {/* Provider header */}
                    <View style={s.keyCardHeader}>
                      <View
                        style={[
                          s.keyIcon,
                          { backgroundColor: provider.color + "22" },
                        ]}
                      >
                        <Feather
                          name={provider.icon}
                          size={16}
                          color={provider.color}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.keyLabel}>{provider.label}</Text>
                        <Text style={s.keyDesc}>{provider.description}</Text>
                      </View>
                      {hasKey && (
                        <View style={s.keyActiveBadge}>
                          <View style={s.keyActiveDot} />
                          <Text style={s.keyActiveText}>مفعّل</Text>
                        </View>
                      )}
                    </View>

                    {/* Input */}
                    <View style={s.keyInputRow}>
                      <TextInput
                        style={s.keyInput}
                        value={currentKey}
                        onChangeText={(text) => {
                          if (provider.id === "openrouter") {
                            settings.setOpenrouterKey(text);
                          } else {
                            settings.setGeminiKey(text);
                          }
                        }}
                        placeholder={provider.placeholder}
                        placeholderTextColor="#333"
                        secureTextEntry={!isVisible}
                        autoCapitalize="none"
                        autoCorrect={false}
                        spellCheck={false}
                      />
                      <TouchableOpacity
                        style={s.eyeBtn}
                        onPress={() => toggleShowKey(provider.id)}
                        activeOpacity={0.7}
                      >
                        <Feather
                          name={isVisible ? "eye-off" : "eye"}
                          size={16}
                          color="#444"
                        />
                      </TouchableOpacity>
                      {hasKey && (
                        <TouchableOpacity
                          style={s.clearBtn}
                          onPress={() => {
                            if (provider.id === "openrouter") {
                              settings.setOpenrouterKey("");
                            } else {
                              settings.setGeminiKey("");
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <Feather name="x" size={14} color="#555" />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Helper link */}
                    <Text style={s.keyHint}>
                      احصل على مفتاحك من{" "}
                      <Text style={[s.keyLink, { color: provider.color }]}>
                        {provider.docsUrl}
                      </Text>
                    </Text>
                  </View>
                );
              })}

              {/* Info card */}
              <View style={s.infoCard}>
                <Feather name="shield" size={14} color="#3B82F6" />
                <Text style={s.infoText}>
                  مفاتيح API تُحفظ محلياً على جهازك فقط ولا تُرسل لأي خادم خارجي
                  غير مزود الذكاء الاصطناعي المختار.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Save button (only for keys) */}
        {section === "keys" && (
          <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
            <TouchableOpacity style={s.saveBtn} onPress={onClose} activeOpacity={0.8}>
              <Feather name="check" size={16} color="#FFF" />
              <Text style={s.saveBtnText}>حفظ الإعدادات</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Done button for agents/models */}
        {section !== "keys" && (
          <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
            <TouchableOpacity
              style={s.doneBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={s.doneBtnText}>تم</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080808",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#141414",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#141414",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#EEE",
    fontSize: 17,
    fontWeight: "700",
  },
  resetBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#141414",
    justifyContent: "center",
    alignItems: "center",
  },
  activeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    margin: 16,
    padding: 14,
    backgroundColor: "#0D0D0D",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1A1A1A",
  },
  activeBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  activeBannerLabel: {
    color: "#444",
    fontSize: 11,
    fontWeight: "500",
  },
  activeBannerAgent: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  modelPill: {
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    maxWidth: 110,
  },
  modelPillText: {
    color: "#888",
    fontSize: 10,
    fontWeight: "600",
  },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: "#0F0F0F",
    borderRadius: 14,
    padding: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#181818",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 11,
  },
  tabActive: {
    backgroundColor: "#1E1E1E",
  },
  tabText: {
    color: "#444",
    fontSize: 12,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#EEE",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  sectionHint: {
    color: "#444",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
    textAlign: "right",
  },

  // Agent grid
  agentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  agentCard: {
    width: "47%",
    backgroundColor: "#0F0F0F",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1A1A1A",
    gap: 7,
  },
  agentCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  agentIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  agentCardTitle: {
    color: "#EEE",
    fontSize: 14,
    fontWeight: "700",
  },
  agentBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  agentBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  agentDesc: {
    color: "#444",
    fontSize: 11,
    lineHeight: 15,
  },
  agentModel: {
    color: "#2A2A2A",
    fontSize: 9,
    fontFamily: "monospace",
    marginTop: 2,
  },

  // Model list
  modelRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: "#0F0F0F",
    borderWidth: 1,
    borderColor: "#161616",
  },
  modelRowActive: {
    backgroundColor: "#6C47FF0E",
    borderColor: "#6C47FF30",
  },
  modelLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  modelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#252525",
    flexShrink: 0,
  },
  modelTitle: {
    color: "#DDD",
    fontSize: 14,
    fontWeight: "600",
  },
  modelValue: {
    color: "#333",
    fontSize: 10,
    marginTop: 2,
    fontFamily: "monospace",
  },
  modelRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 8,
  },
  modelBadge: {
    backgroundColor: "#181818",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modelBadgeText: {
    color: "#444",
    fontSize: 10,
    fontWeight: "600",
  },

  // API Key cards
  keyCard: {
    backgroundColor: "#0D0D0D",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#181818",
    gap: 12,
  },
  keyCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  keyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  keyLabel: {
    color: "#DDD",
    fontSize: 15,
    fontWeight: "700",
  },
  keyDesc: {
    color: "#444",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
    textAlign: "right",
  },
  keyActiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0D2E1A",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
  },
  keyActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
  },
  keyActiveText: {
    color: "#22C55E",
    fontSize: 10,
    fontWeight: "700",
  },
  keyInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A0A0A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1E1E1E",
    overflow: "hidden",
  },
  keyInput: {
    flex: 1,
    color: "#CCC",
    fontSize: 13,
    fontFamily: "monospace",
    paddingHorizontal: 14,
    paddingVertical: 12,
    letterSpacing: 0.5,
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderLeftWidth: 1,
    borderLeftColor: "#1A1A1A",
  },
  keyHint: {
    color: "#333",
    fontSize: 11,
    textAlign: "right",
  },
  keyLink: {
    fontWeight: "600",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#0A1A2E",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#0D2A4A",
    marginTop: 4,
  },
  infoText: {
    color: "#3B82F6",
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
    textAlign: "right",
  },

  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#141414",
    backgroundColor: "#080808",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#6C47FF",
    paddingVertical: 15,
    borderRadius: 16,
  },
  saveBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  doneBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1A1A",
    paddingVertical: 15,
    borderRadius: 16,
  },
  doneBtnText: {
    color: "#EEE",
    fontSize: 16,
    fontWeight: "700",
  },
});
