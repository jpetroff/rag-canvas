import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a new chat
 */
export const create = mutation({
  args: {
    title: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chats", {
      title: args.title,
      user: args.userId,
    });
  },
});

/**
 * Get all chats for a user
 */
export const list = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("user"), args.userId))
      .collect();
  },
});

/**
 * Get a single chat by ID
 */
export const get = query({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.chatId);
  },
});

/**
 * Update chat title
 */
export const updateTitle = mutation({
  args: {
    chatId: v.id("chats"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.chatId, {
      title: args.title,
    });
  },
});

/**
 * Delete a chat
 */
export const remove = mutation({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.chatId);
  },
});

/**
 * Delete a chat and all associated messages and artifacts
 */
export const removeWithAssociatedData = mutation({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const chatId = args.chatId;
    
    // Get all messages associated with this chat
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("from_chat"), chatId))
      .collect();
    
    // Get all artifacts associated with this chat
    const artifacts = await ctx.db
      .query("artifacts")
      .filter((q) => q.eq(q.field("from_chat"), chatId))
      .collect();
    
    // Delete all artifacts first (they reference messages)
    for (const artifact of artifacts) {
      await ctx.db.delete(artifact._id);
    }
    
    // Delete all messages
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
    
    // Finally, delete the chat itself
    await ctx.db.delete(chatId);
  },
});
