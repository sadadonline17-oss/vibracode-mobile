# Vibra Code — مساعد بناء التطبيقات بالذكاء الاصطناعي

## نظرة عامة

monorepo بـ pnpm + TypeScript. تطبيق Expo/React Native لبناء تطبيقات الجوال بالذكاء الاصطناعي.

## Stack

- **Monorepo**: pnpm workspaces
- **Node.js**: 24
- **TypeScript**: 5.9
- **API framework**: Express 5
- **Mobile**: Expo SDK 54 + React Native 0.81
- **Navigation**: expo-router v6
- **AI**: OpenRouter (free models) + E2B sandboxes
- **Build**: esbuild (API), EAS Build (APK)

## البنية

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API — يعمل على port 8080
│   ├── vibracode-mobile/   # Expo React Native app
│   └── mockup-sandbox/     # Canvas mockup preview (Vite)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen
│   ├── api-client-react/   # React Query hooks (generated)
│   ├── api-zod/            # Zod schemas (generated)
│   └── db/                 # Drizzle ORM
```

## المفاتيح والتكوين

جميع المفاتيح مضبوطة كمتغيرات بيئة (Shared):

| المتغير | الوصف |
|---------|-------|
| `OPENROUTER_API_KEY` | OpenRouter — AI لجميع النماذج |
| `E2B_API_KEY` | E2B Cloud Sandboxes |
| `ANTHROPIC_API_KEY` | Claude عبر OpenRouter |
| `CLERK_SECRET_KEY` | Clerk authentication |
| `CONVEX_URL` | Convex cloud database |
| `EXPO_PUBLIC_OPENROUTER_KEY` | Mobile app: OpenRouter key |
| `EXPO_PUBLIC_CLERK_KEY` | Mobile app: Clerk key |
| `EXPO_PUBLIC_E2B_KEY` | Mobile app: E2B key |

## بناء APK للأندرويد

```bash
# في مجلد artifacts/vibracode-mobile
# 1. احصل على EXPO_TOKEN من expo.dev/settings/access-tokens
# 2. ثم شغّل:
EXPO_TOKEN=<your-token> npx eas-cli build --platform android --profile preview --non-interactive
```

حساب EAS:
- Owner: `admin44aa`
- Project ID: `b9f6c24a-7ba8-4dde-9847-00d0890a9ee3`
- eas.json: يحتوي على profile `preview` (APK) و `production` (APK)

## النماذج المتاحة (مجانية عبر OpenRouter)

- Gemini 2.5 Flash (Google) — الافتراضي
- Qwen 3 235B (Alibaba)
- DeepSeek R1
- Kimi K2
- Llama 4 Scout (Meta)
- وأكثر من 40 نموذج

## الشاشات

1. **الدردشة** — محادثة كاملة الشاشة مع AI
2. **معاينة** — WebView لمعاينة التطبيقات المبنية
3. **المتجر** — متجر الوكلاء AI
4. **المهارات** — قوالب مهارات مبرمجة مسبقاً

## الإصلاحات المطبقة (آخر تحديث)

- ✅ المحادثة ممتدة على كامل الشاشة (شريط التنقل عائم)
- ✅ إصلاح خطأ TypeScript في ChatScreen.tsx
- ✅ إصلاح تحذير `pointerEvents` deprecated
- ✅ إضافة جميع مفاتيح API كمتغيرات بيئة
- ✅ ملفات `.env` للتطبيق والخادم
- ✅ تكوين eas.json للأندرويد APK
- ✅ التطبيق يستخدم Expo Go الحقيقي (لا محاكي)
