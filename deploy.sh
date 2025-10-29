#!/bin/bash

# 部署脚本 - 2025-10-29更新
# 更新内容：多语言支持、Dashboard真实数据、商品自动创建lottery_round

SERVER="root@47.243.83.253"
SERVER_DIR="/var/www/luckymart-tj"
PASSWORD="Lingjiu123@"

echo "========================================="
echo "  LuckyMart TJ 更新部署"
echo "  更新时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="

# 1. 创建临时目录
echo "📦 准备文件..."
TEMP_DIR="/workspace/tmp/deploy-$(date +%Y%m%d%H%M%S)"
mkdir -p "$TEMP_DIR"

# 2. 复制需要更新的文件
echo "📋 复制修改的文件..."
cd /workspace/luckymart-tj

# 创建目录结构
mkdir -p "$TEMP_DIR/contexts"
mkdir -p "$TEMP_DIR/app"
mkdir -p "$TEMP_DIR/app/product/[id]"
mkdir -p "$TEMP_DIR/app/api/admin/stats"
mkdir -p "$TEMP_DIR/app/api/admin/products"
mkdir -p "$TEMP_DIR/app/admin/dashboard"

# 复制文件
cp contexts/LanguageContext.tsx "$TEMP_DIR/contexts/"
cp app/layout.tsx "$TEMP_DIR/app/"
cp app/page.tsx "$TEMP_DIR/app/"
cp "app/product/[id]/page.tsx" "$TEMP_DIR/app/product/[id]/"
cp app/api/admin/stats/route.ts "$TEMP_DIR/app/api/admin/stats/"
cp app/admin/dashboard/page.tsx "$TEMP_DIR/app/admin/dashboard/"
cp app/api/admin/products/route.ts "$TEMP_DIR/app/api/admin/products/"
cp TELEGRAM_BOT_GUIDE.md "$TEMP_DIR/"

# 3. 打包
echo "📦 打包文件..."
cd "$TEMP_DIR"
tar -czf update.tar.gz *

# 4. 上传到服务器
echo "🚀 上传到服务器..."
sshpass -p "$PASSWORD" scp update.tar.gz "$SERVER:/tmp/"

# 5. 在服务器上解压和部署
echo "📂 解压并部署..."
sshpass -p "$PASSWORD" ssh "$SERVER" << 'ENDSSH'
cd /var/www/luckymart-tj
echo "创建备份..."
tar -czf ~/luckymart-backup-$(date +%Y%m%d%H%M%S).tar.gz app/ contexts/ TELEGRAM_BOT_GUIDE.md 2>/dev/null || true
echo "解压新文件..."
cd /var/www/luckymart-tj
tar -xzf /tmp/update.tar.gz
echo "重启PM2服务..."
pm2 restart luckymart-web
echo "清理临时文件..."
rm -f /tmp/update.tar.gz
echo "✅ 部署完成！"
pm2 status
ENDSSH

# 6. 清理本地临时文件
echo "🧹 清理临时文件..."
rm -rf "$TEMP_DIR"

echo ""
echo "========================================="
echo "  ✅ 部署完成！"
echo "========================================="
echo "更新内容："
echo "  1. ✅ 全站多语言支持（中英俄）"
echo "  2. ✅ Banner图文案多语言"
echo "  3. ✅ 商品详情页多语言"
echo "  4. ✅ Dashboard接入真实统计数据"
echo "  5. ✅ 商品创建自动生成lottery_round"
echo "  6. ✅ Telegram Bot使用指南"
echo ""
echo "访问地址: http://47.243.83.253:3000"
echo "管理后台: http://47.243.83.253:3000/admin"
echo "========================================="
