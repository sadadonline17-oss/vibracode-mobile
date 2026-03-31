import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

interface Chip {
  label: string;
  prompt: string;
  icon: string;
  color: string;
}

const CHIPS: Chip[] = [
  { label: "توصيل طعام", prompt: "ابنِ تطبيق توصيل طعام كامل مثل Talabat: قائمة مطاعم، سلة تسوق، تتبع الطلب بخريطة حية، طرق دفع متعددة", icon: "package", color: "#F97316" },
  { label: "متجر إلكتروني", prompt: "ابنِ تطبيق متجر إلكتروني مثل Amazon: قائمة منتجات، بحث وفلترة، سلة وشراء، ملف المستخدم", icon: "shopping-bag", color: "#3B82F6" },
  { label: "تطبيق مهام", prompt: "ابنِ تطبيق إدارة مهام متكامل مع: قوائم، أولويات، مواعيد، تذكيرات، مزامنة سحابية", icon: "check-square", color: "#22C55E" },
  { label: "دردشة فورية", prompt: "ابنِ تطبيق دردشة فورية مثل WhatsApp: قائمة محادثات، رسائل نصية وصور، حالة قراءة، مجموعات", icon: "message-circle", color: "#A855F7" },
  { label: "لياقة بدنية", prompt: "ابنِ تطبيق لياقة بدنية: تمارين مصنفة، خطط تدريب، تتبع التقدم، توقيت ومؤقت", icon: "activity", color: "#EF4444" },
  { label: "حجز مواعيد", prompt: "ابنِ تطبيق حجز مواعيد: تقويم تفاعلي، فتحات زمنية، تأكيد حجز، إلغاء ومتابعة", icon: "calendar", color: "#06B6D4" },
  { label: "موسيقى", prompt: "ابنِ تطبيق مشغل موسيقى مثل Spotify: تصفح أغاني، مشغل مع تحكم، قوائم تشغيل، موجة صوت", icon: "music", color: "#EC4899" },
  { label: "طقس ذكي", prompt: "ابنِ تطبيق طقس ذكي: طقس حالي وتوقعات 7 أيام، خريطة، إشعارات، تحديد موقع تلقائي", icon: "cloud", color: "#8B5CF6" },
  { label: "محفظة مالية", prompt: "ابنِ تطبيق محفظة مالية: تتبع المصروفات، رسوم بيانية، ميزانية شهرية، فئات وتقارير", icon: "dollar-sign", color: "#F59E0B" },
  { label: "شبكة اجتماعية", prompt: "ابنِ شبكة اجتماعية: بروفايل مستخدم، منشورات وصور، إعجابات وتعليقات، متابعة", icon: "users", color: "#10B981" },
  { label: "اختبار ذكاء", prompt: "ابنِ تطبيق اختبارات ذكاء وأسئلة: فئات متعددة، عداد وقت، درجات وترتيب عالمي", icon: "help-circle", color: "#6C47FF" },
  { label: "قارئ أخبار", prompt: "ابنِ تطبيق قارئ أخبار: قائمة مقالات، بحث، تفاصيل مقال، حفظ للقراءة لاحقاً، مشاركة", icon: "file-text", color: "#EF4444" },
];

interface Props {
  visible: boolean;
  onSelect: (prompt: string) => void;
}

export default function SuggestionChips({ visible, onSelect }: Props) {
  if (!visible) return null;

  return (
    <View style={s.wrapper}>
      <Text style={s.hint}>جرّب مثالاً سريعاً</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.row}
      >
        {CHIPS.map((chip) => (
          <Pressable
            key={chip.label}
            style={({ pressed }) => [s.chip, { borderColor: chip.color + "55", opacity: pressed ? 0.7 : 1 }]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(chip.prompt);
            }}
          >
            <Feather name={chip.icon as any} size={13} color={chip.color} />
            <Text style={[s.label, { color: chip.color }]}>{chip.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: "#0A0A0A",
  },
  hint: {
    color: "#333",
    fontSize: 10,
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: 10,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "#111",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
});
