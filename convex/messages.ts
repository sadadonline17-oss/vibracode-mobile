import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const lastMessage = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) =>
    ctx.db.query('messages')
      .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
      .order('desc')
      .first(),
});

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
    role:      v.union(v.literal('user'), v.literal('assistant')),
    type:      v.string(),
    content:   v.string(),
    metadata:  v.optional(v.any()),
    streaming: v.optional(v.boolean()),
    agentId:   v.optional(v.string()),
    hasImage:  v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, { updatedAt: Date.now() }).catch(() => {});
    return ctx.db.insert('messages', {
      ...args,
      type: args.type as any,
      createdAt: Date.now(),
    });
  },
});

export const updateStreaming = mutation({
  args: {
    messageId: v.id('messages'),
    content:   v.string(),
    done:      v.optional(v.boolean()),
  },
  handler: async (ctx, { messageId, content, done }) =>
    ctx.db.patch(messageId, { content, streaming: done ? false : true }),
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
