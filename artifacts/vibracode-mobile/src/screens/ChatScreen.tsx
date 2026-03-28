import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
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
import TasksCard from "../components/TasksCard";
import { CONFIG } from "../config";
import { Message, useChat } from "../context/ChatContext";

export default function ChatScreen() {
  const {
    currentSession,
    sessions,
    currentSessionId,
    selectedAgent,
    selectedModel,
    isSending,
    setSelectedAgent,
    setSelectedModel,
    createSession,
    selectSession,
    deleteSession,
    clearHistory,
    sendMessage,
    toggleExpanded,
  } = useChat();

  const [input, setInput] = useState("");
  const [showAgent, setShowAgent] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [activeTab, setActiveTab] = useState<ActionTabId | undefined>(undefined);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const listRef = useRef<FlatList<Message>>(null);
  const insets = useSafeAreaInsets();
  const messages = currentSession?.messages ?? [];
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom - 30, 4);

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
      Alert.alert("Voice", "Voice input available on mobile devices.");
      return;
    }
    if (isRecording && recording) {
      await recording.stopAndUnloadAsync();
      setIsRecording(false);
      setRecording(null);
      Alert.alert(
        "Voice recorded",
        "Add AssemblyAI API key for transcription."
      );
      return;
    }
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) return;
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true });
    const { recording: rec } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    setRecording(rec);
    setIsRecording(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
          setInput("Add background music and sound effects");
          break;
        case "logs":
          setInput("Show me the build logs and errors");
          break;
        case "db":
          setInput("Add a database with user profiles and data persistence");
          break;
        case "payment":
          setInput("Add in-app purchases and payment processing");
          break;
        case "image":
          setInput("Generate app screenshots and preview images");
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
      if (
        item.type === "read" ||
        item.type === "edit" ||
        item.type === "bash"
      ) {
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
      {/* ── TopBar ── */}
      <View style={[s.topBar, { paddingTop: topPad + 6 }]}>
        <Pressable
          style={s.titleRow}
          onPress={() => setShowSessions(true)}
        >
          <Text style={s.titleText} numberOfLines={1}>
            {currentSession?.name ?? "Vibra Code"}
          </Text>
          <View style={s.chevronBtn}>
            <Feather name="chevron-down" size={13} color="#AAA" />
          </View>
        </Pressable>

        <TouchableOpacity
          style={s.clearBtn}
          onPress={clearHistory}
          activeOpacity={0.8}
        >
          <Feather name="refresh-ccw" size={13} color="#AAA" />
          <Text style={s.clearBtnText}>Clear history</Text>
        </TouchableOpacity>
      </View>

      {/* ── Main area ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <View style={{ flex: 1 }}>
          {/* Animated Orb — partially visible, left edge */}
          <View style={[s.orbWrap, { pointerEvents: "none" }]}>
            <AnimatedOrb size={86} />
          </View>

          <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={s.listContent}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: true })
            }
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={s.emptyWrap}>
                <Text style={s.emptyText}>What do you want to build?</Text>
              </View>
            }
          />
        </View>

        {/* ── Input Bar ── */}
        <View style={[s.inputBar, { paddingBottom: bottomPad }]}>
          {/* Agent icon (asterisk) */}
          <TouchableOpacity
            style={s.agentBtn}
            onPress={() => setShowAgent(true)}
          >
            <Text style={s.asterisk}>✦</Text>
          </TouchableOpacity>

          {/* Image attach */}
          <TouchableOpacity
            style={s.iconBtn}
            onPress={async () => {
              const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
              if (!r.canceled)
                sendMessage(
                  "[Image] Attached: " + (r.assets[0].fileName ?? "image")
                );
            }}
          >
            <Feather name="image" size={18} color="#555" />
          </TouchableOpacity>

          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Message"
            placeholderTextColor="#3A3A3A"
            multiline
            maxLength={3000}
            onSubmitEditing={handleSend}
          />

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

        {/* ── Action Tabs ── */}
        <ActionTabs mode="chat" activeTab={activeTab} onPress={handleTabPress} />
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
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0A0A" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
    backgroundColor: "#0A0A0A",
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
    fontWeight: "700" as const,
    maxWidth: 200,
  },
  chevronBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#1E1E1E",
    justifyContent: "center",
    alignItems: "center",
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#161616",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#222",
  },
  clearBtnText: { color: "#AAA", fontSize: 12 },

  orbWrap: {
    position: "absolute",
    left: -42,
    top: "32%",
    zIndex: 1,
    opacity: 0.8,
  },

  listContent: {
    padding: 14,
    paddingLeft: 16,
    flexGrow: 1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    paddingTop: 80,
  },
  emptyText: { color: "#2A2A2A", fontSize: 16 },

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
    fontWeight: "700" as const,
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
});
