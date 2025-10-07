const Router = require('@koa/router');
const SystemController = require('../controllers/systemController');
const { authenticate } = require('../middleware/auth');
const config = require('../config');

const router = new Router({
  prefix: `${config.apiPrefix}`
});

// 提交反饋（需要認證）
router.post('/feedback', authenticate, SystemController.submitFeedback);

// 獲取用戶反饋列表（需要認證）
router.get('/feedback', authenticate, SystemController.getFeedbackList);

// 健康檢查（無需認證）
router.get('/health', SystemController.healthCheck);

module.exports = router;