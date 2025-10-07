const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// 確保日誌目錄存在
const logDir = path.join(__dirname, '../logs');

// 自定義日誌格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// 控制台輸出格式
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ' ' + JSON.stringify(meta);
    }
    return msg;
  })
);

// 創建 Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'nosmoke-backend' },
  transports: [
    // 錯誤日誌文件 (只記錄 error 級別)
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d',
      maxSize: '20m',
      zippedArchive: true
    }),
    
    // 所有日誌文件
    new DailyRotateFile({
      filename: path.join(logDir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      maxSize: '20m',
      zippedArchive: true
    }),
    
    // 控制台輸出
    new winston.transports.Console({
      format: consoleFormat
    })
  ]
});

// 開發環境下的額外配置
if (process.env.NODE_ENV === 'development') {
  logger.level = 'debug';
}

// 創建請求日誌格式化函數
logger.logRequest = (ctx, responseTime) => {
  const { method, url, ip } = ctx.request;
  const { status } = ctx.response;
  const userAgent = ctx.headers['user-agent'] || 'Unknown';
  
  const logData = {
    method,
    url,
    status,
    responseTime: `${responseTime}ms`,
    ip,
    userAgent,
    timestamp: new Date().toISOString()
  };
  
  if (status >= 400) {
    logger.warn('HTTP Request Warning', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

// 創建數據庫日誌函數
logger.logDatabase = (operation, query, params = [], duration = null) => {
  const logData = {
    operation,
    query: query.replace(/\s+/g, ' ').trim(),
    params: params.length > 0 ? params : undefined,
    duration: duration ? `${duration}ms` : undefined
  };
  
  logger.debug('Database Operation', logData);
};

// 創建業務日誌函數
logger.logBusiness = (action, details = {}) => {
  logger.info('Business Action', {
    action,
    ...details,
    timestamp: new Date().toISOString()
  });
};

module.exports = logger;
