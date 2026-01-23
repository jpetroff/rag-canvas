import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a new message
 */
export const create = mutation({
  args: {
    content: v.string(),
    chatId: v.id("chats"),
    hasArtifact: v.optional(v.id("artifacts")),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      content: args.content,
      from_chat: args.chatId,
      has_artifact: args.hasArtifact ?? null,
      metadata: args.metadata ?? null,
    });
  },
});

/**
 * Get all messages for a chat
 */
export const listByChat = query({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("from_chat"), args.chatId))
      .collect();
  },
});

/**
 * Get a single message by ID
 */
export const get = query({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.messageId);
  },
});
