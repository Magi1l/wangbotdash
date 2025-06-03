import type { Express } from "express";
import { getAchievementsCollection, getBackgroundsCollection } from "./mongodb";
import multer from "multer";
import path from "path";
import fs from "fs";

// 간단한 파일 업로드 설정
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = 'uploads';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'));
    }
  }
});

export function setupSimpleAPI(app: Express) {
  
  // 업적 생성 - 상세 설정 포함
  app.post("/api/simple/achievements", async (req, res) => {
    try {
      console.log('Enhanced achievement creation:', req.body);
      
      const { 
        serverId, 
        name, 
        description, 
        type = 'activity', 
        pointReward = 0,
        conditionType = 'message_count',
        conditionValue = 100,
        timeLimit = 0,
        timeLimitUnit = 'days',
        channelRestricted = false,
        allowedChannels = [],
        isEvent = false,
        eventStartDate = '',
        eventEndDate = '',
        roleReward = '',
        badgeIcon = ''
      } = req.body;
      
      if (!serverId || !name || !description) {
        return res.status(400).json({ 
          success: false, 
          error: "serverId, name, description 필드가 필요합니다." 
        });
      }

      // 조건 객체 생성
      const conditions: any = {};
      switch (conditionType) {
        case 'message_count':
          conditions.messages = Number(conditionValue);
          break;
        case 'voice_time':
          conditions.voiceMinutes = Number(conditionValue);
          break;
        case 'level_reach':
          conditions.level = Number(conditionValue);
          break;
        case 'consecutive_days':
          conditions.consecutiveDays = Number(conditionValue);
          break;
        case 'reactions_given':
          conditions.reactionsGiven = Number(conditionValue);
          break;
        case 'reactions_received':
          conditions.reactionsReceived = Number(conditionValue);
          break;
        default:
          conditions.messages = Number(conditionValue);
      }

      // 시간 제한 설정
      if (timeLimit > 0) {
        conditions.timeLimit = {
          value: Number(timeLimit),
          unit: String(timeLimitUnit)
        };
      }

      // 채널 제한 설정
      if (channelRestricted && Array.isArray(allowedChannels) && allowedChannels.length > 0) {
        conditions.allowedChannels = allowedChannels;
      }

      // 보상 객체 생성
      const rewards: any = {
        points: Number(pointReward) || 0
      };

      if (roleReward && roleReward.trim()) {
        rewards.roleId = String(roleReward).trim();
      }

      const collection = getAchievementsCollection();
      const achievement = {
        id: Date.now(),
        serverId: String(serverId),
        name: String(name).trim(),
        description: String(description).trim(),
        type: String(type),
        icon: badgeIcon && badgeIcon.trim() ? String(badgeIcon).trim() : 'star',
        isHidden: false,
        conditions,
        rewards,
        eventStartDate: isEvent && eventStartDate ? new Date(eventStartDate) : null,
        eventEndDate: isEvent && eventEndDate ? new Date(eventEndDate) : null,
        isEvent: Boolean(isEvent),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await collection.insertOne(achievement);
      console.log('Enhanced achievement created:', achievement.id);
      
      res.json({ success: true, data: achievement });
    } catch (error) {
      console.error('Achievement creation error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || '업적 생성 실패' 
      });
    }
  });

  // 배경 업로드 - 매우 단순화
  app.post("/api/simple/backgrounds", upload.single('image'), async (req, res) => {
    try {
      console.log('Simple background upload:', req.body);
      console.log('Uploaded file:', req.file);
      
      const { serverId, name, description, price = 0, category = 'free' } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          error: "이미지 파일이 필요합니다." 
        });
      }

      if (!serverId || !name || !description) {
        return res.status(400).json({ 
          success: false, 
          error: "serverId, name, description 필드가 필요합니다." 
        });
      }

      const collection = getBackgroundsCollection();
      const background = {
        id: Date.now(),
        serverId,
        name: String(name).trim(),
        description: String(description).trim(),
        imageUrl: `/uploads/${req.file.filename}`,
        creatorId: 'system',
        price: Number(price) || 0,
        category: String(category),
        requiredAchievementId: null,
        isActive: true,
        sales: 0,
        createdAt: new Date()
      };

      await collection.insertOne(background);
      console.log('Background created:', background.id);
      
      res.json({ success: true, data: background });
    } catch (error) {
      console.error('Background upload error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || '배경 업로드 실패' 
      });
    }
  });

  // 업적 목록 조회
  app.get("/api/simple/achievements/:serverId", async (req, res) => {
    try {
      const collection = getAchievementsCollection();
      const achievements = await collection.find({ 
        serverId: req.params.serverId 
      }).toArray();
      
      res.json({ success: true, data: achievements });
    } catch (error) {
      console.error('Get achievements error:', error);
      res.status(500).json({ 
        success: false, 
        error: '업적 목록 조회 실패' 
      });
    }
  });

  // 배경 목록 조회
  app.get("/api/simple/backgrounds/:serverId", async (req, res) => {
    try {
      const collection = getBackgroundsCollection();
      const backgrounds = await collection.find({ 
        serverId: req.params.serverId 
      }).toArray();
      
      res.json({ success: true, data: backgrounds });
    } catch (error) {
      console.error('Get backgrounds error:', error);
      res.status(500).json({ 
        success: false, 
        error: '배경 목록 조회 실패' 
      });
    }
  });
}