import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function PublishModal({ visible, onClose }: Props) {
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

          {/* Apple logo */}
          <View style={s.appleWrap}>
            <Feather name="aperture" size={44} color="#FFF" />
          </View>

          <Text style={s.title}>Publish Your App</Text>
          <Text style={s.subtitle}>
            Get your app on the App Store and Google Play
          </Text>

          {/* Connect GitHub row */}
          <TouchableOpacity
            style={s.githubRow}
            onPress={() => Linking.openURL("https://github.com")}
            activeOpacity={0.8}
          >
            <View style={s.githubLeft}>
              <View style={s.codeIcon}>
                <Text style={s.codeIconText}>{"</>"}</Text>
              </View>
              <View>
                <Text style={s.githubTitle}>Connect GitHub</Text>
                <Text style={s.githubSub}>Required for publishing</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color="#555" />
          </TouchableOpacity>

          {/* Steps */}
          <View style={s.steps}>
            {[
              "Push your code to GitHub",
              "Visit launch.expo.dev",
              "Build and submit with EAS",
            ].map((step, i) => (
              <View key={i} style={s.step}>
                <View style={s.stepNum}>
                  <Text style={s.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={s.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={s.ctaBtn}
            onPress={() =>
              Linking.openURL("https://github.com/apps/expo-github-action")
            }
            activeOpacity={0.9}
          >
            <Text style={s.ctaBtnText}>Connect GitHub</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Linking.openURL("https://docs.expo.dev/submit/introduction/")}
          >
            <Text style={s.learnMore}>Learn more about EAS Submit</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#111",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderColor: "#222",
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 24,
  },
  appleWrap: {
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700" as const,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  githubRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#252525",
  },
  githubLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  codeIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#252525",
    justifyContent: "center",
    alignItems: "center",
  },
  codeIconText: {
    color: "#F97316",
    fontSize: 14,
    fontWeight: "700" as const,
  },
  githubTitle: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600" as const,
  },
  githubSub: {
    color: "#F97316",
    fontSize: 12,
    marginTop: 1,
  },
  steps: { gap: 14, marginBottom: 24 },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#6C47FF",
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700" as const,
  },
  stepText: {
    color: "#CCC",
    fontSize: 14,
  },
  ctaBtn: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 14,
  },
  ctaBtnText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  learnMore: {
    color: "#6C47FF",
    fontSize: 13,
    textAlign: "center",
  },
});
