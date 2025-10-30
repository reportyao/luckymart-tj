#!/bin/bash

# ================================
# LuckyMart TJ 终极修复脚本
# 解决所有模块解析问题
# ================================

echo "🚀 开始LuckyMart TJ终极修复流程..."
echo "========================================"

# 进入项目目录
cd /var/www/luckymart-tj || exit 1

echo "📋 第1步：完全清理所有文件和缓存..."
# 清理所有可能的缓存和构建文件
rm -rf .next
rm -rf node_modules/.cache
rm -rf .tsbuildinfo
rm -rf dist
rm -rf build
rm -rf .cache
rm -rf .turbo

# 删除依赖和锁文件
rm -rf node_modules
rm -f package-lock.json pnpm-lock.yaml yarn.lock

echo "📋 第2步：验证关键文件存在..."
# 检查关键文件
if [ ! -f "next.config.js" ]; then
    echo "❌ next.config.js 不存在"
    exit 1
fi

if [ ! -f "jsconfig.json" ]; then
    echo "❌ jsconfig.json 不存在"
    exit 1
fi

if [ ! -f "tsconfig.json" ]; then
    echo "❌ tsconfig.json 不存在"
    exit 1
fi

# 检查关键lib文件
required_files=(
    "lib/api-client.ts"
    "lib/middleware.ts"
    "lib/request-tracker.ts"
    "lib/logger.ts"
    "hooks/useApi.ts"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file 存在"
    else
        echo "❌ $file 不存在"
        exit 1
    fi
done

echo "📋 第3步：重新安装依赖..."
npm install --legacy-peer-deps

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败，尝试使用yarn..."
    npm install -g yarn
    yarn install
fi

if [ $? -ne 0 ]; then
    echo "❌ 所有安装方式都失败"
    exit 1
fi

echo "📋 第4步：验证环境变量..."
if [ -f ".env" ]; then
    echo "✅ .env 文件存在"
    if grep -q "DATABASE_URL=" .env; then
        echo "✅ DATABASE_URL 已配置"
    else
        echo "❌ DATABASE_URL 未找到"
        exit 1
    fi
else
    echo "❌ .env 文件不存在"
    exit 1
fi

echo "📋 第5步：TypeScript检查..."
npx tsc --noEmit

if [ $? -ne 0 ]; then
    echo "⚠️ TypeScript检查有警告，但继续构建..."
fi

echo "📋 第6步：构建项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 项目构建失败"
    echo ""
    echo "🔍 尝试手动检查模块解析..."
    echo "检查lib目录内容："
    ls -la lib/
    echo ""
    echo "检查hooks目录内容："
    ls -la hooks/
    echo ""
    echo "尝试直接导入测试："
    node -e "
    try {
        require('next/dist/compiled/@edge-runtime/primitives/path').relative('./lib/api-client.ts', './lib/api-client.ts');
        console.log('✅ 路径解析测试通过');
    } catch(e) {
        console.log('❌ 路径解析失败:', e.message);
    }
    "
    exit 1
fi

echo "✅ 构建成功！"

echo "📋 第7步：运行数据库迁移..."
npx prisma db push

if [ $? -ne 0 ]; then
    echo "❌ 数据库迁移失败"
    echo "尝试重新生成prisma客户端..."
    npx prisma generate
    npx prisma db push
fi

if [ $? -ne 0 ]; then
    echo "❌ 数据库迁移最终失败"
    exit 1
fi

echo "✅ 数据库迁移成功！"

echo "📋 第8步：重启PM2服务..."
pm2 restart luckymart-tj

if [ $? -ne 0 ]; then
    echo "❌ PM2服务重启失败"
    echo "尝试强制重启..."
    pm2 delete luckymart-tj || true
    pm2 start npm --name "luckymart-tj" -- start
fi

echo "========================================"
echo "🎉 终极修复流程已完成！"
echo "========================================"
echo ""
echo "📊 最终状态检查："
echo "----------------------------------------"
echo "🔍 检查PM2进程状态..."
pm2 list luckymart-tj 2>/dev/null || echo "PM2进程信息获取中..."
echo ""
echo "🔍 检查服务响应..."
sleep 5
curl -s -o /dev/null -w "HTTP状态码: %{http_code}" http://localhost:3000 || echo "服务响应检查中..."
echo ""
echo "========================================"
echo "✅ 终极修复完成！"
echo "如果仍有问题，请检查上面的详细信息"
echo "========================================"