import { Events } from 'discord.js';
import { awardMessageXP } from '../utils/levelSystem.js';

export default {
  name: Events.MessageCreate,
  async execute(message) {
    // Ignore bot messages and messages without content
    if (message.author.bot || !message.content || !message.guild) return;

    try {
      // Award XP for the message
      const result = await awardMessageXP(message);
      
      if (result.levelUp) {
        // Send level up notification
        await sendLevelUpNotification(message, result);
      }
    } catch (error) {
      console.error('Error processing message XP:', error);
    }
  }
};

async function sendLevelUpNotification(message, result) {
  try {
    // Get server settings for level up notifications
    const serverId = message.guild.id;
    // This would fetch from database - using defaults for now
    const settings = {
      levelUpChannel: null, // If null, send in current channel
      levelUpMessage: "🎉 축하합니다! {user}님이 레벨 {level}에 도달했습니다!",
      pointsPerLevel: 100
    };

    // Replace placeholders in message
    let levelUpText = settings.levelUpMessage
      .replace('{user}', `<@${message.author.id}>`)
      .replace('{level}', result.newLevel)
      .replace('{points}', settings.pointsPerLevel);

    // Determine which channel to send the notification
    let targetChannel = message.channel;
    if (settings.levelUpChannel) {
      const levelUpChannel = message.guild.channels.cache.get(settings.levelUpChannel);
      if (levelUpChannel) {
        targetChannel = levelUpChannel;
      }
    }

    // Create level up embed
    const levelUpEmbed = {
      color: 0x5865F2, // Discord blurple
      title: '🎊 레벨 업!',
      description: levelUpText,
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
          value: `+${settings.pointsPerLevel}P`,
          inline: true
        }
      ],
      thumbnail: {
        url: message.author.displayAvatarURL({ dynamic: true })
      },
      footer: {
        text: `${message.guild.name} 레벨링 시스템`,
        icon_url: message.guild.iconURL({ dynamic: true })
      },
      timestamp: new Date().toISOString()
    };

    await targetChannel.send({ embeds: [levelUpEmbed] });

    // Log the level up activity
    await logActivity({
      userId: message.author.id,
      serverId: message.guild.id,
      channelId: message.channel.id,
      type: 'level_up',
      xpGained: 0,
      metadata: {
        oldLevel: result.newLevel - 1,
        newLevel: result.newLevel,
        pointsAwarded: settings.pointsPerLevel
      }
    });

  } catch (error) {
    console.error('Error sending level up notification:', error);
  }
}

async function logActivity(activityData) {
  try {
    // This would log to the database
    // Implementation will be added with database integration
    console.log('Activity logged:', activityData);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}
