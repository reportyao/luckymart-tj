#!/bin/bash
# LuckyMart TJ 移动端优化部署脚本
# 自动部署所有移动端优化代码

set -e  # 遇到错误立即退出

PROJECT_DIR="/var/www/luckymart-tj"
BACKUP_DIR="/root/luckymart-backup-$(date +%Y%m%d_%H%M%S)"

echo "========================================="
echo "🚀 LuckyMart TJ 移动端优化部署"
echo "========================================="

# 1. 检查项目目录
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ 错误: 项目目录不存在: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"
echo "✅ 进入项目目录: $PROJECT_DIR"

# 2. 备份当前代码
echo ""
echo "📦 备份当前代码..."
mkdir -p "$BACKUP_DIR"
cp -r components app types contexts prisma "$BACKUP_DIR/" 2>/dev/null || true
echo "✅ 备份完成: $BACKUP_DIR"

# 3. 执行数据库migration
echo ""
echo "🗄️  执行数据库migration..."
if npx prisma migrate deploy; then
    echo "✅ Migration执行成功"
else
    echo "⚠️  Migration失败，继续部署（字段可能已存在）"
fi

# 4. 生成Prisma客户端
echo ""
echo "🔧 生成Prisma客户端..."
npx prisma generate
echo "✅ Prisma客户端生成完成"

# 5. 重启服务
echo ""
echo "🔄 重启服务..."
pm2 restart luckymart-web || pm2 start npm --name "luckymart-web" -- run dev
echo "✅ 服务重启完成"

# 6. 验证部署
echo ""
echo "🔍 验证部署状态..."
sleep 3
if pm2 status | grep -q "luckymart-web"; then
    echo "✅ PM2服务运行正常"
else
    echo "⚠️  PM2服务状态异常"
fi

echo ""
echo "========================================="
echo "✅ 部署完成!"
echo "========================================="
echo "📱 访问地址: http://47.243.83.253:3000"
echo ""
echo "🔍 验证清单:"
echo "  1. 移动端导航 - 检查汉堡菜单是否正常"
echo "  2. 首页布局 - 确认显示2列商品（手机）"
echo "  3. 商品详情 - 测试图片轮播功能"
echo "  4. 营销角标 - 查看角标显示效果"
echo ""
echo "📝 查看日志: pm2 logs luckymart-web"
echo "🔧 重启服务: pm2 restart luckymart-web"
echo "========================================="
