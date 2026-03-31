FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# ── All API Keys ─────────────────────────────────────────────────────────────
ENV OPENROUTER_API_KEY=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
ENV ANTHROPIC_BASE_URL=https://openrouter.ai/api
ENV ANTHROPIC_AUTH_TOKEN=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
ENV ANTHROPIC_API_KEY=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
ENV JUNIE_OPENROUTER_API_KEY=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
ENV E2B_API_KEY=e2b_51e98476ce3cdfff4768678430d5527df28b169a
ENV CONVEX_URL=https://astute-ladybug-398.convex.cloud
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bWVhc3VyZWQtYWlyZWRhbGUtNjEuY2xlcmsuYWNjb3VudHMuZGV2JA

# ── System Dependencies ───────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y \
  curl git wget unzip build-essential \
  python3 python3-pip ca-certificates gnupg \
  && rm -rf /var/lib/apt/lists/*

# ── Node.js 20 ───────────────────────────────────────────────────────────────
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y nodejs \
  && npm install -g npm@latest

# ── AI Agent CLIs ─────────────────────────────────────────────────────────────

# 1. Claude Code CLI (uses ANTHROPIC_API_KEY → OpenRouter)
RUN npm install -g @anthropic-ai/claude-code

# 2. Codex CLI (uses OPENROUTER_API_KEY)
RUN npm install -g @openai/codex

# 3. OpenClaw (multi-agent via OpenRouter)
RUN npm install -g openclaw

# 4. EAS CLI (Publish to App Store / Google Play)
RUN npm install -g eas-cli

# 5. Expo CLI
RUN npm install -g expo-cli @expo/ngrok

# ── Codex Config (OpenRouter backend) ────────────────────────────────────────
RUN mkdir -p /root/.codex && cat > /root/.codex/config.toml << 'EOF'
model_provider = "openrouter"
model_reasoning_effort = "high"
model = "qwen/qwen-2.5-coder-32b:free"

[model_providers.openrouter]
name = "openrouter"
base_url = "https://openrouter.ai/api/v1"
env_key = "OPENROUTER_API_KEY"
EOF

# ── OpenClaw Config ───────────────────────────────────────────────────────────
RUN mkdir -p /root/.openclaw && cat > /root/.openclaw/openclaw.json << 'EOF'
{
  "env": {
    "OPENROUTER_API_KEY": "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"
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "openrouter/openrouter/auto",
        "fallbacks": ["openrouter/qwen/qwen-2.5-coder-32b"]
      },
      "models": {
        "openrouter/openrouter/auto": {},
        "openrouter/qwen/qwen-2.5-coder-32b": {}
      }
    }
  }
}
EOF

# ── Junie CLI ─────────────────────────────────────────────────────────────────
RUN curl -fsSL https://junie.jetbrains.com/install.sh | bash || true

# ── Global Shell ENV ──────────────────────────────────────────────────────────
RUN cat >> /root/.bashrc << 'EOF'
export OPENROUTER_API_KEY="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"
export ANTHROPIC_BASE_URL="https://openrouter.ai/api"
export ANTHROPIC_AUTH_TOKEN="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"
export ANTHROPIC_API_KEY="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"
export JUNIE_OPENROUTER_API_KEY="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"
EOF

WORKDIR /home/user
RUN mkdir -p /home/user/project
