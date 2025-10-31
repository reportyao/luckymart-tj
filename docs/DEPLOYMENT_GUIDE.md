# LuckyMart TJ 完整部署指南

## 目录
1. [系统要求](#系统要求)
2. [环境准备](#环境准备)
3. [数据库配置](#数据库配置)
4. [应用部署](#应用部署)
5. [Telegram Bot部署](#telegram-bot部署)
6. [生产环境配置](#生产环境配置)
7. [监控与维护](#监控与维护)
8. [故障排查](#故障排查)

---

## 系统要求

### 服务器配置
- **操作系统**: Ubuntu 20.04 LTS 或更高版本
- **CPU**: 2核心或以上
- **内存**: 4GB RAM 或以上
- **存储**: 50GB SSD 或以上
- **网络**: 稳定的互联网连接，建议带宽 10Mbps+

### 软件依赖
- **Node.js**: v18.17.0 或更高版本
- **npm**: v9.0.0 或更高版本
- **PostgreSQL**: v14.0 或更高版本（通过Supabase）
- **Git**: v2.30.0 或更高版本

---

## 环境准备

### 1. 安装Node.js和npm

```bash
# 使用nvm安装Node.js（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# 验证安装
node --version  # 应显示 v18.x.x
npm --version   # 应显示 9.x.x
```

### 2. 克隆项目代码

```bash
# 克隆仓库
git clone <your-repository-url> luckymart-tj
cd luckymart-tj

# 切换到主分支
git checkout main
```

### 3. 安装项目依赖

```bash
# 安装所有依赖
npm install --legacy-peer-deps

# 如果遇到权限问题
sudo npm install --legacy-peer-deps --unsafe-perm
```

---

## 数据库配置

### 1. Supabase设置

#### 创建Supabase项目
1. 访问 https://supabase.com
2. 创建新项目
3. 记录以下信息：
   - Project URL (SUPABASE_URL)
   - Anon Public Key (SUPABASE_ANON_KEY)
   - Service Role Key (SUPABASE_SERVICE_ROLE_KEY)
   - Database URL (SUPABASE_DB_URL)

#### 配置环境变量
创建 `.env.local` 文件：

```bash
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_DB_URL=<your-database-url>

# Telegram Bot配置
TELEGRAM_BOT_TOKEN=<your-bot-token>
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=<your-bot-username>

# 应用配置
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

### 2. 数据库迁移

#### 执行迁移脚本

```bash
# 方式1: 使用Supabase CLI（推荐）
npx supabase db push

# 方式2: 手动执行SQL
# 登录Supabase控制台 -> SQL Editor
# 依次执行以下脚本：
# 1. db/migration_001_show_off_system.sql
# 2. db/migration_002_admin_system.sql
# 3. db/init_permissions.sql
```

#### 验证迁移

```bash
# 使用验证脚本
# 在Supabase SQL Editor中执行
# db/verify_migration.sql

# 检查表是否创建成功
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### 3. 初始化数据

```bash
# 初始化管理员权限
# 执行 db/init_permissions.sql

# 创建初始管理员账户（在Supabase SQL Editor中）
INSERT INTO "adminPermissions" (
  "userId",
  "role",
  permissions,
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  '<your-user-id>',
  'super_admin',
  '["*"]',
  true,
  NOW(),
  NOW()
);
```

### 4. 创建数据库索引（性能优化）

```sql
-- 晒单系统索引
CREATE INDEX IF NOT EXISTS idx_show_off_hotness 
ON "showOffPosts"("hotnessScore" DESC, "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_show_off_user_posts 
ON "showOffPosts"("userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_show_off_recommendations 
ON "showOffRecommendations"("position", "priority" DESC);

CREATE INDEX IF NOT EXISTS idx_show_off_audit 
ON "showOffAuditLogs"("postId", "createdAt" DESC);

-- 用户系统索引
CREATE INDEX IF NOT EXISTS idx_users_created 
ON "users"("createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_referral_relationships 
ON "referralRelationships"("referrerId", "referredId");

-- 订单系统索引
CREATE INDEX IF NOT EXISTS idx_orders_user 
ON "orders"("userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status 
ON "orders"("status", "createdAt" DESC);

-- 夺宝系统索引
CREATE INDEX IF NOT EXISTS idx_lottery_rounds_status 
ON "lotteryRounds"("status", "drawTime");

CREATE INDEX IF NOT EXISTS idx_lottery_participations 
ON "lotteryParticipations"("roundId", "userId");
```

---

## 应用部署

### 1. 构建生产版本

```bash
# 清理缓存
rm -rf .next node_modules
npm install --legacy-peer-deps

# 构建生产版本
npm run build

# 验证构建产物
ls -la .next
```

### 2. 使用PM2部署（推荐）

#### 安装PM2

```bash
npm install -g pm2
```

#### 创建PM2配置文件

创建 `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'luckymart-tj',
      script: 'npm',
      args: 'start',
      cwd: '/path/to/luckymart-tj',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G'
    }
  ]
};
```

#### 启动应用

```bash
# 创建日志目录
mkdir -p logs

# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs luckymart-tj

# 设置开机自启
pm2 startup
pm2 save
```

### 3. 使用Docker部署（可选）

#### 创建Dockerfile

```dockerfile
FROM node:18-alpine AS base

# 安装依赖
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# 构建应用
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 生产镜像
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### 构建和运行

```bash
# 构建镜像
docker build -t luckymart-tj .

# 运行容器
docker run -d \
  --name luckymart-tj \
  -p 3000:3000 \
  --env-file .env.local \
  luckymart-tj
```

---

## Telegram Bot部署

### 1. 创建Telegram Bot

1. 与 @BotFather 对话
2. 使用 /newbot 命令创建新bot
3. 记录Bot Token
4. 配置Bot命令：
   ```
   /setcommands
   start - 开始使用
   help - 帮助信息
   profile - 我的账户
   checkin - 每日签到
   invite - 邀请好友
   ```

### 2. 配置Bot服务

#### 使用PM2运行Bot

创建 `bot-ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'luckymart-bot',
      script: 'bot/index.ts',
      interpreter: 'node',
      interpreter_args: '--loader ts-node/esm',
      cwd: '/path/to/luckymart-tj',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        TELEGRAM_BOT_TOKEN: '<your-bot-token>'
      },
      error_file: './logs/bot-err.log',
      out_file: './logs/bot-out.log',
      log_file: './logs/bot-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
```

#### 启动Bot

```bash
# 安装ts-node
npm install -g ts-node

# 启动Bot
pm2 start bot-ecosystem.config.js

# 查看状态
pm2 status luckymart-bot

# 查看日志
pm2 logs luckymart-bot
```

### 3. 配置Webhook（可选）

如果使用Webhook而非轮询：

```bash
# 设置Webhook
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://yourdomain.com/api/telegram/webhook"}'

# 验证Webhook
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

---

## 生产环境配置

### 1. Nginx反向代理

#### 安装Nginx

```bash
sudo apt update
sudo apt install nginx
```

#### 配置Nginx

创建 `/etc/nginx/sites-available/luckymart-tj`:

```nginx
upstream luckymart_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL证书配置
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 安全头部
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 日志配置
    access_log /var/log/nginx/luckymart-access.log;
    error_log /var/log/nginx/luckymart-error.log;

    # 客户端上传大小限制
    client_max_body_size 20M;

    # 代理配置
    location / {
        proxy_pass http://luckymart_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # 静态文件缓存
    location /_next/static/ {
        proxy_pass http://luckymart_backend;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # 图片缓存
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        proxy_pass http://luckymart_backend;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }
}
```

#### 启用配置

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/luckymart-tj /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

### 2. SSL证书配置

使用Let's Encrypt免费证书：

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

### 3. 防火墙配置

```bash
# 启用UFW
sudo ufw enable

# 允许SSH
sudo ufw allow 22/tcp

# 允许HTTP和HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 查看状态
sudo ufw status
```

---

## 监控与维护

### 1. PM2监控

```bash
# 实时监控
pm2 monit

# Web监控面板
pm2 plus

# 查看详细信息
pm2 show luckymart-tj

# 查看日志
pm2 logs luckymart-tj --lines 100
```

### 2. 日志管理

#### 配置日志轮转

创建 `/etc/logrotate.d/luckymart-tj`:

```
/path/to/luckymart-tj/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 3. 性能监控

#### 使用Node.js性能监控

在应用中添加：

```javascript
// lib/monitoring.ts
export const performanceMonitor = {
  trackApiCall: (endpoint: string, duration: number) => {
    if (duration > 1000) {
      console.warn(`Slow API: ${endpoint} took ${duration}ms`);
    }
  },
  
  trackMemory: () => {
    const used = process.memoryUsage();
    for (let key in used) {
      console.log(`${key}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
    }
  }
};
```

### 4. 数据库监控

在Supabase控制台：
- 查看数据库性能指标
- 监控慢查询
- 检查磁盘使用率
- 设置告警规则

### 5. 备份策略

#### 数据库备份

```bash
# 创建备份脚本 backup.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/luckymart-tj"
mkdir -p $BACKUP_DIR

# 备份Supabase数据库（使用pg_dump）
pg_dump $SUPABASE_DB_URL > $BACKUP_DIR/db_backup_$DATE.sql

# 压缩备份
gzip $BACKUP_DIR/db_backup_$DATE.sql

# 删除30天前的备份
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: db_backup_$DATE.sql.gz"
```

#### 设置定时备份

```bash
# 添加到crontab
crontab -e

# 每天凌晨2点备份
0 2 * * * /path/to/backup.sh >> /var/log/luckymart-backup.log 2>&1
```

---

## 故障排查

### 1. 应用无法启动

**问题**: npm start 失败

```bash
# 检查端口占用
sudo lsof -i :3000

# 检查Node版本
node --version

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# 检查环境变量
cat .env.local
```

### 2. 数据库连接失败

**问题**: 无法连接到Supabase

```bash
# 测试数据库连接
psql $SUPABASE_DB_URL -c "SELECT version();"

# 检查环境变量
echo $SUPABASE_DB_URL

# 检查网络连接
ping your-supabase-url.supabase.co
```

### 3. Telegram Bot无响应

**问题**: Bot不回复消息

```bash
# 检查Bot进程
pm2 status luckymart-bot

# 查看Bot日志
pm2 logs luckymart-bot

# 测试Bot Token
curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe

# 检查Webhook状态
curl https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo
```

### 4. 性能问题

**问题**: 响应缓慢

```bash
# 检查系统资源
top
free -h
df -h

# 检查Node进程
pm2 monit

# 检查Nginx日志
sudo tail -f /var/log/nginx/luckymart-error.log

# 检查数据库慢查询
# 在Supabase控制台查看
```

### 5. 内存泄漏

**问题**: 内存持续增长

```bash
# 重启应用
pm2 restart luckymart-tj

# 增加内存限制
pm2 start ecosystem.config.js --max-memory-restart 2G

# 生成内存快照
node --inspect server.js
```

---

## 维护检查清单

### 每日检查
- [ ] 查看PM2应用状态
- [ ] 检查错误日志
- [ ] 监控系统资源使用
- [ ] 验证关键功能正常

### 每周检查
- [ ] 审查访问日志
- [ ] 检查数据库性能
- [ ] 更新依赖包
- [ ] 验证备份完整性

### 每月检查
- [ ] 安全更新
- [ ] 性能优化
- [ ] 清理旧日志
- [ ] 容量规划评估

---

## 升级部署流程

### 1. 准备升级

```bash
# 备份当前版本
cp -r /path/to/luckymart-tj /backups/luckymart-tj-$(date +%Y%m%d)

# 备份数据库
./backup.sh
```

### 2. 拉取新代码

```bash
cd /path/to/luckymart-tj
git fetch origin
git checkout main
git pull origin main
```

### 3. 安装依赖和构建

```bash
npm install --legacy-peer-deps
npm run build
```

### 4. 数据库迁移

```bash
# 执行新的迁移脚本（如有）
npx supabase db push
```

### 5. 重启应用

```bash
# 零停机重启
pm2 reload luckymart-tj

# 验证服务
pm2 status
curl https://yourdomain.com/api/health
```

### 6. 验证功能

- 测试关键功能
- 检查错误日志
- 监控性能指标

---

## 联系支持

如遇到问题，请：
1. 查看日志文件
2. 参考故障排查章节
3. 联系技术支持团队

---

**文档版本**: 1.0.0  
**最后更新**: 2025年10月31日  
**维护团队**: MiniMax Agent
