import { MongoClient, Db, Collection } from 'mongodb';

let client: MongoClient;
let db: Db;

export async function connectMongoDB() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is required');
    }

    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db('levelbot');
    
    console.log('✅ Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

export function getDB(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectMongoDB first.');
  }
  return db;
}

export function getUserServersCollection(): Collection {
  return getDB().collection('userServers');
}

export function getServersCollection(): Collection {
  return getDB().collection('servers');
}

export function getUsersCollection(): Collection {
  return getDB().collection('users');
}

export function getChannelConfigsCollection(): Collection {
  return getDB().collection('channelConfigs');
}

export function getAchievementsCollection(): Collection {
  return getDB().collection('achievements');
}

export function getBackgroundsCollection(): Collection {
  return getDB().collection('backgrounds');
}

export function getActivityLogsCollection(): Collection {
  return getDB().collection('activityLogs');
}