import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Clipboard,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LATEST_APK_URL = "https://expo.dev/artifacts/eas/3KQnQDQ4a55RZShXakoVHK.apk";
const LATEST_BUILD_URL = "https://expo.dev/accounts/admin44aa/projects/vibracode/builds/16511291-1e54-4178-b90b-7828db8b1be9";
const APP_PAGE_URL = "https://expo.dev/accounts/admin44aa/projects/vibracode";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function PublishModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"download" | "publish">("download");

  const handleCopy = () => {
    Clipboard.setString(LATEST_APK_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

          {/* Header */}
          <View style={s.headerRow}>
            <View style={s.successBadge}>
              <Feather name="check-circle" size={18} color="#22C55E" />
              <Text style={s.successText}>APK جاهز للتحميل</Text>
            </View>
          </View>

          <Text style={s.title}>نشر تطبيق Vibra Code</Text>
          <Text style={s.subtitle}>ملف APK جاهز — بُني بـ EAS Build</Text>

          {/* Tab switcher */}
          <View style={s.tabRow}>
            {(["download", "publish"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[s.tabBtn, tab === t && s.tabBtnActive]}
                onPress={() => setTab(t)}
              >
                <Feather
                  name={t === "download" ? "download" : "upload-cloud"}
                  size={13}
                  color={tab === t ? "#FFF" : "#444"}
                />
                <Text style={[s.tabBtnText, tab === t && s.tabBtnTextActive]}>
                  {t === "download" ? "تحميل APK" : "نشر المتاجر"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === "download" ? (
            <>
              {/* Build Info */}
              <View style={s.buildInfo}>
                <View style={s.buildInfoRow}>
                  <Feather name="package" size={14} color="#6C47FF" />
                  <Text style={s.buildInfoText}>Vibra Code v1.0.0 · Android APK</Text>
                </View>
                <View style={s.buildInfoRow}>
                  <Feather name="cpu" size={14} color="#22C55E" />
                  <Text style={s.buildInfoText}>SDK 54 · EAS Build · Internal Distribution</Text>
                </View>
                <View style={s.buildInfoRow}>
                  <Feather name="calendar" size={14} color="#F97316" />
                  <Text style={s.buildInfoText}>آخر بناء: 31 مارس 2026</Text>
                </View>
              </View>

              {/* Download buttons */}
              <TouchableOpacity
                style={s.downloadBtn}
                onPress={() => Linking.openURL(LATEST_APK_URL)}
                activeOpacity={0.85}
              >
                <Feather name="download" size={18} color="#FFF" />
                <Text style={s.downloadBtnText}>تحميل APK مباشرة</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.copyRow}
                onPress={handleCopy}
                activeOpacity={0.7}
              >
                <Text style={s.copyUrl} numberOfLines={1}>{LATEST_APK_URL}</Text>
                <Feather name={copied ? "check" : "copy"} size={14} color={copied ? "#22C55E" : "#444"} />
              </TouchableOpacity>

              <TouchableOpacity
                style={s.secondaryBtn}
                onPress={() => Linking.openURL(LATEST_BUILD_URL)}
                activeOpacity={0.8}
              >
                <Feather name="external-link" size={14} color="#6C47FF" />
                <Text style={s.secondaryBtnText}>عرض تفاصيل البناء على Expo</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Steps for stores */}
              <View style={s.steps}>
                {[
                  { icon: "github", label: "ربط GitHub", sub: "اربط مستودعك لـ CI/CD تلقائي", url: "https://github.com" },
                  { icon: "play", label: "Google Play", sub: "ارفع APK على Play Console", url: "https://play.google.com/console" },
                  { icon: "smartphone", label: "Apple App Store", sub: "استخدم EAS Submit لـ iOS", url: "https://developer.apple.com" },
                ].map((step, i) => (
                  <TouchableOpacity
                    key={i}
                    style={s.step}
                    onPress={() => Linking.openURL(step.url)}
                    activeOpacity={0.7}
                  >
                    <View style={s.stepNum}>
                      <Text style={s.stepNumText}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.stepLabel}>{step.label}</Text>
                      <Text style={s.stepSub}>{step.sub}</Text>
                    </View>
                    <Feather name="external-link" size={14} color="#333" />
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={s.downloadBtn}
                onPress={() => Linking.openURL(APP_PAGE_URL)}
                activeOpacity={0.85}
              >
                <Feather name="aperture" size={16} color="#FFF" />
                <Text style={s.downloadBtnText}>فتح Expo Dashboard</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={onClose} style={{ marginTop: 12 }}>
            <Text style={s.closeText}>إغلاق</Text>
          </TouchableOpacity>
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
    backgroundColor: "#0F0F0F",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    borderTopWidth: 1,
    borderColor: "#1E1E1E",
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#2A2A2A",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  headerRow: { alignItems: "center", marginBottom: 10 },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#22C55E18",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#22C55E30",
  },
  successText: { color: "#22C55E", fontSize: 12, fontWeight: "700" },
  title: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    color: "#555",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 18,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
    backgroundColor: "#151515",
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: "#1E1E1E",
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 11,
  },
  tabBtnActive: { backgroundColor: "#1E1E1E" },
  tabBtnText: { color: "#444", fontSize: 12, fontWeight: "700" },
  tabBtnTextActive: { color: "#FFF" },
  buildInfo: {
    backgroundColor: "#111",
    borderRadius: 14,
    padding: 14,
    gap: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1A1A1A",
  },
  buildInfoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  buildInfoText: { color: "#777", fontSize: 12 },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#6C47FF",
    borderRadius: 16,
    paddingVertical: 15,
    marginBottom: 10,
  },
  downloadBtnText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  copyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1A1A1A",
  },
  copyUrl: { color: "#444", fontSize: 11, flex: 1 },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
  },
  secondaryBtnText: { color: "#6C47FF", fontSize: 13 },
  steps: { gap: 10, marginBottom: 18 },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#111",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1A1A1A",
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#6C47FF",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  stepNumText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  stepLabel: { color: "#DDD", fontSize: 13, fontWeight: "700" },
  stepSub: { color: "#444", fontSize: 11, marginTop: 2 },
  closeText: { color: "#333", fontSize: 13, textAlign: "center" },
});
