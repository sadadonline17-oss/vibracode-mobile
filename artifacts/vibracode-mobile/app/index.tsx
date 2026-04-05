import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MarketplaceScreen from "@/src/screens/MarketplaceScreen";
import ChatScreen from "@/src/screens/ChatScreen";
import SkillsScreen from "@/src/screens/SkillsScreen";
import PreviewScreen from "@/src/screens/PreviewScreen";
import TerminalScreen from "@/src/screens/TerminalScreen";

type TabId = "chat" | "preview" | "marketplace" | "skills" | "terminal";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "chat",        label: "الدردشة",  icon: "message-circle" },
  { id: "preview",     label: "معاينة",   icon: "monitor" },
  { id: "marketplace", label: "المتجر",   icon: "shopping-bag" },
  { id: "skills",      label: "المهارات", icon: "zap" },
  { id: "terminal",    label: "تيرمنال",  icon: "terminal" },
];

// Android minimum touch target: 48dp
const TAB_ICON_SIZE = 20;
const TAB_ITEM_HEIGHT = 48;

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<TabId>("chat");
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get("window");
  const isTablet = width >= 768;

  // bottomPad: home indicator on iOS (20–34dp), gesture nav bar on Android (varies 0–24dp)
  const bottomPad = Math.max(insets.bottom, 0);
  const tabBarHeight = TAB_ITEM_HEIGHT + bottomPad + 8;

  return (
    <View style={s.root}>
      {/* ── Full-screen content — extends under the floating tab bar ── */}
      <View style={s.content}>{
        activeTab === "chat"        ? <ChatScreen tabBarHeight={tabBarHeight} /> :
        activeTab === "preview"     ? <PreviewScreen /> :
        activeTab === "marketplace" ? <MarketplaceScreen /> :
        activeTab === "terminal"    ? <TerminalScreen /> :
                                      <SkillsScreen />
      }</View>

      {/* ── Floating Tab Bar ── */}
      <View
        style={[
          s.tabBar,
          {
            paddingBottom: Math.max(bottomPad, 6),
            paddingHorizontal: isTablet ? 60 : 4,
          },
        ]}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={s.tabItem}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <View style={[s.tabIconWrap, active && s.tabIconWrapActive]}>
                <Feather
                  name={tab.icon as any}
                  size={TAB_ICON_SIZE}
                  color={active ? "#6C47FF" : "#3A3A3A"}
                />
              </View>
              <Text style={[s.tabLabel, active && s.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#080808" },
  content: { flex: 1 },
  tabBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    backgroundColor: "#080808F2",
    borderTopWidth: 1,
    borderTopColor: "#141414",
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    minHeight: TAB_ITEM_HEIGHT,
    paddingVertical: Platform.OS === "android" ? 6 : 4,
  },
  tabIconWrap: {
    width: 46,
    height: 34,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  tabIconWrapActive: { backgroundColor: "#6C47FF15" },
  tabLabel: { color: "#3A3A3A", fontSize: 10, fontWeight: "600" },
  tabLabelActive: { color: "#6C47FF" },
});
