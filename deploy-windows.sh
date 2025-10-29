#!/bin/bash
# LuckyMart TJ - Windows Git Bash 部署脚本

echo "========================================="
echo "  LuckyMart TJ 自动部署"
echo "========================================="

# 服务器信息
SERVER="47.243.83.253"
USER="root"
PASSWORD="Lingjiu123@"
REMOTE_PATH="/var/www/luckymart-tj"

# 检查sshpass
if ! command -v sshpass &> /dev/null; then
    echo "正在安装sshpass..."
    # Git Bash on Windows 通常需要手动安装
    echo "请下载sshpass for Windows："
    echo "https://sourceforge.net/projects/sshpass/files/latest/download"
    echo ""
    echo "或者使用下面的分步命令手动部署"
    exit 1
fi

# 创建临时目录
TEMP_DIR="/tmp/luckymart-deploy"
mkdir -p $TEMP_DIR

# 打包文件
echo "[1/4] 打包文件..."
tar -czf $TEMP_DIR/update.tar.gz -C /workspace/luckymart-tj \
    contexts \
    app/layout.tsx \
    app/page.tsx \
    app/product \
    app/api/admin/products/route.ts \
    app/api/admin/stats \
    app/admin/dashboard/page.tsx \
    TELEGRAM_BOT_GUIDE.md \
    DEPLOYMENT_MANUAL.md

echo "✓ 打包完成"

# 上传文件
echo "[2/4] 上传到服务器..."
sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no \
    $TEMP_DIR/update.tar.gz $USER@$SERVER:/tmp/

echo "✓ 上传完成"

# 部署
echo "[3/4] 部署..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $USER@$SERVER << 'ENDSSH'
cd /var/www/luckymart-tj
tar -xzf /tmp/update.tar.gz
echo "✓ 解压完成"
ENDSSH

# 重启
echo "[4/4] 重启应用..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $USER@$SERVER << 'ENDSSH'
cd /var/www/luckymart-tj
pm2 restart luckymart-web
pm2 status luckymart-web
ENDSSH

echo ""
echo "========================================="
echo "  部署完成！"
echo "========================================="
echo "访问: http://47.243.83.253:3000"
