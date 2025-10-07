module.exports = {
  // 服務端口
  port: process.env.PORT || 3000,
  
  // 數據庫配置
  database: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '123456',
    database: 'nosmoking',
    charset: 'utf8mb4',
    timezone: '+08:00'
  },
  
  // JWT配置
  jwt: {
    secret: 'quitsmoke_jwt_secret_key_2024',
    expiresIn: '7d'
  },
  
  // 文件上傳配置
  upload: {
    maxFileSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    uploadPath: './uploads'
  },
  
  // API基礎路徑
  apiPrefix: '/v1'
};

