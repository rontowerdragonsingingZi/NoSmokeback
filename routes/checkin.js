const Router = require('@koa/router');
const CheckinController = require('../controllers/checkinController');
const { authenticate } = require('../middleware/auth');
const config = require('../config');

const router = new Router({
  prefix: `${config.apiPrefix}/checkin`
});

// 提交打卡（需要認證）
router.post('/', authenticate, CheckinController.submitCheckin);

// 獲取打卡日曆（需要認證）
router.get('/calendar', authenticate, CheckinController.getCalendar);

// 獲取打卡統計（需要認證）
router.get('/stats', authenticate, CheckinController.getStats);

// 獲取打卡詳情（需要認證）
router.get('/detail', authenticate, CheckinController.getDetail);

module.exports = router;