import { 
  users, servers, userServers, channelConfigs, achievements, 
  userAchievements, backgrounds, backgroundPurchases, activityLogs,
  type User, type InsertUser, type Server, type InsertServer,
  type UserServer, type InsertUserServer, type ChannelConfig, type InsertChannelConfig,
  type Achievement, type InsertAchievement, type Background, type InsertBackground,
  type ActivityLog, type InsertActivityLog
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, count, sum } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Server operations
  getServer(id: string): Promise<Server | undefined>;
  createServer(server: InsertServer): Promise<Server>;
  updateServerSettings(serverId: string, settings: any): Promise<void>;
  
  // User server progress
  getUserServer(userId: string, serverId: string): Promise<UserServer | undefined>;
  createUserServer(userServer: InsertUserServer): Promise<UserServer>;
  updateUserServer(userId: string, serverId: string, updates: Partial<UserServer>): Promise<void>;
  getTopUsers(serverId: string, limit?: number): Promise<UserServer[]>;
  
  // Channel configuration
  getChannelConfigs(serverId: string): Promise<ChannelConfig[]>;
  getChannelConfig(channelId: string, serverId: string): Promise<ChannelConfig | undefined>;
  createChannelConfig(config: InsertChannelConfig): Promise<ChannelConfig>;
  updateChannelConfig(id: number, updates: Partial<ChannelConfig>): Promise<void>;
  
  // Achievements
  getAchievements(serverId: string): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  updateAchievement(id: number, updates: Partial<Achievement>): Promise<void>;
  deleteAchievement(id: number): Promise<void>;
  getUserAchievements(userId: string, serverId: string): Promise<Achievement[]>;
  unlockAchievement(userId: string, serverId: string, achievementId: number): Promise<void>;
  
  // Backgrounds
  getBackgrounds(serverId: string): Promise<Background[]>;
  createBackground(background: InsertBackground): Promise<Background>;
  updateBackground(id: number, updates: Partial<Background>): Promise<void>;
  deleteBackground(id: number): Promise<void>;
  purchaseBackground(userId: string, backgroundId: number, serverId: string): Promise<void>;
  getUserBackgrounds(userId: string, serverId: string): Promise<Background[]>;
  
  // Analytics
  logActivity(activity: InsertActivityLog): Promise<void>;
  getServerStats(serverId: string): Promise<{
    totalUsers: number;
    totalMessages: number;
    totalVoiceTime: number;
    levelUps: number;
  }>;
  getChannelStats(serverId: string): Promise<any[]>;
  getActivityLogs(serverId: string, days?: number): Promise<ActivityLog[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getServer(id: string): Promise<Server | undefined> {
    const [server] = await db.select().from(servers).where(eq(servers.id, id));
    return server || undefined;
  }

  async createServer(insertServer: InsertServer): Promise<Server> {
    const [server] = await db
      .insert(servers)
      .values(insertServer)
      .returning();
    return server;
  }

  async updateServerSettings(serverId: string, settings: any): Promise<void> {
    await db
      .update(servers)
      .set({ settings })
      .where(eq(servers.id, serverId));
  }

  async getUserServer(userId: string, serverId: string): Promise<UserServer | undefined> {
    const [userServer] = await db
      .select()
      .from(userServers)
      .where(and(eq(userServers.userId, userId), eq(userServers.serverId, serverId)));
    return userServer || undefined;
  }

  async createUserServer(insertUserServer: InsertUserServer): Promise<UserServer> {
    const [userServer] = await db
      .insert(userServers)
      .values(insertUserServer)
      .returning();
    return userServer;
  }

  async updateUserServer(userId: string, serverId: string, updates: Partial<UserServer>): Promise<void> {
    await db
      .update(userServers)
      .set(updates)
      .where(and(eq(userServers.userId, userId), eq(userServers.serverId, serverId)));
  }

  async getTopUsers(serverId: string, limit = 10): Promise<UserServer[]> {
    return await db
      .select()
      .from(userServers)
      .where(eq(userServers.serverId, serverId))
      .orderBy(desc(userServers.xp))
      .limit(limit);
  }

  async getChannelConfigs(serverId: string): Promise<ChannelConfig[]> {
    return await db
      .select()
      .from(channelConfigs)
      .where(eq(channelConfigs.serverId, serverId));
  }

  async getChannelConfig(channelId: string, serverId: string): Promise<ChannelConfig | undefined> {
    const [config] = await db
      .select()
      .from(channelConfigs)
      .where(and(eq(channelConfigs.channelId, channelId), eq(channelConfigs.serverId, serverId)));
    return config || undefined;
  }

  async createChannelConfig(config: InsertChannelConfig): Promise<ChannelConfig> {
    const [channelConfig] = await db
      .insert(channelConfigs)
      .values(config)
      .returning();
    return channelConfig;
  }

  async updateChannelConfig(id: number, updates: Partial<ChannelConfig>): Promise<void> {
    await db
      .update(channelConfigs)
      .set(updates)
      .where(eq(channelConfigs.id, id));
  }

  async getAchievements(serverId: string): Promise<Achievement[]> {
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.serverId, serverId))
      .orderBy(achievements.createdAt);
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db
      .insert(achievements)
      .values(achievement)
      .returning();
    return newAchievement;
  }

  async updateAchievement(id: number, updates: Partial<Achievement>): Promise<void> {
    await db
      .update(achievements)
      .set(updates)
      .where(eq(achievements.id, id));
  }

  async deleteAchievement(id: number): Promise<void> {
    await db.delete(achievements).where(eq(achievements.id, id));
  }

  async getUserAchievements(userId: string, serverId: string): Promise<Achievement[]> {
    return await db
      .select({
        id: achievements.id,
        serverId: achievements.serverId,
        name: achievements.name,
        description: achievements.description,
        icon: achievements.icon,
        type: achievements.type,
        isHidden: achievements.isHidden,
        conditions: achievements.conditions,
        rewards: achievements.rewards,
        eventEndDate: achievements.eventEndDate,
        createdAt: achievements.createdAt,
      })
      .from(achievements)
      .innerJoin(userAchievements, eq(achievements.id, userAchievements.achievementId))
      .where(and(eq(userAchievements.userId, userId), eq(userAchievements.serverId, serverId)));
  }

  async unlockAchievement(userId: string, serverId: string, achievementId: number): Promise<void> {
    await db
      .insert(userAchievements)
      .values({ userId, serverId, achievementId })
      .onConflictDoNothing();
  }

  async getBackgrounds(serverId: string): Promise<Background[]> {
    return await db
      .select()
      .from(backgrounds)
      .where(eq(backgrounds.serverId, serverId))
      .orderBy(desc(backgrounds.createdAt));
  }

  async createBackground(background: InsertBackground): Promise<Background> {
    const [newBackground] = await db
      .insert(backgrounds)
      .values(background)
      .returning();
    return newBackground;
  }

  async updateBackground(id: number, updates: Partial<Background>): Promise<void> {
    await db
      .update(backgrounds)
      .set(updates)
      .where(eq(backgrounds.id, id));
  }

  async deleteBackground(id: number): Promise<void> {
    await db.delete(backgrounds).where(eq(backgrounds.id, id));
  }

  async purchaseBackground(userId: string, backgroundId: number, serverId: string): Promise<void> {
    await db
      .insert(backgroundPurchases)
      .values({ userId, backgroundId, serverId })
      .onConflictDoNothing();
    
    // Increment sales count
    await db
      .update(backgrounds)
      .set({ sales: sql`sales + 1` })
      .where(eq(backgrounds.id, backgroundId));
  }

  async getUserBackgrounds(userId: string, serverId: string): Promise<Background[]> {
    return await db
      .select({
        id: backgrounds.id,
        name: backgrounds.name,
        description: backgrounds.description,
        imageUrl: backgrounds.imageUrl,
        creatorId: backgrounds.creatorId,
        serverId: backgrounds.serverId,
        price: backgrounds.price,
        category: backgrounds.category,
        requiredAchievementId: backgrounds.requiredAchievementId,
        sales: backgrounds.sales,
        isActive: backgrounds.isActive,
        createdAt: backgrounds.createdAt,
      })
      .from(backgrounds)
      .innerJoin(backgroundPurchases, eq(backgrounds.id, backgroundPurchases.backgroundId))
      .where(and(eq(backgroundPurchases.userId, userId), eq(backgroundPurchases.serverId, serverId)));
  }

  async logActivity(activity: InsertActivityLog): Promise<void> {
    await db.insert(activityLogs).values(activity);
  }

  async getServerStats(serverId: string): Promise<{
    totalUsers: number;
    totalMessages: number;
    totalVoiceTime: number;
    levelUps: number;
  }> {
    const [userStats] = await db
      .select({
        totalUsers: count(userServers.id),
        totalMessages: sum(userServers.totalMessages),
        totalVoiceTime: sum(userServers.totalVoiceTime),
      })
      .from(userServers)
      .where(eq(userServers.serverId, serverId));

    const [levelUpStats] = await db
      .select({
        levelUps: count(activityLogs.id),
      })
      .from(activityLogs)
      .where(and(eq(activityLogs.serverId, serverId), eq(activityLogs.type, 'level_up')));

    return {
      totalUsers: userStats.totalUsers || 0,
      totalMessages: userStats.totalMessages || 0,
      totalVoiceTime: userStats.totalVoiceTime || 0,
      levelUps: levelUpStats.levelUps || 0,
    };
  }

  async getChannelStats(serverId: string): Promise<any[]> {
    return await db
      .select({
        channelId: activityLogs.channelId,
        totalMessages: count(activityLogs.id),
        totalXp: sum(activityLogs.xpGained),
      })
      .from(activityLogs)
      .where(and(eq(activityLogs.serverId, serverId), eq(activityLogs.type, 'message')))
      .groupBy(activityLogs.channelId);
  }

  async getActivityLogs(serverId: string, days = 7): Promise<ActivityLog[]> {
    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - days);
    
    return await db
      .select()
      .from(activityLogs)
      .where(and(
        eq(activityLogs.serverId, serverId),
        sql`${activityLogs.timestamp} >= ${dateFilter}`
      ))
      .orderBy(desc(activityLogs.timestamp));
  }
}

import { MongoDBStorage } from './mongodb-storage';

export const storage = new MongoDBStorage();
