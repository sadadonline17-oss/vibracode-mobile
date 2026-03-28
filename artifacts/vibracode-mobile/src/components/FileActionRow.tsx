import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  type: "read" | "edit" | "bash";
  fileCount?: number;
  expanded?: boolean;
  onToggle?: () => void;
}

const CONFIG_MAP = {
  read: { label: "Read file", color: "#3B82F6", bgColor: "#3B82F615" },
  edit: { label: "Edit file", color: "#F97316", bgColor: "#F9731615" },
  bash: { label: "Run command", color: "#22C55E", bgColor: "#22C55E15" },
};

export default function FileActionRow({
  type,
  fileCount,
  expanded,
  onToggle,
}: Props) {
  const cfg = CONFIG_MAP[type];

  return (
    <TouchableOpacity
      style={s.row}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      {/* Asterisk icon */}
      <View style={[s.iconWrap, { backgroundColor: cfg.bgColor }]}>
        <Text style={[s.asterisk, { color: cfg.color }]}>✦</Text>
      </View>

      <Text style={[s.label, { color: cfg.color }]}>{cfg.label}</Text>
      {fileCount !== undefined && fileCount > 0 && (
        <Text style={s.count}>
          ({fileCount} file{fileCount !== 1 ? "s" : ""})
        </Text>
      )}

      <View style={{ flex: 1 }} />
      <Feather
        name={expanded ? "chevron-up" : "chevron-down"}
        size={15}
        color="#444"
      />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 4,
    maxWidth: "80%",
    alignSelf: "flex-start",
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  asterisk: {
    fontSize: 13,
    fontWeight: "700" as const,
  },
  label: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  count: {
    color: "#555",
    fontSize: 13,
  },
});
