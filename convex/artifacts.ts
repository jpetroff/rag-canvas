import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a new artifact
 */
export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    messageId: v.id("messages"),
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("artifacts", {
      title: args.title,
      content: args.content,
      from_message: args.messageId,
      from_chat: args.chatId,
    });
  },
});

/**
 * Get an artifact by ID
 */
export const get = query({
  args: {
    artifactId: v.id("artifacts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.artifactId);
  },
});

/**
 * Get all artifacts for a chat
 */
export const listByChat = query({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("artifacts")
      .filter((q) => q.eq(q.field("from_chat"), args.chatId))
      .collect();
  },
});

/**
 * Update artifact content
 */
export const update = mutation({
  args: {
    artifactId: v.id("artifacts"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: { title?: string; content?: string } = {};
    if (args.title !== undefined) {
      updates.title = args.title;
    }
    if (args.content !== undefined) {
      updates.content = args.content;
    }
    await ctx.db.patch(args.artifactId, updates);
  },
});
