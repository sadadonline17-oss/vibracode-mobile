export interface Skill {
  id:           string;
  name:         string;
  icon:         string;
  category:     SkillCategory;
  description:  string;
  prompt:       string;
  tools?:       string[];
  integrations?: string[];
  example:      string;
  trigger?:     string;
}

export type SkillCategory =
  | 'mobile'   | 'web'       | 'backend'
  | 'ai'       | 'database'  | 'payments'
  | 'auth'     | 'deploy'    | 'testing'
  | 'design'   | 'data'      | 'devops'
  | 'search'   | 'security'  | 'productivity';

export const SKILLS: Skill[] = [

  // ── MOBILE ─────────────────────────────────────────────────────────────────
  {
    id: 'expo-app',
    name: 'Expo React Native App',
    icon: '📱',
    category: 'mobile',
    description: 'تطبيق موبايل كامل بـ Expo + React Native',
    trigger: 'expo react native mobile app',
    prompt: `You are building a React Native app with Expo SDK 52.
Rules:
- Use expo-router for navigation
- Use NativeWind for styling (Tailwind)
- Support dark/light mode
- Include proper TypeScript types
- Use react-query for data fetching
- Add proper error boundaries
- Start dev server on port 8081
When done, run: npx expo start --port 8081 --non-interactive`,
    tools: ['expo-router', 'nativewind', 'react-query'],
    integrations: ['expo-go'],
    example: 'Build a todo app with offline sync',
  },
  {
    id: 'react-native-ui',
    name: 'React Native UI Kit',
    icon: '🎨',
    category: 'mobile',
    description: 'واجهة مستخدم احترافية',
    trigger: 'react native ui components animations gestures',
    prompt: `Create beautiful React Native UI components.
Use: @shopify/restyle for theming, react-native-reanimated for animations, react-native-gesture-handler for gestures.
All components must be accessible (aria labels, roles).
Include dark mode support via useColorScheme.`,
    tools: ['restyle', 'reanimated', 'gesture-handler'],
    example: 'Build an animated card swiper',
  },

  // ── WEB ────────────────────────────────────────────────────────────────────
  {
    id: 'nextjs-app',
    name: 'Next.js 15 App',
    icon: '▲',
    category: 'web',
    description: 'تطبيق Next.js 15 مع App Router',
    trigger: 'nextjs next.js website webapp saas landing page',
    prompt: `Build a Next.js 15 application.
Rules:
- Use App Router (not Pages Router)
- TypeScript strict mode
- Tailwind CSS v4
- shadcn/ui components
- Server Components by default, Client Components only when needed
- After installing, run: npx next dev --port 3000
Do NOT use: getServerSideProps, getStaticProps (deprecated)`,
    tools: ['next15', 'tailwind4', 'shadcn'],
    example: 'Build a SaaS landing page',
  },
  {
    id: 'vite-react',
    name: 'Vite + React SPA',
    icon: '⚡',
    category: 'web',
    description: 'Single Page App سريع',
    trigger: 'vite react spa dashboard single page',
    prompt: `Build a Vite + React 18 SPA.
Setup: npm create vite@latest app -- --template react-ts
cd app && npm install && npm install tailwindcss @tailwindcss/vite
Run dev server: npm run dev -- --host 0.0.0.0 --port 5173
Use: Zustand for state, react-router-dom v6, Tailwind CSS`,
    tools: ['vite', 'zustand', 'react-router'],
    example: 'Build a dashboard with charts',
  },
  {
    id: 'astro-site',
    name: 'Astro Static Site',
    icon: '🚀',
    category: 'web',
    description: 'موقع سريع بـ Astro',
    trigger: 'astro static site portfolio blog',
    prompt: `Build an Astro 5 static site.
npm create astro@latest app -- --template minimal --typescript strict --no-install
cd app && npm install
Run: npm run dev -- --host 0.0.0.0 --port 4321
Use: Astro Islands for interactive components, Tailwind CSS integration`,
    tools: ['astro5', 'tailwind'],
    example: 'Build a portfolio site',
  },

  // ── BACKEND ────────────────────────────────────────────────────────────────
  {
    id: 'express-api',
    name: 'Express.js REST API',
    icon: '🛠️',
    category: 'backend',
    description: 'REST API كامل بـ Express',
    trigger: 'express api rest backend server node',
    prompt: `Build a production Express.js REST API.
Stack: Express 5, TypeScript, Zod validation, JWT auth
Structure: routes/ controllers/ middleware/ models/
Include: rate limiting, CORS, helmet, morgan
Run on port 3000: node dist/index.js`,
    tools: ['express5', 'zod', 'jwt', 'helmet'],
    example: 'Build a CRUD API for products',
  },
  {
    id: 'fastapi',
    name: 'FastAPI Python Backend',
    icon: '🐍',
    category: 'backend',
    description: 'API Python سريع',
    trigger: 'fastapi python backend api ml',
    prompt: `Build a FastAPI backend.
pip install fastapi uvicorn sqlalchemy pydantic
Run: uvicorn main:app --host 0.0.0.0 --port 8000
Include: Pydantic models, SQLAlchemy ORM, JWT auth, CORS middleware`,
    tools: ['fastapi', 'sqlalchemy', 'pydantic'],
    example: 'Build an ML model serving API',
  },

  // ── DATABASE ────────────────────────────────────────────────────────────────
  {
    id: 'supabase',
    name: 'Supabase Integration',
    icon: '🗄️',
    category: 'database',
    description: 'قاعدة بيانات + Auth + Storage',
    trigger: 'supabase database realtime auth storage postgres',
    prompt: `Integrate Supabase into the project.
npm install @supabase/supabase-js
Use: createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
Features to implement:
- Real-time subscriptions: supabase.channel().on('postgres_changes'...)
- Auth: supabase.auth.signInWithOAuth, signUp, signOut
- Storage: supabase.storage.from('bucket').upload()
- Row Level Security policies
Put env vars in .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY`,
    tools: ['supabase-js'],
    integrations: ['supabase'],
    example: 'Add real-time chat with user auth',
  },
  {
    id: 'prisma',
    name: 'Prisma ORM',
    icon: '🔷',
    category: 'database',
    description: 'ORM مع type-safety كاملة',
    trigger: 'prisma orm database schema models relations',
    prompt: `Set up Prisma ORM.
npm install prisma @prisma/client
npx prisma init
Create schema.prisma with proper models.
Run: npx prisma generate && npx prisma db push
Use: PrismaClient for all DB operations, include proper relations`,
    tools: ['prisma'],
    example: 'Set up User + Post + Comment schema',
  },
  {
    id: 'drizzle',
    name: 'Drizzle ORM',
    icon: '💧',
    category: 'database',
    description: 'ORM خفيف مع TypeScript',
    trigger: 'drizzle orm sqlite postgresql typescript',
    prompt: `Set up Drizzle ORM with SQLite/PostgreSQL.
npm install drizzle-orm drizzle-kit better-sqlite3
Create: db/schema.ts, db/index.ts
Run migrations: npx drizzle-kit push
Use Drizzle for all queries — no raw SQL`,
    tools: ['drizzle-orm'],
    example: 'Create a blog database schema',
  },

  // ── PAYMENTS ────────────────────────────────────────────────────────────────
  {
    id: 'stripe',
    name: 'Stripe Payments',
    icon: '💳',
    category: 'payments',
    description: 'مدفوعات حقيقية بـ Stripe',
    trigger: 'stripe payment checkout subscription billing',
    prompt: `Integrate Stripe payments.
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
Backend: Use Stripe secret key from env STRIPE_SECRET_KEY
Frontend: Use publishable key NEXT_PUBLIC_STRIPE_KEY
Implement:
1. /api/create-payment-intent route
2. PaymentElement component
3. Webhook handler at /api/stripe-webhook
4. Test with card: 4242 4242 4242 4242`,
    tools: ['stripe'],
    integrations: ['stripe'],
    example: 'Add one-time payment and subscription',
  },
  {
    id: 'polar',
    name: 'Polar Payments',
    icon: '🧊',
    category: 'payments',
    description: 'Polar للمدفوعات مفتوحة المصدر',
    trigger: 'polar payments open source saas billing',
    prompt: `Integrate Polar payments (open source alternative to Stripe).
npm install @polar-sh/sdk
Use: PolarEmbedCheckout component
Set env: POLAR_ACCESS_TOKEN, POLAR_WEBHOOK_SECRET
Implement checkout + webhook + subscription status`,
    tools: ['polar-sdk'],
    example: 'Add SaaS subscription billing',
  },

  // ── AUTH ───────────────────────────────────────────────────────────────────
  {
    id: 'clerk-auth',
    name: 'Clerk Authentication',
    icon: '🔐',
    category: 'auth',
    description: 'Auth جاهز مع Clerk',
    trigger: 'clerk auth authentication login signup oauth social',
    prompt: `Integrate Clerk authentication.
npm install @clerk/nextjs (or @clerk/clerk-react)
Wrap app in <ClerkProvider publishableKey={NEXT_PUBLIC_CLERK_KEY}>
Use: <SignIn/>, <SignUp/>, <UserButton/>
Protect routes with: auth().protect() or middleware
Get user: const { user } = useUser()
Env: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY`,
    tools: ['clerk'],
    integrations: ['clerk'],
    example: 'Add Google + GitHub login',
  },
  {
    id: 'better-auth',
    name: 'Better Auth',
    icon: '🔑',
    category: 'auth',
    description: 'Auth مفتوح المصدر',
    trigger: 'better-auth open source authentication email oauth',
    prompt: `Set up Better Auth (open source).
npm install better-auth
Create: auth.ts with betterAuth({ database, socialProviders: { github, google } })
Mount handler at /api/auth/[...all]
Client: import { useSession } from "@/lib/auth-client"`,
    tools: ['better-auth'],
    example: 'Email + OAuth authentication',
  },

  // ── AI ─────────────────────────────────────────────────────────────────────
  {
    id: 'vercel-ai',
    name: 'Vercel AI SDK',
    icon: '🤖',
    category: 'ai',
    description: 'AI streaming في التطبيق',
    trigger: 'vercel ai sdk streaming chatbot llm openai anthropic',
    prompt: `Integrate Vercel AI SDK.
npm install ai @ai-sdk/anthropic @ai-sdk/openai
For streaming: use streamText() with OpenAI/Anthropic provider
For UI: useChat() hook → auto-handles streaming state
For tools: use tools parameter with Zod schema
For structured output: use generateObject() with schema`,
    tools: ['ai-sdk'],
    example: 'Add AI chatbot with streaming',
  },
  {
    id: 'langchain',
    name: 'LangChain / LangGraph',
    icon: '🦜',
    category: 'ai',
    description: 'AI Agents و Chains',
    trigger: 'langchain langgraph agent rag chain llm',
    prompt: `Build with LangChain.js.
npm install langchain @langchain/anthropic @langchain/openai
Use: ChatAnthropic or ChatOpenAI
For agents: use createReactAgent from langgraph
For RAG: use RecursiveCharacterTextSplitter + MemoryVectorStore`,
    tools: ['langchain', 'langgraph'],
    example: 'Build a RAG document Q&A system',
  },

  // ── DEPLOY ─────────────────────────────────────────────────────────────────
  {
    id: 'docker',
    name: 'Docker + Deploy',
    icon: '🐳',
    category: 'deploy',
    description: 'تغليف التطبيق بـ Docker',
    trigger: 'docker containerize dockerfile compose deploy',
    prompt: `Create production Docker setup.
Generate:
1. Dockerfile (multi-stage: builder → runner)
2. .dockerignore
3. docker-compose.yml with: app, postgres, redis services
4. Makefile with: make dev, make build, make push
Use: node:22-alpine base image for small size`,
    tools: ['docker'],
    example: 'Dockerize a Node.js app',
  },
  {
    id: 'github-actions',
    name: 'GitHub Actions CI/CD',
    icon: '⚙️',
    category: 'deploy',
    description: 'CI/CD تلقائي',
    trigger: 'github actions ci cd pipeline deploy automation',
    prompt: `Create GitHub Actions workflows.
.github/workflows/ci.yml: lint + test + build on PR
.github/workflows/deploy.yml: deploy on push to main
Include: secrets management, caching node_modules, matrix testing`,
    tools: ['github-actions'],
    integrations: ['github'],
    example: 'Auto-deploy to Vercel on push',
  },

  // ── TESTING ────────────────────────────────────────────────────────────────
  {
    id: 'playwright',
    name: 'Playwright E2E Tests',
    icon: '🎭',
    category: 'testing',
    description: 'اختبارات End-to-End حقيقية',
    trigger: 'playwright e2e testing end to end browser test',
    prompt: `Set up Playwright for E2E testing.
npm install -D @playwright/test
npx playwright install --with-deps chromium
Write tests in: tests/*.spec.ts
Use: page.goto(), page.locator(), expect(page)
Run headed: npx playwright test --headed
Record tests: npx playwright codegen http://localhost:3000`,
    tools: ['playwright'],
    example: 'Test login + checkout flow',
  },
  {
    id: 'vitest',
    name: 'Vitest Unit Tests',
    icon: '✅',
    category: 'testing',
    description: 'اختبارات الوحدة السريعة',
    trigger: 'vitest unit test jest testing react component',
    prompt: `Set up Vitest for unit testing.
npm install -D vitest @testing-library/react @testing-library/user-event jsdom
Create vitest.config.ts with jsdom environment
Write tests in: src/**/*.test.ts
Run: npx vitest --coverage`,
    tools: ['vitest', 'testing-library'],
    example: 'Test React components and hooks',
  },

  // ── DATA ───────────────────────────────────────────────────────────────────
  {
    id: 'data-viz',
    name: 'Charts & Data Viz',
    icon: '📊',
    category: 'data',
    description: 'رسوم بيانية تفاعلية',
    trigger: 'charts data visualization dashboard analytics recharts',
    prompt: `Build interactive data visualizations.
npm install recharts (or chart.js react-chartjs-2)
For React Native: npm install react-native-gifted-charts victory-native
Create reusable chart components: LineChart, BarChart, PieChart
Support: real-time data updates, animations, dark mode`,
    tools: ['recharts', 'victory-native'],
    example: 'Build analytics dashboard',
  },

  // ── DESIGN ────────────────────────────────────────────────────────────────
  {
    id: 'shadcn',
    name: 'shadcn/ui Components',
    icon: '🪄',
    category: 'design',
    description: 'مكوّنات UI جاهزة',
    trigger: 'shadcn ui components tailwind design system',
    prompt: `Use shadcn/ui components.
npx shadcn@latest init
npx shadcn@latest add button card dialog form input table sheet
All components in: components/ui/
Customize theme in: tailwind.config.ts
Dark mode: use class strategy with next-themes`,
    tools: ['shadcn'],
    example: 'Add a modal form with validation',
  },

  // ── DEVOPS ────────────────────────────────────────────────────────────────
  {
    id: 'tdd',
    name: 'Test-Driven Development',
    icon: '🧪',
    category: 'testing',
    description: 'Write tests first, then implement code',
    trigger: 'tdd test driven development write tests first',
    prompt: `Implement features using strict TDD — write failing tests first, then make them pass.
Rules:
1. NEVER write implementation before writing a failing test
2. Write the MINIMAL code to make the test pass
3. Refactor after green
4. Each test must have a single assertion
Cycle: RED → GREEN → REFACTOR
Test naming: it('should <action> when <condition>', ...)
When done, run: npm test -- --coverage and report % coverage`,
    tools: ['vitest', 'jest'],
    example: 'Build user auth with TDD',
  },
  {
    id: 'security-audit',
    name: 'Security Audit',
    icon: '🛡️',
    category: 'security',
    description: 'Scan for OWASP Top 10 vulnerabilities',
    trigger: 'security audit owasp vulnerabilities scan',
    prompt: `Run a full security audit against OWASP Top 10.
Check:
- A01 Broken Access Control: auth on every route, RLS in DB, IDOR
- A02 Cryptographic Failures: secrets in .env, bcrypt passwords, HTTPS
- A03 Injection: parameterized queries, sanitize HTML, no exec() with user input
- A05 Security Misconfiguration: CORS not *, helmet.js, no stack traces in prod
- A09 Logging: never log passwords/tokens/PII
Output: SECURITY_REPORT.md with findings + severity + fix`,
    tools: ['helmet', 'zod'],
    example: 'Audit an Express API for security issues',
  },
  {
    id: 'rag-builder',
    name: 'RAG System Builder',
    icon: '🔍',
    category: 'ai',
    description: 'Build Retrieval-Augmented Generation systems',
    trigger: 'rag retrieval augmented generation vector search document qa knowledge base',
    prompt: `Build production RAG systems with vector search.
npm install langchain @langchain/openai @langchain/community chromadb
Pipeline: Documents → Chunk → Embed → Store → Query → Retrieve → Generate
Use RecursiveCharacterTextSplitter (chunkSize: 1000, chunkOverlap: 200)
Vector store: Chroma or Pinecone
Quality: HyDE for query expansion, Cohere Rerank, parent-child chunking`,
    tools: ['langchain', 'chromadb'],
    example: 'Build a document Q&A system',
  },
];

// ── Auto-detect skills from prompt text ─────────────────────────────────────
export function detectSkills(prompt: string): Skill[] {
  const p = prompt.toLowerCase();
  return SKILLS.filter(skill => {
    const keywords = [
      skill.id,
      skill.name.toLowerCase(),
      ...(skill.tools ?? []),
      ...(skill.trigger?.split(' ') ?? []),
    ];
    return keywords.some(k => p.includes(k.toLowerCase()));
  });
}

export function getSkillById(id: string): Skill | undefined {
  return SKILLS.find(s => s.id === id);
}

export function getSkillsByCategory(category: SkillCategory): Skill[] {
  return SKILLS.filter(s => s.category === category);
}
