import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const list = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => {
    return ctx.db
      .query('messages')
      .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
      .order('asc')
      .collect();
  },
});

export const send = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return ctx.db.insert('messages', {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    messageId: v.id('messages'),
    content: v.optional(v.string()),
    streaming: v.optional(v.boolean()),
  },
  handler: async (ctx, { messageId, content, streaming }) => {
    const patch: Record<string, unknown> = {};
    if (content !== undefined) patch.content = content;
    if (streaming !== undefined) patch.streaming = streaming;
    await ctx.db.patch(messageId, patch);
  },
});

export const clearSession = mutation({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => {
    const msgs = await ctx.db
      .query('messages')
      .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
      .collect();
    await Promise.all(msgs.map((m) => ctx.db.delete(m._id)));
  },
});
