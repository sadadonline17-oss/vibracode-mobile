export interface Integration {
  id:          string;
  name:        string;
  icon:        string;
  category:    string;
  description: string;
  envVars:     string[];
  mcpServer?:  string;
  setupCmd?:   string;
  testCmd?:    string;
  configFile?: { path: string; content: string };
}

export const INTEGRATIONS: Integration[] = [

  // ── VERSION CONTROL ───────────────────────────────────────────────────────
  {
    id: 'github',
    name: 'GitHub',
    icon: '🐙',
    category: 'vcs',
    description: 'Clone repos, create PRs, manage issues',
    envVars: ['GITHUB_TOKEN'],
    mcpServer: 'npx -y @modelcontextprotocol/server-github',
    setupCmd: 'git config user.email "agent@vibcode.app" && git config user.name "VibraCode Agent"',
    testCmd: 'curl -s -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/user | head -c 100',
    configFile: {
      path: '.claude/mcp.json',
      content: '{"mcpServers":{"github":{"command":"npx","args":["-y","@modelcontextprotocol/server-github"],"env":{"GITHUB_PERSONAL_ACCESS_TOKEN":"$GITHUB_TOKEN"}}}}',
    },
  },

  // ── DATABASE HOSTING ───────────────────────────────────────────────────────
  {
    id: 'supabase',
    name: 'Supabase',
    icon: '🗄️',
    category: 'database',
    description: 'PostgreSQL + Auth + Storage + Realtime',
    envVars: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY'],
    mcpServer: 'npx -y @supabase/mcp-server-supabase',
    testCmd: 'curl -s "$SUPABASE_URL/rest/v1/" -H "apikey: $SUPABASE_ANON_KEY" | head -c 100',
  },
  {
    id: 'neon',
    name: 'Neon PostgreSQL',
    icon: '🌿',
    category: 'database',
    description: 'Serverless PostgreSQL',
    envVars: ['DATABASE_URL'],
    setupCmd: 'npm install @neondatabase/serverless',
  },
  {
    id: 'planetscale',
    name: 'PlanetScale',
    icon: '🪐',
    category: 'database',
    description: 'MySQL Serverless',
    envVars: ['PLANETSCALE_HOST', 'PLANETSCALE_USERNAME', 'PLANETSCALE_PASSWORD'],
    setupCmd: 'npm install @planetscale/database',
  },
  {
    id: 'mongodb',
    name: 'MongoDB Atlas',
    icon: '🍃',
    category: 'database',
    description: 'Document database',
    envVars: ['MONGODB_URI'],
    setupCmd: 'npm install mongodb mongoose',
  },
  {
    id: 'redis',
    name: 'Redis / Upstash',
    icon: '⚡',
    category: 'database',
    description: 'Cache + Queue + Rate limiting',
    envVars: ['REDIS_URL', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
    setupCmd: 'npm install ioredis @upstash/redis',
  },

  // ── PAYMENTS ──────────────────────────────────────────────────────────────
  {
    id: 'stripe',
    name: 'Stripe',
    icon: '💳',
    category: 'payments',
    description: 'Payments, subscriptions, invoices',
    envVars: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'NEXT_PUBLIC_STRIPE_KEY'],
    mcpServer: 'npx -y @stripe/agent-toolkit',
    testCmd: 'curl -s https://api.stripe.com/v1/products -u "$STRIPE_SECRET_KEY:" | head -c 100',
  },
  {
    id: 'lemonsqueezy',
    name: 'Lemon Squeezy',
    icon: '🍋',
    category: 'payments',
    description: 'Digital products + subscriptions',
    envVars: ['LEMONSQUEEZY_API_KEY', 'LEMONSQUEEZY_WEBHOOK_SECRET'],
    setupCmd: 'npm install @lemonsqueezy/lemonsqueezy.js',
  },

  // ── AUTH PROVIDERS ─────────────────────────────────────────────────────────
  {
    id: 'clerk',
    name: 'Clerk',
    icon: '🔐',
    category: 'auth',
    description: 'Auth with social login',
    envVars: ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'],
  },
  {
    id: 'auth0',
    name: 'Auth0',
    icon: '🔒',
    category: 'auth',
    description: 'Enterprise auth',
    envVars: ['AUTH0_DOMAIN', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET'],
    setupCmd: 'npm install @auth0/nextjs-auth0',
  },

  // ── COMMUNICATION ──────────────────────────────────────────────────────────
  {
    id: 'resend',
    name: 'Resend (Email)',
    icon: '📧',
    category: 'communication',
    description: 'Transactional emails with React templates',
    envVars: ['RESEND_API_KEY'],
    setupCmd: 'npm install resend @react-email/components',
  },
  {
    id: 'twilio',
    name: 'Twilio (SMS/Voice)',
    icon: '📱',
    category: 'communication',
    description: 'SMS + WhatsApp + Voice',
    envVars: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'],
    setupCmd: 'npm install twilio',
  },
  {
    id: 'pusher',
    name: 'Pusher (WebSocket)',
    icon: '🔴',
    category: 'communication',
    description: 'Real-time events via WebSocket',
    envVars: ['PUSHER_APP_ID', 'PUSHER_KEY', 'PUSHER_SECRET', 'PUSHER_CLUSTER'],
    setupCmd: 'npm install pusher pusher-js',
  },

  // ── STORAGE ────────────────────────────────────────────────────────────────
  {
    id: 's3',
    name: 'AWS S3 / Cloudflare R2',
    icon: '☁️',
    category: 'storage',
    description: 'File storage + CDN',
    envVars: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'S3_BUCKET_NAME'],
    setupCmd: 'npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner',
  },
  {
    id: 'uploadthing',
    name: 'UploadThing',
    icon: '📤',
    category: 'storage',
    description: 'File upload for Next.js',
    envVars: ['UPLOADTHING_SECRET', 'UPLOADTHING_APP_ID'],
    setupCmd: 'npm install uploadthing @uploadthing/react',
  },

  // ── ANALYTICS ─────────────────────────────────────────────────────────────
  {
    id: 'posthog',
    name: 'PostHog Analytics',
    icon: '📊',
    category: 'analytics',
    description: 'Product analytics + Feature flags',
    envVars: ['NEXT_PUBLIC_POSTHOG_KEY', 'NEXT_PUBLIC_POSTHOG_HOST'],
    setupCmd: 'npm install posthog-js posthog-node',
  },
  {
    id: 'sentry',
    name: 'Sentry Error Tracking',
    icon: '🐛',
    category: 'monitoring',
    description: 'Error tracking + performance',
    envVars: ['SENTRY_DSN', 'SENTRY_ORG', 'SENTRY_PROJECT'],
    setupCmd: 'npx @sentry/wizard@latest -i nextjs',
  },

  // ── SEARCH ────────────────────────────────────────────────────────────────
  {
    id: 'algolia',
    name: 'Algolia Search',
    icon: '🔍',
    category: 'search',
    description: 'Full-text search with instant results',
    envVars: ['ALGOLIA_APP_ID', 'ALGOLIA_ADMIN_KEY', 'NEXT_PUBLIC_ALGOLIA_SEARCH_KEY'],
    setupCmd: 'npm install algoliasearch @algolia/autocomplete-js',
  },

  // ── AI PROVIDERS ──────────────────────────────────────────────────────────
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '🧠',
    category: 'ai',
    description: 'GPT-4o, GPT-4, DALL-E, Whisper',
    envVars: ['OPENAI_API_KEY'],
    setupCmd: 'npm install openai',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    icon: '🤖',
    category: 'ai',
    description: 'Claude 3.5 Sonnet, Haiku',
    envVars: ['ANTHROPIC_API_KEY'],
    setupCmd: 'npm install @anthropic-ai/sdk',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    icon: '🔀',
    category: 'ai',
    description: 'Access 200+ AI models with one API',
    envVars: ['OPENROUTER_API_KEY'],
    setupCmd: 'npm install openai',
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
export function getIntegrationById(id: string): Integration | undefined {
  return INTEGRATIONS.find(i => i.id === id);
}

export function detectIntegrations(prompt: string): Integration[] {
  const p = prompt.toLowerCase();
  return INTEGRATIONS.filter(i =>
    p.includes(i.id) || p.includes(i.name.toLowerCase())
  );
}

export function getAvailableEnvVars(integration: Integration): string[] {
  return integration.envVars.filter(k => !!process.env[k]);
}
