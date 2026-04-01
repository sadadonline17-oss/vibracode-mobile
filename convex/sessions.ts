import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const create = mutation({
  args: {
    userId: v.string(),
    agent: v.string(),
    model: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert('sessions', {
      userId: args.userId,
      agent: args.agent as any,
      model: args.model,
      name: args.name,
      status: 'idle',
      createdAt: Date.now(),
    });
  },
});

export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query('sessions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .collect();
  },
});

export const updateName = mutation({
  args: { sessionId: v.id('sessions'), name: v.string() },
  handler: async (ctx, { sessionId, name }) => {
    await ctx.db.patch(sessionId, { name });
  },
});

export const setStatus = mutation({
  args: {
    sessionId: v.id('sessions'),
    status: v.union(
      v.literal('idle'),
      v.literal('working'),
      v.literal('done'),
      v.literal('error')
    ),
  },
  handler: async (ctx, { sessionId, status }) => {
    await ctx.db.patch(sessionId, { status });
  },
});

export const setPreviewUrl = mutation({
  args: { sessionId: v.id('sessions'), previewUrl: v.string() },
  handler: async (ctx, { sessionId, previewUrl }) => {
    await ctx.db.patch(sessionId, { previewUrl });
  },
});

export const remove = mutation({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => {
    const msgs = await ctx.db
      .query('messages')
      .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
      .collect();
    await Promise.all(msgs.map((m) => ctx.db.delete(m._id)));
    await ctx.db.delete(sessionId);
  },
});
