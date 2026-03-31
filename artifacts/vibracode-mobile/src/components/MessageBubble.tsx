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
import { Message } from "../context/ChatContext";

interface Props {
  item: Message;
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  return (
    <View style={s.codeWrap}>
      {lang ? <Text style={s.codeLang}>{lang}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Text
          style={[
            s.codeText,
            { fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" },
          ]}
        >
          {code}
        </Text>
      </ScrollView>
    </View>
  );
}

function MarkdownText({ text, isUser }: { text: string; isUser: boolean }) {
  const parts: React.ReactElement[] = [];
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <InlineText
          key={key++}
          text={text.slice(lastIndex, match.index)}
          isUser={isUser}
        />
      );
    }
    parts.push(
      <CodeBlock key={key++} lang={match[1]} code={match[2].trim()} />
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(
      <InlineText key={key++} text={text.slice(lastIndex)} isUser={isUser} />
    );
  }

  return <>{parts}</>;
}

function InlineText({ text, isUser }: { text: string; isUser: boolean }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, li) => {
        if (!line && li !== lines.length - 1) {
          return <View key={li} style={{ height: 6 }} />;
        }
        if (line.startsWith("### "))
          return (
            <Text key={li} style={[s.h3, isUser && { color: "#FFF" }]}>
              {line.slice(4)}
            </Text>
          );
        if (line.startsWith("## "))
          return (
            <Text key={li} style={[s.h2, isUser && { color: "#FFF" }]}>
              {line.slice(3)}
            </Text>
          );
        if (line.startsWith("# "))
          return (
            <Text key={li} style={[s.h1, isUser && { color: "#FFF" }]}>
              {line.slice(2)}
            </Text>
          );
        if (line.startsWith("- ") || line.startsWith("* "))
          return (
            <Text key={li} style={[s.body, isUser && { color: "#FFF" }]}>
              {"• " + line.slice(2)}
            </Text>
          );
        if (/^\d+\.\s/.test(line))
          return (
            <Text key={li} style={[s.body, isUser && { color: "#FFF" }]}>
              {line}
            </Text>
          );
        // Bold inline
        const boldParts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <Text key={li} style={[s.body, isUser && { color: "#FFF" }]}>
            {boldParts.map((p, pi) =>
              p.startsWith("**") && p.endsWith("**") ? (
                <Text key={pi} style={s.bold}>
                  {p.slice(2, -2)}
                </Text>
              ) : (
                p
              )
            )}
          </Text>
        );
      })}
    </>
  );
}

export default function MessageBubble({ item }: Props) {
  const isUser = item.role === "user";

  if (item.type === "status") {
    return (
      <View style={s.statusRow}>
        <ActivityIndicator size="small" color="#6C47FF" />
        <Text style={s.statusText}>Working...</Text>
      </View>
    );
  }

  return (
    <View style={[s.wrapper, isUser ? s.userWrapper : s.asstWrapper]}>
      <View style={[s.bubble, isUser ? s.userBubble : s.asstBubble]}>
        <MarkdownText text={item.content || " "} isUser={isUser} />
        {item.streaming && (
          <View style={s.streamDot}>
            <ActivityIndicator size="small" color={isUser ? "#FFF" : "#6C47FF"} />
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { maxWidth: "86%", marginVertical: 2 },
  userWrapper: { alignSelf: "flex-end" },
  asstWrapper: { alignSelf: "flex-start" },
  bubble: { borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9 },
  userBubble: { backgroundColor: "#2563EB", borderBottomRightRadius: 4 },
  asstBubble: {
    backgroundColor: "#1C1C1C",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#242424",
  },
  body: { color: "#DDD", fontSize: 14, lineHeight: 21 },
  bold: { fontWeight: "700" as const, color: "#FFF" },
  h1: { color: "#FFF", fontSize: 17, fontWeight: "700" as const, marginBottom: 4 },
  h2: { color: "#FFF", fontSize: 15, fontWeight: "700" as const, marginBottom: 3 },
  h3: { color: "#EEE", fontSize: 14, fontWeight: "600" as const, marginBottom: 2 },
  codeWrap: {
    backgroundColor: "#0D1117",
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "#30363D",
  },
  codeLang: { color: "#6E7681", fontSize: 11, marginBottom: 6 },
  codeText: { color: "#E6EDF3", fontSize: 12, lineHeight: 18 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    alignSelf: "flex-start",
  },
  statusText: { color: "#555", fontSize: 13, fontStyle: "italic" },
  streamDot: { marginTop: 4 },
});
