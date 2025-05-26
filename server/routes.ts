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

  app.get("/api/servers/:serverId/channel-stats", async (req, res) => {
    try {
      const stats = await storage.getChannelStats(req.params.serverId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch channel stats" });
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

  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  });

  const httpServer = createServer(app);
  return httpServer;
}
