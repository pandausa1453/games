import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const send = mutation({
  args: {
    content: v.string(),
    roomId: v.optional(v.id("rooms")),
  },
  handler: async (ctx, args) => {
    const author = await getAuthUserId(ctx);
    if (!author) throw new Error("Not authenticated");
    
    if (args.roomId) {
      // Check if user is member of room
      const membership = await ctx.db
        .query("roomMembers")
        .withIndex("by_user", q => q.eq("userId", author))
        .filter(q => q.eq(q.field("roomId"), args.roomId))
        .unique();
      if (!membership) throw new Error("Not a member of this room");
    }
    
    await ctx.db.insert("messages", {
      author,
      content: args.content,
      roomId: args.roomId,
    });
  },
});

export const list = query({
  args: {
    roomId: v.optional(v.id("rooms")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    if (args.roomId) {
      // Check if user is member of room
      const membership = await ctx.db
        .query("roomMembers")
        .withIndex("by_user", q => q.eq("userId", userId))
        .filter(q => q.eq(q.field("roomId"), args.roomId))
        .unique();
      if (!membership) return [];
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_room", q => q.eq("roomId", args.roomId))
      .order("desc")
      .take(50);

    const users = new Set(messages.map(m => m.author));
    const userDetails = await Promise.all(
      Array.from(users).map(id => ctx.db.get(id))
    );
    const userMap = Object.fromEntries(
      userDetails.map(u => [u!._id, u!.email])
    );

    return messages.map(msg => ({
      ...msg,
      authorEmail: userMap[msg.author],
    }));
  },
});

export const createRoom = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Generate a random 6-character code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const roomId = await ctx.db.insert("rooms", {
      name: args.name,
      code,
      creator: userId,
    });

    // Add creator as first member
    await ctx.db.insert("roomMembers", {
      userId,
      roomId,
    });

    return { roomId, code };
  },
});

export const joinRoom = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", q => q.eq("code", args.code))
      .unique();
    
    if (!room) throw new Error("Room not found");

    // Check if already a member
    const existing = await ctx.db
      .query("roomMembers")
      .withIndex("by_user", q => q.eq("userId", userId))
      .filter(q => q.eq(q.field("roomId"), room._id))
      .unique();
    
    if (!existing) {
      await ctx.db.insert("roomMembers", {
        userId,
        roomId: room._id,
      });
    }

    return room._id;
  },
});

export const listRooms = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();

    const rooms = await Promise.all(
      memberships.map(m => ctx.db.get(m.roomId))
    );

    return rooms.filter(r => r !== null);
  },
});
