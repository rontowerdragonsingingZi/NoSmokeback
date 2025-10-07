const Router = require('@koa/router');
const AuthController = require('../controllers/authController');
const config = require('../config');

const router = new Router({
  prefix: `${config.apiPrefix}/auth`
});

// 微信登錄
router.post('/wechat-login', AuthController.wechatLogin);

// 手機號登錄
router.post('/phone-login', AuthController.phoneLogin);

// 用戶註冊
router.post('/register', AuthController.register);

// 發送驗證碼
router.post('/send-code', AuthController.sendCode);

module.exports = router;