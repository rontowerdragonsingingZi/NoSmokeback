const User = require('../models/User');
const VerificationCode = require('../models/VerificationCode');
const { generateToken } = require('../utils/jwt');
const logger = require('../utils/logger');

class AuthController {
  /**
   * 微信登錄（暫時模擬）
   */
  static async wechatLogin(ctx) {
    const { code, userInfo } = ctx.request.body;

    if (!code || !userInfo) {
      const error = new Error('必填參數缺失');
      error.code = 3001;
      error.status = 400;
      throw error;
    }

    // 模擬微信登錄，實際需要調用微信API獲取openid
    const mockOpenid = `wx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 檢查用戶是否已存在
    let user = await User.findByOpenid(mockOpenid);
    let isNewUser = false;

    if (!user) {
      // 創建新用戶
      const userId = await User.create({
        nickname: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
        gender: userInfo.gender === 1 ? 'male' : userInfo.gender === 2 ? 'female' : 'unknown',
        openid: mockOpenid,
        country: userInfo.country,
        province: userInfo.province,
        city: userInfo.city,
        language: userInfo.language
      });

      user = await User.findById(userId);
      isNewUser = true;
    }

    // 生成JWT token
    const token = generateToken({
      id: user.id,
      nickname: user.nickname,
      openid: user.openid
    });

    ctx.body = {
      code: 200,
      message: '登錄成功',
      data: {
        token,
        userInfo: {
          id: user.id,
          nickname: user.nickname,
          avatarUrl: user.avatar_url,
          isNewUser
        }
      },
      timestamp: Math.floor(Date.now() / 1000)
    };
  }

  /**
   * 手機號登錄
   */
  static async phoneLogin(ctx) {
    const { phoneNumber, password } = ctx.request.body;

    if (!phoneNumber) {
      const error = new Error('手機號不能為空');
      error.code = 3001;
      error.status = 400;
      throw error;
    }

    const user = await User.findByPhone(phoneNumber);
    if (!user) {
      const error = new Error('用戶不存在');
      error.code = 1004;
      error.status = 404;
      throw error;
    }

    // 如果提供了密碼，則驗證密碼
    if (password && user.password) {
      const isValidPassword = await User.verifyPassword(password, user.password);
      if (!isValidPassword) {
        const error = new Error('密碼錯誤');
        error.code = 1005;
        error.status = 400;
        throw error;
      }
    }

    // 生成JWT token
    const token = generateToken({
      id: user.id,
      nickname: user.nickname,
      phoneNumber: user.phone_number
    });

    ctx.body = {
      code: 200,
      message: '登錄成功',
      data: {
        token,
        userInfo: {
          id: user.id,
          nickname: user.nickname,
          phoneNumber: user.phone_number
        }
      },
      timestamp: Math.floor(Date.now() / 1000)
    };
  }

  /**
   * 用戶註冊
   */
  static async register(ctx) {
    const {
      phoneNumber,
      verifyCode,
      password,
      nickname,
      gender,
      age,
      smokingAge,
      dailySmoking,
      quitReason
    } = ctx.request.body;

    // 參數驗證
    if (!phoneNumber || !verifyCode || !nickname || !smokingAge || !dailySmoking || !quitReason) {
      const error = new Error('必填參數缺失');
      error.code = 3001;
      error.status = 400;
      throw error;
    }

    // 驗證驗證碼
    const isValidCode = await VerificationCode.verify(phoneNumber, verifyCode, 'register');
    if (!isValidCode) {
      const error = new Error('驗證碼錯誤或已過期');
      error.code = 1002;
      error.status = 400;
      throw error;
    }

    // 檢查用戶是否已存在
    const existingUser = await User.findByPhone(phoneNumber);
    if (existingUser) {
      const error = new Error('手機號已註冊');
      error.code = 2004;
      error.status = 400;
      throw error;
    }

    // 創建用戶
    const userId = await User.create({
      nickname,
      phoneNumber,
      password,
      gender,
      age,
      smokingAge,
      dailySmoking,
      quitReason
    });

    const user = await User.findById(userId);

    // 生成JWT token
    const token = generateToken({
      id: user.id,
      nickname: user.nickname,
      phoneNumber: user.phone_number
    });

    ctx.body = {
      code: 200,
      message: '註冊成功',
      data: {
        token,
        userInfo: {
          id: user.id,
          nickname: user.nickname,
          quitStartDate: user.quit_start_date
        }
      },
      timestamp: Math.floor(Date.now() / 1000)
    };
  }

  /**
   * 發送驗證碼
   */
  static async sendCode(ctx) {
    const { phoneNumber, type = 'register' } = ctx.request.body;

    if (!phoneNumber) {
      const error = new Error('手機號不能為空');
      error.code = 3001;
      error.status = 400;
      throw error;
    }

    // 檢查發送頻率限制
    const canSend = await VerificationCode.checkRateLimit(phoneNumber, type);
    if (!canSend) {
      const error = new Error('發送過於頻繁，請稍後再試');
      error.code = 2004;
      error.status = 400;
      throw error;
    }

    // 生成並保存驗證碼
    const code = await VerificationCode.create(phoneNumber, type);

    // 模擬發送驗證碼（暫不對接真實短信服務）
    logger.logBusiness('模擬發送驗證碼', {
      phoneNumber,
      verificationCode: code,
      type,
      action: 'send_verification_code_simulation',
      message: '這是模擬驗證碼，實際部署時需要對接短信服務商',
      expiresIn: '5分鐘'
    });
    
    // 在控制台明確標示這是模擬驗證碼
    console.log(`======== 模擬驗證碼 ========`);
    console.log(`手機號: ${phoneNumber}`);
    console.log(`驗證碼: ${code}`);
    console.log(`類型: ${type}`);
    console.log(`有效期: 5分鐘`);
    console.log(`===========================`);

    ctx.body = {
      code: 200,
      message: '驗證碼發送成功',
      data: {
        countdown: 60
      },
      timestamp: Math.floor(Date.now() / 1000)
    };
  }
}

module.exports = AuthController;