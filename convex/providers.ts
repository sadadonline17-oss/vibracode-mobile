import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const add = mutation({
  args: {
    userId:     v.string(),
    name:       v.string(),
    type:       v.string(),
    baseUrl:    v.string(),
    apiKey:     v.optional(v.string()),
    models:     v.array(v.string()),
    testStatus: v.string(),
  },
  handler: async (ctx, args) =>
    ctx.db.insert('custom_providers', {
      ...args,
      testStatus: args.testStatus as any,
      isDefault: false,
      createdAt: Date.now(),
    }),
});

export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) =>
    ctx.db.query('custom_providers').withIndex('by_user', q => q.eq('userId', userId)).collect(),
});

export const remove = mutation({
  args: { providerId: v.id('custom_providers') },
  handler: async (ctx, { providerId }) => ctx.db.delete(providerId),
});

export const setDefault = mutation({
  args: { providerId: v.id('custom_providers'), userId: v.string() },
  handler: async (ctx, { providerId, userId }) => {
    const all = await ctx.db.query('custom_providers').withIndex('by_user', q => q.eq('userId', userId)).collect();
    await Promise.all(all.map(p => ctx.db.patch(p._id, { isDefault: p._id === providerId })));
  },
});

export const updateTestStatus = mutation({
  args: { providerId: v.id('custom_providers'), testStatus: v.string() },
  handler: async (ctx, { providerId, testStatus }) =>
    ctx.db.patch(providerId, { testStatus: testStatus as any }),
});
