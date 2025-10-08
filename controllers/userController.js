const User = require('../models/User');
const multer = require('@koa/multer');
const path = require('path');
const fs = require('fs').promises;
const config = require('../config');

// 配置文件上傳
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, config.upload.uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.upload.maxFileSize
  },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式'));
    }
  }
});

class UserController {
  /**
   * 獲取用戶信息
   */
  static async getProfile(ctx) {
    const userId = ctx.state.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('用戶不存在');
      error.code = 1004;
      throw error;
    }
    
    // 獲取統計數據
    const stats = await User.getStats(userId);
    
      // 處理 quit_reason：如果已經是數組就直接使用，否則解析 JSON 字符串
      let quitReason = [];
      if (Array.isArray(user.quit_reason)) {
        quitReason = user.quit_reason;
      } else if (typeof user.quit_reason === 'string') {
        try {
          quitReason = JSON.parse(user.quit_reason);
        } catch (e) {
          quitReason = [];
        }
      }
    
      ctx.body = {
        code: 200,
        message: 'success',
        data: {
          id: user.id,
          nickname: user.nickname,
          avatarUrl: user.avatar_url,
          phoneNumber: user.phone_number,
          gender: User.genderToString(user.gender),
          age: user.age,
          smokingAge: user.smoking_age,
          dailySmoking: user.daily_smoking,
          quitReason: quitReason,
          quitStartDate: user.quit_start_date,
          quitDays: stats.quitDays,
          savedMoney: stats.savedMoney,
          savedCigarettes: stats.savedCigarettes
        }
      };
  }
  
  /**
   * 更新用戶信息
   */
  static async updateProfile(ctx) {
    const userId = ctx.state.user.id;
    const { nickname, avatarUrl, gender, age } = ctx.request.body;
    
    const updateData = {};
    if (nickname !== undefined) updateData.nickname = nickname;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (gender !== undefined) updateData.gender = gender;
    if (age !== undefined) updateData.age = age;
    
    if (Object.keys(updateData).length === 0) {
      const error = new Error('沒有要更新的字段');
      error.code = 3001;
      throw error;
    }
    
    const user = await User.update(userId, updateData);
    
    ctx.body = {
      code: 200,
      message: '更新成功',
      data: {
        userInfo: {
          id: user.id,
          nickname: user.nickname,
          avatarUrl: user.avatar_url
        }
      }
    };
  }
  
  /**
   * 上傳頭像
   */
  static async uploadAvatar(ctx) {
    try {
      // 使用multer中間件處理文件上傳（Koa方式）
      await upload.single('file')(ctx, async () => {});
      
      if (!ctx.file) {
        const error = new Error('請選擇要上傳的文件');
        error.code = 3001;
        throw error;
      }
      
      const userId = ctx.state.user.id;
      const filename = ctx.file.filename;
      const avatarUrl = `/uploads/${filename}`;
      
      // 更新用戶頭像
      await User.update(userId, { avatarUrl });
      
      ctx.body = {
        code: 200,
        message: '上傳成功',
        data: {
          avatarUrl
        }
      };
      
    } catch (error) {
      // 如果上傳失敗，刪除已上傳的文件
      if (ctx.file) {
        try {
          await fs.unlink(ctx.file.path);
        } catch (unlinkError) {
          console.error('刪除文件失敗:', unlinkError);
        }
      }
      
      // 處理multer錯誤
      if (error.code === 'LIMIT_FILE_SIZE') {
        const err = new Error('文件大小超限');
        err.code = 3005;
        throw err;
      } else if (error.message === '不支持的文件格式') {
        const err = new Error('文件格式不支持');
        err.code = 3004;
        throw err;
      }
      
      throw error;
    }
  }
}

module.exports = UserController;
