import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

export interface GithubAgent {
  id: string;
  name: string;
  displayName: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  url: string;
  installCmd: string;
  category: "coding" | "reasoning" | "multimodal" | "agent" | "tool";
  author: string;
  version: string;
  badge: string;
  color: string;
  icon: string;
  installed: boolean;
  updateAvailable: boolean;
  lastChecked?: number;
}

const MARKETPLACE_KEY = "vibracode_marketplace_v1";
const UPDATE_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

const CURATED_AGENTS: Omit<GithubAgent, "installed" | "updateAvailable" | "lastChecked">[] = [
  {
    id: "claude-code",
    name: "anthropic/claude-code",
    displayName: "Claude Code",
    description: "Anthropic's official coding agent. Builds, edits, and debugs full apps inside a real sandbox.",
    stars: 12400,
    forks: 890,
    language: "TypeScript",
    url: "https://github.com/anthropics/claude-code",
    installCmd: "npm install -g @anthropic-ai/claude-code",
    category: "coding",
    author: "Anthropic",
    version: "1.0.17",
    badge: "Official",
    color: "#A855F7",
    icon: "cpu",
  },
  {
    id: "openai-codex",
    name: "openai/codex",
    displayName: "Codex CLI",
    description: "OpenAI's terminal-native coding agent. Runs shell commands, writes and patches code autonomously.",
    stars: 34200,
    forks: 2100,
    language: "TypeScript",
    url: "https://github.com/openai/codex",
    installCmd: "npm install -g @openai/codex",
    category: "coding",
    author: "OpenAI",
    version: "0.1.2504",
    badge: "Official",
    color: "#10B981",
    icon: "terminal",
  },
  {
    id: "openclaw",
    name: "openclaw/openclaw",
    displayName: "OpenClaw",
    description: "Open-source multi-agent coding framework. Orchestrates multiple AI models for complex tasks.",
    stars: 5800,
    forks: 420,
    language: "TypeScript",
    url: "https://github.com/openclaw/openclaw",
    installCmd: "npm install -g openclaw",
    category: "agent",
    author: "OpenClaw",
    version: "2.1.0",
    badge: "Free",
    color: "#F43F5E",
    icon: "git-branch",
  },
  {
    id: "aider",
    name: "paul-gauthier/aider",
    displayName: "Aider",
    description: "AI pair programming in your terminal. Edit code in your local git repo with GPT-4, Claude & more.",
    stars: 22100,
    forks: 1980,
    language: "Python",
    url: "https://github.com/paul-gauthier/aider",
    installCmd: "pip install aider-chat",
    category: "coding",
    author: "Paul Gauthier",
    version: "0.82.0",
    badge: "Popular",
    color: "#3B82F6",
    icon: "edit-3",
  },
  {
    id: "continue",
    name: "continuedev/continue",
    displayName: "Continue",
    description: "Open-source VS Code extension for AI coding assistance. Connects to any LLM.",
    stars: 18700,
    forks: 1420,
    language: "TypeScript",
    url: "https://github.com/continuedev/continue",
    installCmd: "npm install -g @continuedev/continue-cli",
    category: "tool",
    author: "Continue Dev",
    version: "1.0.3",
    badge: "VS Code",
    color: "#06B6D4",
    icon: "code",
  },
  {
    id: "gpt-pilot",
    name: "Pythagora-io/gpt-pilot",
    displayName: "GPT Pilot",
    description: "AI developer that writes scalable apps from scratch while you supervise the implementation.",
    stars: 31600,
    forks: 3100,
    language: "Python",
    url: "https://github.com/Pythagora-io/gpt-pilot",
    installCmd: "pip install gpt-pilot",
    category: "agent",
    author: "Pythagora",
    version: "0.3.2",
    badge: "Trending",
    color: "#F59E0B",
    icon: "zap",
  },
  {
    id: "swe-agent",
    name: "princeton-nlp/SWE-agent",
    displayName: "SWE-Agent",
    description: "Princeton's AI software engineering agent. Solves real GitHub issues autonomously.",
    stars: 14300,
    forks: 1600,
    language: "Python",
    url: "https://github.com/princeton-nlp/SWE-agent",
    installCmd: "pip install sweagent",
    category: "agent",
    author: "Princeton NLP",
    version: "1.0.0",
    badge: "Research",
    color: "#EF4444",
    icon: "layers",
  },
  {
    id: "devin-clone",
    name: "stitionai/devika",
    displayName: "Devika",
    description: "Open-source Devin alternative. AI software engineer that understands high-level instructions.",
    stars: 19800,
    forks: 2400,
    language: "Python",
    url: "https://github.com/stitionai/devika",
    installCmd: "pip install devika",
    category: "agent",
    author: "Stition AI",
    version: "1.0.0",
    badge: "Devin Alt",
    color: "#8B5CF6",
    icon: "user",
  },
  {
    id: "open-interpreter",
    name: "KillianLucas/open-interpreter",
    displayName: "Open Interpreter",
    description: "Local code interpreter. Lets LLMs run code on your machine. Executes Python, JS, Shell & more.",
    stars: 57200,
    forks: 5100,
    language: "Python",
    url: "https://github.com/KillianLucas/open-interpreter",
    installCmd: "pip install open-interpreter",
    category: "tool",
    author: "Killian Lucas",
    version: "0.3.8",
    badge: "Most Stars",
    color: "#22C55E",
    icon: "play",
  },
  {
    id: "autogen",
    name: "microsoft/autogen",
    displayName: "AutoGen",
    description: "Microsoft's framework for building multi-agent AI systems. Agents collaborate to solve tasks.",
    stars: 43500,
    forks: 6200,
    language: "Python",
    url: "https://github.com/microsoft/autogen",
    installCmd: "pip install pyautogen",
    category: "agent",
    author: "Microsoft",
    version: "0.2.38",
    badge: "Microsoft",
    color: "#0EA5E9",
    icon: "users",
  },
  {
    id: "crewai",
    name: "joaomdmoura/crewAI",
    displayName: "CrewAI",
    description: "Role-based multi-agent orchestration framework. Agents work as a crew to accomplish tasks.",
    stars: 28900,
    forks: 3900,
    language: "Python",
    url: "https://github.com/joaomdmoura/crewAI",
    installCmd: "pip install crewai",
    category: "agent",
    author: "João Moura",
    version: "0.80.0",
    badge: "Trending",
    color: "#F97316",
    icon: "briefcase",
  },
  {
    id: "langchain",
    name: "langchain-ai/langchain",
    displayName: "LangChain",
    description: "Framework for building LLM-powered applications with chains, agents, and memory.",
    stars: 95100,
    forks: 15800,
    language: "Python",
    url: "https://github.com/langchain-ai/langchain",
    installCmd: "pip install langchain",
    category: "tool",
    author: "LangChain AI",
    version: "0.3.25",
    badge: "95K ⭐",
    color: "#76C442",
    icon: "link",
  },
  {
    id: "goose",
    name: "square/goose",
    displayName: "Goose",
    description: "Block's open-source developer agent. Automates coding tasks using any LLM provider.",
    stars: 11200,
    forks: 890,
    language: "Rust",
    url: "https://github.com/square/goose",
    installCmd: "pip install goose-ai",
    category: "coding",
    author: "Block (Square)",
    version: "1.0.20",
    badge: "Rust",
    color: "#EC4899",
    icon: "feather",
  },
  {
    id: "void",
    name: "voideditor/void",
    displayName: "Void",
    description: "Open-source Cursor alternative. AI-powered code editor built on VS Code.",
    stars: 15600,
    forks: 1100,
    language: "TypeScript",
    url: "https://github.com/voideditor/void",
    installCmd: "npx void-install",
    category: "tool",
    author: "Void Editor",
    version: "0.2.0",
    badge: "Cursor Alt",
    color: "#6C47FF",
    icon: "box",
  },
];

