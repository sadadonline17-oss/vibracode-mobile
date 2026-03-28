import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Message, MessageType } from "../context/ChatContext";

interface Props {
  item: Message;
}

const TYPE_CONFIG: Record<
  MessageType,
  { badge?: string; accent: string; icon?: string }
> = {
  read: { badge: "Read", icon: "file-text", accent: "#3B82F6" },
  edit: { badge: "Edit", icon: "edit-2", accent: "#F97316" },
  bash: { badge: "Bash", icon: "terminal", accent: "#22C55E" },
  tasks: { badge: "Tasks", icon: "check-square", accent: "#8B5CF6" },
  status: { accent: "#6C47FF" },
  message: { accent: "#6C47FF" },
};

function CodeBlock({ code }: { code: string }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={s.codeScroll}
    >
      <View style={s.codeBlock}>
        <Text style={s.codeText}>{code}</Text>
      </View>
    </ScrollView>
  );
}

function renderMarkdown(text: string, isUser: boolean) {
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const lines = part.split("\n");
      const code = lines.slice(1, -1).join("\n");
      return <CodeBlock key={i} code={code} />;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <Text key={i} style={s.inlineCode}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    const lines = part.split("\n");
    return (
      <Text key={i} style={[s.bodyText, isUser && s.userText]}>
        {lines.map((line, li) => {
          if (line.startsWith("# "))
            return (
              <Text key={li} style={s.h1}>
                {line.slice(2) + "\n"}
              </Text>
            );
          if (line.startsWith("## "))
            return (
              <Text key={li} style={s.h2}>
                {line.slice(3) + "\n"}
              </Text>
            );
          if (line.startsWith("**") && line.endsWith("**"))
            return (
              <Text key={li} style={s.bold}>
                {line.slice(2, -2) + "\n"}
              </Text>
            );
          if (line.startsWith("- "))
            return (
              <Text key={li} style={s.bodyText}>
                {"• " + line.slice(2) + "\n"}
              </Text>
            );
          return line + (li < lines.length - 1 ? "\n" : "");
        })}
      </Text>
    );
  });
}

export default function MessageBubble({ item }: Props) {
  const isUser = item.role === "user";
  const config = TYPE_CONFIG[item.type];

  if (item.type === "status") {
    return (
      <View style={s.statusRow}>
        <ActivityIndicator size="small" color="#6C47FF" />
        <Text style={s.statusText}>جاري المعالجة...</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        s.bubbleWrapper,
        isUser ? s.userWrapper : s.assistantWrapper,
      ]}
    >
      {!isUser && config.badge && (
        <View style={[s.badge, { backgroundColor: config.accent + "22" }]}>
          <Feather
            name={(config.icon as any) ?? "info"}
            size={11}
            color={config.accent}
          />
          <Text style={[s.badgeText, { color: config.accent }]}>
            {config.badge}
          </Text>
        </View>
      )}
      <View
        style={[
          s.bubble,
          isUser
            ? s.userBubble
            : item.type !== "message"
            ? [s.assistantBubble, { borderLeftColor: config.accent }]
            : s.assistantBubble,
        ]}
      >
        {renderMarkdown(item.content, isUser)}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bubbleWrapper: {
    maxWidth: "88%",
    marginVertical: 3,
  },
  userWrapper: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  assistantWrapper: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: "#6C47FF",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: "#1A1A1A",
    borderBottomLeftRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: "#333",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    alignSelf: "flex-start",
  },
  statusText: { color: "#666", fontSize: 13, fontStyle: "italic" },
  bodyText: { color: "#E5E5E5", fontSize: 14, lineHeight: 20 },
  userText: { color: "#FFF" },
  h1: { color: "#FFF", fontSize: 18, fontWeight: "700" as const },
  h2: { color: "#FFF", fontSize: 15, fontWeight: "600" as const },
  bold: { color: "#FFF", fontWeight: "700" as const, fontSize: 14 },
  codeScroll: { marginVertical: 6 },
  codeBlock: {
    backgroundColor: "#0D1117",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#30363D",
    minWidth: 200,
  },
  codeText: {
    color: "#79C0FF",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    lineHeight: 18,
  },
  inlineCode: {
    backgroundColor: "#1E1E1E",
    color: "#79C0FF",
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontSize: 12,
    paddingHorizontal: 4,
    borderRadius: 3,
  },
});
