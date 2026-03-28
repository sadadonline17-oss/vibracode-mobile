import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

export type ActionTabId =
  | "audio"
  | "logs"
  | "haptic"
  | "payment"
  | "publish"
  | "db"
  | "image";

interface Tab {
  id: ActionTabId;
  label: string;
  icon: string;
}

const CHAT_TABS: Tab[] = [
  { id: "audio",   label: "Audio",   icon: "bar-chart-2" },
  { id: "logs",    label: "Logs",    icon: "file-text" },
  { id: "haptic",  label: "Haptic",  icon: "smartphone" },
  { id: "payment", label: "Payment", icon: "dollar-sign" },
  { id: "publish", label: "Publish", icon: "upload-cloud" },
  { id: "db",      label: "DB",      icon: "database" },
];

const PREVIEW_TABS: Tab[] = [
  { id: "image",   label: "Image",   icon: "image" },
  { id: "audio",   label: "Audio",   icon: "bar-chart-2" },
  { id: "logs",    label: "Logs",    icon: "file-text" },
  { id: "haptic",  label: "Haptic",  icon: "smartphone" },
  { id: "payment", label: "Payment", icon: "dollar-sign" },
  { id: "publish", label: "Publish", icon: "upload-cloud" },
];

interface Props {
  mode?: "chat" | "preview";
  activeTab?: ActionTabId;
  onPress: (tab: ActionTabId) => void;
}

export default function ActionTabs({ mode = "chat", activeTab, onPress }: Props) {
  const tabs = mode === "chat" ? CHAT_TABS : PREVIEW_TABS;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.container}
      style={s.scroll}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={s.tab}
            onPress={() => {
              if (Platform.OS !== "web")
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onPress(tab.id);
            }}
            activeOpacity={0.6}
          >
            <Feather
              name={tab.icon as any}
              size={21}
              color={isActive ? "#6C47FF" : "#454545"}
            />
            <Text style={[s.label, isActive && s.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: {
    backgroundColor: "#060606",
    borderTopWidth: 1,
    borderTopColor: "#111",
  },
  container: {
    flexDirection: "row",
    paddingHorizontal: 2,
    paddingVertical: 6,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 5,
    gap: 3,
    minWidth: 58,
  },
  label: { fontSize: 10, color: "#454545", fontWeight: "500" as const },
  labelActive: { color: "#6C47FF" },
});
