import { getUserServerData, updateUserServerData, createUserServerData } from './database.js';

// XP calculation constants
const BASE_XP_PER_LEVEL = 100;
const XP_MULTIPLIER = 1.2;
const COOLDOWN_TIME = 60000; // 1 minute in milliseconds

// Store user cooldowns in memory
const userCooldowns = new Map();

export async function awardMessageXP(message) {
  const userId = message.author.id;
  const guildId = message.guild.id;
  const channelId = message.channel.id;

  try {
    // Check cooldown
    const cooldownKey = `${userId}-${guildId}-message`;
    const now = Date.now();
    const lastMessageTime = userCooldowns.get(cooldownKey);
    
    if (lastMessageTime && (now - lastMessageTime) < COOLDOWN_TIME) {
      return { success: false, reason: 'cooldown' };
    }

    // Get channel configuration for XP amount
    const channelConfig = await getChannelConfig(channelId, guildId);
    const xpAmount = channelConfig?.messageXp || 15;

    // Get or create user data
    let userData = await getUserServerData(userId, guildId);
    if (!userData) {
      userData = await createUserServerData({
        userId,
        serverId: guildId,
        xp: 0,
        level: 1,
        points: 0,
        totalMessages: 0,
        totalVoiceTime: 0
      });
    }

    // Calculate new values
    const newXP = userData.xp + xpAmount;
    const newLevel = calculateLevel(newXP);
    const oldLevel = userData.level;
    const levelUp = newLevel > oldLevel;
    
    // Calculate points if leveled up
    const pointsToAdd = levelUp ? (newLevel - oldLevel) * 100 : 0;

    // Update user data
    await updateUserServerData(userId, guildId, {
      xp: newXP,
      level: newLevel,
      points: userData.points + pointsToAdd,
      totalMessages: userData.totalMessages + 1,
      lastMessageAt: new Date()
    });

    // Set cooldown
    userCooldowns.set(cooldownKey, now);

    // Log activity
    await logActivity({
      userId,
      serverId: guildId,
      channelId,
      type: 'message',
      xpGained: xpAmount,
      metadata: {
        messageLength: message.content.length,
        channelName: message.channel.name
      }
    });

    return {
      success: true,
      xpGained: xpAmount,
      newXP,
      newLevel,
      oldLevel,
      levelUp,
      pointsGained: pointsToAdd,
      totalXP: newXP
    };

  } catch (error) {
    console.error('Error awarding message XP:', error);
    return { success: false, reason: 'error', error };
  }
}

export async function awardVoiceXP(userId, guildId, channelId, minutes) {
  try {
    // Get channel configuration for XP amount
    const channelConfig = await getChannelConfig(channelId, guildId);
    const xpPerMinute = channelConfig?.voiceXpPerMinute || 5;
    const xpAmount = minutes * xpPerMinute;

    // Get or create user data
    let userData = await getUserServerData(userId, guildId);
    if (!userData) {
      userData = await createUserServerData({
        userId,
        serverId: guildId,
        xp: 0,
        level: 1,
        points: 0,
        totalMessages: 0,
        totalVoiceTime: 0
      });
    }

    // Calculate new values
    const newXP = userData.xp + xpAmount;
    const newLevel = calculateLevel(newXP);
    const oldLevel = userData.level;
    const levelUp = newLevel > oldLevel;
    
    // Calculate points if leveled up
    const pointsToAdd = levelUp ? (newLevel - oldLevel) * 100 : 0;

    // Update user data
    await updateUserServerData(userId, guildId, {
      xp: newXP,
      level: newLevel,
      points: userData.points + pointsToAdd,
      totalVoiceTime: userData.totalVoiceTime + minutes,
      lastVoiceAt: new Date()
    });

    // Log activity
    await logActivity({
      userId,
      serverId: guildId,
      channelId,
      type: 'voice_xp',
      xpGained: xpAmount,
      metadata: {
        minutes,
        xpPerMinute
      }
    });

    return {
      success: true,
      xpGained: xpAmount,
      newXP,
      newLevel,
      oldLevel,
      levelUp,
      pointsGained: pointsToAdd,
      totalXP: newXP
    };

  } catch (error) {
    console.error('Error awarding voice XP:', error);
    return { success: false, reason: 'error', error };
  }
}

export function calculateLevel(xp) {
  let level = 1;
  let requiredXP = BASE_XP_PER_LEVEL;
  
  while (xp >= requiredXP) {
    level++;
    requiredXP = Math.floor(BASE_XP_PER_LEVEL * Math.pow(level, XP_MULTIPLIER));
  }
  
  return level;
}

export function calculateRequiredXP(level) {
  return Math.floor(BASE_XP_PER_LEVEL * Math.pow(level, XP_MULTIPLIER));
}

export function calculateLevelProgress(xp, level) {
  const currentLevelXP = level === 1 ? 0 : calculateRequiredXP(level - 1);
  const nextLevelXP = calculateRequiredXP(level);
  const progressXP = xp - currentLevelXP;
  const requiredXP = nextLevelXP - currentLevelXP;
  
  return {
    currentXP: progressXP,
    requiredXP,
    percentage: Math.floor((progressXP / requiredXP) * 100)
  };
}

async function getChannelConfig(channelId, guildId) {
  try {
    // This would fetch from the web dashboard's database
    // For now, return default values
    return {
      messageXp: 15,
      voiceXpPerMinute: 5,
      cooldown: 60,
      minUsersForVoice: 2,
      enabled: true
    };
  } catch (error) {
    console.error('Error fetching channel config:', error);
    return null;
  }
}

async function logActivity(activityData) {
  try {
    // This would integrate with the web dashboard's database
    console.log('Activity logged:', activityData);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

export const levelSystem = {
  awardMessageXP,
  awardVoiceXP,
  calculateLevel,
  calculateRequiredXP,
  calculateLevelProgress
};
