# 部署指南

本文档详细介绍LuckyMart-TJ系统的部署流程、环境配置和最佳实践。

## 📋 目录

- [部署架构](#部署架构)
- [环境要求](#环境要求)
- [服务器配置](#服务器配置)
- [数据库部署](#数据库部署)
- [应用部署](#应用部署)
- [机器人部署](#机器人部署)
- [监控配置](#监控配置)
- [备份策略](#备份策略)
- [故障恢复](#故障恢复)
- [性能优化](#性能优化)

## 🏗️ 部署架构

### 生产环境架构图
```
                    ┌─────────────────┐
                    │   Load Balancer │
                    │    (Nginx)      │
                    └─────────┬───────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
    ┌───────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
    │  Web Server 1│  │  Web Server 2│  │  Web Server 3│
    │  (Node.js)   │  │  (Node.js)   │  │  (Node.js)   │
    └───────▲──────┘  └───────▲──────┘  └───────▲──────┘
            │                 │                 │
            └─────────────────┼─────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   Redis Cluster   │
                    │    (Cache)        │
                    └─────────┬─────────┘
                              │
                    ┌─────────┴─────────┐
                    │  PostgreSQL DB    │
                    │     (Primary)     │
                    └─────────┬─────────┘
                              │
                    ┌─────────┴─────────┐
                    │ Supabase Services │
                    │  (Auth/Storage)   │
                    └───────────────────┘
```

### 环境分层
- **开发环境 (Development)**: 本地开发，功能验证
- **测试环境 (Staging)**: 完整功能测试，模拟生产环境
- **生产环境 (Production)**: 正式运行环境，高可用配置

## 🖥️ 环境要求

### 硬件要求

#### 生产环境 (推荐配置)
| 组件 | 最低配置 | 推荐配置 | 扩展配置 |
|------|----------|----------|----------|
| Web服务器 | 2核4GB | 4核8GB | 8核16GB |
| 数据库服务器 | 2核4GB | 4核8GB SSD | 8核16GB SSD |
| Redis服务器 | 1核2GB | 2核4GB | 4核8GB |
| 负载均衡器 | 1核2GB | 2核4GB | 4核8GB |

#### 存储要求
- **Web服务器**: 20GB SSD
- **数据库服务器**: 100GB SSD
- **Redis**: 5GB RAM

### 软件版本要求

#### 核心组件
- **操作系统**: Ubuntu 20.04 LTS / CentOS 8+
- **Node.js**: >= 20.14.15
- **PostgreSQL**: >= 13.0
- **Redis**: >= 6.0
- **Nginx**: >= 1.18

#### 依赖工具
- **Docker**: >= 20.0
- **Docker Compose**: >= 2.0
- **PM2**: >= 5.0 (可选)
- **Git**: >= 2.25

## 🛠️ 服务器配置

### 基础环境准备

#### 1. 系统更新
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

#### 2. 安装基础工具
```bash
# Ubuntu/Debian
sudo apt install -y curl wget git unzip software-properties-common

# CentOS/RHEL
sudo yum install -y curl wget git unzip epel-release
```

#### 3. 安装Node.js
```bash
# 使用NodeSource仓库
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

#### 4. 安装PM2
```bash
sudo npm install -g pm2

# 设置开机自启
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

#### 5. 安装Redis
```bash
# Ubuntu/Debian
sudo apt install -y redis-server

# CentOS/RHEL
sudo yum install -y redis

# 启动并设置自启
sudo systemctl enable redis-server
sudo systemctl start redis-server

# 测试连接
redis-cli ping
```

#### 6. 安装PostgreSQL
```bash
# Ubuntu/Debian
sudo apt install -y postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install -y postgresql-server postgresql-contrib

# 初始化数据库
sudo postgresql-setup initdb

# 启动并设置自启
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

#### 7. 安装Nginx
```bash
# Ubuntu/Debian
sudo apt install -y nginx

# CentOS/RHEL
sudo yum install -y nginx

# 启动并设置自启
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 安全配置

#### 1. 防火墙设置
```bash
# Ubuntu/Debian (ufw)
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

#### 2. 创建应用用户
```bash
# 创建应用用户
sudo adduser luckymart
sudo usermod -aG sudo luckymart

# 切换到应用用户
sudo su - luckymart
```

#### 3. SSH密钥配置
```bash
# 生成SSH密钥
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# 添加到GitHub/GitLab
cat ~/.ssh/id_rsa.pub
```

## 💾 数据库部署

### PostgreSQL配置

#### 1. 数据库用户和数据库创建
```bash
# 切换到postgres用户
sudo -u postgres psql

# 创建数据库和用户
CREATE DATABASE luckymart;
CREATE USER luckymart_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE luckymart TO luckymart_user;

# 退出
\q
```

#### 2. 数据库配置优化
```bash
# 编辑postgresql.conf
sudo nano /etc/postgresql/13/main/postgresql.conf

# 添加优化配置
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.7
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200

# 重启数据库
sudo systemctl restart postgresql
```

#### 3. 创建数据库迁移
```bash
# 在项目目录中
cd /home/luckymart/app

# 安装依赖
npm install

# 生成Prisma客户端
npm run prisma:generate

# 运行迁移
npm run prisma:migrate
```

### Redis配置

#### 1. Redis安全配置
```bash
# 编辑redis配置
sudo nano /etc/redis/redis.conf

# 安全设置
requirepass your_redis_password
bind 127.0.0.1
port 6379
timeout 300
maxmemory 512mb
maxmemory-policy allkeys-lru

# 重启Redis
sudo systemctl restart redis-server
```

#### 2. Redis性能优化
```bash
# 启用AOF持久化
appendonly yes
appendfsync everysec

# 重启Redis
sudo systemctl restart redis-server
```

## 🚀 应用部署

### 方法一：PM2部署 (推荐)

#### 1. 准备应用代码
```bash
# 克隆代码仓库
cd /home/luckymart
git clone <repository-url> app
cd app

# 安装依赖
npm install --production

# 构建应用
npm run build
```

#### 2. 环境配置
```bash
# 创建环境文件
cp .env.example .env.production

# 编辑生产环境配置
nano .env.production
```

```env
# 生产环境配置
NODE_ENV=production

# 数据库配置
DATABASE_URL="postgresql://luckymart_user:your_secure_password@localhost:5432/luckymart"

# Redis配置
REDIS_URL="redis://:your_redis_password@localhost:6379"

# JWT配置
JWT_SECRET="your-super-secure-jwt-secret-key"
JWT_REFRESH_SECRET="your-super-secure-refresh-secret-key"

# Supabase配置
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Telegram Bot配置
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_WEBHOOK_URL="https://your-domain.com/api/bot/webhook"

# 其他配置
LOG_LEVEL=info
```

#### 3. 创建PM2配置文件
```json
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'luckymart-web',
    script: 'npm',
    args: 'start',
    cwd: '/home/luckymart/app',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/luckymart/logs/err.log',
    out_file: '/home/luckymart/logs/out.log',
    log_file: '/home/luckymart/logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

#### 4. 启动应用
```bash
# 创建日志目录
mkdir -p /home/luckymart/logs

# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs luckymart-web
```

### 方法二：Docker部署

#### 1. 创建Docker Compose文件
```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://luckymart_user:password@db:5432/luckymart
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:13
    environment:
      POSTGRES_DB: luckymart
      POSTGRES_USER: luckymart_user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

  redis:
    image: redis:6-alpine
    command: redis-server --requirepass password
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - web
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

#### 2. 启动服务
```bash
# 构建并启动
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f web
```

### Nginx配置

#### 1. 创建Nginx配置文件
```nginx
# /etc/nginx/sites-available/luckymart
upstream luckymart {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL配置
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # 静态文件
    location /_next/static {
        proxy_pass http://luckymart;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 动态内容
    location / {
        proxy_pass http://luckymart;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API路由
    location /api/ {
        proxy_pass http://luckymart;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # API超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

#### 2. 启用站点
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/luckymart /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl reload nginx
```

## 🤖 机器人部署

### 机器人服务配置

#### 1. 创建机器人配置
```json
// bot/ecosystem.config.js
module.exports = {
  apps: [{
    name: 'luckymart-bot',
    script: 'node',
    args: 'dist/index.js',
    cwd: '/home/luckymart/bot',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info'
    },
    error_file: '/home/luckymart/logs/bot-err.log',
    out_file: '/home/luckymart/logs/bot-out.log',
    log_file: '/home/luckymart/logs/bot-combined.log',
    time: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

#### 2. 启动机器人服务
```bash
# 进入机器人目录
cd /home/luckymart/bot

# 安装依赖
npm install

# 构建TypeScript
npm run build

# 启动机器人
pm2 start ecosystem.config.js

# 设置自启
pm2 save
pm2 startup
```

### Webhook配置

#### 1. 配置Telegram Webhook
```bash
# 设置Webhook
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/api/bot/webhook",
    "allowed_updates": ["message", "callback_query"]
  }'
```

#### 2. 验证Webhook状态
```bash
# 查看Webhook信息
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

## 📊 监控配置

### 应用监控

#### 1. PM2监控
```bash
# 实时监控
pm2 monit

# 集群监控
pm2 plus

# 查看所有应用状态
pm2 list
pm2 show luckymart-web
```

#### 2. 日志管理
```bash
# 实时查看日志
pm2 logs luckymart-web

# 查看错误日志
pm2 logs luckymart-web --err

# 清空日志
pm2 flush luckymart-web
```

### 系统监控

#### 1. 安装监控工具
```bash
# 安装htop
sudo apt install htop

# 安装iotop
sudo apt install iotop

# 安装ncdu (磁盘使用分析)
sudo apt install ncdu
```

#### 2. 资源监控脚本
```bash
# 创建监控脚本
nano /home/luckymart/scripts/monitor.sh

#!/bin/bash
# 资源监控脚本

LOG_FILE="/home/luckymart/logs/system-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# CPU使用率
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')

# 内存使用率
MEM_USAGE=$(free | grep Mem | awk '{printf("%.2f", $3/$2 * 100.0)}')

# 磁盘使用率
DISK_USAGE=$(df -h / | awk 'NR==2{printf "%s", $5}')

# PM2进程状态
PM2_STATUS=$(pm2 list | grep luckymart-web | awk '{print $9}')

echo "[$DATE] CPU: ${CPU_USAGE}%, MEM: ${MEM_USAGE}%, DISK: ${DISK_USAGE}, PM2: $PM2_STATUS" >> $LOG_FILE
```

#### 3. 设置定时监控
```bash
# 编辑crontab
crontab -e

# 添加监控任务 (每5分钟执行一次)
*/5 * * * * /home/luckymart/scripts/monitor.sh
```

## 💾 备份策略

### 数据库备份

#### 1. 自动备份脚本
```bash
# 创建备份目录
mkdir -p /home/luckymart/backups/database

# 创建备份脚本
nano /home/luckymart/scripts/backup-db.sh

#!/bin/bash
# 数据库备份脚本

BACKUP_DIR="/home/luckymart/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="luckymart_backup_$DATE.sql"

# 压缩备份
pg_dump -h localhost -U luckymart_user -d luckymart | gzip > $BACKUP_DIR/$BACKUP_FILE.gz

# 删除7天前的备份
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

# 上传到云存储 (可选)
# aws s3 cp $BACKUP_DIR/$BACKUP_FILE.gz s3://your-backup-bucket/database/
```

#### 2. 设置定时备份
```bash
# 编辑crontab
crontab -e

# 每天凌晨2点备份
0 2 * * * /home/luckymart/scripts/backup-db.sh
```

### 应用代码备份

#### 1. 代码备份脚本
```bash
# 创建代码备份脚本
nano /home/luckymart/scripts/backup-code.sh

#!/bin/bash
# 应用代码备份脚本

APP_DIR="/home/luckymart/app"
BACKUP_DIR="/home/luckymart/backups/code"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 创建代码压缩包
tar -czf $BACKUP_DIR/luckymart_code_$DATE.tar.gz -C $APP_DIR .

# 保留最近30天的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

## 🔄 故障恢复

### 数据库恢复

#### 1. 从备份恢复
```bash
# 停止应用服务
pm2 stop luckymart-web

# 恢复数据库
gunzip -c /home/luckymart/backups/database/luckymart_backup_20231031_020000.sql.gz | \
psql -h localhost -U luckymart_user -d luckymart

# 重新生成Prisma客户端
npm run prisma:generate

# 启动应用服务
pm2 start luckymart-web
```

#### 2. 主从复制恢复 (生产环境)
```bash
# 提升从库为主库
sudo -u postgres pg_ctl promote -D /var/lib/postgresql/13/main

# 更新应用连接配置
# 重启应用
pm2 restart luckymart-web
```

### 应用恢复

#### 1. 从Git恢复
```bash
# 备份当前代码
mv /home/luckymart/app /home/luckymart/app_backup_$(date +%Y%m%d)

# 从Git恢复
cd /home/luckymart
git clone <repository-url> app
cd app

# 安装依赖
npm install

# 恢复环境配置
cp ../app_backup_*/.env.production .env

# 构建应用
npm run build

# 启动服务
pm2 start ecosystem.config.js
```

#### 2. Docker恢复
```bash
# 停止当前服务
docker-compose down

# 恢复代码
git pull origin main

# 重新构建和启动
docker-compose build
docker-compose up -d
```

## ⚡ 性能优化

### 应用性能优化

#### 1. Node.js优化
```bash
# 设置Node.js环境变量
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=1024"
export UV_THREADPOOL_SIZE=16

# 写入配置文件
echo 'export NODE_ENV=production' >> ~/.bashrc
echo 'export NODE_OPTIONS="--max-old-space-size=1024"' >> ~/.bashrc
```

#### 2. PM2集群配置
```json
// ecosystem.config.js
{
  "apps": [{
    "name": "luckymart-web",
    "script": "npm",
    "args": "start",
    "instances": "max",
    "exec_mode": "cluster",
    "max_memory_restart": "1G",
    "node_args": "--max-old-space-size=1024"
  }]
}
```

### 数据库性能优化

#### 1. PostgreSQL优化
```sql
-- 创建索引
CREATE INDEX CONCURRENTLY idx_users_referral_code ON users(referral_code);
CREATE INDEX CONCURRENTLY idx_referral_referrer ON referral_relationships(referrer_id);
CREATE INDEX CONCURRENTLY idx_referral_referee ON referral_relationships(referee_id);

-- 统计查询分析
ANALYZE;
```

#### 2. 缓存优化
```bash
# Redis内存优化
redis-cli CONFIG SET maxmemory 512mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

## 🔍 故障排除

### 常见问题

#### 1. 应用无法启动
```bash
# 检查端口占用
sudo netstat -tulpn | grep :3000

# 检查PM2状态
pm2 list
pm2 logs luckymart-web

# 检查环境变量
pm2 env luckymart-web
```

#### 2. 数据库连接问题
```bash
# 检查PostgreSQL状态
sudo systemctl status postgresql

# 测试数据库连接
psql -h localhost -U luckymart_user -d luckymart

# 检查连接配置
cat .env.production | grep DATABASE_URL
```

#### 3. Redis连接问题
```bash
# 检查Redis状态
sudo systemctl status redis-server

# 测试Redis连接
redis-cli -a your_redis_password ping
```

#### 4. 高负载问题
```bash
# 查看系统资源
htop
iotop

# 查看应用日志
pm2 logs luckymart-web --lines 100

# 重启应用
pm2 restart luckymart-web
```

### 紧急响应流程

#### 1. 服务中断处理
1. 检查服务状态
2. 查看错误日志
3. 重启服务
4. 监控恢复情况
5. 分析根本原因

#### 2. 数据库故障处理
1. 评估数据丢失影响
2. 从最近备份恢复
3. 验证数据完整性
4. 重启应用服务
5. 通知相关人员

#### 3. 性能问题处理
1. 识别性能瓶颈
2. 优化查询和缓存
3. 调整资源配置
4. 监控改进效果
5. 制定长期优化计划

## 📞 技术支持

### 紧急联系
- **24/7紧急支持**: +1-xxx-xxx-xxxx
- **技术支持邮箱**: tech-support@luckymart.com
- **运维团队**: Telegram @LuckymartOps

### 支持级别
- **P0 (紧急)**: 系统完全不可用，1小时内响应
- **P1 (高)**: 关键功能受损，4小时内响应
- **P2 (中)**: 部分功能异常，24小时内响应
- **P3 (低)**: 一般问题，48小时内响应

### 监控指标
- **应用可用性**: 99.9%
- **响应时间**: < 2秒
- **数据库查询时间**: < 500ms
- **系统负载**: < 80%

---

确保按照本指南进行部署，并在生产环境部署前进行充分的测试。如有问题，请及时联系技术支持团队。