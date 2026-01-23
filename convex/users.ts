import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a new user
 */
export const create = mutation({
  args: {
    username: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_key", (q) => q.eq("username", args.username))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("users", {
      username: args.username,
      name: args.name,
    });
  },
});

/**
 * Get user by username
 */
export const getByUsername = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_key", (q) => q.eq("username", args.username))
      .first();
  },
});

/**
 * Get user by ID
 */
export const get = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});
