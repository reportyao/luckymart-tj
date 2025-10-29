#!/bin/bash

echo "========================================="
echo "  LuckyMart TJ 自动部署脚本"
echo "========================================="
echo ""

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查sshpass是否安装
if ! command -v sshpass &> /dev/null; then
    echo -e "${RED}错误: 未安装sshpass工具${NC}"
    echo "请先安装sshpass:"
    echo "  MacOS: brew install sshpass"
    echo "  Ubuntu/Debian: sudo apt-get install sshpass"
    echo "  CentOS/RHEL: sudo yum install sshpass"
    exit 1
fi

# 步骤1: 打包文件
echo -e "${GREEN}[1/4] 正在打包修改的文件...${NC}"
cd /workspace/luckymart-tj
tar -czf /tmp/luckymart-update-$(date +%Y%m%d-%H%M%S).tar.gz \
    contexts/ \
    app/layout.tsx \
    app/page.tsx \
    app/product/\[id\]/page.tsx \
    app/api/admin/products/route.ts \
    app/api/admin/stats/ \
    app/admin/dashboard/page.tsx \
    TELEGRAM_BOT_GUIDE.md \
    DEPLOYMENT_MANUAL.md

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 文件打包成功${NC}"
else
    echo -e "${RED}✗ 文件打包失败${NC}"
    exit 1
fi

# 步骤2: 上传到服务器
echo -e "${GREEN}[2/4] 正在上传到服务器...${NC}"
sshpass -p "Lingjiu123@" scp -o StrictHostKeyChecking=no /tmp/luckymart-update-*.tar.gz root@47.243.83.253:/tmp/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 文件上传成功${NC}"
else
    echo -e "${RED}✗ 文件上传失败${NC}"
    exit 1
fi

# 步骤3: 在服务器上解压并部署
echo -e "${GREEN}[3/4] 正在服务器上部署...${NC}"
sshpass -p "Lingjiu123@" ssh -o StrictHostKeyChecking=no root@47.243.83.253 << 'ENDSSH'
cd /var/www/luckymart-tj

# 备份原文件
echo "备份原文件..."
tar -czf /tmp/backup-$(date +%Y%m%d-%H%M%S).tar.gz contexts/ app/ 2>/dev/null || true

# 解压新文件
echo "解压新文件..."
tar -xzf /tmp/luckymart-update-*.tar.gz

# 安装依赖（如果需要）
echo "检查依赖..."
npm install 2>/dev/null || true

echo "部署完成！"
ENDSSH

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 服务器部署成功${NC}"
else
    echo -e "${RED}✗ 服务器部署失败${NC}"
    exit 1
fi

# 步骤4: 重启应用
echo -e "${GREEN}[4/4] 正在重启应用...${NC}"
sshpass -p "Lingjiu123@" ssh -o StrictHostKeyChecking=no root@47.243.83.253 << 'ENDSSH'
cd /var/www/luckymart-tj
pm2 restart luckymart-web
sleep 3
pm2 status luckymart-web
ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}  部署完成！${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    echo "访问地址："
    echo "  前端: http://47.243.83.253:3000"
    echo "  管理后台: http://47.243.83.253:3000/admin"
    echo ""
    echo "请测试以下功能："
    echo "  1. 多语言切换（🇨🇳 🇬🇧 🇷🇺）"
    echo "  2. 新建商品 → 查看详情页是否有夺宝功能"
    echo "  3. 管理后台Dashboard数据是否为真实数据"
    echo "  4. Telegram Bot（发送/start测试）"
else
    echo -e "${RED}✗ 应用重启失败${NC}"
    exit 1
fi
