import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
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

type Tab = "agents" | "models";

export default function AgentModal({
  visible,
  selectedAgent,
  selectedModel,
  onSelectAgent,
  onSelectModel,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("agents");

  const activeAgent = CONFIG.AGENTS.find((a) => a.id === selectedAgent);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable
          style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={s.handle} />

          {/* Header */}
          <View style={s.headerRow}>
            <Text style={s.headerTitle}>AI Provider</Text>
            {activeAgent && (
              <View style={[s.activeBadge, { backgroundColor: activeAgent.color + "22" }]}>
                <View style={[s.activeDot, { backgroundColor: activeAgent.color }]} />
                <Text style={[s.activeBadgeText, { color: activeAgent.color }]}>
                  {activeAgent.label}
                </Text>
              </View>
            )}
          </View>

          {/* Tabs */}
          <View style={s.tabs}>
            <TouchableOpacity
              style={[s.tab, tab === "agents" && s.tabActive]}
              onPress={() => setTab("agents")}
            >
              <Text style={[s.tabText, tab === "agents" && s.tabTextActive]}>Agents</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.tab, tab === "models" && s.tabActive]}
              onPress={() => setTab("models")}
            >
              <Text style={[s.tabText, tab === "models" && s.tabTextActive]}>Models</Text>
            </TouchableOpacity>
          </View>

          {tab === "agents" ? (
            <ScrollView
              style={{ maxHeight: 420 }}
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              <View style={s.grid}>
                {CONFIG.AGENTS.map((agent) => {
                  const active = selectedAgent === agent.id;
                  return (
                    <TouchableOpacity
                      key={agent.id}
                      style={[
                        s.agentCard,
                        active && { borderColor: agent.color, backgroundColor: agent.color + "10" },
                      ]}
                      onPress={() => {
                        onSelectAgent(agent.id);
                        onClose();
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={s.agentCardTop}>
                        <View
                          style={[s.agentIconCircle, { backgroundColor: agent.color + "22" }]}
                        >
                          <Feather name={agent.icon as any} size={18} color={agent.color} />
                        </View>
                        {active && (
                          <View style={[s.checkBadge, { backgroundColor: agent.color }]}>
                            <Feather name="check" size={10} color="#FFF" />
                          </View>
                        )}
                      </View>
                      <Text style={s.agentCardTitle} numberOfLines={1}>
                        {agent.label}
                      </Text>
                      <View style={[s.agentBadge, { backgroundColor: agent.color + "18" }]}>
                        <Text style={[s.agentBadgeText, { color: agent.color }]}>
                          {agent.badge}
                        </Text>
                      </View>
                      <Text style={s.agentDesc} numberOfLines={2}>
                        {agent.description}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          ) : (
            <ScrollView
              style={{ maxHeight: 420 }}
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              {CONFIG.FREE_MODELS.map((m) => {
                const active = selectedModel === m.value;
                return (
                  <TouchableOpacity
                    key={m.value}
                    style={[s.modelRow, active && s.modelRowActive]}
                    onPress={() => {
                      onSelectModel(m.value);
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={s.modelLeft}>
                      <View style={s.modelDot} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.modelTitle}>{m.label}</Text>
                        <Text style={s.modelValue} numberOfLines={1}>
                          {m.value}
                        </Text>
                      </View>
                    </View>
                    <View style={s.modelBadgeWrap}>
                      <Text style={s.modelBadgeText}>{m.badge}</Text>
                      {active && (
                        <Feather name="check" size={13} color="#6C47FF" style={{ marginLeft: 6 }} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0D0D0D",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#1E1E1E",
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#2A2A2A",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 18,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#161616",
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#252525",
  },
  tabText: {
    color: "#555",
    fontSize: 13,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#EEE",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  agentCard: {
    width: "47%",
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1E1E1E",
    gap: 6,
  },
  agentCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  agentIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  checkBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  agentCardTitle: {
    color: "#EEE",
    fontSize: 14,
    fontWeight: "700",
  },
  agentBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  agentBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  agentDesc: {
    color: "#555",
    fontSize: 11,
    lineHeight: 15,
  },
  modelRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: "#141414",
    justifyContent: "space-between",
  },
  modelRowActive: {
    backgroundColor: "#6C47FF12",
    borderWidth: 1,
    borderColor: "#6C47FF30",
  },
  modelLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  modelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6C47FF44",
    flexShrink: 0,
  },
  modelTitle: {
    color: "#EEE",
    fontSize: 14,
    fontWeight: "600",
  },
  modelValue: {
    color: "#444",
    fontSize: 10,
    marginTop: 2,
  },
  modelBadgeWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  modelBadgeText: {
    color: "#444",
    fontSize: 11,
    fontWeight: "600",
  },
});
