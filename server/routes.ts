import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertServerSchema, insertChannelConfigSchema, insertAchievementSchema, insertBackgroundSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

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

  app.patch("/api/servers/:id/settings", async (req, res) => {
    try {
      await storage.updateServerSettings(req.params.id, req.body);
      res.json({ message: "Settings updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Get user's Discord guilds
  app.get("/api/user/guilds", async (req, res) => {
    try {
      const user = (req.session as any)?.user;
      if (!user || !user.accessToken) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Fetch user's guilds from Discord API v10
      const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'User-Agent': 'WangBot Dashboard (https://wangbotdash.up.railway.app, 1.0.0)',
        },
      });

      if (!response.ok) {
        console.error('Discord API Error:', response.status, await response.text());
        throw new Error(`Discord API returned ${response.status}`);
      }

      const guilds = await response.json();
      console.log('Fetched guilds:', guilds?.length || 0, 'guilds');
      
      // Filter guilds where user has admin permissions
      const adminGuilds = guilds.filter((guild: any) => {
        // Check for ADMINISTRATOR permission (0x8) or MANAGE_GUILD permission (0x20) or owner
        const permissions = parseInt(guild.permissions || '0');
        const hasAdminPermissions = 
          (permissions & 0x8) === 0x8 || // ADMINISTRATOR
          (permissions & 0x20) === 0x20 || // MANAGE_GUILD
          guild.owner === true;
        
        console.log(`Guild ${guild.name}: permissions=${guild.permissions}, hasAdmin=${hasAdminPermissions}, isOwner=${guild.owner}`);
        return hasAdminPermissions;
      });
      
      console.log(`Filtered ${adminGuilds.length} admin guilds from ${guilds.length} total guilds`);

      res.json(adminGuilds);
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

  // Channel configuration routes
  app.get("/api/servers/:serverId/channels", async (req, res) => {
    try {
      const configs = await storage.getChannelConfigs(req.params.serverId);
      res.json(configs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch channel configs" });
    }
  });

  app.post("/api/servers/:serverId/channels", async (req, res) => {
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

  app.patch("/api/channels/:id", async (req, res) => {
    try {
      await storage.updateChannelConfig(parseInt(req.params.id), req.body);
      res.json({ message: "Channel config updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update channel config" });
    }
  });

  // Achievement routes
  app.get("/api/servers/:serverId/achievements", async (req, res) => {
    try {
      const achievements = await storage.getAchievements(req.params.serverId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.post("/api/servers/:serverId/achievements", async (req, res) => {
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

  app.get("/api/servers/:serverId/users/:userId/achievements", async (req, res) => {
    try {
      const achievements = await storage.getUserAchievements(req.params.userId, req.params.serverId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user achievements" });
    }
  });

  // Background marketplace routes
  app.get("/api/servers/:serverId/backgrounds", async (req, res) => {
    try {
      const backgrounds = await storage.getBackgrounds(req.params.serverId);
      res.json(backgrounds);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch backgrounds" });
    }
  });

  app.post("/api/servers/:serverId/backgrounds", upload.single('image'), async (req, res) => {
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

  app.post("/api/backgrounds/:id/purchase", async (req, res) => {
    try {
      const { userId, serverId } = req.body;
      await storage.purchaseBackground(userId, parseInt(req.params.id), serverId);
      res.json({ message: "Background purchased successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to purchase background" });
    }
  });

  app.get("/api/servers/:serverId/users/:userId/backgrounds", async (req, res) => {
    try {
      const backgrounds = await storage.getUserBackgrounds(req.params.userId, req.params.serverId);
      res.json(backgrounds);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user backgrounds" });
    }
  });

  // Analytics routes
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

  app.get("/api/servers/:serverId/channel-stats", async (req, res) => {
    try {
      const stats = await storage.getChannelStats(req.params.serverId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch channel stats" });
    }
  });

  // Profile card generation API
  app.get("/api/profile-card/:userId/:serverId", async (req, res) => {
    try {
      const { userId, serverId } = req.params;
      
      // Get user data from MongoDB
      const userServer = await storage.getUserServer(userId, serverId);
      if (!userServer) {
        return res.status(404).json({ message: "User not found in server" });
      }

      // Get user's profile customization settings with defaults
      const user = await storage.getUser(userId);
      const profileStyle = {
        accentColor: '#5865F2',
        backgroundColor: '#36393F',
        backgroundImage: null,
        textColor: '#FFFFFF',
        ...(user?.profileCard || {})
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

      // Generate profile card using Canvas
      const { createCanvas, loadImage } = await import('canvas');
      const canvas = createCanvas(800, 400);
      const ctx = canvas.getContext('2d');

      // Background with rounded corners
      ctx.fillStyle = profileStyle.backgroundColor || '#36393F';
      roundedRect(ctx, 0, 0, 800, 400, 20);
      ctx.fill();

      // Draw avatar
      const avatarSize = 120;
      const avatarX = 50;
      const avatarY = 50;

      try {
        let avatarUrl = null;
        if (discordUser?.avatar) {
          avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${discordUser.avatar}.png?size=256`;
        } else if (discordUser?.discriminator && discordUser.discriminator !== '0') {
          // Legacy default avatar
          const defaultAvatarNum = parseInt(discordUser.discriminator) % 5;
          avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNum}.png`;
        } else {
          // New default avatar
          const defaultAvatarNum = (parseInt(userId) >> 22) % 6;
          avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNum}.png`;
        }

        if (avatarUrl) {
          const avatarImage = await loadImage(avatarUrl);
          // Draw circular avatar
          ctx.save();
          ctx.beginPath();
          ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize);
          ctx.restore();

          // Avatar border
          ctx.strokeStyle = profileStyle.accentColor || '#5865F2';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
          ctx.stroke();
        }
      } catch (error) {
        console.log('Could not load avatar image:', error);
      }

      // Username
      ctx.fillStyle = profileStyle.textColor || '#FFFFFF';
      ctx.font = 'bold 36px sans-serif';
      const username = discordUser?.username || `User ${userId.slice(-4)}`;
      ctx.fillText(username, avatarX + avatarSize + 30, avatarY + 45);

      // Level display
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(`Level ${userServer.level}`, avatarX + avatarSize + 30, avatarY + 85);

      // Stats boxes
      const statY = 220;
      const statWidth = 180;
      const statHeight = 70;
      const statSpacing = 20;

      // XP stat
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      roundedRect(ctx, 50, statY, statWidth, statHeight, 10);
      ctx.fill();
      
      ctx.fillStyle = profileStyle.textColor || '#FFFFFF';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(userServer.xp.toLocaleString(), 50 + statWidth / 2, statY + 35);
      
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#B9BBBE';
      ctx.fillText('총 경험치', 50 + statWidth / 2, statY + 55);

      // Points stat
      const pointsX = 50 + statWidth + statSpacing;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      roundedRect(ctx, pointsX, statY, statWidth, statHeight, 10);
      ctx.fill();
      
      ctx.fillStyle = profileStyle.textColor || '#FFFFFF';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(userServer.points.toLocaleString(), pointsX + statWidth / 2, statY + 35);
      
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#B9BBBE';
      ctx.fillText('포인트', pointsX + statWidth / 2, statY + 55);

      // Messages stat
      const messagesX = pointsX + statWidth + statSpacing;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      roundedRect(ctx, messagesX, statY, statWidth, statHeight, 10);
      ctx.fill();
      
      ctx.fillStyle = profileStyle.textColor || '#FFFFFF';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText((userServer.totalMessages || 0).toLocaleString(), messagesX + statWidth / 2, statY + 35);
      
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#B9BBBE';
      ctx.fillText('메시지', messagesX + statWidth / 2, statY + 55);

      // Progress bar
      const progressY = 320;
      const progressWidth = 700;
      const progressHeight = 25;

      const currentLevelXP = Math.pow(userServer.level, 2) * 100;
      const nextLevelXP = Math.pow(userServer.level + 1, 2) * 100;
      const progressXP = userServer.xp - currentLevelXP;
      const neededXP = nextLevelXP - currentLevelXP;
      const percentage = Math.min((progressXP / neededXP) * 100, 100);

      // Progress background
      ctx.fillStyle = '#4F545C';
      roundedRect(ctx, 50, progressY, progressWidth, progressHeight, progressHeight / 2);
      ctx.fill();

      // Progress fill with gradient
      if (percentage > 0) {
        const gradient = ctx.createLinearGradient(50, 0, 50 + progressWidth, 0);
        gradient.addColorStop(0, profileStyle.accentColor || '#5865F2');
        gradient.addColorStop(1, profileStyle.accentColor || '#FF73FA');
        
        ctx.fillStyle = gradient;
        const fillWidth = (progressWidth * percentage) / 100;
        roundedRect(ctx, 50, progressY, fillWidth, progressHeight, progressHeight / 2);
        ctx.fill();
      }

      // Progress text
      ctx.textAlign = 'left';
      ctx.fillStyle = profileStyle.textColor || '#FFFFFF';
      ctx.font = '14px sans-serif';
      ctx.fillText('다음 레벨까지', 50, progressY - 8);
      
      ctx.textAlign = 'right';
      ctx.fillText(`${progressXP.toLocaleString()} / ${neededXP.toLocaleString()} XP`, 50 + progressWidth, progressY - 8);

      // Reset text alignment
      ctx.textAlign = 'left';

      // Convert to buffer
      const buffer = canvas.toBuffer('image/png');

      // Helper function for rounded rectangles
      function roundedRect(ctx: any, x: number, y: number, width: number, height: number, radius: number) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
      }
      
      res.set({
        'Content-Type': 'image/png',
        'Content-Length': buffer.length
      });
      res.send(buffer);

    } catch (error) {
      console.error('Profile card generation error:', error);
      res.status(500).json({ message: "Failed to generate profile card" });
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

  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  });

  const httpServer = createServer(app);
  return httpServer;
}
