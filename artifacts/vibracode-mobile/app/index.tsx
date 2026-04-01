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

type TabId = "chat" | "preview" | "marketplace" | "skills";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "chat", label: "الدردشة", icon: "message-circle" },
  { id: "preview", label: "معاينة", icon: "monitor" },
  { id: "marketplace", label: "المتجر", icon: "shopping-bag" },
  { id: "skills", label: "المهارات", icon: "zap" },
];

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<TabId>("chat");
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get("window");
  const isTablet = width >= 768;

  const bottomPad = Math.max(insets.bottom, (Platform.OS as string) === "web" ? 8 : 4);
  const tabBarHeight = 44 + bottomPad + 8;

  const renderScreen = () => {
    switch (activeTab) {
      case "chat":
        return <ChatScreen tabBarHeight={tabBarHeight} />;
      case "preview":
        return <PreviewScreen />;
      case "marketplace":
        return <MarketplaceScreen />;
      case "skills":
        return <SkillsScreen />;
    }
  };

  return (
    <View style={s.root}>
      {/* Full-screen content — extends under the floating tab bar */}
      <View style={s.content}>{renderScreen()}</View>

      {/* Floating tab bar — overlays the bottom of the screen */}
      <View
        style={[
          s.tabBar,
          {
            paddingBottom: bottomPad,
            paddingHorizontal: isTablet ? 60 : 0,
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
            >
              <View style={[s.tabIconWrap, active && s.tabIconWrapActive]}>
                <Feather
                  name={tab.icon as any}
                  size={19}
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
  root: { flex: 1, backgroundColor: "#0A0A0A" },
  content: { flex: 1 },
  tabBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    backgroundColor: "#080808EE",
    borderTopWidth: 1,
    borderTopColor: "#141414",
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 4,
  },
  tabIconWrap: {
    width: 44,
    height: 32,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  tabIconWrapActive: { backgroundColor: "#6C47FF15" },
  tabLabel: { color: "#3A3A3A", fontSize: 10, fontWeight: "600" },
  tabLabelActive: { color: "#6C47FF" },
});
