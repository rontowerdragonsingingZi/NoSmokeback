const Router = require('@koa/router');
const HealthController = require('../controllers/healthController');
const { authenticate } = require('../middleware/auth');
const config = require('../config');

const router = new Router({
  prefix: `${config.apiPrefix}/achievements`
});

// 獲取成就列表（需要認證）
router.get('/', authenticate, HealthController.getAchievements);

module.exports = router;
