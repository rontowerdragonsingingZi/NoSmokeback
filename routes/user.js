const Router = require('@koa/router');
const UserController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const config = require('../config');

const router = new Router({
  prefix: `${config.apiPrefix}/user`
});

// 獲取用戶信息（需要認證）
router.get('/profile', authenticate, UserController.getProfile);

// 更新用戶信息（需要認證）
router.put('/profile', authenticate, UserController.updateProfile);

// 上傳頭像（需要認證）
router.post('/upload-avatar', authenticate, UserController.uploadAvatar);

module.exports = router;