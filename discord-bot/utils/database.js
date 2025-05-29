import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

let client;
let db;

export async function connectDatabase() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export function getDB() {
  if (!db) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return db;
}

export function getUserServersCollection() {
  return getDB().collection('userServers');
}

export function getServersCollection() {
  return getDB().collection('servers');
}

export function getUsersCollection() {
  return getDB().collection('users');
}

export function getChannelConfigsCollection() {
  return getDB().collection('channelConfigs');
}

export function getAchievementsCollection() {
  return getDB().collection('achievements');
}

export function getBackgroundsCollection() {
  return getDB().collection('backgrounds');
}

export function getActivityLogsCollection() {
  return getDB().collection('activityLogs');
}

export async function getUserServerData(userId, serverId) {
  try {
    const collection = getUserServersCollection();
    const result = await collection.findOne({ 
      userId: userId, 
      serverId: serverId 
    });
    
    return result || null;
  } catch (error) {
    console.error('Error getting user server data:', error);
    return null;
  }
}

export async function createUserServerData(userData) {
  try {
    const collection = getUserServersCollection();
    const result = await collection.insertOne(userData);
    return { ...userData, _id: result.insertedId };
  } catch (error) {
    console.error('Error creating user server data:', error);
    throw error;
  }
}

export async function updateUserServerData(userId, serverId, updates) {
  try {
    const collection = getUserServersCollection();
    await collection.updateOne(
      { userId: userId, serverId: serverId },
      { $set: updates }
    );
  } catch (error) {
    console.error('Error updating user server data:', error);
    throw error;
  }
}

export async function ensureUserExists(userId, username, discriminator, avatar) {
  try {
    const collection = getUsersCollection();
    const existingUser = await collection.findOne({ id: userId });
    
    if (!existingUser) {
      const userData = {
        id: userId,
        username: username,
        discriminator: discriminator || '0000',
        avatar: avatar,
        createdAt: new Date()
      };
      
      await collection.insertOne(userData);
      return userData;
    }
    
    return existingUser;
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    throw error;
  }
}

export async function ensureServerExists(serverId, serverName, iconUrl, ownerId) {
  try {
    const collection = getServersCollection();
    const existingServer = await collection.findOne({ id: serverId });
    
    if (!existingServer) {
      const serverData = {
        id: serverId,
        name: serverName,
        icon: iconUrl,
        ownerId: ownerId,
        createdAt: new Date()
      };
      
      await collection.insertOne(serverData);
      return serverData;
    }
    
    return existingServer;
  } catch (error) {
    console.error('Error ensuring server exists:', error);
    throw error;
  }
}

export async function getChannelConfig(channelId, serverId) {
  try {
    const collection = getChannelConfigsCollection();
    const config = await collection.findOne({ 
      channelId: channelId, 
      serverId: serverId 
    });
    
    return config || { 
      messageXpMultiplier: 1.0, 
      voiceXpMultiplier: 1.0, 
      isActive: true 
    };
  } catch (error) {
    console.error('Error getting channel config:', error);
    return { messageXpMultiplier: 1.0, voiceXpMultiplier: 1.0, isActive: true };
  }
}

export async function logActivity(activityData) {
  try {
    const collection = getActivityLogsCollection();
    await collection.insertOne({
      ...activityData,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

export async function getUserRank(userId, serverId) {
  try {
    const collection = getUserServersCollection();
    const userRank = await collection.aggregate([
      { $match: { serverId: serverId } },
      { $sort: { xp: -1 } },
      { $group: { 
          _id: null, 
          users: { $push: { userId: "$userId", xp: "$xp" } } 
        }
      },
      { $unwind: { path: "$users", includeArrayIndex: "rank" } },
      { $match: { "users.userId": userId } },
      { $project: { rank: { $add: ["$rank", 1] }, xp: "$users.xp" } }
    ]).toArray();
    
    return userRank[0] || { rank: null, xp: 0 };
  } catch (error) {
    console.error('Error getting user rank:', error);
    return { rank: null, xp: 0 };
  }
}

export async function getTopUsers(serverId, limit = 10) {
  try {
    const collection = getUserServersCollection();
    const topUsers = await collection.find({ serverId: serverId })
      .sort({ xp: -1 })
      .limit(limit)
      .toArray();
    
    return topUsers;
  } catch (error) {
    console.error('Error getting top users:', error);
    return [];
  }
}