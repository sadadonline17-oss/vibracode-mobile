import { Feather } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

let WebView: any = null;
try {
  WebView = require("react-native-webview").WebView;
} catch {}

interface Props {
  visible:   boolean;
  url:       string;
  onClose:   () => void;
  sandboxId?: string;
}

export default function LivePreviewModal({ visible, url, onClose, sandboxId }: Props) {
  const [loading, setLoading]     = useState(true);
  const [canBack, setCanBack]     = useState(false);
  const [canFwd, setCanFwd]       = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState(url);
  const webRef = useRef<any>(null);

  const handleShare = () => Share.share({ url: currentUrl, message: currentUrl });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={S.root}>
        {/* Top Bar */}
        <View style={S.topBar}>
          <TouchableOpacity onPress={onClose} style={S.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="x" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={S.urlBar}>
            <View style={S.statusDot} />
            <Text style={S.urlTxt} numberOfLines={1}>{currentUrl}</Text>
          </View>
          <TouchableOpacity onPress={handleShare} style={S.shareBtn}>
            <Feather name="share" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* WebView or Error */}
        {error ? (
          <View style={S.errorView}>
            <Text style={S.errorEmoji}>⚠️</Text>
            <Text style={S.errorTitle}>Preview Not Ready</Text>
            <Text style={S.errorMsg}>{error}</Text>
            <TouchableOpacity
              onPress={() => { setError(null); webRef.current?.reload(); }}
              style={S.retryBtn}
            >
              <Text style={S.retryTxt}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : WebView ? (
          <WebView
            ref={webRef}
            source={{ uri: url }}
            style={S.webview}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onNavigationStateChange={(s: any) => {
              setCanBack(s.canGoBack);
              setCanFwd(s.canGoForward);
              setCurrentUrl(s.url);
            }}
            onError={(e: any) => setError(e.nativeEvent.description)}
            onHttpError={(e: any) => {
              if (e.nativeEvent.statusCode >= 500) {
                setError(`Server error: ${e.nativeEvent.statusCode}`);
              }
            }}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            allowsBackForwardNavigationGestures
            startInLoadingState
          />
        ) : (
          <View style={S.noWebViewBox}>
            <Feather name="monitor" size={48} color="#444" />
            <Text style={S.noWebViewTxt}>WebView not available</Text>
            <Text style={S.noWebViewUrl}>{url}</Text>
          </View>
        )}

        {loading && !error && (
          <View style={S.loadingOverlay}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={S.loadingTxt}>Loading preview...</Text>
          </View>
        )}

        {/* Bottom Controls */}
        <View style={S.bottomBar}>
          <TouchableOpacity
            disabled={!canBack}
            onPress={() => webRef.current?.goBack()}
            style={[S.navBtn, !canBack && S.navBtnDis]}
          >
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            disabled={!canFwd}
            onPress={() => webRef.current?.goForward()}
            style={[S.navBtn, !canFwd && S.navBtnDis]}
          >
            <Feather name="arrow-right" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setError(null); webRef.current?.reload(); }}
            style={S.navBtn}
          >
            <Feather name="refresh-cw" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={S.navBtn}>
            <Feather name="link" size={20} color="#fff" />
          </TouchableOpacity>
          {sandboxId && (
            <View style={S.sandboxBadge}>
              <Text style={S.sandboxTxt}>E2B</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const S = StyleSheet.create({
  root:          { flex: 1, backgroundColor: "#0A0A0F" },
  topBar:        { flexDirection: "row", alignItems: "center", paddingTop: 52, paddingHorizontal: 12, paddingBottom: 12, backgroundColor: "#111", gap: 8 },
  closeBtn:      { padding: 8, backgroundColor: "#222", borderRadius: 20 },
  urlBar:        { flex: 1, backgroundColor: "#222", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e" },
  urlTxt:        { color: "#aaa", fontSize: 12, flex: 1 },
  shareBtn:      { padding: 8 },
  webview:       { flex: 1 },
  loadingOverlay:{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  loadingTxt:    { color: "#fff", marginTop: 12, fontSize: 14 },
  bottomBar:     { flexDirection: "row", backgroundColor: "#111", paddingBottom: 34, paddingTop: 8, paddingHorizontal: 12, gap: 8, alignItems: "center" },
  navBtn:        { flex: 1, alignItems: "center", paddingVertical: 10 },
  navBtnDis:     { opacity: 0.3 },
  errorView:     { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  errorEmoji:    { fontSize: 48, marginBottom: 16 },
  errorTitle:    { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 8 },
  errorMsg:      { color: "#888", fontSize: 14, textAlign: "center" },
  retryBtn:      { marginTop: 20, backgroundColor: "#7C3AED", borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14 },
  retryTxt:      { color: "#fff", fontSize: 16, fontWeight: "600" },
  noWebViewBox:  { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  noWebViewTxt:  { color: "#888", fontSize: 16 },
  noWebViewUrl:  { color: "#555", fontSize: 12, textAlign: "center", paddingHorizontal: 24 },
  sandboxBadge:  { backgroundColor: "#7C3AED33", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "#7C3AED55" },
  sandboxTxt:    { color: "#7C3AED", fontSize: 11, fontWeight: "700" },
});
