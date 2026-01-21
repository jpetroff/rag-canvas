import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Set a key-value pair in the configuration (upsert).
 * If the key already exists, it will be updated.
 * If the key doesn't exist, it will be inserted.
 */
export const set = mutation({
  args: {
    key: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    // Check if key already exists using the index
    const existing = await ctx.db
      .query("kv_config")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      // Update existing entry
      await ctx.db.patch(existing._id, { value: args.value });
      return existing._id;
    } else {
      // Insert new entry
      return await ctx.db.insert("kv_config", {
        key: args.key,
        value: args.value,
      });
    }
  },
});

/**
 * Insert a new key-value pair.
 * Throws an error if the key already exists (strict uniqueness).
 */
export const insert = mutation({
  args: {
    key: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    // Check if key already exists using the index
    const existing = await ctx.db
      .query("kv_config")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first()

    if (existing) {
      throw new Error(`Key "${args.key}" already exists. Use set() to update or remove() to delete first.`);
    }

    // Insert new entry
    return await ctx.db.insert("kv_config", {
      key: args.key,
      value: args.value,
    })
  },
});

/**
 * Get a value by key.
 */
export const get = query({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db
      .query("kv_config")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    return entry?.value ?? null;
  },
});

/**
 * Delete a key-value pair by key.
 */
export const remove = mutation({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("kv_config")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return true;
    }
    return false;
  },
});

/**
 * Get all key-value pairs.
 */
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("kv_config").collect();
  },
});
