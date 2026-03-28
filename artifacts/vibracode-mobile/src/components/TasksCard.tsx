import { Feather } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { TaskItem } from "../context/ChatContext";

interface Props {
  tasks: TaskItem[];
}

export default function TasksCard({ tasks }: Props) {
  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <View style={s.card}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Feather name="check-square" size={12} color="#6C47FF" />
          <Text style={s.label}>TASKS</Text>
        </View>
        <Text style={s.count}>
          {doneCount}/{tasks.length}
        </Text>
      </View>

      {tasks.map((task, i) => (
        <View key={i} style={s.taskRow}>
          <View style={s.iconWrap}>
            {task.status === "done" ? (
              <View style={s.doneCircle}>
                <Feather name="check" size={9} color="#22C55E" />
              </View>
            ) : task.status === "active" ? (
              <ActivityIndicator
                size="small"
                color="#6C47FF"
                style={{ transform: [{ scale: 0.6 }] }}
              />
            ) : (
              <View style={s.pendingCircle} />
            )}
          </View>
          <Text
            style={[
              s.taskText,
              task.status === "done" && s.taskDone,
              task.status === "active" && s.taskActive,
              task.status === "pending" && s.taskPending,
            ]}
            numberOfLines={2}
          >
            {task.text}
          </Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: "#111",
    borderRadius: 14,
    padding: 13,
    marginVertical: 3,
    borderWidth: 1,
    borderColor: "#1C1C1C",
    maxWidth: "90%",
    alignSelf: "flex-start",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: {
    color: "#6C47FF",
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 1.2,
  },
  count: { color: "#444", fontSize: 11, fontWeight: "600" as const },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 7,
  },
  iconWrap: { width: 18, height: 18, alignItems: "center", justifyContent: "center" },
  doneCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#22C55E15",
    justifyContent: "center",
    alignItems: "center",
  },
  pendingCircle: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 1.5,
    borderColor: "#2A2A2A",
  },
  taskText: { color: "#BBB", fontSize: 13, flex: 1, lineHeight: 18 },
  taskActive: { color: "#FFF", fontWeight: "500" as const },
  taskDone: { color: "#444", textDecorationLine: "line-through" },
  taskPending: { color: "#444" },
});
