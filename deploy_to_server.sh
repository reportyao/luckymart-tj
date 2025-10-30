#!/bin/bash

# LuckyMart TJ 移动端优化完整部署脚本
# 包含文件上传和服务器端部署

SERVER="47.243.83.253"
USER="root"
PASSWORD="Lingjiu123@"
PROJECT_DIR="/var/www/luckymart-tj"
ARCHIVE="mobile_optimization_files.tar.gz"

echo "=========================================="
echo "LuckyMart TJ 移动端优化 - 自动化部署"
echo "=========================================="
echo ""

# 检查压缩包
if [ ! -f "$ARCHIVE" ]; then
    echo "错误: 找不到 $ARCHIVE"
    exit 1
fi

echo "步骤 1/5: 上传文件到服务器..."
sshpass -p "$PASSWORD" scp "$ARCHIVE" "$USER@$SERVER:/tmp/" 2>&1 || {
    echo "提示: sshpass未安装，请手动上传文件"
    echo "命令: scp $ARCHIVE $USER@$SERVER:/tmp/"
    exit 1
}

echo ""
echo "步骤 2/5: 连接服务器并执行部署..."

sshpass -p "$PASSWORD" ssh "$USER@$SERVER" << 'EOFREMOTE'
set -e

echo "进入项目目录..."
cd /var/www/luckymart-tj

echo "停止服务..."
pm2 stop luckymart-web 2>/dev/null || true

echo "备份当前代码..."
BACKUP_DIR="/tmp/luckymart-backup-$(date +%Y%m%d_%H%M%S)"
cp -r /var/www/luckymart-tj "$BACKUP_DIR"
echo "备份完成: $BACKUP_DIR"

echo "解压新文件..."
tar -xzf /tmp/mobile_optimization_files.tar.gz

echo "安装依赖..."
pnpm install

echo "生成Prisma客户端..."
npx prisma generate

echo "清理缓存..."
rm -rf .next

echo "重启服务..."
pm2 restart luckymart-web || pm2 start npm --name "luckymart-web" -- run dev

echo "等待服务启动..."
sleep 5

echo "检查服务状态..."
pm2 status luckymart-web

echo ""
echo "部署完成！"
EOFREMOTE

echo ""
echo "步骤 3/5: 验证部署..."
sleep 3

# 检查网站是否可访问
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$SERVER:3000/ || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ 网站访问正常 (HTTP $HTTP_CODE)"
else
    echo "✗ 网站访问异常 (HTTP $HTTP_CODE)"
fi

echo ""
echo "=========================================="
echo "部署完成！"
echo "=========================================="
echo ""
echo "访问地址: http://$SERVER:3000"
echo ""
echo "后续步骤:"
echo "1. 访问网站验证功能"
echo "2. 检查移动端布局"
echo "3. 测试图片轮播"
echo "4. 验证营销角标"
echo ""
