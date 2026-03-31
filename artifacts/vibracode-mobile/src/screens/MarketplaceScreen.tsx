import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GithubAgent, useMarketplace } from "../hooks/useMarketplace";

const { width: SCREEN_W } = Dimensions.get("window");
const IS_TABLET = SCREEN_W >= 768;

type Category = "all" | "coding" | "agent" | "tool" | "reasoning" | "multimodal";

const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: "all", label: "الكل", icon: "grid" },
  { id: "coding", label: "برمجة", icon: "code" },
  { id: "agent", label: "وكلاء", icon: "cpu" },
  { id: "tool", label: "أدوات", icon: "tool" },
];

export default function MarketplaceScreen() {
  const insets = useSafeAreaInsets();
  const { agents, loading, refreshing, installing, installedCount, updatesCount, refresh, toggleInstall, updateAgent } =
    useMarketplace();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [tab, setTab] = useState<"all" | "installed">("all");

  const filtered = useMemo(() => {
    return agents.filter((a) => {
      const matchesSearch =
        !search ||
        a.displayName.toLowerCase().includes(search.toLowerCase()) ||
        a.description.toLowerCase().includes(search.toLowerCase()) ||
        a.author.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "all" || a.category === category;
      const matchesTab = tab === "all" || a.installed;
      return matchesSearch && matchesCategory && matchesTab;
    });
  }, [agents, search, category, tab]);

  const numColumns = IS_TABLET ? 2 : 1;

  const renderAgent = ({ item }: { item: GithubAgent }) => {
    const isInstalling = installing.has(item.id);
    return (
      <View style={[s.card, IS_TABLET && s.cardTablet]}>
        <View style={s.cardTop}>
          <View style={[s.iconWrap, { backgroundColor: item.color + "22" }]}>
            <Feather name={item.icon as any} size={22} color={item.color} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={s.titleRow}>
              <Text style={s.cardTitle} numberOfLines={1}>
                {item.displayName}
              </Text>
              <View style={[s.badge, { backgroundColor: item.color + "20" }]}>
                <Text style={[s.badgeText, { color: item.color }]}>{item.badge}</Text>
              </View>
            </View>
            <Text style={s.cardAuthor}>{item.author}</Text>
          </View>
        </View>

        <Text style={s.cardDesc} numberOfLines={3}>
          {item.description}
        </Text>

        <View style={s.cardMeta}>
          <View style={s.metaItem}>
            <Feather name="star" size={11} color="#F59E0B" />
            <Text style={s.metaText}>{(item.stars / 1000).toFixed(1)}k</Text>
          </View>
          <View style={s.metaItem}>
            <Feather name="git-branch" size={11} color="#555" />
            <Text style={s.metaText}>{(item.forks / 1000).toFixed(1)}k</Text>
          </View>
          <View style={s.metaItem}>
            <Feather name="code" size={11} color="#555" />
            <Text style={s.metaText}>{item.language}</Text>
          </View>
          <Text style={s.versionText}>v{item.version}</Text>
        </View>

        <View style={s.installRow}>
          <Text style={s.installCmd} numberOfLines={1}>
            {item.installCmd}
          </Text>
          {item.updateAvailable ? (
            <TouchableOpacity
              style={[s.installBtn, { backgroundColor: "#F59E0B" }]}
              onPress={() => updateAgent(item.id)}
              disabled={isInstalling}
              activeOpacity={0.8}
            >
              {isInstalling ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Feather name="refresh-cw" size={12} color="#FFF" />
                  <Text style={s.installBtnText}>تحديث</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                s.installBtn,
                item.installed
                  ? { backgroundColor: "#1A1A1A", borderWidth: 1, borderColor: "#2A2A2A" }
                  : { backgroundColor: item.color },
              ]}
              onPress={() => toggleInstall(item.id)}
              disabled={isInstalling}
              activeOpacity={0.8}
            >
              {isInstalling ? (
                <ActivityIndicator size="small" color={item.installed ? "#555" : "#FFF"} />
              ) : (
                <>
                  <Feather
                    name={item.installed ? "check" : "download"}
                    size={12}
                    color={item.installed ? "#555" : "#FFF"}
                  />
                  <Text
                    style={[
                      s.installBtnText,
                      item.installed && { color: "#555" },
                    ]}
                  >
                    {item.installed ? "مثبّت" : "تثبيت"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>متجر الوكلاء</Text>
          <Text style={s.headerSub}>
            {installedCount} مثبّت · {updatesCount > 0 ? `${updatesCount} تحديثات` : "محدّث"}
          </Text>
        </View>
        <TouchableOpacity style={s.refreshBtn} onPress={refresh}>
          <Feather name="refresh-cw" size={16} color={refreshing ? "#6C47FF" : "#555"} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Feather name="search" size={15} color="#333" style={{ marginLeft: 12 }} />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="ابحث عن وكيل..."
          placeholderTextColor="#333"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")} style={{ paddingRight: 12 }}>
            <Feather name="x" size={14} color="#444" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {(["all", "installed"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[s.tabBtn, tab === t && s.tabBtnActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.7}
          >
            <Text style={[s.tabBtnText, tab === t && s.tabBtnTextActive]}>
              {t === "all" ? "جميع الوكلاء" : `المثبّتة (${installedCount})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Categories */}
      <View style={s.catRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[s.catBtn, category === cat.id && s.catBtnActive]}
            onPress={() => setCategory(cat.id)}
            activeOpacity={0.7}
          >
            <Feather
              name={cat.icon as any}
              size={12}
              color={category === cat.id ? "#6C47FF" : "#444"}
            />
            <Text style={[s.catText, category === cat.id && s.catTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color="#6C47FF" size="large" />
          <Text style={s.loadingText}>جارٍ تحميل الوكلاء...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <Feather name="package" size={40} color="#222" />
          <Text style={s.emptyText}>لا توجد نتائج</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderAgent}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          key={numColumns}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor="#6C47FF"
            />
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
  },
  headerTitle: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  headerSub: { color: "#444", fontSize: 12, marginTop: 2 },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#141414",
    justifyContent: "center",
    alignItems: "center",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#1A1A1A",
  },
  searchInput: {
    flex: 1,
    color: "#EEE",
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    textAlign: "right",
  },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: "#0F0F0F",
    borderRadius: 12,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  tabBtnActive: { backgroundColor: "#1A1A1A" },
  tabBtnText: { color: "#444", fontSize: 12, fontWeight: "600" },
  tabBtnTextActive: { color: "#EEE" },
  catRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
    flexWrap: "wrap",
  },
  catBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#1A1A1A",
  },
  catBtnActive: { backgroundColor: "#6C47FF18", borderColor: "#6C47FF50" },
  catText: { color: "#444", fontSize: 12, fontWeight: "600" },
  catTextActive: { color: "#6C47FF" },
  list: { padding: 12, paddingBottom: 100 },
  card: {
    backgroundColor: "#0D0D0D",
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 4,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "#161616",
    gap: 10,
    flex: 1,
  },
  cardTablet: { maxWidth: "49%" },
  cardTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  cardTitle: { color: "#EEE", fontSize: 15, fontWeight: "700", flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  cardAuthor: { color: "#444", fontSize: 12, marginTop: 2 },
  cardDesc: { color: "#444", fontSize: 13, lineHeight: 19 },
  cardMeta: { flexDirection: "row", gap: 12, alignItems: "center" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: "#333", fontSize: 11 },
  versionText: { color: "#2A2A2A", fontSize: 10, marginLeft: "auto" },
  installRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  installCmd: {
    flex: 1,
    color: "#333",
    fontSize: 10,
    fontFamily: "monospace",
    backgroundColor: "#0A0A0A",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  installBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 76,
    justifyContent: "center",
  },
  installBtnText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: "#333", fontSize: 14 },
  emptyText: { color: "#333", fontSize: 15, marginTop: 8 },
});
