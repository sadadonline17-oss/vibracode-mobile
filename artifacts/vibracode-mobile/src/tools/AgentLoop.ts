import { fetchEventSource } from "react-native-fetch-event-source";
import { executeBashTool } from "./BashTool";
import { TodoTool } from "./TodoTool";
import { CONFIG } from "../config";

export interface AgentTool {
  name: string;
  description: string;
  parameters: object;
}

export const FRUSTRATION_PATTERNS = [
  /not working/i,
  /doesn't work/i,
  /isn't working/i,
  /broken/i,
  /error again/i,
  /still failing/i,
  /still not/i,
  /why isn't/i,
  /frustrated/i,
  /give up/i,
  /same error/i,
  /doesn't fix/i,
  /still broken/i,
  /hopeless/i,
];

export function detectFrustration(message: string): boolean {
  return FRUSTRATION_PATTERNS.some((p) => p.test(message));
}

export const AVAILABLE_TOOLS: AgentTool[] = [
  {
    name: "bash",
    description:
      "Execute a bash command on the server. Use for file operations, running scripts, checking system info.",
    parameters: {
      type: "object",
      properties: {
        command: { type: "string", description: "The bash command to execute" },
        timeout: { type: "number", description: "Timeout in milliseconds (default 30000)" },
      },
      required: ["command"],
    },
  },
  {
    name: "todo_read",
    description: "Read the current todo list for this session.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "todo_write",
    description: "Replace the entire todo list with a new set of todos.",
    parameters: {
      type: "object",
      properties: {
        todos: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              content: { type: "string" },
              status: { type: "string", enum: ["pending", "in_progress", "completed"] },
              priority: { type: "string", enum: ["low", "medium", "high"] },
            },
            required: ["id", "content", "status", "priority"],
          },
        },
      },
      required: ["todos"],
    },
  },
  {
    name: "read_file",
    description: "Read the contents of a file from the server.",
    parameters: {
      type: "object",
      properties: { path: { type: "string", description: "Absolute file path" } },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "Write content to a file on the server.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Absolute file path" },
        content: { type: "string", description: "File content to write" },
      },
      required: ["path", "content"],
    },
  },
];

export type ToolUseCallback = (toolName: string, input: Record<string, unknown>) => void;
export type ToolResultCallback = (toolName: string, result: unknown) => void;

export async function runAgentLoop(
  messages: { role: string; content: string }[],
  apiKey: string,
  onChunk: (text: string) => void,
  onToolUse: ToolUseCallback,
  onToolResult: ToolResultCallback,
  signal?: AbortSignal
): Promise<string> {
  const backendUrl = (CONFIG.BACKEND_URL || "").replace(/\/$/, "");
  let currentMessages = [...messages];
  let fullResponse = "";
  const MAX_ITERATIONS = 10;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const toolCalls: { id: string; name: string; arguments: string }[] = [];
    let assistantText = "";

    await fetchEventSource("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://vibracode.app",
        "X-Title": "VibraCode Agent",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: currentMessages,
        tools: AVAILABLE_TOOLS.map((t) => ({
          type: "function",
          function: { name: t.name, description: t.description, parameters: t.parameters },
        })),
        stream: true,
        max_tokens: 4096,
      }),
      signal,
      async onopen(response) {
        if (!response.ok) {
          const errText = await response.text().catch(() => "");
          throw new Error(`HTTP ${response.status}: ${errText}`);
        }
      },
      onmessage(ev) {
        if (ev.data === "[DONE]") return;
        try {
          const chunk = JSON.parse(ev.data);
          const delta = chunk.choices?.[0]?.delta;
          if (delta?.content) {
            assistantText += delta.content;
            fullResponse += delta.content;
            onChunk(delta.content);
          }
          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const existing = toolCalls.find((c) => c.id === tc.id);
              if (existing) {
                existing.arguments += tc.function?.arguments ?? "";
              } else {
                toolCalls.push({
                  id: tc.id ?? `call_${Date.now()}`,
                  name: tc.function?.name ?? "",
                  arguments: tc.function?.arguments ?? "",
                });
              }
            }
          }
        } catch {}
      },
      onerror(err) {
        throw err;
      },
    });

    if (toolCalls.length === 0) break;

    const toolResults: { role: string; content: string; tool_call_id: string }[] = [];

    for (const tc of toolCalls) {
      let input: Record<string, unknown> = {};
      try { input = JSON.parse(tc.arguments); } catch {}

      onToolUse(tc.name, input);

      let result: unknown = { error: "Unknown tool" };
      try {
        if (tc.name === "bash") {
          result = await executeBashTool(input as any, backendUrl, onChunk);
        } else if (tc.name === "todo_read") {
          result = TodoTool.read();
        } else if (tc.name === "todo_write") {
          result = TodoTool.write((input.todos ?? []) as any);
        } else if (tc.name === "read_file" && backendUrl) {
          const res = await fetch(`${backendUrl}/files/read`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: input.path }),
          });
          result = await res.json();
        } else if (tc.name === "write_file" && backendUrl) {
          const res = await fetch(`${backendUrl}/files/write`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: input.path, content: input.content }),
          });
          result = await res.json();
        }
      } catch (err: any) {
        result = { error: err?.message ?? "Tool execution failed" };
      }

      onToolResult(tc.name, result);
      toolResults.push({
        role: "tool",
        tool_call_id: tc.id,
        content: JSON.stringify(result),
      });
    }

    currentMessages = [
      ...currentMessages,
      { role: "assistant", content: assistantText },
      ...toolResults,
    ];
  }

  return fullResponse;
}
