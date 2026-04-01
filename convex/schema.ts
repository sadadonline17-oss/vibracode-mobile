import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

const providerValidator = v.object({
  type: v.union(
    v.literal('openrouter'),
    v.literal('ollama'),
    v.literal('custom'),
    v.literal('anthropic'),
    v.literal('openai')
  ),
  baseUrl:  v.string(),
  apiKey:   v.optional(v.string()),
  model:    v.string(),
  headers:  v.optional(v.any()),
});

export default defineSchema({

  users: defineTable({
    clerkId:     v.string(),
    email:       v.optional(v.string()),
    displayName: v.optional(v.string()),
    plan:        v.union(v.literal('free'), v.literal('pro'), v.literal('enterprise')),
    createdAt:   v.number(),
  }).index('by_clerk', ['clerkId']),

  custom_providers: defineTable({
    userId:      v.string(),
    name:        v.string(),
    type:        v.string(),
    baseUrl:     v.string(),
    apiKey:      v.optional(v.string()),
    models:      v.array(v.string()),
    isDefault:   v.optional(v.boolean()),
    testStatus:  v.union(v.literal('untested'), v.literal('ok'), v.literal('error')),
    createdAt:   v.number(),
  }).index('by_user', ['userId']),

  sessions: defineTable({
    userId:     v.string(),
    title:      v.optional(v.string()),
    name:       v.optional(v.string()),
    agent:      v.string(),
    model:      v.optional(v.string()),
    status:     v.union(
      v.literal('idle'),
      v.literal('working'),
      v.literal('done'),
      v.literal('error')
    ),
    provider:   v.optional(providerValidator),
    previewUrl: v.optional(v.string()),
    sandboxId:  v.optional(v.string()),
    tokenUsed:  v.optional(v.number()),
    createdAt:  v.number(),
    updatedAt:  v.number(),
  })
  .index('by_user',      ['userId'])
  .index('by_user_date', ['userId', 'createdAt']),

  messages: defineTable({
    sessionId: v.id('sessions'),
    role:      v.union(v.literal('user'), v.literal('assistant')),
    type:      v.union(
      v.literal('message'),
      v.literal('tasks_card'),
      v.literal('read_file'),
      v.literal('edit_file'),
      v.literal('bash'),
      v.literal('status'),
      v.literal('preview'),
      v.literal('error'),
      v.literal('thinking'),
      v.literal('read'),
      v.literal('edit'),
      v.literal('tasks')
    ),
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
    size:      v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_session', ['sessionId']),

  skill_templates: defineTable({
    name:        v.string(),
    description: v.string(),
    agent:       v.string(),
    prompt:      v.string(),
    category:    v.string(),
    isPublic:    v.boolean(),
    authorId:    v.optional(v.string()),
    usageCount:  v.number(),
    createdAt:   v.number(),
  }).index('by_category', ['category']).index('by_public', ['isPublic']),
});
