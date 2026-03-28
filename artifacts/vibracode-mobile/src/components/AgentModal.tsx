import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AgentType, CONFIG } from "../config";

interface Props {
  visible: boolean;
  selectedAgent: AgentType;
  selectedModel: string;
  onSelectAgent: (a: AgentType) => void;
  onSelectModel: (m: string) => void;
  onClose: () => void;
}

export default function AgentModal({
  visible,
  selectedAgent,
  selectedModel,
  onSelectAgent,
  onSelectModel,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable
          style={[s.sheet, { paddingBottom: insets.bottom + 20 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={s.handle} />

          <Text style={s.sectionLabel}>AI Agent</Text>
          {CONFIG.AGENTS.map((agent) => {
            const active = selectedAgent === agent.id;
            return (
              <TouchableOpacity
                key={agent.id}
                style={[s.row, active && s.rowActive]}
                onPress={() => { onSelectAgent(agent.id); onClose(); }}
                activeOpacity={0.7}
              >
                <View style={[s.iconCircle, { backgroundColor: agent.color + "22" }]}>
                  <Feather name={agent.icon as any} size={16} color={agent.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle}>{agent.label}</Text>
                  <Text style={s.rowSub} numberOfLines={1}>{agent.model}</Text>
                </View>
                {active && <Feather name="check" size={15} color="#6C47FF" />}
              </TouchableOpacity>
            );
          })}

          <View style={s.divider} />

          <Text style={s.sectionLabel}>Model</Text>
          <ScrollView style={{ maxHeight: 220 }} bounces={false} showsVerticalScrollIndicator={false}>
            {CONFIG.FREE_MODELS.map((m) => {
              const active = selectedModel === m.value;
              return (
                <TouchableOpacity
                  key={m.value}
                  style={[s.row, active && s.rowActive]}
                  onPress={() => { onSelectModel(m.value); onClose(); }}
                  activeOpacity={0.7}
                >
                  <View style={s.modelDot} />
                  <Text style={[s.rowTitle, { flex: 1 }]}>{m.label}</Text>
                  {active && <Feather name="check" size={15} color="#6C47FF" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#0F0F0F",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#1E1E1E",
  },
  handle: {
    width: 36, height: 4, backgroundColor: "#2A2A2A",
    borderRadius: 2, alignSelf: "center", marginBottom: 22,
  },
  sectionLabel: {
    color: "#555", fontSize: 11, fontWeight: "700" as const,
    letterSpacing: 1.3, textTransform: "uppercase", marginBottom: 8,
  },
  row: {
    flexDirection: "row", alignItems: "center",
    padding: 11, borderRadius: 12, marginBottom: 4, gap: 12,
  },
  rowActive: { backgroundColor: "#6C47FF15" },
  iconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  rowTitle: { color: "#EEE", fontSize: 14, fontWeight: "600" as const },
  rowSub: { color: "#444", fontSize: 11, marginTop: 1 },
  divider: { height: 1, backgroundColor: "#1A1A1A", marginVertical: 14 },
  modelDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#6C47FF44" },
});
