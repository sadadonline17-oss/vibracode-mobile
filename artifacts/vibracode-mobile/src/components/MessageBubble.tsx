import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Message } from "../context/ChatContext";

interface Props {
  item: Message;
}

let _Clipboard: { setString: (s: string) => void } | null = null;
try {
  const rn = require("react-native");
  if (rn.Clipboard?.setString) _Clipboard = rn.Clipboard;
} catch {}

function copyToClipboard(text: string) {
  try {
    _Clipboard?.setString(text);
  } catch {}
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={s.codeWrap}>
      <View style={s.codeHeader}>
        <Text style={s.codeLang}>{lang ?? "code"}</Text>
        <TouchableOpacity style={s.copyBtn} onPress={handleCopy} activeOpacity={0.7}>
          <Feather name={copied ? "check" : "copy"} size={13} color={copied ? "#22C55E" : "#6E7681"} />
          <Text style={[s.copyBtnText, copied && { color: "#22C55E" }]}>
            {copied ? "تم النسخ" : "نسخ"}
          </Text>
        </TouchableOpacity>
      </View>
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

function InlineCode({ code }: { code: string }) {
  return (
    <Text
      style={[
        s.inlineCode,
        { fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" },
      ]}
    >
      {code}
    </Text>
  );
}

function parseLine(line: string, isUser: boolean, key: number): React.ReactElement {
  if (line.startsWith("### "))
    return <Text key={key} style={[s.h3, isUser && { color: "#FFF" }]}>{line.slice(4)}</Text>;
  if (line.startsWith("## "))
    return <Text key={key} style={[s.h2, isUser && { color: "#FFF" }]}>{line.slice(3)}</Text>;
  if (line.startsWith("# "))
    return <Text key={key} style={[s.h1, isUser && { color: "#FFF" }]}>{line.slice(2)}</Text>;
  if (line.startsWith("- ") || line.startsWith("* "))
    return (
      <Text key={key} style={[s.body, isUser && { color: "#FFF" }]}>
        {"• "}{parseInline(line.slice(2), isUser)}
      </Text>
    );
  if (/^\d+\.\s/.test(line))
    return <Text key={key} style={[s.body, isUser && { color: "#FFF" }]}>{parseInline(line, isUser)}</Text>;
  if (line.startsWith("> "))
    return (
      <View key={key} style={s.blockquote}>
        <Text style={s.blockquoteText}>{line.slice(2)}</Text>
      </View>
    );
  if (line.startsWith("---") || line.startsWith("==="))
    return <View key={key} style={s.divider} />;

  return (
    <Text key={key} style={[s.body, isUser && { color: "#FFF" }]}>
      {parseInline(line, isUser)}
    </Text>
  );
}

function parseInline(text: string, isUser: boolean): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<React.Fragment key={key++}>{text.slice(lastIndex, match.index)}</React.Fragment>);
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(<Text key={key++} style={s.bold}>{token.slice(2, -2)}</Text>);
    } else if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
      parts.push(<Text key={key++} style={s.italic}>{token.slice(1, -1)}</Text>);
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(<InlineCode key={key++} code={token.slice(1, -1)} />);
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(<React.Fragment key={key++}>{text.slice(lastIndex)}</React.Fragment>);
  }

  return parts;
}

function MarkdownText({ text, isUser }: { text: string; isUser: boolean }) {
  const elements: React.ReactElement[] = [];
  const codeBlockRegex = /```(\w*)?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const chunk = text.slice(lastIndex, match.index);
      const lines = chunk.split("\n");
      lines.forEach((line, li) => {
        if (!line && li !== lines.length - 1) {
          elements.push(<View key={key++} style={{ height: 5 }} />);
        } else if (line) {
          elements.push(parseLine(line, isUser, key++));
        }
      });
    }
    elements.push(<CodeBlock key={key++} lang={match[1] || undefined} code={match[2].trim()} />);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex);
    const lines = remaining.split("\n");
    lines.forEach((line, li) => {
      if (!line && li !== lines.length - 1) {
        elements.push(<View key={key++} style={{ height: 5 }} />);
      } else if (line) {
        elements.push(parseLine(line, isUser, key++));
      }
    });
  }

  return <>{elements}</>;
}

export default function MessageBubble({ item }: Props) {
  const isUser = item.role === "user";

  if (item.type === "status") {
    const isWorking = !item.content || item.content.length < 3;
    return (
      <View style={s.statusRow}>
        {isWorking
          ? <ActivityIndicator size="small" color="#6C47FF" />
          : <Text style={s.statusIcon}>›</Text>
        }
        <Text style={s.statusText} numberOfLines={2}>
          {item.content?.trim() || "جارٍ المعالجة..."}
        </Text>
      </View>
    );
  }

  const handleCopyMessage = () => {
    copyToClipboard(item.content);
  };

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
      {!isUser && !item.streaming && item.content.length > 10 && (
        <TouchableOpacity style={s.msgCopyBtn} onPress={handleCopyMessage} activeOpacity={0.7}>
          <Feather name="copy" size={12} color="#333" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { maxWidth: "88%", marginVertical: 2 },
  userWrapper: { alignSelf: "flex-end" },
  asstWrapper: { alignSelf: "flex-start" },
  bubble: { borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9 },
  userBubble: { backgroundColor: "#2563EB", borderBottomRightRadius: 4 },
  asstBubble: {
    backgroundColor: "#131313",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#242424",
  },
  body: { color: "#CCC", fontSize: 14, lineHeight: 22 },
  bold: { fontWeight: "700" as const, color: "#EEE" },
  italic: { fontStyle: "italic" as const, color: "#BBB" },
  h1: { color: "#FFF", fontSize: 18, fontWeight: "700" as const, marginTop: 8, marginBottom: 4 },
  h2: { color: "#EEE", fontSize: 16, fontWeight: "700" as const, marginTop: 6, marginBottom: 3 },
  h3: { color: "#DDD", fontSize: 14, fontWeight: "600" as const, marginTop: 4, marginBottom: 2 },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: "#6C47FF",
    paddingLeft: 10,
    marginVertical: 4,
    backgroundColor: "#1A1A2E",
    borderRadius: 4,
    paddingVertical: 4,
  },
  blockquoteText: { color: "#AAA", fontSize: 13, fontStyle: "italic" },
  divider: { height: 1, backgroundColor: "#222", marginVertical: 8 },

  codeWrap: {
    backgroundColor: "#0D1117",
    borderRadius: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "#30363D",
    overflow: "hidden",
  },
  codeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#161B22",
    borderBottomWidth: 1,
    borderBottomColor: "#30363D",
  },
  codeLang: { color: "#6E7681", fontSize: 11, fontWeight: "600" },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#21262D",
  },
  copyBtnText: { color: "#6E7681", fontSize: 10, fontWeight: "600" },
  codeText: { color: "#E6EDF3", fontSize: 12, lineHeight: 18, padding: 12 },

  inlineCode: {
    backgroundColor: "#1E2530",
    color: "#F97316",
    fontSize: 12,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignSelf: "flex-start",
    maxWidth: "90%",
  },
  statusIcon: { color: "#6C47FF", fontSize: 16, fontWeight: "700", lineHeight: 18 },
  statusText: { color: "#555", fontSize: 12, fontStyle: "italic", flex: 1 },
  streamDot: { marginTop: 4 },
  msgCopyBtn: {
    marginTop: 3,
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
});
