import { Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useChat } from "../context/ChatContext";

const QUICK_SITES = [
  { label: "Expo Snack", url: "https://snack.expo.dev", icon: "smartphone" },
  { label: "CodeSandbox", url: "https://codesandbox.io", icon: "box" },
  { label: "StackBlitz", url: "https://stackblitz.com", icon: "zap" },
  { label: "Vercel", url: "https://vercel.com", icon: "triangle" },
  { label: "Netlify", url: "https://netlify.com", icon: "cloud" },
  { label: "GitHub", url: "https://github.com", icon: "github" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let WebView: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  WebView = require("react-native-webview").WebView;
} catch {}

export default function PreviewScreen() {
  const insets = useSafeAreaInsets();
  const { currentSession } = useChat();
  const [url, setUrl] = useState(currentSession?.previewUrl ?? "");
  const [activeUrl, setActiveUrl] = useState(currentSession?.previewUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [webError, setWebError] = useState(false);
  const webRef = useRef<any>(null);

  const normalizeUrl = (raw: string) => {
    let u = raw.trim();
    if (!u) return "";
    if (!u.startsWith("http://") && !u.startsWith("https://")) {
      u = "https://" + u;
    }
    return u;
  };

  const handleGo = () => {
    const u = normalizeUrl(url);
    if (!u) return;
    Keyboard.dismiss();
    setWebError(false);
    setActiveUrl(u);
    setUrl(u);
  };

  const handleOpenExternal = async () => {
    const u = normalizeUrl(activeUrl || url);
    if (!u) return;
    await WebBrowser.openBrowserAsync(u);
  };

  const handleQuick = (site: (typeof QUICK_SITES)[0]) => {
    setUrl(site.url);
    setActiveUrl(site.url);
    setWebError(false);
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.headerIcon}>
            <Feather name="eye" size={16} color="#6C47FF" />
          </View>
          <View>
            <Text style={s.headerTitle}>معاينة التطبيق</Text>
            <Text style={s.headerSub}>عرض مباشر للمواقع والتطبيقات</Text>
          </View>
        </View>
        <TouchableOpacity style={s.extBtn} onPress={handleOpenExternal} activeOpacity={0.8}>
          <Feather name="external-link" size={14} color="#6C47FF" />
        </TouchableOpacity>
      </View>

      {/* URL Bar */}
      <View style={s.urlBar}>
        <Feather name="globe" size={14} color="#444" style={{ marginLeft: 10 }} />
        <TextInput
          style={s.urlInput}
          value={url}
          onChangeText={setUrl}
          placeholder="https://expo.dev أو رابط تطبيقك..."
          placeholderTextColor="#333"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          onSubmitEditing={handleGo}
        />
        {loading && <ActivityIndicator size="small" color="#6C47FF" style={{ marginRight: 4 }} />}
        <TouchableOpacity style={s.goBtn} onPress={handleGo} activeOpacity={0.8}>
          <Feather name="arrow-right" size={14} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Controls */}
      <View style={s.controls}>
        <TouchableOpacity style={s.ctrlBtn} onPress={() => webRef.current?.goBack()}>
          <Feather name="arrow-left" size={16} color="#555" />
        </TouchableOpacity>
        <TouchableOpacity style={s.ctrlBtn} onPress={() => webRef.current?.goForward()}>
          <Feather name="arrow-right" size={16} color="#555" />
        </TouchableOpacity>
        <TouchableOpacity style={s.ctrlBtn} onPress={() => { setWebError(false); webRef.current?.reload(); }}>
          <Feather name="refresh-cw" size={16} color="#555" />
        </TouchableOpacity>
        <TouchableOpacity style={s.ctrlBtn} onPress={() => { setActiveUrl(""); setUrl(""); }}>
          <Feather name="x" size={16} color="#555" />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={[s.ctrlBtn, { backgroundColor: "#6C47FF20", borderColor: "#6C47FF40" }]} onPress={handleOpenExternal}>
          <Feather name="external-link" size={15} color="#6C47FF" />
          <Text style={{ color: "#6C47FF", fontSize: 11, fontWeight: "600" }}>متصفح</Text>
        </TouchableOpacity>
      </View>

      {/* WebView Area */}
      <View style={s.webArea}>
        {!activeUrl ? (
          <View style={s.emptyState}>
            <View style={s.emptyIcon}>
              <Feather name="monitor" size={48} color="#1E1E1E" />
            </View>
            <Text style={s.emptyTitle}>معاينة فورية</Text>
            <Text style={s.emptyDesc}>
              أدخل رابط تطبيقك أو موقعك لمشاهدته مباشرة داخل التطبيق
            </Text>

            <Text style={s.quickLabel}>روابط سريعة</Text>
            <View style={s.quickGrid}>
              {QUICK_SITES.map((site) => (
                <TouchableOpacity
                  key={site.url}
                  style={s.quickCard}
                  onPress={() => handleQuick(site)}
                  activeOpacity={0.75}
                >
                  <Feather name={site.icon as any} size={20} color="#6C47FF" />
                  <Text style={s.quickLabel2}>{site.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {currentSession?.previewUrl && (
              <TouchableOpacity
                style={s.sessionPreviewBtn}
                onPress={() => {
                  setUrl(currentSession.previewUrl!);
                  setActiveUrl(currentSession.previewUrl!);
                }}
                activeOpacity={0.8}
              >
                <Feather name="play" size={14} color="#22C55E" />
                <Text style={s.sessionPreviewText}>فتح معاينة المشروع الحالي</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : WebView && Platform.OS !== "web" ? (
          <>
            {webError ? (
              <View style={s.errorState}>
                <Feather name="wifi-off" size={40} color="#EF4444" />
                <Text style={s.errorTitle}>تعذّر تحميل الصفحة</Text>
                <Text style={s.errorDesc}>{activeUrl}</Text>
                <TouchableOpacity style={s.openExternalFull} onPress={handleOpenExternal}>
                  <Feather name="external-link" size={14} color="#FFF" />
                  <Text style={s.openExternalText}>فتح في المتصفح الخارجي</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <WebView
                ref={webRef}
                source={{ uri: activeUrl }}
                style={s.webview}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onError={() => { setLoading(false); setWebError(true); }}
                javaScriptEnabled
                domStorageEnabled
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                onNavigationStateChange={(e: any) => setUrl(e.url || activeUrl)}
              />
            )}
          </>
        ) : (
          <View style={s.webFallback}>
            <Feather name="external-link" size={36} color="#6C47FF" />
            <Text style={s.webFallbackTitle}>فتح في المتصفح</Text>
            <Text style={s.webFallbackDesc}>{activeUrl}</Text>
            <TouchableOpacity style={s.openExternalFull} onPress={handleOpenExternal} activeOpacity={0.85}>
              <Feather name="globe" size={14} color="#FFF" />
              <Text style={s.openExternalText}>فتح الآن</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0A0A" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "#6C47FF15",
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  headerSub: { color: "#444", fontSize: 11 },
  extBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "#161616", borderWidth: 1, borderColor: "#222",
    justifyContent: "center", alignItems: "center",
  },

  urlBar: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 12, marginVertical: 8,
    backgroundColor: "#111",
    borderRadius: 12, borderWidth: 1, borderColor: "#1E1E1E",
    gap: 6,
  },
  urlInput: {
    flex: 1, color: "#FFF", fontSize: 13,
    paddingVertical: 10, paddingHorizontal: 6,
  },
  goBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: "#6C47FF",
    justifyContent: "center", alignItems: "center",
    marginRight: 4,
  },

  controls: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingBottom: 8, gap: 4,
  },
  ctrlBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, backgroundColor: "#111",
    borderWidth: 1, borderColor: "#1E1E1E",
  },

  webArea: { flex: 1, overflow: "hidden" },
  webview: { flex: 1, backgroundColor: "#0A0A0A" },

  emptyState: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 24, paddingBottom: 40,
  },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 22,
    backgroundColor: "#111", justifyContent: "center", alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: { color: "#DDD", fontSize: 20, fontWeight: "700", marginBottom: 8 },
  emptyDesc: { color: "#444", fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 28 },

  quickLabel: { color: "#555", fontSize: 12, fontWeight: "600", marginBottom: 12, alignSelf: "flex-start" },
  quickGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10,
    justifyContent: "center", width: "100%", marginBottom: 24,
  },
  quickCard: {
    width: "28%", aspectRatio: 1.1,
    backgroundColor: "#111", borderRadius: 14,
    borderWidth: 1, borderColor: "#1E1E1E",
    justifyContent: "center", alignItems: "center", gap: 6,
  },
  quickLabel2: { color: "#777", fontSize: 10, fontWeight: "600" },

  sessionPreviewBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: "#22C55E15",
    borderRadius: 14, borderWidth: 1, borderColor: "#22C55E30",
  },
  sessionPreviewText: { color: "#22C55E", fontSize: 14, fontWeight: "600" },

  errorState: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: 12,
  },
  errorTitle: { color: "#EF4444", fontSize: 18, fontWeight: "700" },
  errorDesc: { color: "#555", fontSize: 12, textAlign: "center", paddingHorizontal: 20 },

  webFallback: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: 12,
  },
  webFallbackTitle: { color: "#DDD", fontSize: 18, fontWeight: "700" },
  webFallbackDesc: { color: "#555", fontSize: 12, textAlign: "center", paddingHorizontal: 20 },

  openExternalFull: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 24, paddingVertical: 14,
    backgroundColor: "#6C47FF", borderRadius: 14,
  },
  openExternalText: { color: "#FFF", fontSize: 14, fontWeight: "700" },
});
