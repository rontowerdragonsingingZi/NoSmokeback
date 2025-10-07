# 日誌系統說明

## 概述
本項目使用 Winston 作為日誌框架，提供完整的日誌記錄功能。

## 日誌配置

### 日誌級別
- `error`: 錯誤信息
- `warn`: 警告信息  
- `info`: 一般信息
- `debug`: 調試信息

### 日誌輸出
1. **控制台輸出**: 彩色格式化輸出
2. **文件輸出**: 
   - `logs/app-YYYY-MM-DD.log`: 所有級別日誌
   - `logs/error-YYYY-MM-DD.log`: 僅錯誤日誌

### 日誌輪轉
- 按日期輪轉 (每天一個文件)
- 最大文件大小: 20MB
- 保留天數: 30天
- 自動壓縮舊日誌

## 使用方法

### 基本日誌記錄
```javascript
const logger = require('./utils/logger');

logger.error('錯誤信息', { error: err.message });
logger.warn('警告信息', { data: someData });
logger.info('信息', { userId: 123 });
logger.debug('調試信息', { request: ctx.request });
```

### 請求日誌
請求日誌會自動記錄所有HTTP請求，包括：
- 請求方法和URL
- 響應狀態碼
- 響應時間
- 客戶端IP
- User-Agent

### 數據庫日誌
數據庫查詢會自動記錄：
- SQL語句
- 參數
- 執行時間

### 業務日誌
```javascript
logger.logBusiness('用戶註冊', {
  userId: 123,
  phoneNumber: '138****8888'
});
```

## 環境變量配置

在 `.env` 文件中設置：
```
LOG_LEVEL=info
NODE_ENV=development
```

## 日誌查看

### 實時查看日誌
```bash
# 查看所有日誌
tail -f logs/app-2023-10-03.log

# 查看錯誤日誌
tail -f logs/error-2023-10-03.log

# 過濾特定內容
tail -f logs/app-2023-10-03.log | grep "ERROR"
```

### 查看歷史日誌
```bash
# 查看指定日期的日誌
cat logs/app-2023-10-01.log

# 搜索特定內容
grep "用戶註冊" logs/app-*.log
```

## 注意事項

1. 生產環境建議設置 `LOG_LEVEL=warn` 或 `LOG_LEVEL=error`
2. 定期清理舊日誌文件
3. 避免在日誌中記錄敏感信息（密碼、token等）
4. 使用結構化日誌格式，便於後續分析
