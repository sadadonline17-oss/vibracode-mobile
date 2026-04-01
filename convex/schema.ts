import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  sessions: defineTable({
    userId: v.string(),
    title: v.optional(v.string()),
    agent: v.string(),
    model: v.string(),
    previewUrl: v.optional(v.string()),
    sandboxId: v.optional(v.string()),
    status: v.union(
      v.literal('idle'),
      v.literal('working'),
      v.literal('done'),
      v.literal('error')
    ),
    name: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
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
      v.literal('tasks_card'),
      v.literal('read_file'),
      v.literal('edit_file'),
      v.literal('status'),
      v.literal('preview'),
      v.literal('error')
    ),
    content: v.string(),
    metadata: v.optional(v.any()),
    streaming: v.optional(v.boolean()),
    agentId: v.optional(v.string()),
    hasImage: v.optional(v.boolean()),
    createdAt: v.number(),
  }).index('by_session', ['sessionId']),
});
