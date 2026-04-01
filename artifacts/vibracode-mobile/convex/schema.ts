import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  sessions: defineTable({
    userId: v.string(),
    title: v.optional(v.string()),
    agent: v.union(
      v.literal('claude'),
      v.literal('opencode'),
      v.literal('kilocode'),
      v.literal('codex'),
      v.literal('auto'),
      v.literal('qwen'),
      v.literal('nemotron'),
      v.literal('gemma'),
      v.literal('hermes'),
      v.literal('llama'),
      v.literal('minimax'),
      v.literal('glm'),
      v.literal('qwen_next'),
      v.literal('nvidia_nano'),
      v.literal('stepfun'),
      v.literal('arcee'),
      v.literal('qwen_coder')
    ),
    model: v.string(),
    previewUrl: v.optional(v.string()),
    status: v.union(
      v.literal('idle'),
      v.literal('working'),
      v.literal('done'),
      v.literal('error')
    ),
    name: v.string(),
    createdAt: v.number(),
  }).index('by_user', ['userId']),

  messages: defineTable({
    sessionId: v.id('sessions'),
    role: v.union(v.literal('user'), v.literal('assistant')),
    type: v.union(
      v.literal('message'),
      v.literal('read'),
      v.literal('edit'),
      v.literal('bash'),
      v.literal('tasks'),
      v.literal('status')
    ),
    content: v.string(),
    metadata: v.optional(v.any()),
    streaming: v.optional(v.boolean()),
    agentId: v.optional(v.string()),
    hasImage: v.optional(v.boolean()),
    createdAt: v.number(),
  }).index('by_session', ['sessionId']),
});