async function fetchGithubStars(repoName: string): Promise<{ stars: number; forks: number } | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${repoName}`, {
      headers: { "Accept": "application/vnd.github.v3+json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { stars: data.stargazers_count ?? 0, forks: data.forks_count ?? 0 };
  } catch {
    return null;
  }
}

export function useMarketplace() {
  const [agents, setAgents] = useState<GithubAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [installing, setInstalling] = useState<Set<string>>(new Set());

  const load = useCallback(async (fetchLive = false) => {
    try {
      const raw = await AsyncStorage.getItem(MARKETPLACE_KEY);
      const saved: Record<string, { installed: boolean; version: string; stars?: number; forks?: number; fetchedAt?: number }> = raw
        ? JSON.parse(raw)
        : {};

      const now = Date.now();
      const merged: GithubAgent[] = CURATED_AGENTS.map((agent) => {
        const savedAgent = saved[agent.id];
        return {
          ...agent,
          stars: savedAgent?.stars ?? agent.stars,
          forks: savedAgent?.forks ?? agent.forks,
          installed: savedAgent?.installed ?? false,
          updateAvailable: savedAgent?.installed
            ? savedAgent.version !== agent.version
            : false,
          lastChecked: now,
        };
      });

      setAgents(merged);

      // Fetch live star counts from GitHub (non-blocking, updates in background)
      if (fetchLive) {
        const cacheAge = 60 * 60 * 1000; // 1 hour cache
        const toFetch = CURATED_AGENTS.filter(a => {
          const s = saved[a.id];
          return !s?.fetchedAt || now - s.fetchedAt > cacheAge;
        }).slice(0, 5); // Max 5 at a time to avoid rate limits

        if (toFetch.length > 0) {
          const results = await Promise.allSettled(
            toFetch.map(async (agent) => {
              const gh = await fetchGithubStars(agent.name);
              return { id: agent.id, gh };
            })
          );

          const updatedSaved = { ...saved };
          results.forEach((r) => {
            if (r.status === "fulfilled" && r.value.gh) {
              const { id, gh } = r.value;
              if (!updatedSaved[id]) updatedSaved[id] = { installed: false, version: "" };
              updatedSaved[id].stars = gh.stars;
              updatedSaved[id].forks = gh.forks;
              updatedSaved[id].fetchedAt = now;
            }
          });

          await AsyncStorage.setItem(MARKETPLACE_KEY, JSON.stringify(updatedSaved)).catch(() => {});

          // Update UI with live data
          setAgents((prev) =>
            prev.map((agent) => {
              const s = updatedSaved[agent.id];
              return s?.stars ? { ...agent, stars: s.stars, forks: s.forks ?? agent.forks } : agent;
            })
          );
        }
      }
    } catch {
      setAgents(
        CURATED_AGENTS.map((a) => ({ ...a, installed: false, updateAvailable: false }))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load(true); // fetch live GitHub data on manual refresh
    setRefreshing(false);
  }, [load]);

  const toggleInstall = useCallback(
    async (agentId: string) => {
      setInstalling((prev) => new Set(prev).add(agentId));

      try {
        // Read persisted state and determine new install status
        const raw = await AsyncStorage.getItem(MARKETPLACE_KEY).catch(() => "{}");
        const saved: Record<string, { installed: boolean; version: string; stars?: number; forks?: number; fetchedAt?: number }> = JSON.parse(raw ?? "{}");
        const agent = agents.find((a) => a.id === agentId);
        if (agent) {
          const nowInstalled = !agent.installed;
          saved[agentId] = { ...saved[agentId], installed: nowInstalled, version: agent.version };
          await AsyncStorage.setItem(MARKETPLACE_KEY, JSON.stringify(saved)).catch(() => {});
        }

        setAgents((prev) =>
          prev.map((a) =>
            a.id === agentId
              ? { ...a, installed: !a.installed, updateAvailable: false }
              : a
          )
        );
      } finally {
        setInstalling((prev) => {
          const next = new Set(prev);
          next.delete(agentId);
          return next;
        });
      }
    },
    [agents]
  );

  const updateAgent = useCallback(
    async (agentId: string) => {
      await toggleInstall(agentId);
      setAgents((prev) =>
        prev.map((a) =>
          a.id === agentId ? { ...a, installed: true, updateAvailable: false } : a
        )
      );
    },
    [toggleInstall]
  );

  useEffect(() => {
    load(true); // fetch live GitHub stars on mount
    const timer = setInterval(() => {
      load(true);
    }, UPDATE_INTERVAL);
    return () => clearInterval(timer);
  }, [load]);

  const installedCount = agents.filter((a) => a.installed).length;
  const updatesCount = agents.filter((a) => a.updateAvailable).length;

  return {
    agents,
    loading,
    refreshing,
    installing,
    installedCount,
    updatesCount,
    refresh,
    toggleInstall,
    updateAgent,
  };
}
