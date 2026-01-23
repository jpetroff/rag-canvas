import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({

  users: defineTable({
    username: v.string(),
    name: v.string()
  }).index("by_key", ["username"]),

  kv_config: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),

  chats: defineTable({
    title: v.string(),
    user: v.id('users')
  }),

  messages: defineTable({
    content: v.string(),
    has_artifact: v.union(v.null(), v.id('artifacts')),
    metadata: v.any(),
    from_chat: v.id('chats')
  }),

  artifacts: defineTable({
    title: v.string(),
    content: v.string(),
    from_message: v.id('messages'),
    from_chat: v.id('chats')
  }),
});