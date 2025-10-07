const Router = require('@koa/router');
const HealthController = require('../controllers/healthController');
const { authenticate } = require('../middleware/auth');
const config = require('../config');

const router = new Router({
  prefix: `${config.apiPrefix}/health`
});

// 基本健康檢查（無需認證）
router.get('/', HealthController.check);

// 獲取健康提示（需要認證）
router.get('/tips', authenticate, HealthController.getTips);

module.exports = router;