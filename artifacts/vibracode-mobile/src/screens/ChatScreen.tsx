import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ActionTabs, { ActionTabId } from "../components/ActionTabs";
import AgentModal from "../components/AgentModal";
import AnimatedOrb from "../components/AnimatedOrb";
import FileActionRow from "../components/FileActionRow";
import LivePreviewModal from "../components/LivePreviewModal";
import MessageBubble from "../components/MessageBubble";
import PublishModal from "../components/PublishModal";
import SessionsDrawer from "../components/SessionsDrawer";
import SkillsIntegrationsPicker from "../components/SkillsIntegrationsPicker";
import SuggestionChips from "../components/SuggestionChips";
import TasksCard from "../components/TasksCard";
import { CONFIG } from "../config";
import { Message, useChat } from "../context/ChatContext";
import { useSettings } from "../context/SettingsContext";
import SettingsScreen from "./SettingsScreen";

interface ChatScreenProps {
  tabBarHeight?: number;
}

export default function ChatScreen({ tabBarHeight = 0 }: ChatScreenProps) {
  const {
    currentSession,
    sessions,
    currentSessionId,
    selectedAgent,
    selectedModel,
    isSending,
    activeSkills,
    setSelectedAgent,
    setSelectedModel,
    createSession,
    selectSession,
    deleteSession,
    clearHistory,
    sendMessage,
    sendVisionMessage,
    toggleExpanded,
    cancelMessage,
  } = useChat();

  const { groqKey, getEffectiveOpenrouterKey } = useSettings();

  const [input, setInput] = useState("");
  const [showAgent, setShowAgent] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSkillsPicker, setShowSkillsPicker] = useState(false);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [selectedIntegIds, setSelectedIntegIds] = useState<string[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [activePreviewUrl, setActivePreviewUrl] = useState("");
  const [activeTab, setActiveTab] = useState<ActionTabId | undefined>(undefined);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  useEffect(() => {
    const msgs = currentSession?.messages ?? [];
    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg?.type === "preview" && lastMsg?.content?.startsWith("https://")) {
      setActivePreviewUrl(lastMsg.content);
      setShowPreviewModal(true);
    }
  }, [currentSession?.messages]);

  const handleSkillToggle = useCallback((id: string) => {
    setSelectedSkillIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }, []);

  const handleIntegToggle = useCallback((id: string) => {
    setSelectedIntegIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const handleApplySkills = useCallback(() => {
    setShowSkillsPicker(false);
  }, []);

  const listRef = useRef<FlatList<Message>>(null);
  const insets = useSafeAreaInsets();
  const messages = currentSession?.messages ?? [];

  // Android status bar is ~24dp, iOS notch can be 44–59dp
  const statusBarHeight = insets.top;
  const topBarHeight = statusBarHeight + 50;

  const hasUserMessages = messages.some((m) => m.role === "user");
  const activeAgent = CONFIG.AGENTS.find((a) => a.id === selectedAgent);

  // Android: keyboard behavior is 'height'; iOS: 'padding'
  const kbBehavior = Platform.OS === "android" ? "height" : "padding";

  const handleSend = useCallback(async () => {
    if (!input.trim() || isSending) return;
    const txt = input.trim();
    setInput("");
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await sendMessage(txt);
  }, [input, isSending, sendMessage]);

  const handleVoice = useCallback(async () => {
    if (Platform.OS === "web") {
      Alert.alert("الصوت", "إدخال الصوت متاح فقط على الأجهزة المحمولة.");
      return;
    }

    if (isRecording && recording) {
      try {
        setIsRecording(false);
        setIsTranscribing(true);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);

        if (!uri) { setIsTranscribing(false); return; }

        let base64Audio: string | null = null;
        try {
          const resp = await fetch(uri);
          const blob = await resp.blob();
          base64Audio = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch {}

        if (!base64Audio) {
          setIsTranscribing(false);
          Alert.alert("خطأ", "تعذر قراءة ملف الصوت.");
          return;
        }

        const backendUrl = CONFIG.BACKEND_URL;
        if (!backendUrl) {
          setIsTranscribing(false);
          Alert.alert("خطأ", "لم يتم إعداد خادم API.");
          return;
        }

        const res = await fetch(`${backendUrl}/transcribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audio: base64Audio,
            mimeType: "audio/m4a",
            groqKey: groqKey || undefined,
            openrouterKey: getEffectiveOpenrouterKey(),
          }),
        });

        if (res.ok) {
          const { text } = (await res.json()) as { text: string };
          if (text?.trim()) setInput(text.trim());
          else Alert.alert("لا يوجد كلام", "لم يتم الكشف عن أي كلام. حاول مجدداً.");
        } else {
          const e = await res.json().catch(() => ({})) as any;
          Alert.alert("خطأ في التفريغ", e.error ?? "فشل التفريغ.");
        }
      } catch (e: any) {
        Alert.alert("خطأ", e?.message ?? "فشل التفريغ.");
      } finally {
        setIsTranscribing(false);
      }
      return;
    }

    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) { Alert.alert("إذن مطلوب", "يجب السماح باستخدام الميكروفون."); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(rec);
      setIsRecording(true);
      if ((Platform.OS as string) !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      Alert.alert("خطأ", "تعذر بدء التسجيل.");
    }
  }, [isRecording, recording, groqKey, getEffectiveOpenrouterKey]);

  const handleImagePick = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.8,
        base64: true,
        allowsEditing: false,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      if (!asset.base64) { Alert.alert("خطأ", "تعذر قراءة الصورة."); return; }
      const mimeType = asset.mimeType ?? "image/jpeg";
      const userText = input.trim() || "ما الذي يمكن بناؤه استناداً لهذه الصورة؟";
      setInput("");
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await sendVisionMessage(userText, asset.base64, mimeType);
    } catch (e: any) {
      Alert.alert("خطأ", e?.message ?? "تعذر اختيار الصورة.");
    }
  }, [input, sendVisionMessage]);

  const handleTabPress = useCallback(
    (tab: ActionTabId) => {
      setActiveTab((prev) => (prev === tab ? undefined : tab));
      switch (tab) {
        case "publish":   setShowPublish(true); break;
        case "haptic":
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case "audio":     setInput("أضف موسيقى خلفية ومؤثرات صوتية للتطبيق"); break;
        case "logs":      setInput("أظهر سجلات البناء والأخطاء"); break;
        case "db":        setInput("أضف قاعدة بيانات Convex مع ملفات المستخدمين والمزامنة الفورية"); break;
        case "payment":   setInput("أضف نظام دفع مع Stripe ومدفوعات داخل التطبيق"); break;
        case "image":     handleImagePick(); break;
        case "github":    setInput("اربط التطبيق بـ GitHub: أنشئ مستودعاً، أضف CI/CD بـ GitHub Actions، واضبط النشر التلقائي"); break;
        case "test":      setInput("اكتب اختبارات شاملة للتطبيق: Unit Tests بـ Jest، Integration Tests، وE2E Tests"); break;
        case "deploy":    setInput("ابنِ ملف APK للأندرويد بـ EAS Build وأرسل رابط التحميل"); break;
      }
    },
    [handleImagePick]
  );

  const renderItem = useCallback(
    ({ item }: { item: Message }) => {
      if (item.type === "tasks" && item.tasks) {
        return <View style={s.msgWrap}><TasksCard tasks={item.tasks} /></View>;
      }
      if (item.type === "read" || item.type === "edit" || item.type === "bash") {
        return (
          <FileActionRow
            type={item.type}
            fileCount={item.fileCount}
            expanded={item.expanded}
            onToggle={() => toggleExpanded(item.id)}
          />
        );
      }
      return <View style={s.msgWrap}><MessageBubble item={item} /></View>;
    },
    [toggleExpanded]
  );

  const bottomInset = insets.bottom;

  return (
    <View style={s.root}>
      {/* ── Floating TopBar ── */}
      <View style={[s.topBar, { paddingTop: statusBarHeight + 8 }]}>
        <Pressable style={s.titleRow} onPress={() => setShowSessions(true)}>
          <Text style={s.titleText} numberOfLines={1}>
            {currentSession?.name ?? "Vibra Code"}
          </Text>
          <View style={s.chevronBtn}>
            <Feather name="chevron-down" size={12} color="#666" />
          </View>
        </Pressable>
        <View style={s.topRight}>
          {activeSkills.length > 0 && (
            <View style={s.skillsBadge}>
              <Text style={s.skillsBadgeText}>📌 {activeSkills.length}</Text>
            </View>
          )}
          {activeAgent && (
            <TouchableOpacity
              style={[s.providerBadge, { borderColor: activeAgent.color + "50" }]}
              onPress={() => setShowAgent(true)}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            >
              <View style={[s.providerDot, { backgroundColor: activeAgent.color }]} />
              <Text style={[s.providerText, { color: activeAgent.color }]}>{activeAgent.label}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={s.iconBtn}
            onPress={clearHistory}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Feather name="refresh-ccw" size={14} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => setShowSettings(true)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Feather name="settings" size={14} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Background orb ── */}
      <View style={[s.orbWrap, { pointerEvents: "none" }]}>
        <AnimatedOrb size={80} />
      </View>

      {/* ── Main chat area ── */}
      <KeyboardAvoidingView
        style={s.flex1}
        behavior={kbBehavior}
        keyboardVerticalOffset={Platform.OS === "android" ? 0 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            s.listContent,
            { paddingTop: topBarHeight + 4, flexGrow: 1, justifyContent: "flex-end" },
          ]}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        {/* ── Action Tabs ── */}
        <ActionTabs mode="chat" activeTab={activeTab} onPress={handleTabPress} />

        {/* ── Suggestion Chips ── */}
        <SuggestionChips visible={!hasUserMessages} onSelect={(p) => setInput(p)} />

        {/* ── Status Banners ── */}
        {isRecording && (
          <View style={s.recBanner}>
            <View style={s.recDot} />
            <Text style={s.recText}>جارٍ التسجيل — اضغط مجدداً للإيقاف</Text>
          </View>
        )}
        {isTranscribing && (
          <View style={s.transBanner}>
            <ActivityIndicator size="small" color="#F97316" />
            <Text style={s.transText}>جارٍ تفريغ الصوت...</Text>
          </View>
        )}

        {/* ── Input Bar ── */}
        <View style={[s.inputBar, { paddingBottom: Math.max(bottomInset, 8) }]}>
          {/* Agent selector */}
          <TouchableOpacity
            style={[s.agentBtn, activeAgent && { backgroundColor: activeAgent.color + "22" }]}
            onPress={() => setShowAgent(true)}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Text style={[s.asterisk, activeAgent && { color: activeAgent.color }]}>✦</Text>
          </TouchableOpacity>

          {/* Text input */}
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="صف تطبيقك..."
            placeholderTextColor="#303030"
            multiline
            maxLength={4000}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            blurOnSubmit={false}
          />

          {/* Skills / integrations */}
          <TouchableOpacity
            style={[s.inputIconBtn, (selectedSkillIds.length + selectedIntegIds.length) > 0 && s.skillsIconActive]}
            onPress={() => setShowSkillsPicker(true)}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            {(selectedSkillIds.length + selectedIntegIds.length) > 0 ? (
              <View style={s.skillsIconBadge}>
                <Text style={s.skillsIconBadgeTxt}>{selectedSkillIds.length + selectedIntegIds.length}</Text>
              </View>
            ) : (
              <Feather name="zap" size={17} color="#444" />
            )}
          </TouchableOpacity>

          {/* Image */}
          <TouchableOpacity
            style={s.inputIconBtn}
            onPress={handleImagePick}
            disabled={isSending}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Feather name="image" size={17} color={isSending ? "#252525" : "#444"} />
          </TouchableOpacity>

          {/* Send / Stop */}
          {isSending ? (
            <TouchableOpacity style={s.stopBtn} onPress={cancelMessage}>
              <Feather name="square" size={14} color="#EF4444" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.sendBtn, input.trim() && s.sendBtnActive]}
              onPress={handleSend}
              disabled={!input.trim()}
            >
              <Feather name="arrow-up" size={16} color={input.trim() ? "#FFF" : "#252525"} />
            </TouchableOpacity>
          )}

          {/* Mic */}
          <TouchableOpacity
            style={[s.inputIconBtn, isRecording && s.recActive]}
            onPress={handleVoice}
            disabled={isTranscribing || isSending}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            {isTranscribing ? (
              <ActivityIndicator size="small" color="#F97316" />
            ) : (
              <Feather
                name={isRecording ? "square" : "mic"}
                size={17}
                color={isRecording ? "#EF4444" : "#444"}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── Modals ── */}
      <AgentModal
        visible={showAgent}
        selectedAgent={selectedAgent}
        selectedModel={selectedModel}
        onSelectAgent={setSelectedAgent}
        onSelectModel={setSelectedModel}
        onClose={() => setShowAgent(false)}
      />
      <SessionsDrawer
        visible={showSessions}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={selectSession}
        onCreateSession={() => { createSession(); setShowSessions(false); }}
        onDeleteSession={deleteSession}
        onClose={() => setShowSessions(false)}
      />
      <PublishModal visible={showPublish} onClose={() => setShowPublish(false)} />
      <SettingsScreen visible={showSettings} onClose={() => setShowSettings(false)} />

      <SkillsIntegrationsPicker
        visible={showSkillsPicker}
        onClose={() => setShowSkillsPicker(false)}
        selectedSkillIds={selectedSkillIds}
        selectedIntegIds={selectedIntegIds}
        onSkillToggle={handleSkillToggle}
        onIntegToggle={handleIntegToggle}
        onApply={handleApplySkills}
        prompt={input}
      />

      {activePreviewUrl ? (
        <LivePreviewModal
          visible={showPreviewModal}
          url={activePreviewUrl}
          onClose={() => setShowPreviewModal(false)}
          sandboxId={undefined}
        />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#080808" },
  flex1: { flex: 1 },

  topBar: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 10,
    backgroundColor: "#080808EE",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    paddingVertical: 4,
  },
  titleText: { color: "#EEE", fontSize: 15, fontWeight: "700", maxWidth: 160 },
  chevronBtn: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "#191919",
    justifyContent: "center", alignItems: "center",
  },
  topRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  providerBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 9, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, backgroundColor: "#111",
    minHeight: 32,
  },
  providerDot: { width: 6, height: 6, borderRadius: 3 },
  providerText: { fontSize: 10, fontWeight: "700" },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "#141414",
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "#1E1E1E",
  },
  skillsBadge: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 10, backgroundColor: "#6C47FF20",
    borderWidth: 1, borderColor: "#6C47FF40",
  },
  skillsBadgeText: { color: "#A78BFA", fontSize: 10, fontWeight: "700" },

  orbWrap: {
    position: "absolute",
    left: -38, top: "35%",
    zIndex: 0, opacity: 0.7,
  },

  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  msgWrap: { marginVertical: 1 },

  recBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: "#1A0808",
    borderTopWidth: 1, borderTopColor: "#EF444418",
  },
  recDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#EF4444" },
  recText: { color: "#EF4444", fontSize: 12, fontWeight: "600" },
  transBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: "#1A0F08",
    borderTopWidth: 1, borderTopColor: "#F9731618",
  },
  transText: { color: "#F97316", fontSize: 12, fontWeight: "600" },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingTop: 9,
    backgroundColor: "#080808",
    borderTopWidth: 1,
    borderTopColor: "#131313",
    gap: 4,
  },
  agentBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#141414",
    justifyContent: "center", alignItems: "center",
    flexShrink: 0,
  },
  asterisk: { color: "#F97316", fontSize: 15, fontWeight: "700", lineHeight: 20 },
  inputIconBtn: {
    width: 38, height: 38,
    justifyContent: "center", alignItems: "center",
    flexShrink: 0,
  },
  recActive: {
    backgroundColor: "#1A0808", borderRadius: 19,
    borderWidth: 1, borderColor: "#EF444430",
  },
  skillsIconActive: {
    backgroundColor: "#7C3AED22", borderRadius: 19,
    borderWidth: 1, borderColor: "#7C3AED55",
  },
  skillsIconBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "#7C3AED",
    alignItems: "center", justifyContent: "center",
  },
  skillsIconBadgeTxt: { color: "#fff", fontSize: 10, fontWeight: "700" },
  input: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "android" ? 9 : 8,
    color: "#EEE",
    fontSize: 15,
    maxHeight: 130,
    minHeight: 38,
    borderWidth: 1,
    borderColor: "#1C1C1C",
    textAlignVertical: "center",
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#1C1C1C",
    justifyContent: "center", alignItems: "center",
    flexShrink: 0,
  },
  sendBtnActive: { backgroundColor: "#6C47FF" },
  stopBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#200808",
    borderWidth: 1, borderColor: "#EF444430",
    justifyContent: "center", alignItems: "center",
    flexShrink: 0,
  },
});
