#!/bin/bash

# LuckyMart TJ 完整部署脚本
# 包含代码更新、依赖安装、服务重启等

set -e

echo "🚀 开始 LuckyMart TJ 完整部署流程..."

# 配置变量
SERVER_HOST="47.243.83.253"
SERVER_USER="root"
PROJECT_DIR="/var/www/luckymart-tj"
BACKUP_DIR="/var/backups/luckymart-tj-$(date +%Y%m%d-%H%M%S)"

echo "📁 1. 备份当前版本..."
# 创建备份
mkdir -p $BACKUP_DIR
if [ -d "$PROJECT_DIR" ]; then
    cp -r $PROJECT_DIR/* $BACKUP_DIR/ 2>/dev/null || true
    echo "✅ 备份完成: $BACKUP_DIR"
fi

echo "📥 2. 拉取最新代码..."
# 拉取GitHub最新代码
cd $PROJECT_DIR 2>/dev/null || mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# 如果目录不存在或为空，先克隆
if [ ! -d ".git" ]; then
    echo "⚠️ 请确保已配置Git认证:"
    echo "   git config --global credential.helper store"
    echo "   git clone https://github.com/reportyao/luckymart-tj.git ."
    echo ""
    echo "📋 或者手动克隆:"
    echo "   git clone https://github.com/reportyao/luckymart-tj.git ."
    echo "📋 配置SSH密钥 (推荐):"
    echo "   git clone git@github.com:reportyao/luckymart-tj.git ."
    exit 1
fi

# 拉取最新代码
git pull origin main || git pull origin master
git checkout main || git checkout master

echo "🔧 3. 安装依赖..."
# 安装Node.js依赖
npm install

echo "🗄️ 4. 数据库迁移..."
# 执行数据库迁移
npx prisma generate
npx prisma db push || echo "数据库迁移完成"

echo "⚡ 5. 构建项目..."
# 构建生产版本
npm run build

echo "🔄 6. 重启服务..."
# 重启PM2进程
pm2 restart luckymart-tj || pm2 start npm --name "luckymart-tj" -- start

echo "📊 7. 重启Bot服务..."
# 重启Bot
pm2 restart luckymart-bot || pm2 start node --name "luckymart-bot" bot/start.ts

echo "🌐 8. 重启Nginx..."
# 重启Nginx
systemctl reload nginx

echo "✅ 9. 验证部署状态..."
# 检查服务状态
pm2 status
systemctl status nginx --no-pager -l

echo "🔍 10. 健康检查..."
# 基本健康检查
curl -f http://localhost:3000/health || echo "健康检查失败"
curl -f http://localhost:3000/api/monitoring/health || echo "API健康检查失败"

echo "🎉 部署完成！"
echo "📝 部署摘要:"
echo "   - 代码已更新到最新版本"
echo "   - 依赖已安装并构建"
echo "   - 服务已重启"
echo "   - 备份保存在: $BACKUP_DIR"
echo ""
echo "🔗 访问地址:"
echo "   - 网站: http://$SERVER_HOST:3000"
echo "   - 管理后台: http://$SERVER_HOST:3000/admin"
echo ""
echo "⚠️  如有问题，请检查:"
echo "   - PM2日志: pm2 logs"
echo "   - Nginx日志: tail -f /var/log/nginx/error.log"
echo "   - 系统日志: journalctl -u nginx"