#!/bin/bash

# ================================
# LuckyMart TJ 完整修复脚本
# 修复构建错误和数据库迁移问题
# ================================

echo "🚀 开始LuckyMart TJ完整修复流程..."
echo "========================================"

# 进入项目目录
cd /var/www/luckymart-tj || exit 1

echo "📋 第1步：清理所有缓存和构建文件..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .tsbuildinfo
rm -rf dist
rm -rf build

echo "📋 第2步：删除依赖并重新安装..."
rm -rf node_modules
rm -f package-lock.json pnpm-lock.yaml
echo "重新安装依赖中..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败，请检查网络连接或npm配置"
    exit 1
fi

echo "📋 第3步：环境变量验证..."
if [ -f ".env" ]; then
    echo "✅ .env 文件存在"
    echo "检查关键环境变量..."
    if grep -q "DATABASE_URL=" .env; then
        echo "✅ DATABASE_URL 已配置"
    else
        echo "❌ DATABASE_URL 未找到，请检查.env文件"
        exit 1
    fi
else
    echo "❌ .env 文件不存在"
    exit 1
fi

echo "📋 第4步：重新构建项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 项目构建失败"
    echo "请检查上面的错误信息"
    exit 1
fi

echo "✅ 构建成功！"

echo "📋 第5步：运行数据库迁移..."
echo "同步数据库结构..."
npx prisma db push

if [ $? -ne 0 ]; then
    echo "❌ 数据库迁移失败"
    echo "检查错误信息并修复"
    exit 1
fi

echo "✅ 数据库迁移成功！"

echo "📋 第6步：生成Prisma客户端..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Prisma客户端生成失败"
    exit 1
fi

echo "✅ Prisma客户端生成成功！"

echo "📋 第7步：重启PM2服务..."
pm2 restart luckymart-tj

if [ $? -ne 0 ]; then
    echo "❌ PM2服务重启失败"
    exit 1
fi

echo "========================================"
echo "🎉 完整修复流程已完成！"
echo "========================================"
echo ""
echo "📊 部署状态检查："
echo "----------------------------------------"
echo "🔍 检查PM2进程状态..."
pm2 list luckymart-tj || echo "PM2进程信息获取中..."
echo ""
echo "🔍 检查服务访问状态..."
sleep 3
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "服务响应检查中..."
echo ""
echo "========================================"
echo "✅ 修复完成！"
echo "项目应该现在可以正常访问了"
echo "如有任何问题，请查看上面的输出信息"
echo "========================================"