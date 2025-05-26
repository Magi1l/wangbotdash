import { 
  getUserServersCollection, 
  getServersCollection, 
  getUsersCollection,
  getChannelConfigsCollection,
  getAchievementsCollection,
  getBackgroundsCollection,
  getActivityLogsCollection
} from './mongodb';
import { IStorage } from './storage';
import type { 
  User, InsertUser, Server, InsertServer,
  UserServer, InsertUserServer, ChannelConfig, InsertChannelConfig,
  Achievement, InsertAchievement, Background, InsertBackground,
  ActivityLog, InsertActivityLog
} from "@shared/schema";

export class MongoDBStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const collection = getUsersCollection();
    const user = await collection.findOne({ id });
    if (!user) return undefined;
    
    const { _id, ...userData } = user;
    return userData as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const collection = getUsersCollection();
    const user = await collection.findOne({ username });
    return user ? { ...user, _id: undefined } : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const collection = getUsersCollection();
    const userData = {
      ...insertUser,
      createdAt: new Date()
    };
    
    await collection.replaceOne(
      { id: insertUser.id },
      userData,
      { upsert: true }
    );
    
    return userData as User;
  }

  async getServer(id: string): Promise<Server | undefined> {
    const collection = getServersCollection();
    const server = await collection.findOne({ id });
    return server ? { ...server, _id: undefined } : undefined;
  }

  async createServer(insertServer: InsertServer): Promise<Server> {
    const collection = getServersCollection();
    const serverData = {
      ...insertServer,
      createdAt: new Date()
    };
    
    await collection.replaceOne(
      { id: insertServer.id },
      serverData,
      { upsert: true }
    );
    
    return serverData as Server;
  }

  async updateServerSettings(serverId: string, settings: any): Promise<void> {
    const collection = getServersCollection();
    await collection.updateOne(
      { id: serverId },
      { $set: { settings } }
    );
  }

  async getUserServer(userId: string, serverId: string): Promise<UserServer | undefined> {
    const collection = getUserServersCollection();
    const userServer = await collection.findOne({ userId, serverId });
    return userServer ? { ...userServer, _id: undefined } : undefined;
  }

  async createUserServer(insertUserServer: InsertUserServer): Promise<UserServer> {
    const collection = getUserServersCollection();
    const userServerData = {
      ...insertUserServer,
      id: Date.now() // Simple ID generation
    };
    
    await collection.replaceOne(
      { userId: insertUserServer.userId, serverId: insertUserServer.serverId },
      userServerData,
      { upsert: true }
    );
    
    return userServerData as UserServer;
  }

  async updateUserServer(userId: string, serverId: string, updates: Partial<UserServer>): Promise<void> {
    const collection = getUserServersCollection();
    await collection.updateOne(
      { userId, serverId },
      { $set: updates }
    );
  }

  async getTopUsers(serverId: string, limit = 10): Promise<UserServer[]> {
    const collection = getUserServersCollection();
    const users = await collection
      .find({ serverId })
      .sort({ xp: -1 })
      .limit(limit)
      .toArray();
    
    return users.map(user => ({ ...user, _id: undefined }));
  }

  async getChannelConfigs(serverId: string): Promise<ChannelConfig[]> {
    const collection = getChannelConfigsCollection();
    const configs = await collection.find({ serverId }).toArray();
    return configs.map(config => ({ ...config, _id: undefined }));
  }

  async getChannelConfig(channelId: string, serverId: string): Promise<ChannelConfig | undefined> {
    const collection = getChannelConfigsCollection();
    const config = await collection.findOne({ channelId, serverId });
    return config ? { ...config, _id: undefined } : undefined;
  }

  async createChannelConfig(config: InsertChannelConfig): Promise<ChannelConfig> {
    const collection = getChannelConfigsCollection();
    const configData = {
      ...config,
      id: Date.now()
    };
    
    await collection.insertOne(configData);
    return configData as ChannelConfig;
  }

  async updateChannelConfig(id: number, updates: Partial<ChannelConfig>): Promise<void> {
    const collection = getChannelConfigsCollection();
    await collection.updateOne({ id }, { $set: updates });
  }

  async getAchievements(serverId: string): Promise<Achievement[]> {
    const collection = getAchievementsCollection();
    const achievements = await collection.find({ serverId }).sort({ createdAt: 1 }).toArray();
    return achievements.map(achievement => ({ ...achievement, _id: undefined }));
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const collection = getAchievementsCollection();
    const achievementData = {
      ...achievement,
      id: Date.now(),
      createdAt: new Date()
    };
    
    await collection.insertOne(achievementData);
    return achievementData as Achievement;
  }

  async updateAchievement(id: number, updates: Partial<Achievement>): Promise<void> {
    const collection = getAchievementsCollection();
    await collection.updateOne({ id }, { $set: updates });
  }

  async deleteAchievement(id: number): Promise<void> {
    const collection = getAchievementsCollection();
    await collection.deleteOne({ id });
  }

  async getUserAchievements(userId: string, serverId: string): Promise<Achievement[]> {
    // This would require a join-like operation or separate userAchievements collection
    // For now, return empty array
    return [];
  }

  async unlockAchievement(userId: string, serverId: string, achievementId: number): Promise<void> {
    // Implementation needed for userAchievements collection
  }

  async getBackgrounds(serverId: string): Promise<Background[]> {
    const collection = getBackgroundsCollection();
    const backgrounds = await collection.find({ serverId }).sort({ createdAt: -1 }).toArray();
    return backgrounds.map(background => ({ ...background, _id: undefined }));
  }

  async createBackground(background: InsertBackground): Promise<Background> {
    const collection = getBackgroundsCollection();
    const backgroundData = {
      ...background,
      id: Date.now(),
      sales: 0,
      createdAt: new Date()
    };
    
    await collection.insertOne(backgroundData);
    return backgroundData as Background;
  }

  async updateBackground(id: number, updates: Partial<Background>): Promise<void> {
    const collection = getBackgroundsCollection();
    await collection.updateOne({ id }, { $set: updates });
  }

  async deleteBackground(id: number): Promise<void> {
    const collection = getBackgroundsCollection();
    await collection.deleteOne({ id });
  }

  async purchaseBackground(userId: string, backgroundId: number, serverId: string): Promise<void> {
    // Implementation needed for backgroundPurchases collection
  }

  async getUserBackgrounds(userId: string, serverId: string): Promise<Background[]> {
    // This would require a join-like operation or separate backgroundPurchases collection
    // For now, return empty array
    return [];
  }

  async logActivity(activity: InsertActivityLog): Promise<void> {
    const collection = getActivityLogsCollection();
    const activityData = {
      ...activity,
      id: Date.now(),
      timestamp: new Date()
    };
    
    await collection.insertOne(activityData);
  }

  async getServerStats(serverId: string): Promise<{
    totalUsers: number;
    totalMessages: number;
    totalVoiceTime: number;
    levelUps: number;
  }> {
    const userServersCollection = getUserServersCollection();
    const activityLogsCollection = getActivityLogsCollection();
    
    const userStats = await userServersCollection.aggregate([
      { $match: { serverId } },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalMessages: { $sum: '$totalMessages' },
          totalVoiceTime: { $sum: '$totalVoiceTime' }
        }
      }
    ]).toArray();
    
    const levelUps = await activityLogsCollection.countDocuments({
      serverId,
      type: 'level_up'
    });
    
    const stats = userStats[0] || { totalUsers: 0, totalMessages: 0, totalVoiceTime: 0 };
    
    return {
      totalUsers: stats.totalUsers || 0,
      totalMessages: stats.totalMessages || 0,
      totalVoiceTime: stats.totalVoiceTime || 0,
      levelUps: levelUps || 0
    };
  }

  async getChannelStats(serverId: string): Promise<any[]> {
    const collection = getActivityLogsCollection();
    const stats = await collection.aggregate([
      { $match: { serverId, type: 'message' } },
      {
        $group: {
          _id: '$channelId',
          totalMessages: { $sum: 1 },
          totalXp: { $sum: '$xpGained' }
        }
      }
    ]).toArray();
    
    return stats.map(stat => ({
      channelId: stat._id,
      totalMessages: stat.totalMessages,
      totalXp: stat.totalXp
    }));
  }

  async getActivityLogs(serverId: string, days = 7): Promise<ActivityLog[]> {
    const collection = getActivityLogsCollection();
    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - days);
    
    const logs = await collection
      .find({
        serverId,
        timestamp: { $gte: dateFilter }
      })
      .sort({ timestamp: -1 })
      .toArray();
    
    return logs.map(log => ({ ...log, _id: undefined }));
  }
}