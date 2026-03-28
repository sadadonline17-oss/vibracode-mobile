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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AgentModal from "../components/AgentModal";
import MessageBubble from "../components/MessageBubble";
import SessionsDrawer from "../components/SessionsDrawer";
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
    sendMessage,
  } = useChat();

  const [input, setInput] = useState("");
  const [showAgent, setShowAgent] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const listRef = useRef<FlatList<Message>>(null);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();

  const agent = CONFIG.AGENTS.find((a) => a.id === selectedAgent);
  const messages = currentSession?.messages ?? [];

  const handleSend = useCallback(async () => {
    if (!input.trim() || isSending) return;
    const text = input.trim();
    setInput("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await sendMessage(text);
  }, [input, isSending, sendMessage]);

  const handleVoice = useCallback(async () => {
    if (isRecording && recording) {
      await recording.stopAndUnloadAsync();
      setIsRecording(false);
      setRecording(null);
      Alert.alert("صوتي", "لتفعيل النسخ الصوتي أضف AssemblyAI API key.");
      return;
    }
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) {
      Alert.alert("تنبيه", "يجب السماح بالوصول للميكروفون.");
      return;
    }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true });
    const { recording: rec } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    setRecording(rec);
    setIsRecording(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [isRecording, recording]);

  const handleAttach = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      base64: false,
      quality: 0.7,
    });
    if (!result.canceled) {
      await sendMessage("[صورة مرفقة] " + (result.assets[0].fileName ?? ""));
    }
  }, [sendMessage]);

  const topPad =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  return (
    <View style={s.root}>
      {/* TopBar */}
      <View style={[s.topBar, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity
          style={s.iconBtn}
          onPress={() => setShowSessions(true)}
        >
          <Feather name="menu" size={20} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={s.agentPill}
          onPress={() => setShowAgent(true)}
          activeOpacity={0.8}
        >
          <View
            style={[s.agentDot, { backgroundColor: agent?.color ?? "#6C47FF" }]}
          />
          <Text style={s.agentPillText}>{agent?.label}</Text>
          <Feather name="chevron-down" size={12} color="#888" />
        </TouchableOpacity>

        <TouchableOpacity
          style={s.iconBtn}
          onPress={() => createSession()}
        >
          <Feather name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Session name */}
      {currentSession && (
        <View style={s.sessionNameRow}>
          <Text style={s.sessionNameText} numberOfLines={1}>
            {currentSession.name}
          </Text>
        </View>
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={({ item }) => <MessageBubble item={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            s.listContent,
            { paddingBottom: Platform.OS === "web" ? 100 : 20 },
          ]}
          inverted={false}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={s.emptyChat}>
              <Feather name="cpu" size={40} color="#222" />
              <Text style={s.emptyChatText}>ابدأ المحادثة</Text>
            </View>
          }
        />

        {/* BottomBar */}
        <View
          style={[
            s.bottomBar,
            {
              paddingBottom:
                Platform.OS === "web"
                  ? 34
                  : Math.max(insets.bottom, 8),
            },
          ]}
        >
          <TouchableOpacity style={s.smallBtn} onPress={handleAttach}>
            <Feather name="paperclip" size={18} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.smallBtn, isRecording && s.recordingBtn]}
            onPress={handleVoice}
          >
            <Feather
              name={isRecording ? "square" : "mic"}
              size={18}
              color={isRecording ? "#EF4444" : "#888"}
            />
          </TouchableOpacity>

          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="صف تطبيقك..."
            placeholderTextColor="#444"
            multiline
            maxLength={2000}
            returnKeyType="default"
          />

          <TouchableOpacity
            style={[
              s.sendBtn,
              (!input.trim() || isSending) && s.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!input.trim() || isSending}
            activeOpacity={0.8}
          >
            <Feather name="arrow-up" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Modals */}
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
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0A0A" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#151515",
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
  },
  agentPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  agentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  agentPillText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600" as const,
  },
  sessionNameRow: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
  },
  sessionNameText: {
    color: "#555",
    fontSize: 11,
    textAlign: "center",
    fontWeight: "500" as const,
  },
  listContent: {
    padding: 12,
    gap: 2,
    flexGrow: 1,
  },
  emptyChat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 100,
  },
  emptyChatText: { color: "#333", fontSize: 14 },
  bottomBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#151515",
    gap: 8,
    backgroundColor: "#0A0A0A",
  },
  smallBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#151515",
    justifyContent: "center",
    alignItems: "center",
  },
  recordingBtn: { backgroundColor: "#EF444422" },
  input: {
    flex: 1,
    backgroundColor: "#151515",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#FFF",
    fontSize: 15,
    maxHeight: 120,
    minHeight: 38,
    borderWidth: 1,
    borderColor: "#222",
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#6C47FF",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { backgroundColor: "#2A2A2A" },
});
