import React, { useCallback, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CONFIG } from "../config";
import { terminalBridge } from "../tools/TerminalBridge";
import { Feather } from "@expo/vector-icons";

// Built-in commands that work without backend
const BUILTIN_COMMANDS: Record<string, () => string> = {
  help: () =>
    `VibraCode Terminal v2.0 - Built-in Commands:
  help        - Show this help message
  clear       - Clear terminal output
  about       - About VibraCode
  agents      - List available AI agents
  models      - List available AI models
  env         - Show environment config
  version     - Show app version

Remote commands require a backend URL.
Set EXPO_PUBLIC_BACKEND_URL to enable.`,

  clear: () => "__CLEAR__",

  about: () =>
    `VibraCode v1.0.2
AI-powered mobile app builder
Build React Native / Expo apps with AI assistance
7 E2B Sandbox Agents + 12 AI Chat Models
https://vibracode-mobile.vercel.app`,

  version: () => `VibraCode v1.0.2 (build 3)`,

  agents: () => {
    const agents = CONFIG.AGENTS.filter((a) => a.provider === "e2b");
    return `Available E2B Sandbox Agents:\n${agents
      .map((a) => `  ● ${a.label} (${a.id}) - ${a.description}`)
      .join("\n")}`;
  },

  models: () => {
    const models = CONFIG.AGENTS.filter((a) => a.provider === "openrouter");
    return `Available Chat Models:\n${models
      .map((a) => `  ● ${a.label} - ${a.model}`)
      .join("\n")}`;
  },

  env: () => {
    const hasBackend = !!CONFIG.BACKEND_URL;
    const hasOpenRouter = !!CONFIG.OPENROUTER_API_KEY;
    const hasConvex = !!CONFIG.CONVEX_URL;
    const hasE2B = !!CONFIG.E2B_API_KEY;
    return `Environment Configuration:
  Backend URL:    ${hasBackend ? CONFIG.BACKEND_URL : "not set"}
  OpenRouter Key: ${hasOpenRouter ? "***" + CONFIG.OPENROUTER_API_KEY.slice(-6) : "not set"}
  Convex URL:     ${hasConvex ? CONFIG.CONVEX_URL : "not set"}
  E2B Key:        ${hasE2B ? "***" + CONFIG.E2B_API_KEY.slice(-6) : "not set"}
  Platform:       ${Platform.OS}
  Architecture:   ${Platform.OS === "android" ? "Android" : Platform.OS === "ios" ? "iOS" : "Web"}`;
  },
};

interface TerminalLine {
  id: string;
  type: "input" | "output" | "error" | "info" | "agent";
  content: string;
}

