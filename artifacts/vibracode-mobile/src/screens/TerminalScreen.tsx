import React, { useCallback, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { CONFIG } from "../config";
import { terminalBridge } from "../tools/TerminalBridge";

// ── xterm.js HTML bundle (loaded offline, no CDN required at runtime) ─────────
const TERMINAL_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <script src="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.3.0/lib/xterm.js"></script>
  <link  rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.3.0/css/xterm.css"/>
  <script src="https://cdn.jsdelivr.net/npm/@xterm/addon-fit@0.10.0/lib/addon-fit.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{background:#0d1117;height:100%;overflow:hidden}
    #t{width:100%;height:100vh}
  </style>
</head>
<body>
  <div id="t"></div>
  <script>
    const term = new Terminal({
      theme:{
        background:'#0d1117',foreground:'#c9d1d9',
        cursor:'#58a6ff',selectionBackground:'rgba(88,166,255,0.3)',
        black:'#484f58',red:'#ff7b72',green:'#3fb950',
        yellow:'#d29922',blue:'#58a6ff',magenta:'#d2a8ff',
        cyan:'#76e3ea',white:'#b1bac4'
      },
      fontSize:13,fontFamily:"'JetBrains Mono','Fira Code',monospace",
      cursorBlink:true,allowTransparency:true,scrollback:2000
    });
    const fit = new FitAddon.FitAddon();
    term.loadAddon(fit);
    term.open(document.getElementById('t'));
    fit.fit();

    let line='',history=[],hIdx=-1,prompt='\\x1b[32m$ \\x1b[0m';

    function writePrompt(){term.write('\\r\\n'+prompt);}

    term.write('\\x1b[1;34m╔══════════════════════════╗\\x1b[0m\\r\\n');
    term.write('\\x1b[1;34m║  VibraCode Terminal 1.0  ║\\x1b[0m\\r\\n');
    term.write('\\x1b[1;34m╚══════════════════════════╝\\x1b[0m\\r\\n');
    writePrompt();

    term.onKey(({key,domEvent})=>{
      const k=domEvent.keyCode;
      if(k===13){
        const cmd=line.trim();
        if(cmd){history.unshift(cmd);hIdx=-1;window.ReactNativeWebView.postMessage(JSON.stringify({type:'command',command:cmd}));}
        line='';
      } else if(k===8){
        if(line.length>0){line=line.slice(0,-1);term.write('\\b \\b');}
      } else if(k===38){
        if(hIdx<history.length-1){hIdx++;const c=history[hIdx];term.write('\\r\\x1b[K'+prompt+c);line=c;}
      } else if(k===40){
        if(hIdx>0){hIdx--;const c=history[hIdx];term.write('\\r\\x1b[K'+prompt+c);line=c;}
        else if(hIdx===0){hIdx=-1;term.write('\\r\\x1b[K'+prompt);line='';}
      } else {
        line+=key;term.write(key);
      }
    });

    window.receiveOutput=function(d){term.write('\\r\\n'+d.replace(/\\n/g,'\\r\\n'));writePrompt();};
    window.receiveError=function(d){term.write('\\r\\n\\x1b[31m'+d.replace(/\\n/g,'\\r\\n')+'\\x1b[0m');writePrompt();};
    window.receiveAgent=function(d){term.write('\\r\\n\\x1b[33m🤖 '+d.replace(/\\n/g,'\\r\\n')+'\\x1b[0m');writePrompt();};
    window.clearTerm=function(){term.clear();writePrompt();};
    window.addEventListener('resize',()=>fit.fit());
  </script>
</body>
</html>`;

export default function TerminalScreen() {
  const webRef = useRef<WebView>(null);
  const [connected, setConnected] = useState(false);
  const [executing, setExecuting] = useState(false);

  const backendUrl = (CONFIG.BACKEND_URL || "").replace(/\/$/, "");

  const injectOutput = useCallback((js: string) => {
    webRef.current?.injectJavaScript(`${js}; true;`);
  }, []);

  // Subscribe to agent tool output so the terminal shows agent commands
  React.useEffect(() => {
    return terminalBridge.subscribe((text, type) => {
      const escaped = JSON.stringify(text);
      if (type === "error") {
        injectOutput(`window.receiveError(${escaped})`);
      } else if (type === "agent") {
        injectOutput(`window.receiveAgent(${escaped})`);
      } else {
        injectOutput(`window.receiveOutput(${escaped})`);
      }
    });
  }, [injectOutput]);

  const executeCommand = useCallback(
    async (command: string) => {
      if (!backendUrl) {
        injectOutput(`window.receiveError("Backend not configured. Set EXPO_PUBLIC_BACKEND_URL.")`);
        return;
      }
      setExecuting(true);
      try {
        const res = await fetch(`${backendUrl}/terminal/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command, cwd: "/tmp/vibracode" }),
        });
        const data = (await res.json()) as { stdout: string; stderr: string; code: number };
        if (data.stdout) injectOutput(`window.receiveOutput(${JSON.stringify(data.stdout)})`);
        if (data.stderr) injectOutput(`window.receiveError(${JSON.stringify(data.stderr)})`);
        if (!data.stdout && !data.stderr) injectOutput(`window.receiveOutput("")`);
      } catch (err: any) {
        injectOutput(`window.receiveError(${JSON.stringify("Connection error: " + (err?.message ?? "unknown"))})`);
      } finally {
        setExecuting(false);
      }
    },
    [backendUrl, injectOutput]
  );

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.headerTitle}>⚡ Terminal</Text>
          {executing && <Text style={s.runningText}>running…</Text>}
        </View>
        <View style={s.headerRight}>
          <View style={[s.dot, { backgroundColor: connected ? "#3fb950" : "#484f58" }]} />
          <Pressable
            style={s.clearBtn}
            onPress={() => injectOutput("window.clearTerm()")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={s.clearText}>clear</Text>
          </Pressable>
        </View>
      </View>

      {/* WebView terminal */}
      <WebView
        ref={webRef}
        source={{ html: TERMINAL_HTML }}
        style={s.webview}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
        mixedContentMode="always"
        allowsInlineMediaPlayback
        onLoad={() => setConnected(true)}
        onError={() => setConnected(false)}
        onMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data) as { type: string; command?: string };
            if (msg.type === "command" && msg.command) {
              executeCommand(msg.command);
            }
          } catch {}
        }}
        // Android: allow loading CDN resources
        {...(Platform.OS === "android" ? { useWebKit: false } : {})}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0d1117" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#21262d",
    backgroundColor: "#161b22",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: { color: "#58a6ff", fontWeight: "700", fontSize: 15 },
  runningText: { color: "#d29922", fontSize: 11 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#21262d",
    borderWidth: 1,
    borderColor: "#30363d",
  },
  clearText: { color: "#8b949e", fontSize: 11 },
  webview: { flex: 1, backgroundColor: "#0d1117" },
});
