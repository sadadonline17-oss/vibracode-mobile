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
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable
          style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={s.handle} />

          <Text style={s.sectionTitle}>AI Agent</Text>
          {CONFIG.AGENTS.map((agent) => {
            const isActive = selectedAgent === agent.id;
            return (
              <TouchableOpacity
                key={agent.id}
                style={[s.row, isActive && s.rowActive]}
                onPress={() => {
                  onSelectAgent(agent.id);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[s.iconCircle, { backgroundColor: agent.color + "22" }]}
                >
                  <Feather name={agent.icon} size={16} color={agent.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.agentName}>{agent.label}</Text>
                  <Text style={s.agentModel} numberOfLines={1}>
                    {agent.model}
                  </Text>
                </View>
                {isActive && (
                  <Feather name="check" size={16} color="#6C47FF" />
                )}
              </TouchableOpacity>
            );
          })}

          <View style={s.divider} />

          <Text style={s.sectionTitle}>Model</Text>
          <ScrollView style={{ maxHeight: 200 }} bounces={false}>
            {CONFIG.FREE_MODELS.map((m) => {
              const isActive = selectedModel === m.value;
              return (
                <TouchableOpacity
                  key={m.value}
                  style={[s.row, isActive && s.rowActive]}
                  onPress={() => {
                    onSelectModel(m.value);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={s.modelDot} />
                  <Text style={s.agentName}>{m.label}</Text>
                  {isActive && (
                    <Feather name="check" size={16} color="#6C47FF" />
                  )}
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#111",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#222",
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#666",
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 4,
    gap: 12,
  },
  rowActive: { backgroundColor: "#6C47FF18" },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  agentName: { color: "#FFF", fontSize: 14, fontWeight: "600" as const },
  agentModel: { color: "#555", fontSize: 11, marginTop: 1 },
  divider: {
    height: 1,
    backgroundColor: "#222",
    marginVertical: 16,
  },
  modelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6C47FF",
  },
});
