import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  sessions: defineTable({
    userId:     v.string(),
    title:      v.optional(v.string()),
    name:       v.optional(v.string()),
    agent:      v.string(),
    model:      v.string(),
    status:     v.union(
      v.literal('idle'), v.literal('working'),
      v.literal('done'), v.literal('error')
    ),
    previewUrl: v.optional(v.string()),
    sandboxId:  v.optional(v.string()),
    createdAt:  v.number(),
    updatedAt:  v.number(),
  })
  .index('by_user',      ['userId'])
  .index('by_user_date', ['userId', 'createdAt']),

  messages: defineTable({
    sessionId: v.id('sessions'),
    role:      v.union(v.literal('user'), v.literal('assistant')),
    type:      v.string(),
    content:   v.string(),
    metadata:  v.optional(v.any()),
    streaming: v.optional(v.boolean()),
    agentId:   v.optional(v.string()),
    hasImage:  v.optional(v.boolean()),
    createdAt: v.number(),
  })
  .index('by_session',      ['sessionId'])
  .index('by_session_date', ['sessionId', 'createdAt']),

  files: defineTable({
    sessionId: v.id('sessions'),
    path:      v.string(),
    content:   v.string(),
    language:  v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index('by_session', ['sessionId']),
});
