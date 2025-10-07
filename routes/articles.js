const Router = require('@koa/router');
const ArticleController = require('../controllers/articlesController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const config = require('../config');

const router = new Router({
  prefix: `${config.apiPrefix}/articles`
});

// 獲取文章列表（無需認證）
router.get('/', ArticleController.getList);

// 獲取文章分類（無需認證）
router.get('/categories', ArticleController.getCategories);

// 獲取文章詳情（可選認證，用於判斷點讚狀態）
router.get('/:id', optionalAuthenticate, ArticleController.getDetail);

// 點讚文章（需要認證）
router.post('/:id/like', authenticate, ArticleController.like);

module.exports = router;