import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    userId: v.string(),
    agent:  v.string(),
    model:  v.string(),
    name:   v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("sessions", {
      userId:    args.userId,
      agent:     args.agent,
      model:     args.model,
      name:      args.name,
      status:    "idle",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("sessions")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
  },
});

export const get = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    return ctx.db.get(sessionId);
  },
});

export const setStatus = mutation({
  args: {
    sessionId: v.id("sessions"),
    status:    v.string(),
    sandboxId: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, status, sandboxId }) => {
    await ctx.db.patch(sessionId, {
      status: status as any,
      ...(sandboxId && { sandboxId }),
      updatedAt: Date.now(),
    });
  },
});

export const updateName = mutation({
  args: { sessionId: v.id("sessions"), name: v.string() },
  handler: async (ctx, { sessionId, name }) => {
    await ctx.db.patch(sessionId, { name, updatedAt: Date.now() });
  },
});

export const setPreview = mutation({
  args: { sessionId: v.id("sessions"), previewUrl: v.string() },
  handler: async (ctx, { sessionId, previewUrl }) => {
    await ctx.db.patch(sessionId, { previewUrl, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    await Promise.all(msgs.map((m) => ctx.db.delete(m._id)));
    await ctx.db.delete(sessionId);
  },
});
