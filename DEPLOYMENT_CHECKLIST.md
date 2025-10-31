# LuckyMartTJ 多层级邀请裂变系统 - 部署检查清单

## 🚀 快速部署检查清单

### 📋 部署前环境变量配置

#### **核心环境变量**
```bash
# Supabase 配置（必需）
SUPABASE_ACCESS_TOKEN=sbp_oauth_9f50211ecbae5ef9f1c3a335f09b340f6af0a37c
SUPABASE_PROJECT_ID=ijcbozvagquzwgjvxtsu
SUPABASE_URL=https://ijcbozvagquzwgjvxtsu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqY2JvenZhZ3F1endnanZ4dHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MzI4MTIsImV4cCI6MjA3NzIwODgxMn0.t45PVuJxEXbK3RS-lhv0ytNdYXGeOGpEoBz5rjW2RYU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqY2JvenZhZ3F1endnanZ4dHN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTYzMjgxMiwiZXhwIjoyMDc3MjA4ODEyfQ.fGirFEOTEim8lPqAJpsIyqqblBLx0wxubvD7p1SxztI

# JWT 密钥（必需 - 32位以上）
JWT_SECRET=your_jwt_secret_key_minimum_32_characters_long_string_here
JWT_REFRESH_SECRET=your_refresh_secret_key_minimum_32_characters_long_string_here
JWT_ADMIN_SECRET=your_admin_secret_key_minimum_32_characters_long_string_here

# Redis 配置（推荐）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0
REDIS_KEY_PREFIX=luckymart:
```

#### **Telegram Bot 配置（可选）**
```bash
# Telegram Bot 配置
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_BOT_USERNAME=your_bot_username

# MiniApp 配置
MINI_APP_URL=http://your-domain.com:3000
```

#### **服务器配置（生产环境）**
```bash
# 服务器信息
SERVER_IP=your_server_ip
SERVER_USER=root
SERVER_PASSWORD=your_server_password

# 数据库配置（如果使用独立数据库）
DATABASE_URL=postgresql://user:password@localhost:5432/luckymart_db
```

### 🗄️ 数据库迁移步骤

#### **1. 运行数据库迁移**
```bash
# 执行所有数据库迁移
npm run prisma:migrate

# 生成Prisma客户端
npm run prisma:generate
```

#### **2. 验证数据库表创建**
确保以下表已成功创建：
- ✅ `referral_relationships` - 推荐关系表
- ✅ `reward_config` - 奖励配置表
- ✅ `reward_config_history` - 配置历史表
- ✅ `reward_transactions` - 奖励流水表
- ✅ `device_fingerprints` - 设备指纹表
- ✅ `device_blacklist` - 设备黑名单表
- ✅ `fraud_detection_logs` - 欺诈检测日志表
- ✅ `instagram_shares` - Instagram分享表
- ✅ `users` 表已更新（新增推荐相关字段）

#### **3. 初始化奖励配置**
```bash
# 初始化默认奖励配置
npm run reward-config:init
```

### 🔧 系统配置验证

#### **1. 环境变量检查**
```bash
# 运行环境检查脚本
npm run cache:status
```

#### **2. 缓存系统启动**
```bash
# 启动Redis和缓存系统
npm run cache:start
npm run cache:health
```

#### **3. API健康检查**
```bash
# 测试核心API
curl -X GET http://localhost:3000/api/monitoring/health
```

### 🎯 功能模块验证

#### **1. 推荐系统核心功能**
- [ ] `/api/referral/my-code` - 获取邀请码API
- [ ] `/api/referral/bind` - 推荐关系绑定API
- [ ] `/api/referral/calculate-rebate` - 返利计算API
- [ ] `/api/referral/trigger-reward` - 奖励触发API
- [ ] `/api/referral/stats` - 统计信息API

#### **2. 管理后台功能**
- [ ] `/api/admin/reward-config` - 奖励配置管理API
- [ ] `/api/admin/reward-config/batch-update` - 批量配置API
- [ ] `/admin/reward-config` - 管理界面访问

#### **3. 防作弊系统**
- [ ] 设备指纹识别功能
- [ ] 自我推荐拦截
- [ ] 循环推荐检测
- [ ] 批量注册监控

#### **4. Instagram海报生成**
- [ ] `/api/referral/generate-instagram-poster` - 海报生成API
- [ ] 海报模板渲染
- [ ] 二维码集成

#### **5. Telegram Bot升级**
- [ ] Bot启动：`npm run bot:dev`
- [ ] 奖励通知功能
- [ ] 管理员命令响应

### 🧪 测试验证

#### **1. 运行测试套件**
```bash
# 运行所有测试
npm run test:all

# 运行覆盖率测试
npm run test:coverage

# 运行性能测试
npm run benchmark
```

#### **2. 核心业务流程测试**
- [ ] 新用户注册和推荐关系绑定
- [ ] 奖励配置修改和生效
- [ ] 消费返利计算和发放
- [ ] 防作弊检测和拦截
- [ ] 海报生成和分享

### 🚀 生产环境部署

#### **1. 构建应用**
```bash
# 安装依赖
npm install

# 构建生产版本
npm run build

# 启动生产服务
npm run start
```

#### **2. PM2部署（推荐）**
```bash
# 使用PM2管理进程
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### **3. Nginx配置**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 📊 监控和维护

#### **1. 系统监控**
- [ ] 设置服务器资源监控
- [ ] 配置数据库性能监控
- [ ] 设置Redis缓存监控
- [ ] 配置错误日志收集

#### **2. 定期维护任务**
```bash
# 清理过期数据（建议每日执行）
npm run cache:cleanup

# 备份数据库
# 检查系统健康状态
npm run cache:health
```

### ⚠️ 重要注意事项

#### **安全性检查**
- [ ] 确保所有JWT密钥都是强随机字符串（32位以上）
- [ ] 验证Supabase密钥安全性
- [ ] 检查Redis密码强度
- [ ] 确认Telegram Bot Token安全

#### **性能优化**
- [ ] 启用Redis缓存
- [ ] 配置数据库索引
- [ ] 优化API响应时间
- [ ] 设置合适的缓存TTL

#### **备份策略**
- [ ] 设置数据库自动备份
- [ ] 备份Redis持久化数据
- [ ] 备份配置文件
- [ ] 保存环境变量备份

### 🔗 有用的链接

- **GitHub仓库**: https://github.com/reportyao/luckymart-tj
- **发布版本**: https://github.com/reportyao/luckymart-tj/releases/tag/v1.0.0
- **Supabase控制台**: https://supabase.com/dashboard/project/ijcbozvagquzwgjvxtsu
- **API文档**: `/docs/api/README.md`
- **开发者指南**: `/docs/developer-guide.md`

---

## ✅ 部署完成确认

在完成以上所有步骤后，确认以下关键指标：

- [ ] 所有环境变量已正确配置
- [ ] 数据库迁移成功完成
- [ ] 缓存系统正常运行
- [ ] 核心API接口正常响应
- [ ] 管理后台可以正常访问
- [ ] 测试套件运行通过
- [ ] 监控系统正常运行

**恭喜！LuckyMartTJ多层级邀请裂变系统已成功部署！** 🎉

如遇到问题，请参考 `/docs/` 目录下的详细文档或检查项目README.md。
