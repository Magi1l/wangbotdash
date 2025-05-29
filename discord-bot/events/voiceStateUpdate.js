import { Events } from 'discord.js';
import { awardVoiceXP } from '../utils/levelSystem.js';

export default {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    try {
      // Handle user joining voice channel
      if (!oldState.channel && newState.channel) {
        await handleVoiceJoin(newState);
      }
      
      // Handle user leaving voice channel
      if (oldState.channel && !newState.channel) {
        await handleVoiceLeave(oldState);
      }
      
      // Handle user switching channels
      if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
        await handleVoiceLeave(oldState);
        await handleVoiceJoin(newState);
      }
    } catch (error) {
      console.error('Error handling voice state update:', error);
    }
  }
};

async function handleVoiceJoin(voiceState) {
  const { member, channel, guild } = voiceState;
  
  // Ignore bots
  if (member.user.bot) return;

  // Check if there are enough users in the channel
  const nonBotMembers = channel.members.filter(m => !m.user.bot);
  
  // Get channel configuration (minimum users required)
  const channelConfig = await getChannelConfig(channel.id, guild.id);
  const minUsers = channelConfig?.minUsersForVoice || 2;
  
  if (nonBotMembers.size < minUsers) {
    console.log(`Not enough users in ${channel.name} for XP (${nonBotMembers.size}/${minUsers})`);
    return;
  }

  // Start tracking voice session
  const client = voiceState.client;
  if (!client.voiceSessions) {
    client.voiceSessions = new Map();
  }

  const sessionKey = `${member.id}-${guild.id}`;
  client.voiceSessions.set(sessionKey, {
    userId: member.id,
    guildId: guild.id,
    channelId: channel.id,
    joinTime: Date.now(),
    lastXPTime: Date.now()
  });

  // Start XP timer for this user
  startVoiceXPTimer(client, sessionKey);

  // Log voice join activity
  await logActivity({
    userId: member.id,
    serverId: guild.id,
    channelId: channel.id,
    type: 'voice_join',
    xpGained: 0,
    metadata: {
      channelName: channel.name,
      memberCount: nonBotMembers.size
    }
  });
}

async function handleVoiceLeave(voiceState) {
  const { member, channel, guild } = voiceState;
  
  // Ignore bots
  if (member.user.bot) return;

  const client = voiceState.client;
  if (!client.voiceSessions) return;

  const sessionKey = `${member.id}-${guild.id}`;
  const session = client.voiceSessions.get(sessionKey);
  
  if (session) {
    // Calculate total voice time
    const totalTime = Date.now() - session.joinTime;
    const totalMinutes = Math.floor(totalTime / 60000);

    // Award final XP if session was long enough
    if (totalMinutes > 0) {
      await awardVoiceXP(member.id, guild.id, channel.id, totalMinutes);
    }

    // Remove session
    client.voiceSessions.delete(sessionKey);

    // Log voice leave activity
    await logActivity({
      userId: member.id,
      serverId: guild.id,
      channelId: channel.id,
      type: 'voice_leave',
      xpGained: 0,
      metadata: {
        channelName: channel.name,
        duration: totalMinutes
      }
    });
  }
}

function startVoiceXPTimer(client, sessionKey) {
  const session = client.voiceSessions.get(sessionKey);
  if (!session) return;

  // Award XP every minute
  const timer = setInterval(async () => {
    const currentSession = client.voiceSessions.get(sessionKey);
    if (!currentSession) {
      clearInterval(timer);
      return;
    }

    try {
      // Check if user is still in voice and channel has enough members
      const guild = client.guilds.cache.get(currentSession.guildId);
      if (!guild) {
        clearInterval(timer);
        client.voiceSessions.delete(sessionKey);
        return;
      }

      const channel = guild.channels.cache.get(currentSession.channelId);
      if (!channel) {
        clearInterval(timer);
        client.voiceSessions.delete(sessionKey);
        return;
      }

      const member = channel.members.get(currentSession.userId);
      if (!member) {
        clearInterval(timer);
        client.voiceSessions.delete(sessionKey);
        return;
      }

      // Check minimum users requirement
      const nonBotMembers = channel.members.filter(m => !m.user.bot);
      const channelConfig = await getChannelConfig(channel.id, guild.id);
      const minUsers = channelConfig?.minUsersForVoice || 2;
      
      if (nonBotMembers.size < minUsers) {
        return; // Don't award XP but keep timer running
      }

      // Award XP for 1 minute of voice activity
      const result = await awardVoiceXP(currentSession.userId, guild.id, channel.id, 1);
      
      // Update last XP time
      currentSession.lastXPTime = Date.now();

      // Check for level up
      if (result.levelUp) {
        // Send level up notification in a text channel
        await sendVoiceLevelUpNotification(guild, member.user, result);
      }

    } catch (error) {
      console.error('Error in voice XP timer:', error);
      clearInterval(timer);
      client.voiceSessions.delete(sessionKey);
    }
  }, 60000); // Every minute
}

async function sendVoiceLevelUpNotification(guild, user, result) {
  try {
    // Find a suitable channel to send the notification
    // Priority: level-up channel > general > first available text channel
    let targetChannel = null;
    
    const levelUpChannel = guild.channels.cache.find(ch => ch.name.includes('level') && ch.isTextBased());
    const generalChannel = guild.channels.cache.find(ch => ch.name === 'general' && ch.isTextBased());
    const firstTextChannel = guild.channels.cache.find(ch => ch.isTextBased());
    
    targetChannel = levelUpChannel || generalChannel || firstTextChannel;
    
    if (!targetChannel) return;

    const levelUpEmbed = {
      color: 0xFF73FA, // Pink for voice level ups
      title: '🎤 음성 채팅 레벨 업!',
      description: `🎉 <@${user.id}>님이 음성 활동으로 레벨 ${result.newLevel}에 도달했습니다!`,
      fields: [
        {
          name: '새로운 레벨',
          value: `${result.newLevel}`,
          inline: true
        },
        {
          name: '총 경험치',
          value: `${result.totalXP.toLocaleString()}`,
          inline: true
        },
        {
          name: '획득 포인트',
          value: `+100P`,
          inline: true
        }
      ],
      thumbnail: {
        url: user.displayAvatarURL({ dynamic: true })
      },
      footer: {
        text: `${guild.name} 레벨링 시스템`,
        icon_url: guild.iconURL({ dynamic: true })
      },
      timestamp: new Date().toISOString()
    };

    await targetChannel.send({ embeds: [levelUpEmbed] });
  } catch (error) {
    console.error('Error sending voice level up notification:', error);
  }
}

async function getChannelConfig(channelId, guildId) {
  try {
    // This would fetch from database
    // For now, return default configuration
    return {
      minUsersForVoice: 2,
      voiceXpPerMinute: 5,
      enabled: true
    };
  } catch (error) {
    console.error('Error fetching channel config:', error);
    return null;
  }
}

async function logActivity(activityData) {
  try {
    // This would log to the database
    console.log('Voice activity logged:', activityData);
  } catch (error) {
    console.error('Error logging voice activity:', error);
  }
}
