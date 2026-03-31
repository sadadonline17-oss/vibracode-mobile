import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import React, { useCallback, useRef, useState } from "react";
import {
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
import SettingsScreen from "./SettingsScreen";

export default function ChatScreen() {
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
    toggleExpanded,
    cancelMessage,
  } = useChat();

  const [input, setInput] = useState("");
  const [showAgent, setShowAgent] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<ActionTabId | undefined>(undefined);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const listRef = useRef<FlatList<Message>>(null);
  const insets = useSafeAreaInsets();
  const messages = currentSession?.messages ?? [];
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom + 10, 20);

  const activeAgent = CONFIG.AGENTS.find((a) => a.id === selectedAgent);

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
      Alert.alert("Voice", "Voice input is available on mobile devices only.");
      return;
    }
    if (isRecording && recording) {
      await recording.stopAndUnloadAsync();
      setIsRecording(false);
      setRecording(null);
      Alert.alert("Voice recorded", "Voice transcription coming soon.");
      return;
    }
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission needed", "Microphone permission is required.");
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setIsRecording(true);
      if ((Platform.OS as string) !== "web")
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      Alert.alert("Error", "Could not start recording.");
    }
  }, [isRecording, recording]);

  const handleTabPress = useCallback(
    (tab: ActionTabId) => {
      setActiveTab((prev) => (prev === tab ? undefined : tab));
      switch (tab) {
        case "publish":
          setShowPublish(true);
          break;
        case "haptic":
          if (Platform.OS !== "web")
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case "audio":
          setInput("أضف موسيقى خلفية ومؤثرات صوتية للتطبيق");
          break;
        case "logs":
          setInput("أظهر سجلات البناء والأخطاء");
          break;
        case "db":
          setInput("أضف قاعدة بيانات Convex مع ملفات المستخدمين والمزامنة الفورية");
          break;
        case "payment":
          setInput("أضف نظام دفع مع Stripe ومدفوعات داخل التطبيق");
          break;
        case "image":
          setInput("أنشئ لقطات شاشة احترافية للتطبيق لمتاجر التطبيقات");
          break;
        case "github":
          setInput("اربط التطبيق بـ GitHub: أنشئ مستودعاً، أضف CI/CD بـ GitHub Actions، واضبط النشر التلقائي");
          break;
        case "test":
          setInput("اكتب اختبارات شاملة للتطبيق: Unit Tests بـ Jest، Integration Tests، وE2E Tests");
          break;
        case "deploy":
          setInput("ابنِ ملف APK للأندرويد بـ EAS Build وأرسل رابط التحميل");
          break;
      }
    },
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: Message }) => {
      if (item.type === "tasks" && item.tasks) {
        return (
          <View style={{ marginVertical: 2 }}>
            <TasksCard tasks={item.tasks} />
          </View>
        );
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
      return (
        <View style={{ marginVertical: 2 }}>
          <MessageBubble item={item} />
        </View>
      );
    },
    [toggleExpanded]
  );

  return (
    <View style={s.root}>
      {/* ── TopBar (floating) ── */}
      <View style={[s.topBar, { paddingTop: topPad + 4 }]}>
        <Pressable style={s.titleRow} onPress={() => setShowSessions(true)}>
          <Text style={s.titleText} numberOfLines={1}>
            {currentSession?.name ?? "Vibra Code"}
          </Text>
          <View style={s.chevronBtn}>
            <Feather name="chevron-down" size={12} color="#AAA" />
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
              style={[s.providerBadge, { borderColor: activeAgent.color + "40" }]}
              onPress={() => setShowAgent(true)}
            >
              <View style={[s.providerDot, { backgroundColor: activeAgent.color }]} />
              <Text style={[s.providerText, { color: activeAgent.color }]}>
                {activeAgent.label}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.clearBtn} onPress={clearHistory} activeOpacity={0.8}>
            <Feather name="refresh-ccw" size={13} color="#AAA" />
          </TouchableOpacity>
          <TouchableOpacity style={s.settingsBtn} onPress={() => setShowSettings(true)} activeOpacity={0.8}>
            <Feather name="settings" size={15} color="#888" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Main area ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <View style={{ flex: 1 }}>
          {/* Animated Orb */}
          <View style={[s.orbWrap, { pointerEvents: "none" }]}>
            <AnimatedOrb size={86} />
          </View>

          <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[s.listContent, { paddingTop: topPad + 60 }]}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: true })
            }
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </View>

        {/* ── Suggestion Chips (above input, when no user messages) ── */}
        <SuggestionChips
          visible={!messages.some((m) => m.role === "user")}
          onSelect={(prompt) => { setInput(prompt); }}
        />

        {/* ── Action Tabs ── */}
        <ActionTabs mode="chat" activeTab={activeTab} onPress={handleTabPress} />

        {/* ── Input Bar ── */}
        <View style={[s.inputBar, { paddingBottom: bottomPad }]}>
          {/* Agent / Provider selector button */}
          <TouchableOpacity
            style={[
              s.agentBtn,
              activeAgent && { backgroundColor: activeAgent.color + "22" },
            ]}
            onPress={() => setShowAgent(true)}
          >
            <Text style={[s.asterisk, activeAgent && { color: activeAgent.color }]}>
              ✦
            </Text>
          </TouchableOpacity>

          {/* Image attach */}
          <TouchableOpacity
            style={s.iconBtn}
            onPress={async () => {
              const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
              if (!r.canceled)
                sendMessage("[Image] Describe what to build based on: " + (r.assets[0].fileName ?? "screenshot"));
            }}
          >
            <Feather name="image" size={18} color="#555" />
          </TouchableOpacity>

          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Describe your app..."
            placeholderTextColor="#2E2E2E"
            multiline
            maxLength={4000}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            blurOnSubmit={false}
          />

          {/* Send / Cancel */}
          {isSending ? (
            <TouchableOpacity style={s.stopBtn} onPress={cancelMessage}>
              <Feather name="square" size={16} color="#EF4444" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.sendBtn, input.trim().length > 0 && s.sendBtnActive]}
              onPress={handleSend}
              disabled={!input.trim()}
            >
              <Feather
                name="arrow-up"
                size={17}
                color={input.trim().length > 0 ? "#FFF" : "#333"}
              />
            </TouchableOpacity>
          )}

          {/* Mic */}
          <TouchableOpacity
            style={[s.iconBtn, isRecording && s.recActive]}
            onPress={handleVoice}
          >
            <Feather
              name={isRecording ? "square" : "mic"}
              size={18}
              color={isRecording ? "#EF4444" : "#555"}
            />
          </TouchableOpacity>
        </View>
        {Platform.OS === "web" && <View style={{ height: 34 }} />}
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
        onCreateSession={() => {
          createSession();
          setShowSessions(false);
        }}
        onDeleteSession={deleteSession}
        onClose={() => setShowSessions(false)}
      />
      <PublishModal visible={showPublish} onClose={() => setShowPublish(false)} />
      <SettingsScreen visible={showSettings} onClose={() => setShowSettings(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0A0A" },

  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 8,
    backgroundColor: "#0A0A0ACC",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flex: 1,
  },
  titleText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    maxWidth: 160,
  },
  chevronBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#1E1E1E",
    justifyContent: "center",
    alignItems: "center",
  },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  providerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "#111",
  },
  providerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  providerText: {
    fontSize: 11,
    fontWeight: "700",
  },
  clearBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#161616",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  settingsBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#161616",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
  },

  orbWrap: {
    position: "absolute",
    left: -42,
    top: "32%",
    zIndex: 1,
    opacity: 0.8,
  },

  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    flexGrow: 1,
  },
  skillsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#6C47FF22",
    borderWidth: 1,
    borderColor: "#6C47FF44",
  },
  skillsBadgeText: {
    color: "#A78BFA",
    fontSize: 11,
    fontWeight: "700",
  },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingTop: 10,
    backgroundColor: "#0A0A0A",
    borderTopWidth: 1,
    borderTopColor: "#111",
    gap: 6,
  },
  agentBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#161616",
    justifyContent: "center",
    alignItems: "center",
  },
  asterisk: {
    color: "#F97316",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
  },
  iconBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  recActive: {},
  input: {
    flex: 1,
    backgroundColor: "#141414",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 9,
    color: "#FFF",
    fontSize: 15,
    maxHeight: 120,
    minHeight: 38,
    borderWidth: 1,
    borderColor: "#1E1E1E",
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnActive: {
    backgroundColor: "#6C47FF",
  },
  stopBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1A0A0A",
    borderWidth: 1,
    borderColor: "#EF444440",
    justifyContent: "center",
    alignItems: "center",
  },
});
