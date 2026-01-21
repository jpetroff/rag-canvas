import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  kv_config: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),
});