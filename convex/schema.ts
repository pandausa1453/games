import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const applicationTables = {
  messages: defineTable({
    author: v.id("users"),
    content: v.string(),
    roomId: v.optional(v.id("rooms")), // null for global chat
  }).index("by_room", ["roomId"]),

  rooms: defineTable({
    name: v.string(),
    code: v.string(),
    creator: v.id("users"),
  }).index("by_code", ["code"]),

  roomMembers: defineTable({
    userId: v.id("users"),
    roomId: v.id("rooms"),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