export default function TerminalScreen() {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: "0",
      type: "info",
      content: "╔══════════════════════════╗\n║  VibraCode Terminal v2.0  ║\n╚══════════════════════════╝",
    },
    {
      id: "1",
      type: "info",
      content: `Type 'help' for available commands.\nMode: ${CONFIG.BACKEND_URL ? "☁️ Cloud Connected" : "📦 Local Mode"}`,
    },
  ]);
  const [input, setInput] = useState("");
  const [executing, setExecuting] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const backendUrl = (CONFIG.BACKEND_URL || "").replace(/\/$/, "");
  const isCloud = !!backendUrl;

  const addLine = useCallback(
    (type: TerminalLine["type"], content: string) => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 4);
      setLines((prev) => [...prev, { id, type, content }]);
    },
    []
  );

  // Subscribe to agent tool output
  React.useEffect(() => {
    return terminalBridge.subscribe((text, type) => {
      addLine(type === "error" ? "error" : type === "agent" ? "agent" : "output", text);
    });
  }, [addLine]);

  const executeCommand = useCallback(
    async (command: string) => {
      const trimmed = command.trim();
      if (!trimmed) return;

      // Add to history
      setHistory((prev) => [trimmed, ...prev.slice(0, 99)]);
      setHistoryIdx(-1);

      // Show input line
      addLine("input", `$ ${trimmed}`);

      // Check built-in commands first
      const builtin = BUILTIN_COMMANDS[trimmed.toLowerCase()];
      if (builtin) {
        const result = builtin();
        if (result === "__CLEAR__") {
          setLines([]);
        } else {
          addLine("output", result);
        }
        return;
      }

      // If no backend, show error
      if (!backendUrl) {
        addLine(
          "error",
          "Backend not configured. Set EXPO_PUBLIC_BACKEND_URL to enable remote command execution.\nType 'help' for local commands."
        );
        return;
      }

      // Execute remote command
      setExecuting(true);
      try {
        const res = await fetch(`${backendUrl}/terminal/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command: trimmed, cwd: "/home/user" }),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          addLine("error", `HTTP ${res.status}: ${errText}`);
          return;
        }

        const data = (await res.json()) as {
          stdout: string;
          stderr: string;
          code: number;
        };

        if (data.stdout) addLine("output", data.stdout);
        if (data.stderr) addLine("error", data.stderr);
        if (data.code !== 0 && !data.stdout && !data.stderr) {
          addLine("info", `Command exited with code ${data.code}`);
        }
        if (!data.stdout && !data.stderr) {
          addLine("info", "(no output)");
        }
      } catch (err: any) {
        addLine(
          "error",
          `Connection error: ${err?.message ?? "unknown"}\nMake sure the backend server is running.`
        );
      } finally {
        setExecuting(false);
      }
    },
    [backendUrl, addLine]
  );

  const handleSend = useCallback(() => {
    const cmd = input.trim();
    setInput("");
    if (cmd) executeCommand(cmd);
  }, [input, executeCommand]);

  const handleKeyDown = useCallback(
    (e: any) => {
      if (e?.nativeEvent?.key === "Enter") {
        handleSend();
      }
    },
    [handleSend]
  );

  const handleHistoryUp = useCallback(() => {
    if (history.length === 0) return;
    const nextIdx = Math.min(historyIdx + 1, history.length - 1);
    setHistoryIdx(nextIdx);
    setInput(history[nextIdx]);
  }, [history, historyIdx]);

  const handleHistoryDown = useCallback(() => {
    if (historyIdx <= 0) {
      setHistoryIdx(-1);
      setInput("");
      return;
    }
    const nextIdx = historyIdx - 1;
    setHistoryIdx(nextIdx);
    setInput(history[nextIdx]);
  }, [history, historyIdx]);

  const handleClear = useCallback(() => {
    setLines([]);
  }, []);

  // Auto-scroll to bottom when lines change
  React.useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [lines]);

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.headerTitle}>⚡ Terminal</Text>
          {executing && (
            <ActivityIndicator size="small" color="#d29922" style={{ marginLeft: 8 }} />
          )}
        </View>
        <View style={s.headerRight}>
          <View style={[s.modeBadge, isCloud ? s.modeCloud : s.modeLocal]}>
            <View style={[s.dot, { backgroundColor: isCloud ? "#3fb950" : "#d29922" }]} />
            <Text style={[s.modeText, isCloud ? s.modeCloudText : s.modeLocalText]}>
              {isCloud ? "Cloud" : "Local"}
            </Text>
          </View>
          <Pressable style={s.clearBtn} onPress={handleClear} hitSlop={8}>
            <Text style={s.clearText}>clear</Text>
          </Pressable>
        </View>
      </View>

      {/* Terminal Output */}
      <ScrollView
        ref={scrollRef}
        style={s.output}
        contentContainerStyle={s.outputContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {lines.map((line) => (
          <TerminalLineView key={line.id} line={line} />
        ))}
      </ScrollView>

      {/* Input Bar */}
      <View style={s.inputBar}>
        <Text style={s.prompt}>$</Text>
        <TextInput
          ref={inputRef}
          style={s.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a command..."
          placeholderTextColor="#30363d"
          onSubmitEditing={handleSend}
          returnKeyType="send"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!executing}
          selectTextOnFocus
        />
        <Pressable
          style={[s.sendBtn, input.trim() && s.sendBtnActive]}
          onPress={handleSend}
          disabled={!input.trim() || executing}
        >
          <Feather name="arrow-up" size={16} color={input.trim() ? "#FFF" : "#30363d"} />
        </Pressable>
        <Pressable style={s.historyBtn} onPress={handleHistoryUp} hitSlop={8}>
          <Feather name="chevron-up" size={16} color="#484f58" />
        </Pressable>
        <Pressable style={s.historyBtn} onPress={handleHistoryDown} hitSlop={8}>
          <Feather name="chevron-down" size={16} color="#484f58" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// Terminal line renderer
function TerminalLineView({ line }: { line: TerminalLine }) {
  const colorMap: Record<string, string> = {
    input: "#c9d1d9",
    output: "#8b949e",
    error: "#ff7b72",
    info: "#58a6ff",
    agent: "#d29922",
  };

  return (
    <Text
      style={[
        s.line,
        { color: colorMap[line.type] || "#8b949e" },
        line.type === "error" && s.errorLine,
        line.type === "input" && s.inputLine,
      ]}
      selectable
    >
      {line.content}
    </Text>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0d1117" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#21262d",
    backgroundColor: "#161b22",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { color: "#58a6ff", fontWeight: "700", fontSize: 15 },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  modeCloud: {
    backgroundColor: "#3fb95010",
    borderColor: "#3fb95030",
  },
  modeLocal: {
    backgroundColor: "#d2992210",
    borderColor: "#d2992230",
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  modeText: { fontSize: 10, fontWeight: "700" },
  modeCloudText: { color: "#3fb950" },
  modeLocalText: { color: "#d29922" },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#21262d",
    borderWidth: 1,
    borderColor: "#30363d",
  },
  clearText: { color: "#8b949e", fontSize: 11 },
  output: {
    flex: 1,
    backgroundColor: "#0d1117",
    paddingHorizontal: 12,
  },
  outputContent: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  line: {
    fontSize: 13,
    fontFamily: Platform.OS === "android" ? "monospace" : "Menlo",
    lineHeight: 18,
    marginBottom: 2,
  },
  errorLine: {
    fontWeight: "500",
  },
  inputLine: {
    fontWeight: "600",
    color: "#c9d1d9",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#161b22",
    borderTopWidth: 1,
    borderTopColor: "#21262d",
    gap: 8,
  },
  prompt: {
    color: "#3fb950",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: Platform.OS === "android" ? "monospace" : "Menlo",
  },
  input: {
    flex: 1,
    color: "#c9d1d9",
    fontSize: 13,
    fontFamily: Platform.OS === "android" ? "monospace" : "Menlo",
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: "#0d1117",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#21262d",
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#21262d",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnActive: { backgroundColor: "#6C47FF" },
  historyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
});
