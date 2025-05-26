import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for Discord users
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Discord user ID
  username: text("username").notNull(),
  discriminator: text("discriminator").notNull(),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Servers table for Discord servers/guilds
export const servers = pgTable("servers", {
  id: text("id").primaryKey(), // Discord guild ID
  name: text("name").notNull(),
  icon: text("icon"),
  ownerId: text("owner_id").notNull().references(() => users.id),
  settings: jsonb("settings").$type<{
    levelUpChannel?: string;
    pointsPerLevel: number;
    levelUpMessage: string;
  }>().default({
    pointsPerLevel: 100,
    levelUpMessage: "축하합니다! {user}님이 레벨 {level}에 도달했습니다!"
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User progress in each server
export const userServers = pgTable("user_servers", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  serverId: text("server_id").notNull().references(() => servers.id),
  xp: integer("xp").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  points: integer("points").default(0).notNull(),
  totalMessages: integer("total_messages").default(0).notNull(),
  totalVoiceTime: integer("total_voice_time").default(0).notNull(), // in minutes
  lastMessageAt: timestamp("last_message_at"),
  lastVoiceAt: timestamp("last_voice_at"),
  profileCard: jsonb("profile_card").$type<{
    backgroundColor?: string;
    backgroundImage?: string;
    accentColor: string;
    progressGradient: string[];
  }>().default({
    accentColor: "#5865F2",
    progressGradient: ["#5865F2", "#FF73FA"]
  }),
});

// Channels configuration for XP settings
export const channelConfigs = pgTable("channel_configs", {
  id: serial("id").primaryKey(),
  channelId: text("channel_id").notNull(),
  serverId: text("server_id").notNull().references(() => servers.id),
  type: text("type").notNull(), // 'text' or 'voice'
  messageXp: integer("message_xp").default(15).notNull(),
  voiceXpPerMinute: integer("voice_xp_per_minute").default(5).notNull(),
  cooldown: integer("cooldown").default(60).notNull(), // seconds
  minUsersForVoice: integer("min_users_for_voice").default(2).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
});

// Achievements system
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  serverId: text("server_id").notNull().references(() => servers.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  type: text("type").notNull(), // 'level', 'activity', 'hidden', 'event'
  isHidden: boolean("is_hidden").default(false).notNull(),
  conditions: jsonb("conditions").$type<{
    level?: number;
    messages?: number;
    voiceTime?: number;
    custom?: string;
  }>().notNull(),
  rewards: jsonb("rewards").$type<{
    points?: number;
    backgroundId?: number;
    customReward?: string;
  }>().notNull(),
  eventEndDate: timestamp("event_end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User achievements
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  serverId: text("server_id").notNull().references(() => servers.id),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
});

// Background marketplace
export const backgrounds = pgTable("backgrounds", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  creatorId: text("creator_id").notNull().references(() => users.id),
  serverId: text("server_id").notNull().references(() => servers.id),
  price: integer("price").default(0).notNull(), // 0 for free backgrounds
  category: text("category").notNull(), // 'free', 'premium', 'achievement'
  requiredAchievementId: integer("required_achievement_id").references(() => achievements.id),
  sales: integer("sales").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Background purchases
export const backgroundPurchases = pgTable("background_purchases", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  backgroundId: integer("background_id").notNull().references(() => backgrounds.id),
  serverId: text("server_id").notNull().references(() => servers.id),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
});

// Activity logs for analytics
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  serverId: text("server_id").notNull().references(() => servers.id),
  channelId: text("channel_id").notNull(),
  type: text("type").notNull(), // 'message', 'voice_join', 'voice_leave', 'level_up'
  xpGained: integer("xp_gained").default(0).notNull(),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  servers: many(servers),
  userServers: many(userServers),
  backgrounds: many(backgrounds),
  achievements: many(userAchievements),
  purchases: many(backgroundPurchases),
  activities: many(activityLogs),
}));

export const serversRelations = relations(servers, ({ one, many }) => ({
  owner: one(users, {
    fields: [servers.ownerId],
    references: [users.id],
  }),
  userServers: many(userServers),
  channelConfigs: many(channelConfigs),
  achievements: many(achievements),
  backgrounds: many(backgrounds),
  activities: many(activityLogs),
}));

export const userServersRelations = relations(userServers, ({ one }) => ({
  user: one(users, {
    fields: [userServers.userId],
    references: [users.id],
  }),
  server: one(servers, {
    fields: [userServers.serverId],
    references: [servers.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ one, many }) => ({
  server: one(servers, {
    fields: [achievements.serverId],
    references: [servers.id],
  }),
  userAchievements: many(userAchievements),
}));

export const backgroundsRelations = relations(backgrounds, ({ one, many }) => ({
  creator: one(users, {
    fields: [backgrounds.creatorId],
    references: [users.id],
  }),
  server: one(servers, {
    fields: [backgrounds.serverId],
    references: [servers.id],
  }),
  requiredAchievement: one(achievements, {
    fields: [backgrounds.requiredAchievementId],
    references: [achievements.id],
  }),
  purchases: many(backgroundPurchases),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ createdAt: true });
export const insertServerSchema = createInsertSchema(servers).omit({ createdAt: true });
export const insertUserServerSchema = createInsertSchema(userServers).omit({ id: true });
export const insertChannelConfigSchema = createInsertSchema(channelConfigs).omit({ id: true });
export const insertAchievementSchema = createInsertSchema(achievements).omit({ id: true, createdAt: true });
export const insertBackgroundSchema = createInsertSchema(backgrounds).omit({ id: true, createdAt: true, sales: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, timestamp: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Server = typeof servers.$inferSelect;
export type InsertServer = z.infer<typeof insertServerSchema>;
export type UserServer = typeof userServers.$inferSelect;
export type InsertUserServer = z.infer<typeof insertUserServerSchema>;
export type ChannelConfig = typeof channelConfigs.$inferSelect;
export type InsertChannelConfig = z.infer<typeof insertChannelConfigSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Background = typeof backgrounds.$inferSelect;
export type InsertBackground = z.infer<typeof insertBackgroundSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
