import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import React, { useCallback, useRef, useState } from "react";
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
import MessageBubble from "../components/MessageBubble";
import PublishModal from "../components/PublishModal";
import SessionsDrawer from "../components/SessionsDrawer";
import SuggestionChips from "../components/SuggestionChips";
import TasksCard from "../components/TasksCard";
import { CONFIG } from "../config";
import { Message, useChat } from "../context/ChatContext";
import { useSettings } from "../context/SettingsContext";
import SettingsScreen from "./SettingsScreen";

interface ChatScreenProps {
  tabBarHeight?: number;
}

export default function ChatScreen({ tabBarHeight = 60 }: ChatScreenProps) {
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
  const [activeTab, setActiveTab] = useState<ActionTabId | undefined>(undefined);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const listRef = useRef<FlatList<Message>>(null);
  const insets = useSafeAreaInsets();
  const messages = currentSession?.messages ?? [];
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const hasUserMessages = messages.some((m) => m.role === "user");

  const activeAgent = CONFIG.AGENTS.find((a) => a.id === selectedAgent);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isSending) return;
    const txt = input.trim();
    setInput("");
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await sendMessage(txt);
  }, [input, isSending, sendMessage]);

  // ── Real voice recording with Whisper transcription ──────────────────────
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

  // ── Image picker with real vision support ────────────────────────────────
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

  return (
    <View style={s.root}>
      {/* ── Floating TopBar ── */}
      <View style={[s.topBar, { paddingTop: topPad + 4 }]}>
        <Pressable style={s.titleRow} onPress={() => setShowSessions(true)}>
          <Text style={s.titleText} numberOfLines={1}>
            {currentSession?.name ?? "Vibra Code"}
          </Text>
          <View style={s.chevronBtn}>
            <Feather name="chevron-down" size={11} color="#666" />
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
            >
              <View style={[s.providerDot, { backgroundColor: activeAgent.color }]} />
              <Text style={[s.providerText, { color: activeAgent.color }]}>{activeAgent.label}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.iconBtn32} onPress={clearHistory}>
            <Feather name="refresh-ccw" size={13} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn32} onPress={() => setShowSettings(true)}>
            <Feather name="settings" size={14} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Background orb ── */}
      <View style={[s.orbWrap, { pointerEvents: "none" }]}>
        <AnimatedOrb size={80} />
      </View>

      {/* ── Main chat area ── */}
      <KeyboardAvoidingView style={s.flex1} behavior="padding" keyboardVerticalOffset={0}>
        {/* Messages list — fills all space, content sticks to bottom */}
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            s.listContent,
            { paddingTop: topPad + 54 },
            { flexGrow: 1, justifyContent: "flex-end" },
          ]}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        {/* ── Action Tabs ── */}
        <ActionTabs mode="chat" activeTab={activeTab} onPress={handleTabPress} />

        {/* ── Suggestion Chips (above input, only when no messages) ── */}
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
        <View style={s.inputBar}>
          <TouchableOpacity
            style={[s.agentBtn, activeAgent && { backgroundColor: activeAgent.color + "22" }]}
            onPress={() => setShowAgent(true)}
          >
            <Text style={[s.asterisk, activeAgent && { color: activeAgent.color }]}>✦</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.inputIconBtn} onPress={handleImagePick} disabled={isSending}>
            <Feather name="image" size={18} color={isSending ? "#252525" : "#444"} />
          </TouchableOpacity>

          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="صف تطبيقك..."
            placeholderTextColor="#252525"
            multiline
            maxLength={4000}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            blurOnSubmit={false}
          />

          {isSending ? (
            <TouchableOpacity style={s.stopBtn} onPress={cancelMessage}>
              <Feather name="square" size={15} color="#EF4444" />
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

          <TouchableOpacity
            style={[s.inputIconBtn, isRecording && s.recActive]}
            onPress={handleVoice}
            disabled={isTranscribing || isSending}
          >
            {isTranscribing ? (
              <ActivityIndicator size="small" color="#F97316" />
            ) : (
              <Feather
                name={isRecording ? "square" : "mic"}
                size={18}
                color={isRecording ? "#EF4444" : "#444"}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Safe area bottom padding — accounts for floating tab bar */}
        <View style={{ height: tabBarHeight }} />
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
    backgroundColor: "#080808E8",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  titleText: { color: "#EEE", fontSize: 15, fontWeight: "700", maxWidth: 170 },
  chevronBtn: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#191919",
    justifyContent: "center", alignItems: "center",
  },
  topRight: { flexDirection: "row", alignItems: "center", gap: 7 },
  providerBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, backgroundColor: "#111",
  },
  providerDot: { width: 6, height: 6, borderRadius: 3 },
  providerText: { fontSize: 10, fontWeight: "700" },
  iconBtn32: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "#141414",
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "#1E1E1E",
  },
  skillsBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
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
    paddingHorizontal: 16, paddingVertical: 7,
    backgroundColor: "#1A0808",
    borderTopWidth: 1, borderTopColor: "#EF444418",
  },
  recDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#EF4444" },
  recText: { color: "#EF4444", fontSize: 12, fontWeight: "600" },
  transBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 7,
    backgroundColor: "#1A0F08",
    borderTopWidth: 1, borderTopColor: "#F9731618",
  },
  transText: { color: "#F97316", fontSize: 12, fontWeight: "600" },

  inputBar: {
    flexDirection: "row", alignItems: "flex-end",
    paddingHorizontal: 10, paddingTop: 9,
    backgroundColor: "#080808",
    borderTopWidth: 1, borderTopColor: "#131313",
    gap: 5,
  },
  agentBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "#141414",
    justifyContent: "center", alignItems: "center",
  },
  asterisk: { color: "#F97316", fontSize: 15, fontWeight: "700", lineHeight: 19 },
  inputIconBtn: {
    width: 34, height: 34,
    justifyContent: "center", alignItems: "center",
  },
  recActive: {
    backgroundColor: "#1A0808", borderRadius: 17,
    borderWidth: 1, borderColor: "#EF444430",
  },
  input: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    color: "#EEE", fontSize: 15,
    maxHeight: 130, minHeight: 36,
    borderWidth: 1, borderColor: "#1C1C1C",
  },
  sendBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "#1C1C1C",
    justifyContent: "center", alignItems: "center",
  },
  sendBtnActive: { backgroundColor: "#6C47FF" },
  stopBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "#200808",
    borderWidth: 1, borderColor: "#EF444430",
    justifyContent: "center", alignItems: "center",
  },
});
