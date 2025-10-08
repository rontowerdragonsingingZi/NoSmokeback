const Koa = require('koa');
const bodyparser = require('koa-bodyparser');
const serve = require('koa-static');
const path = require('path');

// 引入配置
const config = require('./config/index');

// 引入數據庫工具
const { testConnection } = require('./utils/database');

// 引入路由
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const checkinRoutes = require('./routes/checkin');
const articlesRoutes = require('./routes/articles');
const healthRoutes = require('./routes/health');
const achievementsRoutes = require('./routes/achievements');
const systemRoutes = require('./routes/system');

// 引入中間件
const errorHandler = require('./middleware/errorHandler');
const responseFormatter = require('./middleware/responseFormatter');
const requestLogger = require('./middleware/requestLogger');

// 引入日誌工具
const logger = require('./utils/logger');

const app = new Koa();

// 錯誤處理中間件
app.use(errorHandler);

// 請求日誌中間件
app.use(requestLogger);

// 靜態文件服務 - 優先處理靜態文件請求，不經過格式化
// 注意：koa-static 會將指定目錄的內容暴露在根路由上
// 若要訪問 /uploads/filename.png，需要這樣配置：
app.use(serve(path.join(__dirname), {
  defer: false, // 不延遲處理，立即處理靜態文件請求
  maxage: 86400000 // 設置緩存，提高性能
}));

// 響應格式化中間件 - 放在靜態文件處理之後，只處理API響應
app.use(responseFormatter);

// CORS 跨域 - 手動設置
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  ctx.set('Access-Control-Allow-Credentials', 'true');
  
  // OPTIONS預檢請求直接返回
  if (ctx.method === 'OPTIONS') {
    ctx.status = 204;
    return;
  }
  
  await next();
});

// 解析請求體 - 排除文件上傳路徑
app.use(bodyparser({
  enableTypes: ['json', 'form'],
  jsonLimit: '10mb',
  formLimit: '10mb',
  // 排除文件上傳路徑，讓multer處理
  ignore: (ctx) => {
    return ctx.path === '/v1/user/upload-avatar';
  }
}));

// 路由 - 必須在靜態文件中間件之前
app.use(authRoutes.routes()).use(authRoutes.allowedMethods());
app.use(userRoutes.routes()).use(userRoutes.allowedMethods());
app.use(checkinRoutes.routes()).use(checkinRoutes.allowedMethods());
app.use(articlesRoutes.routes()).use(articlesRoutes.allowedMethods());
app.use(healthRoutes.routes()).use(healthRoutes.allowedMethods());
app.use(achievementsRoutes.routes()).use(achievementsRoutes.allowedMethods());
app.use(systemRoutes.routes()).use(systemRoutes.allowedMethods());

// 此處已移除重複的靜態文件服務聲明
// 靜態文件服務已移至中間件順序的前面，在responseFormatter之前

// 啟動服務
const PORT = config.port || 3000;

async function startServer() {
  try {
    // 測試數據庫連接
    await testConnection();
    
    app.listen(PORT, () => {
      logger.info('戒煙助手後端服務啟動成功！', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        serviceUrl: `http://localhost:${PORT}`,
        healthCheckUrl: `http://localhost:${PORT}/v1/health`
      });
      console.log(`戒煙助手後端服務啟動成功！`);
      console.log(`服務地址: http://localhost:${PORT}`);
      console.log(`健康檢查: http://localhost:${PORT}/v1/health`);
      console.log('');
      console.log('如果這是第一次運行，請先執行：npm run init-db');
    });
  } catch (error) {
    logger.error('服務啟動失敗', {
      error: error.message,
      stack: error.stack
    });
    console.error('服務啟動失敗:', error.message);
    console.error('請檢查數據庫連接配置並確保數據庫已初始化');
    process.exit(1);
  }
}

startServer();

module.exports = app;

