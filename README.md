# 戒煙助手後端服務

基於 Node.js (Koa) + MySQL 的戒煙助手小程序後端API服務。

## 功能特性

- 用戶認證（手機號註冊/登錄，微信登錄模擬）
- 用戶信息管理（資料更新，頭像上傳）
- 打卡管理（每日打卡，統計數據，日曆視圖）
- 資訊管理（文章列表，詳情，分類，點讚）
- 健康數據（戒煙進度提示，成就系統）
- 系統功能（意見反饋，健康檢查）

## 技術棧

- **框架**: Koa.js
- **數據庫**: MySQL 8.0
- **認證**: JWT
- **文件上傳**: Multer
- **密碼加密**: bcryptjs

## 快速開始

### 1. 環境要求

- Node.js >= 16.0.0
- MySQL >= 8.0
- npm >= 8.0.0

### 2. 安裝依賴

```bash
npm install
```

### 3. 配置數據庫

確保 MySQL 服務已啟動，並使用以下配置：
- 主機: localhost
- 端口: 3306
- 用戶名: root
- 密碼: 123456
- 數據庫: nosmoking

### 4. 檢查現有數據庫

```bash
npm run check-db
```

查看現有數據庫結構和數據情況。

### 5. 設置缺失表（如需要）

```bash
npm run setup-db
```

此命令會：
- 檢查並創建缺失的數據表（驗證碼、點讚、成就、反饋等）
- 插入成就初始數據
- 保持現有數據完整性

### 6. 啟動服務

```bash
npm start
```

服務將在 `http://localhost:3000` 啟動。

## API文檔

### 基礎信息

- **基礎URL**: `http://localhost:3000/v1`
- **請求格式**: JSON
- **響應格式**: JSON
- **字符編碼**: UTF-8

### 認證方式

大部分接口需要在請求頭中添加：
```
Authorization: Bearer {JWT_TOKEN}
```

### 主要接口

#### 用戶認證
- `POST /v1/auth/wechat-login` - 微信登錄（模擬）
- `POST /v1/auth/phone-login` - 手機號登錄
- `POST /v1/auth/register` - 用戶註冊
- `POST /v1/auth/send-code` - 發送驗證碼

#### 用戶管理
- `GET /v1/user/profile` - 獲取用戶信息
- `PUT /v1/user/profile` - 更新用戶信息
- `POST /v1/user/upload-avatar` - 上傳頭像

#### 打卡管理
- `POST /v1/checkin` - 提交打卡
- `GET /v1/checkin/calendar` - 獲取打卡日曆
- `GET /v1/checkin/stats` - 獲取打卡統計
- `GET /v1/checkin/detail` - 獲取打卡詳情

#### 文章資訊
- `GET /v1/articles` - 獲取文章列表
- `GET /v1/articles/categories` - 獲取文章分類
- `GET /v1/articles/:id` - 獲取文章詳情
- `POST /v1/articles/:id/like` - 點讚文章

#### 健康數據
- `GET /v1/health/tips` - 獲取健康提示
- `GET /v1/achievements` - 獲取成就列表

#### 系統功能
- `POST /v1/feedback` - 提交反饋
- `GET /v1/feedback` - 獲取反饋列表
- `GET /v1/health` - 服務健康檢查

### 響應格式

成功響應：
```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": 1642584123
}
```

錯誤響應：
```json
{
  "code": 1001,
  "message": "錯誤描述",
  "data": null,
  "timestamp": 1642584123
}
```

## 數據庫適配

本項目已適配現有的 `nosmoking` 數據庫，具體適配情況：

### 現有表結構（已適配）
- `users` - 用戶表，使用 `openid` 字段和數字類型的 `gender`
- `check_ins` - 打卡記錄表（複數形式）
- `articles` - 文章表，使用數字類型的 `status` 字段

### 自動創建的補充表
- `verification_codes` - 驗證碼表
- `article_likes` - 文章點讚記錄表  
- `achievements` - 成就表
- `user_achievements` - 用戶成就關聯表
- `feedback` - 用戶反饋表

## 項目結構

```
├── app.js                      # 應用入口文件
├── config/
│   └── index.js               # 配置文件
├── controllers/               # 控制器層
├── middleware/                # 中間件
├── models/                    # 數據模型層
├── routes/                    # 路由層
├── utils/                     # 工具函數
├── uploads/                   # 上傳文件目錄
├── examples/
│   └── api-test.js            # API測試示例
└── scripts/
    ├── checkDatabase.js       # 數據庫結構檢查腳本
    └── createMissingTables.js # 創建缺失表腳本
```

## 開發說明

### 驗證碼功能

當前版本中，驗證碼功能使用隨機數字模擬，控制台會輸出驗證碼。生產環境需要對接實際的短信服務商。

### 微信登錄

當前版本模擬微信登錄流程，生產環境需要對接微信小程序API。

### 文件上傳

- 支持格式：JPG, PNG
- 最大大小：2MB
- 上傳路徑：`./uploads`

## 錯誤碼說明

- `1xxx`: 用戶認證相關錯誤
- `2xxx`: 業務邏輯相關錯誤
- `3xxx`: 參數驗證相關錯誤
- `5xxx`: 服務器錯誤

## 注意事項

1. 本項目僅用於開發測試，生產環境需要額外的安全配置
2. 數據庫密碼等敏感信息應使用環境變量管理
3. 建議使用反向代理（如Nginx）來處理靜態文件和HTTPS
4. 生產環境建議添加請求限流、日誌記錄等功能

## License

ISC