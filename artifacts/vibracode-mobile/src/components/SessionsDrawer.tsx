import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Session } from "../context/ChatContext";

interface Props {
  visible: boolean;
  sessions: Session[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  onClose: () => void;
}

export default function SessionsDrawer({
  visible,
  sessions,
  currentSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
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
          style={[
            s.drawer,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={s.drawerHeader}>
            <Text style={s.drawerTitle}>المشاريع</Text>
            <TouchableOpacity style={s.newBtn} onPress={onCreateSession}>
              <Feather name="plus" size={18} color="#6C47FF" />
            </TouchableOpacity>
          </View>

          {sessions.length === 0 ? (
            <View style={s.empty}>
              <Feather name="folder" size={40} color="#333" />
              <Text style={s.emptyText}>لا توجد مشاريع بعد</Text>
            </View>
          ) : (
            <FlatList
              data={sessions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isActive = item.id === currentSessionId;
                const lastMsg = item.messages[item.messages.length - 1];
                return (
                  <TouchableOpacity
                    style={[s.sessionRow, isActive && s.sessionRowActive]}
                    onPress={() => {
                      onSelectSession(item.id);
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        s.sessionIcon,
                        { backgroundColor: isActive ? "#6C47FF22" : "#1A1A1A" },
                      ]}
                    >
                      <Feather
                        name="code"
                        size={16}
                        color={isActive ? "#6C47FF" : "#555"}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.sessionName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {lastMsg && (
                        <Text style={s.sessionPreview} numberOfLines={1}>
                          {lastMsg.content.slice(0, 40)}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => onDeleteSession(item.id)}
                      style={s.deleteBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Feather name="trash-2" size={14} color="#444" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    flexDirection: "row",
  },
  drawer: {
    width: 280,
    backgroundColor: "#0D0D0D",
    borderRightWidth: 1,
    borderRightColor: "#1A1A1A",
    paddingHorizontal: 16,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  drawerTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700" as const,
  },
  newBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    marginBottom: 4,
    gap: 10,
  },
  sessionRowActive: { backgroundColor: "#6C47FF12" },
  sessionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sessionName: {
    color: "#E5E5E5",
    fontSize: 13,
    fontWeight: "600" as const,
  },
  sessionPreview: { color: "#555", fontSize: 11, marginTop: 1 },
  deleteBtn: {
    padding: 4,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  emptyText: { color: "#444", fontSize: 14 },
});
