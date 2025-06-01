import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertServerSchema, insertChannelConfigSchema, insertAchievementSchema, insertBackgroundSchema } from "@shared/schema";
import { requireAuth, requireServerAdmin, requireServerAccess } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
// Profile card generation function using SVG
function generateProfileCardSVG(profileData: any): string {
  const bgColor = profileData.style?.backgroundColor || '#36393F';
  const accentColor = profileData.style?.accentColor || '#5865F2';
  const textColor = profileData.style?.textColor || '#FFFFFF';
  
  const progress = profileData.stats.maxXp > 0 ? 
    Math.max(0, Math.min(1, profileData.stats.xp / profileData.stats.maxXp)) : 0;
  const progressWidth = progress * 250;
  
  const initial = (profileData.user.username || 'U').charAt(0).toUpperCase();

  return `
    <svg width="800" height="300" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="800" height="300" fill="${bgColor}"/>
      
      <!-- Border -->
      <rect x="20" y="20" width="760" height="260" fill="none" stroke="${accentColor}" stroke-width="3" rx="15"/>
      
      <!-- Avatar Circle -->
      <circle cx="100" cy="150" r="60" fill="${accentColor}" stroke="#FFFFFF" stroke-width="4"/>
      
      <!-- Avatar Initial -->
      <text x="100" y="165" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="48" font-weight="bold">${initial}</text>
      
      <!-- Username -->
      <text x="180" y="80" fill="${textColor}" font-family="Arial, sans-serif" font-size="32" font-weight="bold">${profileData.user.username || 'User'}</text>
      
      <!-- Level -->
      <text x="180" y="120" fill="${accentColor}" font-family="Arial, sans-serif" font-size="24" font-weight="bold">Level ${profileData.stats.level}</text>
      
      <!-- Rank -->
      <text x="180" y="145" fill="#B9BBBE" font-family="Arial, sans-serif" font-size="18">Rank #${profileData.stats.rank}</text>
      
      <!-- Stats -->
      <text x="180" y="180" fill="${textColor}" font-family="Arial, sans-serif" font-size="16">Messages: ${profileData.stats.totalMessages || 0}</text>
      <text x="180" y="200" fill="${textColor}" font-family="Arial, sans-serif" font-size="16">Voice Time: ${profileData.stats.voiceTime || 0}h</text>
      <text x="180" y="220" fill="${textColor}" font-family="Arial, sans-serif" font-size="16">Points: ${profileData.stats.points || 0}P</text>
      
      <!-- Progress Bar Background -->
      <rect x="450" y="170" width="250" height="20" fill="#2F3136" rx="10"/>
      
      <!-- Progress Bar Fill -->
      <rect x="450" y="170" width="${progressWidth}" height="20" fill="${accentColor}" rx="10"/>
      
      <!-- Progress Text -->
      <text x="575" y="184" text-anchor="middle" fill="${textColor}" font-family="Arial, sans-serif" font-size="14">${profileData.stats.xp}/${profileData.stats.maxXp} XP</text>
    </svg>
  `;
}

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  // Server routes
  app.get("/api/servers/:id", async (req, res) => {
    try {
      const server = await storage.getServer(req.params.id);
      if (!server) {
        return res.status(404).json({ message: "Server not found" });
      }
      res.json(server);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch server" });
    }
  });

  app.post("/api/servers", async (req, res) => {
    try {
      const serverData = insertServerSchema.parse(req.body);
      const server = await storage.createServer(serverData);
      res.status(201).json(server);
    } catch (error) {
      res.status(400).json({ message: "Invalid server data" });
    }
  });

  // Get server by ID - create if not exists
  app.get("/api/servers/:serverId", async (req, res) => {
    try {
      let server = await storage.getServer(req.params.serverId);
      
      if (!server) {
        // Server not in database, fetch from Discord API and create
        try {
          const discordResponse = await fetch(`https://discord.com/api/v10/guilds/${req.params.serverId}`, {
            headers: {
              'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
              'User-Agent': 'WangBot Dashboard (https://wangbotdash.up.railway.app, 1.0.0)',
            },
          });

          if (discordResponse.ok) {
            const discordGuild = await discordResponse.json();
            
            // Create server in database with Discord data
            const newServer = await storage.createServer({
              id: req.params.serverId,
              name: discordGuild.name,
              ownerId: discordGuild.owner_id || "unknown",
              icon: discordGuild.icon,
              settings: {
                pointsPerLevel: 100,
                levelUpMessage: "축하합니다! {user}님이 레벨 {level}에 도달했습니다!",
                levelUpChannel: null
              }
            });
            
            return res.json(newServer);
          } else {
            console.log('Discord API response:', discordResponse.status, await discordResponse.text());
            return res.status(404).json({ message: "Server not found in Discord" });
          }
        } catch (discordError) {
          console.error('Error fetching Discord guild:', discordError);
          return res.status(404).json({ message: "Server not found" });
        }
      }
      
      res.json(server);
    } catch (error) {
      console.error('Server fetch error:', error);
      res.status(500).json({ message: "Failed to fetch server" });
    }
  });

  app.patch("/api/servers/:id/settings", async (req, res) => {
    try {
      await storage.updateServerSettings(req.params.id, req.body);
      res.json({ message: "Settings updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Get user's Discord guilds
  app.get("/api/user/guilds", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      if (!user?.accessToken) {
        return res.status(401).json({ message: "No access token" });
      }

      // Fetch user's guilds from Discord API
      const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'User-Agent': 'WangBot Dashboard (https://wangbotdash.up.railway.app, 1.0.0)',
        },
      });

      if (!response.ok) {
        console.error('User Guild API Error:', response.status, await response.text());
        return res.status(500).json({ message: "Failed to fetch user guilds" });
      }

      const userGuilds = await response.json();
      
      // Filter guilds where user has admin permissions (bit 3 = ADMINISTRATOR)
      const adminGuilds = userGuilds.filter((guild: any) => 
        (parseInt(guild.permissions) & 0x8) === 0x8 || guild.owner
      );

      res.json(adminGuilds);
    } catch (error) {
      console.error('Error fetching user guilds:', error);
      res.status(500).json({ message: "Failed to fetch user guilds" });
    }
  });

  // Get bot's Discord guilds
  app.get("/api/bot/guilds", async (req, res) => {
    try {
      if (!process.env.DISCORD_BOT_TOKEN) {
        return res.status(500).json({ message: "Bot token not configured" });
      }

      // Fetch bot's guilds from Discord API v10
      const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: {
          'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          'User-Agent': 'WangBot Dashboard (https://wangbotdash.up.railway.app, 1.0.0)',
        },
      });

      if (!response.ok) {
        console.error('Bot Guild API Error:', response.status, await response.text());
        throw new Error(`Bot Guild API returned ${response.status}`);
      }

      const botGuilds = await response.json();
      console.log('Bot is in', botGuilds?.length || 0, 'guilds');

      res.json(botGuilds);
    } catch (error) {
      console.error('Error fetching bot guilds:', error);
      res.status(500).json({ message: "Failed to fetch bot guilds" });
    }
  });

  // Get user's Discord guilds with priority sorting
  app.get("/api/user/guilds", async (req, res) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || !user.accessToken) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Fetch user's guilds and bot's guilds in parallel
      const [userGuildsResponse, botGuildsResponse] = await Promise.all([
        fetch('https://discord.com/api/v10/users/@me/guilds', {
          headers: {
            'Authorization': `Bearer ${user.accessToken}`,
            'User-Agent': 'WangBot Dashboard (https://wangbotdash.up.railway.app, 1.0.0)',
          },
        }),
        fetch('https://discord.com/api/v10/users/@me/guilds', {
          headers: {
            'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            'User-Agent': 'WangBot Dashboard (https://wangbotdash.up.railway.app, 1.0.0)',
          },
        })
      ]);

      if (!userGuildsResponse.ok) {
        console.error('User Guilds API Error:', userGuildsResponse.status, await userGuildsResponse.text());
        throw new Error(`User Guilds API returned ${userGuildsResponse.status}`);
      }

      const userGuilds = await userGuildsResponse.json();
      const botGuilds = botGuildsResponse.ok ? await botGuildsResponse.json() : [];
      
      console.log('Fetched user guilds:', userGuilds?.length || 0);
      console.log('Fetched bot guilds:', botGuilds?.length || 0);

      // Create a Set of bot guild IDs for quick lookup
      const botGuildIds = new Set(botGuilds.map((guild: any) => guild.id));
      
      // Process all user guilds and categorize them
      const processedGuilds = userGuilds.map((guild: any) => {
        // Check admin permissions
        const permissions = parseInt(guild.permissions || '0');
        const hasAdminPermissions = 
          (permissions & 0x8) === 0x8 || // ADMINISTRATOR
          (permissions & 0x20) === 0x20 || // MANAGE_GUILD
          guild.owner === true;
        
        // Check if bot is in this guild
        const hasBotAccess = botGuildIds.has(guild.id);
        
        // Determine priority: admin+bot > bot only > admin only > none
        let priority = 0;
        if (hasAdminPermissions && hasBotAccess) priority = 3; // Admin + Bot
        else if (hasBotAccess) priority = 2; // Bot only
        else if (hasAdminPermissions) priority = 1; // Admin only
        
        console.log(`Guild ${guild.name}: admin=${hasAdminPermissions}, bot=${hasBotAccess}, priority=${priority}`);
        
        return {
          ...guild,
          hasAdminPermissions,
          hasBotAccess,
          priority
        };
      });

      // Filter guilds that have either admin permissions or bot access
      const relevantGuilds = processedGuilds.filter(guild => 
        guild.hasAdminPermissions || guild.hasBotAccess
      );

      // Sort by priority (highest first)
      relevantGuilds.sort((a, b) => b.priority - a.priority);
      
      console.log(`Returning ${relevantGuilds.length} relevant guilds (${relevantGuilds.filter(g => g.priority === 3).length} admin+bot, ${relevantGuilds.filter(g => g.priority === 2).length} bot-only, ${relevantGuilds.filter(g => g.priority === 1).length} admin-only)`);

      res.json(relevantGuilds);
    } catch (error) {
      console.error('Error fetching user guilds:', error);
      res.status(500).json({ message: "Failed to fetch guilds" });
    }
  });

  // User server progress routes
  app.get("/api/servers/:serverId/users/:userId", async (req, res) => {
    try {
      const userServer = await storage.getUserServer(req.params.userId, req.params.serverId);
      if (!userServer) {
        return res.status(404).json({ message: "User server data not found" });
      }
      res.json(userServer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user server data" });
    }
  });

  app.get("/api/servers/:serverId/stats", async (req, res) => {
    try {
      const stats = await storage.getServerStats(req.params.serverId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch server stats" });
    }
  });

  app.get("/api/servers/:serverId/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topUsers = await storage.getTopUsers(req.params.serverId, limit);
      res.json(topUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  app.patch("/api/servers/:serverId/users/:userId", async (req, res) => {
    try {
      await storage.updateUserServer(req.params.userId, req.params.serverId, req.body);
      res.json({ message: "User server data updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user server data" });
    }
  });

  // Channel configuration routes (Admin only)
  app.get("/api/servers/:serverId/channel-configs", async (req, res) => {
    try {
      const configs = await storage.getChannelConfigs(req.params.serverId);
      res.json(configs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch channel configs" });
    }
  });

  app.post("/api/servers/:serverId/channel-configs", async (req, res) => {
    try {
      const configData = insertChannelConfigSchema.parse({
        ...req.body,
        serverId: req.params.serverId
      });
      const config = await storage.createChannelConfig(configData);
      res.status(201).json(config);
    } catch (error) {
      res.status(400).json({ message: "Invalid channel config data" });
    }
  });

  app.patch("/api/channels/:id", requireServerAdmin, async (req, res) => {
    try {
      await storage.updateChannelConfig(parseInt(req.params.id), req.body);
      res.json({ message: "Channel config updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update channel config" });
    }
  });

  // Achievement routes
  app.get("/api/servers/:serverId/achievements", requireServerAccess, async (req, res) => {
    try {
      const achievements = await storage.getAchievements(req.params.serverId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.post("/api/servers/:serverId/achievements", requireServerAdmin, async (req, res) => {
    try {
      const achievementData = insertAchievementSchema.parse({
        ...req.body,
        serverId: req.params.serverId
      });
      const achievement = await storage.createAchievement(achievementData);
      res.status(201).json(achievement);
    } catch (error) {
      res.status(400).json({ message: "Invalid achievement data" });
    }
  });

  app.patch("/api/achievements/:id", requireServerAdmin, async (req, res) => {
    try {
      await storage.updateAchievement(parseInt(req.params.id), req.body);
      res.json({ message: "Achievement updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update achievement" });
    }
  });

  app.delete("/api/achievements/:id", requireServerAdmin, async (req, res) => {
    try {
      await storage.deleteAchievement(parseInt(req.params.id));
      res.json({ message: "Achievement deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete achievement" });
    }
  });

  app.get("/api/servers/:serverId/users/:userId/achievements", async (req, res) => {
    try {
      const achievements = await storage.getUserAchievements(req.params.userId, req.params.serverId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user achievements" });
    }
  });

  // Background marketplace routes
  app.get("/api/servers/:serverId/backgrounds", requireServerAccess, async (req, res) => {
    try {
      const backgrounds = await storage.getBackgrounds(req.params.serverId);
      res.json(backgrounds);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch backgrounds" });
    }
  });

  app.post("/api/servers/:serverId/backgrounds", requireServerAdmin, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      // Move file to permanent location
      const filename = `${Date.now()}-${req.file.originalname}`;
      const permanentPath = path.join(uploadDir, filename);
      fs.renameSync(req.file.path, permanentPath);

      const backgroundData = insertBackgroundSchema.parse({
        ...req.body,
        serverId: req.params.serverId,
        imageUrl: `/uploads/${filename}`
      });
      
      const background = await storage.createBackground(backgroundData);
      res.status(201).json(background);
    } catch (error) {
      res.status(400).json({ message: "Invalid background data" });
    }
  });

  app.patch("/api/backgrounds/:id", requireServerAdmin, async (req, res) => {
    try {
      await storage.updateBackground(parseInt(req.params.id), req.body);
      res.json({ message: "Background updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update background" });
    }
  });

  app.delete("/api/backgrounds/:id", requireServerAdmin, async (req, res) => {
    try {
      await storage.deleteBackground(parseInt(req.params.id));
      res.json({ message: "Background deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete background" });
    }
  });

  app.post("/api/backgrounds/:id/purchase", requireServerAccess, async (req, res) => {
    try {
      const { userId, serverId } = req.body;
      await storage.purchaseBackground(userId, parseInt(req.params.id), serverId);
      res.json({ message: "Background purchased successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to purchase background" });
    }
  });

  app.get("/api/servers/:serverId/users/:userId/backgrounds", requireServerAccess, async (req, res) => {
    try {
      const backgrounds = await storage.getUserBackgrounds(req.params.userId, req.params.serverId);
      res.json(backgrounds);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user backgrounds" });
    }
  });

  // Analytics routes (accessible to anyone with server access)
  app.get("/api/servers/:serverId/stats", requireServerAccess, async (req, res) => {
    try {
      const stats = await storage.getServerStats(req.params.serverId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch server stats" });
    }
  });

  app.get("/api/servers/:serverId/leaderboard", requireServerAccess, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topUsers = await storage.getTopUsers(req.params.serverId, limit);
      res.json(topUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  app.get("/api/servers/:serverId/channel-stats", requireServerAccess, async (req, res) => {
    try {
      const stats = await storage.getChannelStats(req.params.serverId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch channel stats" });
    }
  });

  // User profile data API
  app.get("/api/user-profile/:userId/:serverId", async (req, res) => {
    try {
      const { userId, serverId } = req.params;
      
      // Get user data from MongoDB
      const userServer = await storage.getUserServer(userId, serverId);
      const user = await storage.getUser(userId);
      
      if (!userServer) {
        return res.status(404).json({ message: "User data not found" });
      }

      // 올바른 XP 계산 공식
      const BASE_XP_PER_LEVEL = 100;
      const XP_MULTIPLIER = 1.2;
      
      const calculateRequiredXP = (level: number) => {
        return Math.floor(BASE_XP_PER_LEVEL * Math.pow(level, XP_MULTIPLIER));
      };
      
      // 현재 레벨의 시작 XP와 다음 레벨까지 필요한 XP 계산
      const currentLevelStartXP = userServer.level === 1 ? 0 : calculateRequiredXP(userServer.level - 1);
      const nextLevelRequiredXP = calculateRequiredXP(userServer.level);
      const progressXP = Math.max(0, userServer.xp - currentLevelStartXP);
      const neededXP = nextLevelRequiredXP - currentLevelStartXP;

      // Get user rank
      const topUsers = await storage.getTopUsers(serverId, 1000);
      const userRank = topUsers.findIndex(u => u.userId === userId) + 1;

      const response = {
        ...userServer,
        xp: progressXP,
        maxXp: neededXP,
        rank: userRank || topUsers.length + 1,
        profileCard: userServer.profileCard || {
          backgroundColor: "#36393F",
          accentColor: "#5865F2",
          progressGradient: ["#5865F2", "#FF73FA"]
        }
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Update user profile settings
  app.patch("/api/user-profile/:userId/:serverId", async (req, res) => {
    try {
      const { userId, serverId } = req.params;
      const { profileCard } = req.body;

      // Update user server profile card settings
      await storage.updateUserServer(userId, serverId, { profileCard });

      res.json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Profile card generation API (GET)
  app.get("/api/profile-card/:userId/:serverId", async (req, res) => {
    try {
      const { userId, serverId } = req.params;
      
      // Get user data from MongoDB - use defaults if not found
      let userServer = await storage.getUserServer(userId, serverId);
      if (!userServer) {
        // Create default user data for profile card generation
        userServer = {
          id: 0, // temporary ID for default user
          userId,
          serverId,
          level: 1,
          xp: 0,
          points: 0,
          totalMessages: 0,
          totalVoiceTime: 0,
          lastMessageAt: new Date(),
          lastVoiceAt: new Date(),
          profileCard: null
        };
      }

      // Get user's profile customization settings with defaults
      const user = await storage.getUser(userId);
      const profileStyle = {
        accentColor: '#5865F2',
        backgroundColor: '#36393F',
        backgroundImage: null,
        textColor: '#FFFFFF',
        // Use userServer's profileCard first, then user's settings
        ...(userServer.profileCard || {}),
        ...(user && 'profileCard' in user ? user.profileCard || {} : {})
      };

      // Get Discord user info for avatar
      let discordUser = null;
      try {
        const discordResponse = await fetch(`https://discord.com/api/users/${userId}`, {
          headers: {
            'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          },
        });
        if (discordResponse.ok) {
          discordUser = await discordResponse.json();
        }
      } catch (error) {
        console.log('Could not fetch Discord user info:', error);
      }

      // Generate profile card as SVG
      const username = discordUser?.username || `User ${userId.slice(-4)}`;
      
      let avatarUrl = null;
      if (discordUser?.avatar) {
        avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${discordUser.avatar}.png?size=256`;
      } else if (discordUser?.discriminator && discordUser.discriminator !== '0') {
        const defaultAvatarNum = parseInt(discordUser.discriminator) % 5;
        avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNum}.png`;
      } else {
        const defaultAvatarNum = (parseInt(userId) >> 22) % 6;
        avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNum}.png`;
      }

      const svg = `
        <svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <clipPath id="avatar-clip">
              <circle cx="110" cy="110" r="60"/>
            </clipPath>
          </defs>
          
          <!-- Background -->
          <rect width="800" height="400" rx="20" fill="${profileStyle.backgroundColor || '#36393F'}"/>
          
          <!-- Avatar -->
          ${avatarUrl ? `
            <image href="${avatarUrl}" x="50" y="50" width="120" height="120" clip-path="url(#avatar-clip)"/>
            <circle cx="110" cy="110" r="60" fill="none" stroke="${profileStyle.accentColor || '#5865F2'}" stroke-width="4"/>
          ` : `
            <circle cx="110" cy="110" r="60" fill="${profileStyle.accentColor || '#5865F2'}"/>
            <text x="110" y="120" text-anchor="middle" fill="white" font-size="48" font-weight="bold">?</text>
          `}
          
          <!-- Username -->
          <text x="200" y="95" fill="${profileStyle.textColor || '#FFFFFF'}" font-size="36" font-weight="bold">${username}</text>
          
          <!-- Level -->
          <text x="200" y="135" fill="${profileStyle.textColor || '#FFFFFF'}" font-size="28" font-weight="bold">Level ${userServer.level}</text>
          
          <!-- Stats boxes -->
          <rect x="50" y="220" width="180" height="70" rx="10" fill="rgba(255,255,255,0.1)"/>
          <text x="140" y="245" text-anchor="middle" fill="${profileStyle.textColor || '#FFFFFF'}" font-size="14">XP</text>
          <text x="140" y="270" text-anchor="middle" fill="${profileStyle.textColor || '#FFFFFF'}" font-size="24" font-weight="bold">${userServer.xp}</text>
          
          <rect x="250" y="220" width="180" height="70" rx="10" fill="rgba(255,255,255,0.1)"/>
          <text x="340" y="245" text-anchor="middle" fill="${profileStyle.textColor || '#FFFFFF'}" font-size="14">Messages</text>
          <text x="340" y="270" text-anchor="middle" fill="${profileStyle.textColor || '#FFFFFF'}" font-size="24" font-weight="bold">${userServer.totalMessages}</text>
          
          <rect x="450" y="220" width="180" height="70" rx="10" fill="rgba(255,255,255,0.1)"/>
          <text x="540" y="245" text-anchor="middle" fill="${profileStyle.textColor || '#FFFFFF'}" font-size="14">Voice (min)</text>
          <text x="540" y="270" text-anchor="middle" fill="${profileStyle.textColor || '#FFFFFF'}" font-size="24" font-weight="bold">${Math.round(userServer.totalVoiceTime / 60)}</text>
          
          <!-- Progress bar -->
          <rect x="50" y="320" width="700" height="20" rx="10" fill="rgba(255,255,255,0.1)"/>
          <rect x="50" y="320" width="${Math.min(700, (userServer.xp % 1000) / 1000 * 700)}" height="20" rx="10" fill="${profileStyle.accentColor || '#5865F2'}"/>
          <text x="400" y="335" text-anchor="middle" fill="${profileStyle.textColor || '#FFFFFF'}" font-size="12">${userServer.xp % 1000}/1000 XP to next level</text>
        </svg>
      `;

      res.set({
        'Content-Type': 'image/svg+xml',
        'Content-Length': Buffer.byteLength(svg, 'utf8')
      });
      res.send(svg);

    } catch (error) {
      console.error('Profile card generation error:', error);
      res.status(500).json({ message: "Failed to generate profile card" });
    }
  });

  // Profile card generation API (POST) - for bot with custom data
  app.post("/api/profile-card/:userId/:serverId", async (req, res) => {
    try {
      const { userId, serverId } = req.params;
      const profileData = req.body;
      
      // Use provided profile data or defaults
      const user = profileData.user || { username: 'Unknown', avatar: null };
      const stats = profileData.stats || { level: 1, xp: 0, totalMessages: 0, voiceTime: 0 };
      const style = profileData.style || {
        backgroundColor: '#36393F',
        accentColor: '#5865F2',
        progressGradient: ['#5865F2', '#FF73FA']
      };

      const username = user.username || 'Unknown User';
      const avatarUrl = user.avatar;

      // Calculate XP progress for current level
      const BASE_XP_PER_LEVEL = 100;
      const XP_MULTIPLIER = 1.2;
      
      function calculateRequiredXP(level: number) {
        return Math.floor(BASE_XP_PER_LEVEL * Math.pow(level, XP_MULTIPLIER));
      }
      
      const currentLevelXP = stats.level === 1 ? 0 : calculateRequiredXP(stats.level - 1);
      const nextLevelXP = calculateRequiredXP(stats.level);
      const progressXP = stats.xp - currentLevelXP;
      const neededXP = nextLevelXP - currentLevelXP;
      const progressPercent = Math.max(0, Math.min(100, (progressXP / neededXP) * 100));

      // Generate SVG profile card
      const svg = `
        <svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
          <!-- Background -->
          <rect width="800" height="400" fill="${style.backgroundColor || '#36393F'}" rx="20"/>
          
          <!-- Avatar circle or placeholder -->
          ${avatarUrl ? `
            <circle cx="110" cy="110" r="60" fill="#2F3136"/>
            <image x="50" y="50" width="120" height="120" href="${avatarUrl}" clip-path="circle(60px at 110px 110px)" />
          ` : `
            <circle cx="110" cy="110" r="60" fill="${style.accentColor || '#5865F2'}"/>
            <text x="110" y="120" text-anchor="middle" fill="white" font-size="48" font-weight="bold">?</text>
          `}
          
          <!-- Username -->
          <text x="200" y="95" fill="#FFFFFF" font-size="36" font-weight="bold">${username}</text>
          
          <!-- Level -->
          <text x="200" y="135" fill="#FFFFFF" font-size="28" font-weight="bold">Level ${stats.level}</text>
          
          <!-- Stats boxes -->
          <rect x="50" y="220" width="180" height="70" rx="10" fill="rgba(255,255,255,0.1)"/>
          <text x="140" y="245" text-anchor="middle" fill="#FFFFFF" font-size="14">XP</text>
          <text x="140" y="270" text-anchor="middle" fill="#FFFFFF" font-size="24" font-weight="bold">${stats.xp}</text>
          
          <rect x="250" y="220" width="180" height="70" rx="10" fill="rgba(255,255,255,0.1)"/>
          <text x="340" y="245" text-anchor="middle" fill="#FFFFFF" font-size="14">Messages</text>
          <text x="340" y="270" text-anchor="middle" fill="#FFFFFF" font-size="24" font-weight="bold">${stats.totalMessages || 0}</text>
          
          <rect x="450" y="220" width="180" height="70" rx="10" fill="rgba(255,255,255,0.1)"/>
          <text x="540" y="245" text-anchor="middle" fill="#FFFFFF" font-size="14">Voice (min)</text>
          <text x="540" y="270" text-anchor="middle" fill="#FFFFFF" font-size="24" font-weight="bold">${Math.round((stats.voiceTime || 0) / 60)}</text>
          
          <!-- Progress bar background -->
          <rect x="50" y="320" width="700" height="20" rx="10" fill="rgba(255,255,255,0.1)"/>
          <!-- Progress bar fill -->
          <rect x="50" y="320" width="${Math.min(700, (progressPercent / 100) * 700)}" height="20" rx="10" fill="${style.accentColor || '#5865F2'}"/>
          <!-- Progress text -->
          <text x="400" y="335" text-anchor="middle" fill="#FFFFFF" font-size="12">${progressXP}/${neededXP} XP to next level</text>
        </svg>
      `;

      res.set({
        'Content-Type': 'image/svg+xml',
        'Content-Length': Buffer.byteLength(svg, 'utf8')
      });
      res.send(svg);

    } catch (error) {
      console.error('Profile card generation error (POST):', error);
      res.status(500).json({ message: "Failed to generate profile card" });
    }
  });

  // Server information API
  app.get("/api/servers/:serverId", async (req, res) => {
    try {
      const { serverId } = req.params;
      
      // Get server from database first
      let server = await storage.getServer(serverId);
      
      // If not in database, try to fetch from Discord API
      if (!server) {
        try {
          const response = await fetch(`https://discord.com/api/v10/guilds/${serverId}`, {
            headers: {
              'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const discordGuild = await response.json();
            // Create server in database
            server = await storage.createServer({
              id: serverId,
              name: discordGuild.name,
              icon: discordGuild.icon ? `https://cdn.discordapp.com/icons/${serverId}/${discordGuild.icon}.png` : null,
              ownerId: discordGuild.owner_id,
              settings: {
                pointsPerLevel: 100,
                levelUpMessage: "축하합니다! {user}님이 레벨 {level}에 도달했습니다!"
              }
            });
          }
        } catch (error) {
          console.error('Failed to fetch guild from Discord:', error);
        }
      }
      
      if (!server) {
        return res.status(404).json({ message: "Server not found" });
      }
      
      res.json(server);
    } catch (error) {
      console.error('Server info error:', error);
      res.status(500).json({ message: "Failed to fetch server information" });
    }
  });

  // Server statistics API
  app.get("/api/servers/:serverId/stats", async (req, res) => {
    try {
      const { serverId } = req.params;
      const stats = await storage.getServerStats(serverId);
      res.json(stats);
    } catch (error) {
      console.error('Server stats error:', error);
      res.status(500).json({ message: "Failed to fetch server statistics" });
    }
  });

  // Server leaderboard API
  app.get("/api/servers/:serverId/leaderboard", async (req, res) => {
    try {
      const { serverId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      const topUsers = await storage.getTopUsers(serverId, limit);
      
      // Fetch user data for each user
      const enrichedUsers = await Promise.all(
        topUsers.map(async (userServer) => {
          const user = await storage.getUser(userServer.userId);
          return {
            ...userServer,
            user
          };
        })
      );
      
      res.json(enrichedUsers);
    } catch (error) {
      console.error('Leaderboard error:', error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  app.get("/api/servers/:serverId/activity", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const activities = await storage.getActivityLogs(req.params.serverId, days);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  // Bot guild information route
  app.get("/api/bot/guilds", async (req, res) => {
    try {
      if (!process.env.DISCORD_BOT_TOKEN) {
        return res.status(500).json({ message: "Bot token not configured" });
      }

      // Fetch bot guilds from Discord API
      const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: {
          'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch bot guilds:', response.status, response.statusText);
        return res.status(500).json({ message: "Failed to fetch bot guilds from Discord" });
      }

      const botGuilds = await response.json();
      res.json(botGuilds);
    } catch (error) {
      console.error('Bot guilds API error:', error);
      res.status(500).json({ message: "Failed to fetch bot guilds" });
    }
  });

  // Background upload and management
  app.post("/api/servers/:serverId/backgrounds", upload.single('image'), async (req, res) => {
    try {
      const { serverId } = req.params;
      const { name, description, price, category, requiredAchievementId } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      // Create background record
      const backgroundData = {
        serverId,
        name,
        description,
        imageUrl: `/uploads/${req.file.filename}`,
        creatorId: req.user?.id || 'unknown',
        price: parseInt(price) || 0,
        category,
        requiredAchievementId: requiredAchievementId ? parseInt(requiredAchievementId) : null
      };

      const background = await storage.createBackground(backgroundData);
      res.status(201).json(background);
    } catch (error) {
      console.error("Background upload error:", error);
      res.status(500).json({ message: "Failed to upload background" });
    }
  });

  app.get("/api/servers/:serverId/backgrounds", async (req, res) => {
    try {
      const backgrounds = await storage.getBackgrounds(req.params.serverId);
      res.json(backgrounds);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch backgrounds" });
    }
  });

  app.patch("/api/backgrounds/:id", async (req, res) => {
    try {
      await storage.updateBackground(parseInt(req.params.id), req.body);
      res.json({ message: "Background updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update background" });
    }
  });

  app.delete("/api/backgrounds/:id", async (req, res) => {
    try {
      await storage.deleteBackground(parseInt(req.params.id));
      res.json({ message: "Background deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete background" });
    }
  });

  // Achievement management
  app.post("/api/servers/:serverId/achievements", async (req, res) => {
    try {
      const { serverId } = req.params;
      const achievementData = {
        ...req.body,
        serverId,
        createdAt: new Date()
      };

      const achievement = await storage.createAchievement(achievementData);
      res.status(201).json(achievement);
    } catch (error) {
      console.error("Achievement creation error:", error);
      res.status(500).json({ message: "Failed to create achievement" });
    }
  });

  app.get("/api/servers/:serverId/achievements", async (req, res) => {
    try {
      const achievements = await storage.getAchievements(req.params.serverId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.patch("/api/achievements/:id", async (req, res) => {
    try {
      await storage.updateAchievement(parseInt(req.params.id), req.body);
      res.json({ message: "Achievement updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update achievement" });
    }
  });

  app.delete("/api/achievements/:id", async (req, res) => {
    try {
      await storage.deleteAchievement(parseInt(req.params.id));
      res.json({ message: "Achievement deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete achievement" });
    }
  });

  // Individual user statistics
  app.get("/api/user-stats/:userId/:serverId", async (req, res) => {
    try {
      const { userId, serverId } = req.params;
      
      // Get user server data
      const userServer = await storage.getUserServer(userId, serverId);
      if (!userServer) {
        return res.status(404).json({ message: "User not found in this server" });
      }

      // Get user basic info
      const user = await storage.getUser(userId);
      
      // Get user rank
      const topUsers = await storage.getTopUsers(serverId, 1000);
      const rank = topUsers.findIndex(u => u.userId === userId) + 1;

      // Get user achievements
      const userAchievements = await storage.getUserAchievements(userId, serverId);

      // Get user backgrounds
      const userBackgrounds = await storage.getUserBackgrounds(userId, serverId);

      // Calculate hourly activity from activity logs
      const activityLogs = await storage.getActivityLogs(serverId, 30);
      const userActivities = activityLogs.filter(log => log.userId === userId);
      
      const hourlyActivity: { [hour: number]: number } = {};
      for (let i = 0; i < 24; i++) {
        hourlyActivity[i] = 0;
      }
      
      userActivities.forEach(activity => {
        const hour = new Date(activity.timestamp).getHours();
        hourlyActivity[hour]++;
      });

      // Get channel activity from database
      const channelActivity: any[] = [];
      const channelConfigs = await storage.getChannelConfigs(serverId);
      
      for (const config of channelConfigs) {
        const channelLogs = userActivities.filter(log => 
          log.type === 'message' && log.metadata?.channelId === config.channelId
        );
        
        if (channelLogs.length > 0) {
          channelActivity.push({
            channelId: config.channelId,
            name: config.channelId,
            messageCount: channelLogs.length
          });
        }
      }

      const stats = {
        username: user?.username || `User ${userId}`,
        level: userServer.level,
        points: userServer.points,
        rank: rank || topUsers.length + 1,
        totalMessages: userServer.totalMessages,
        totalVoiceTime: userServer.totalVoiceTime,
        achievements: userAchievements,
        backgrounds: userBackgrounds,
        hourlyActivity,
        channelActivity
      };

      res.json(stats);
    } catch (error) {
      console.error("User stats error:", error);
      res.status(500).json({ message: "Failed to fetch user statistics" });
    }
  });

  // Profile card generation API for bot
  app.get("/api/profile-card/:userId/:serverId", async (req, res) => {
    try {
      const { userId, serverId } = req.params;
      
      const userServer = await storage.getUserServer(userId, serverId);
      if (!userServer) {
        return res.status(404).json({ message: "User not found in this server" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user rank
      const topUsers = await storage.getTopUsers(serverId, 1000);
      const rank = topUsers.findIndex(u => u.userId === userId) + 1;

      // Calculate level progress
      const currentLevelXP = Math.pow(userServer.level, 2) * 100;
      const nextLevelXP = Math.pow(userServer.level + 1, 2) * 100;
      const progressXP = userServer.xp - currentLevelXP;
      const neededXP = nextLevelXP - currentLevelXP;

      const profileData = {
        user: {
          username: user.username,
          id: userId
        },
        stats: {
          level: userServer.level,
          xp: progressXP,
          maxXp: neededXP,
          totalXp: userServer.xp,
          points: userServer.points,
          rank: rank,
          totalMessages: userServer.totalMessages,
          voiceTime: Math.floor(userServer.totalVoiceTime / 60)
        },
        style: {
          backgroundColor: '#36393F',
          accentColor: '#5865F2',
          textColor: '#FFFFFF'
        }
      };

      // Generate profile card SVG
      const svgContent = generateProfileCardSVG(profileData);

      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(svgContent);
    } catch (error) {
      console.error('Profile card error:', error);
      res.status(500).json({ message: "Failed to generate profile card" });
    }
  });

  app.post("/api/profile-card/:userId/:serverId", async (req, res) => {
    try {
      const profileData = req.body;
      
      // Generate profile card SVG with provided data
      const svgContent = generateProfileCardSVG(profileData);

      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(svgContent);
    } catch (error) {
      console.error('Profile card generation error:', error);
      res.status(500).json({ message: "Failed to generate profile card" });
    }
  });

  // Public channel listing endpoint - no auth required
  app.get("/api/public/servers/:serverId/channels", async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    try {
      const { serverId } = req.params;
      
      if (!process.env.DISCORD_BOT_TOKEN) {
        console.error('Discord bot token not configured');
        return res.json([]);
      }

      const response = await fetch(`https://discord.com/api/v10/guilds/${serverId}/channels`, {
        headers: {
          'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch channels:', response.status, response.statusText);
        return res.json([]);
      }

      const channels = await response.json();
      console.log('Fetched channels:', channels.length);
      // Include text channels (0), voice channels (2), and category channels (4)
      const filteredChannels = channels.filter((channel: any) => 
        channel.type === 0 || channel.type === 2 || channel.type === 4
      );
      res.json(filteredChannels);
    } catch (error) {
      console.error('Channels API error:', error);
      res.json([]);
    }
  });

  // Server channels endpoint (for achievement conditions) - with auth
  app.get("/api/servers/:serverId/channels", async (req, res) => {
    try {
      const { serverId } = req.params;
      
      if (!process.env.DISCORD_BOT_TOKEN) {
        return res.json([]);
      }

      const response = await fetch(`https://discord.com/api/v10/guilds/${serverId}/channels`, {
        headers: {
          'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return res.json([]);
      }

      const channels = await response.json();
      // Include text channels (0), voice channels (2), and category channels (4)
      const filteredChannels = channels.filter((channel: any) => 
        channel.type === 0 || channel.type === 2 || channel.type === 4
      );
      res.json(filteredChannels);
    } catch (error) {
      res.json([]);
    }
  });

  // Channel configurations endpoint
  app.get("/api/servers/:serverId/channel-configs", async (req, res) => {
    try {
      const configs = await storage.getChannelConfigs(req.params.serverId);
      res.json(configs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch channel configs" });
    }
  });

  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  });

  const httpServer = createServer(app);
  return httpServer;
}
