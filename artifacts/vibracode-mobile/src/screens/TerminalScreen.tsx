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

// Detect web platform
const isWeb = Platform.OS === "web";

// Get the API base URL for web deployment
function getApiBaseUrl(): string {
  if (CONFIG.BACKEND_URL) return CONFIG.BACKEND_URL;
  if (isWeb && typeof window !== "undefined") {
    const origin = window.location?.origin;
    if (origin) return origin + "/api";
  }
  return "";
}

// Built-in commands that work without backend
const BUILTIN_COMMANDS: Record<string, (args?: string) => string | Promise<string>> = {
  help: () =>
    `VibraCode Terminal v2.1 — Built-in Commands:
  help            Show this help message
  clear           Clear terminal output
  about           About VibraCode
  agents          List available AI agents
  models          List available AI models
  env             Show environment config
  version         Show app version
  echo <text>     Print text to terminal
  date            Show current date/time
  uname           Show system information
  whoami          Show current user
  pwd             Show current directory
  ls              List files (simulated)
  cat <name>      Show file contents (simulated)
  calc <expr>     Calculate math expression
  base64 <text>   Encode text to base64
  decode64 <text> Decode base64 to text
  json <text>     Format/prettify JSON
  hex <text>      Convert text to hex
  uptime          Show terminal session uptime
  history         Show command history
  ping <host>     Test connectivity to host

Remote commands require a backend API.
On web: API is auto-detected from the deployment URL.
Set EXPO_PUBLIC_BACKEND_URL for custom backend.`,

  clear: () => "__CLEAR__",

  about: () =>
    `VibraCode v1.0.2
AI-powered mobile app builder
Build React Native / Expo apps with AI assistance
7 E2B Sandbox Agents + 12 AI Chat Models
https://vibracode-mobile.vercel.app`,

  version: () => `VibraCode v1.0.2 (build 3) · Terminal v2.1`,

  agents: () => {
    const agents = CONFIG.AGENTS.filter((a) => a.provider === "e2b");
    return `Available E2B Sandbox Agents:\n${agents
      .map((a) => `  ● ${a.label} (${a.id}) - ${a.description}`)
      .join("\n")}\n\nTotal: ${agents.length} agents`;
  },

  models: () => {
    const models = CONFIG.AGENTS.filter((a) => a.provider === "openrouter");
    return `Available Chat Models:\n${models
      .map((a) => `  ● ${a.label} - ${a.model}`)
      .join("\n")}\n\nTotal: ${models.length} models`;
  },

  env: () => {
    const hasBackend = !!CONFIG.BACKEND_URL;
    const hasOpenRouter = !!CONFIG.OPENROUTER_API_KEY;
    const hasConvex = !!CONFIG.CONVEX_URL;
    const hasE2B = !!CONFIG.E2B_API_KEY;
    const apiBase = getApiBaseUrl();
    return `Environment Configuration:
  Platform:       ${Platform.OS}${isWeb ? " (Web Browser)" : " (Native)"}
  Backend URL:    ${hasBackend ? CONFIG.BACKEND_URL : "not set (using auto-detect)"}
  API Base:       ${apiBase || "not available"}
  OpenRouter Key: ${hasOpenRouter ? "***" + CONFIG.OPENROUTER_API_KEY.slice(-6) : "not set"}
  Convex URL:     ${hasConvex ? CONFIG.CONVEX_URL : "not set"}
  E2B Key:        ${hasE2B ? "***" + CONFIG.E2B_API_KEY.slice(-6) : "not set"}
  Screen:         ${typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "native"}`;
  },

  date: () => new Date().toString(),

  uname: () => {
    if (isWeb) {
      return `${navigator.userAgent}`;
    }
    return `VibraCode Terminal · ${Platform.OS} · ${Platform.Version}`;
  },

  whoami: () => "vibracode-user",

  pwd: () => "/home/vibracode",

  ls: () =>
    `drwxr-xr-x  app.json
drwxr-xr-x  src/
drwxr-xr-x  components/
drwxr-xr-x  assets/
drwxr-xr-x  node_modules/
-rw-r--r--  package.json
-rw-r--r--  eas.json
-rw-r--r--  tsconfig.json`,

  uptime: () => {
    const sessionStart = new Date();
    const diff = Math.floor((Date.now() - sessionStart.getTime()) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `Terminal session: ${mins}m ${secs}s`;
  },

  echo: (args) => args || "",

  calc: (args) => {
    if (!args) return "Usage: calc <expression> — e.g. calc 2+2, calc Math.PI*10";
    try {
      // Safe eval — only allow numbers and math operators
      const sanitized = args.replace(/[^0-9+\-*/.()%\s]/g, "");
      if (!sanitized.trim()) return "Invalid expression";
      const result = Function('"use strict"; return (' + sanitized + ")")();
      return `${args} = ${result}`;
    } catch {
      return `Error: Invalid expression "${args}"`;
    }
  },

  base64: (args) => {
    if (!args) return "Usage: base64 <text>";
    try {
      return btoa(args);
    } catch {
      return "Error: Failed to encode";
    }
  },

  decode64: (args) => {
    if (!args) return "Usage: decode64 <base64text>";
    try {
      return atob(args);
    } catch {
      return "Error: Invalid base64 string";
    }
  },

  json: (args) => {
    if (!args) return 'Usage: json \'{"key":"value"}\'';
    try {
      return JSON.stringify(JSON.parse(args), null, 2);
    } catch {
      return "Error: Invalid JSON";
    }
  },

  hex: (args) => {
    if (!args) return "Usage: hex <text>";
    try {
      return args.split("").map((c) => c.charCodeAt(0).toString(16).padStart(2, "0")).join(" ");
    } catch {
      return "Error encoding to hex";
    }
  },

  cat: (args) => {
    if (!args) return "Usage: cat <filename>";
    const files: Record<string, string> = {
      "package.json": '{\n  "name": "vibracode",\n  "version": "1.0.2",\n  "main": "expo-router/entry"\n}',
      "app.json": '{\n  "expo": {\n    "name": "Vibra Code",\n    "slug": "vibracode",\n    "version": "1.0.2"\n  }\n}',
      "README.md": "# Vibra Code\n\nAI-powered mobile app builder using React Native and Expo.",
      "tsconfig.json": '{\n  "extends": "expo/tsconfig.base",\n  "compilerOptions": {\n    "strict": true\n  }\n}',
    };
    return files[args] || `cat: ${args}: No such file or directory`;
  },
};

// Parse command into name + args
function parseCommand(input: string): { name: string; args: string } {
  const parts = input.trim().split(/\s+/);
  const name = parts[0]?.toLowerCase() || "";
  const args = parts.slice(1).join(" ");
  return { name, args };
}

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
      content: "╔════════════════════════════╗\n║  VibraCode Terminal v2.1  ║\n╚══════════════════════════╝",
    },
    {
      id: "1",
      type: "info",
      content: `Type 'help' for available commands.
Platform: ${Platform.OS}${isWeb ? " (Web)" : " (Native)"}
API: ${getApiBaseUrl() ? "Connected ☁️" : "Local Mode 📦"}`,
    },
  ]);
  const [input, setInput] = useState("");
  const [executing, setExecuting] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const sessionStart = useRef(Date.now());

  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const apiBaseUrl = getApiBaseUrl();
  const isCloud = !!apiBaseUrl;

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

      // Parse command
      const { name, args } = parseCommand(trimmed);

      // Check built-in commands first
      const builtin = BUILTIN_COMMANDS[name];
      if (builtin) {
        try {
          const result = await (typeof builtin === "function" ? builtin(args) : builtin);
          if (result === "__CLEAR__") {
            setLines([]);
          } else if (result) {
            addLine("output", String(result));
          }
        } catch (err: any) {
          addLine("error", `Error: ${err?.message || "command failed"}`);
        }
        return;
      }

      // Handle 'ping' specially as a built-in fetch test
      if (name === "ping") {
        const host = args || "google.com";
        addLine("info", `Pinging ${host}...`);
        try {
          const start = Date.now();
          const res = await fetch(`https://${host}`, { mode: "no-cors", cache: "no-store" });
          const ms = Date.now() - start;
          addLine("output", `Ping to ${host}: ${ms}ms (response received)`);
        } catch {
          addLine("error", `Ping to ${host}: failed (network error or CORS blocked)`);
        }
        return;
      }

      // Handle 'history' command
      if (name === "history") {
        const hist = history.length > 0 ? history.map((h, i) => `  ${i + 1}  ${h}`).join("\n") : "  (no history)";
        addLine("output", `Command History:\n${hist}`);
        return;
      }

      // If no API base, show error for remote commands
      if (!apiBaseUrl) {
        addLine(
          "error",
          `Command '${name}' requires a backend API.\nType 'help' for available built-in commands.\n\nTo enable remote commands, set EXPO_PUBLIC_BACKEND_URL.\nOn web deployment, the API is auto-detected.`
        );
        return;
      }

      // Execute remote command via API
      setExecuting(true);
      addLine("info", `Executing via ${apiBaseUrl}...`);
      try {
        const res = await fetch(`${apiBaseUrl}/terminal/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command: trimmed, cwd: "/tmp", timeout: 15000 }),
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
          `Connection error: ${err?.message ?? "unknown"}\nMake sure the API server is accessible.`
        );
      } finally {
        setExecuting(false);
      }
    },
    [apiBaseUrl, addLine, history]
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
        {lines.length === 0 && (
          <Text style={[s.line, { color: "#30363d" }]}>
            Terminal cleared. Type 'help' for commands.
          </Text>
        )}
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
          {...(isWeb ? {
            onKeyDown: (e: any) => {
              // Handle up/down arrow keys for history on web
              if (e.key === "ArrowUp") {
                e.preventDefault();
                handleHistoryUp();
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                handleHistoryDown();
              }
            },
          } : {})}
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
    outlineStyle: "none",
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
