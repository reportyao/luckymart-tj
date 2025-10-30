#!/bin/bash

# ================================
# 环境变量加载修复脚本
# 解决 Prisma 读取不到 DATABASE_URL 的问题
# ================================

echo "🔧 开始环境变量加载修复..."

cd /var/www/luckymart-tj || exit 1

echo "📋 检查环境变量文件..."
if [ -f ".env" ]; then
    echo "✅ .env 文件存在"
    echo "📋 环境变量文件内容预览："
    head -10 .env
else
    echo "❌ .env 文件不存在，创建默认环境变量文件..."
    cat > .env << 'EOF'
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://ijcbozvagquzwgjvxtsu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqY2JvenZhZ3F1endnanZ4dHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MzI4MTIsImV4cCI6MjA3NzIwODgxMn0.t45PVuJxEXbK3RS-lhv0ytNdYXGeOGpEoBz5rjW2RYU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqY2JvenZhZ3F1endnanZ4dHN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTYzMjgxMiwiZXhwIjoyMDc3MjA4ODEyfQ.fGirFEOTEim8lPqAJpsIyqqblBLx0wxubvD7p1SxztI

# 数据库连接
DATABASE_URL=postgresql://postgres.ijcbozvagquzwgjvxtsu:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqY2JvenZhZ3F1endnanZ4dHN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTYzMjgxMiwiZXhwIjoyMDc3MjA4ODEyfQ.fGirFEOTEim8lPqAJpsIyqqblBLx0wxubvD7p1SxztI@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

# JWT配置
JWT_SECRET=luckymart_tj_secret_key_2025_production

# Telegram Bot配置
TELEGRAM_BOT_TOKEN=8074258399:AAG1WdyCJe4vphx9YB3B6z60nTE3dhBBP-Q
MINI_APP_URL=http://47.243.83.253:3000

# 支付配置
ALIF_MOBI_PHONE=+992000000000
DC_BANK_ACCOUNT=TJ00000000000000000000

# 管理员配置
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123456
EOF
    echo "✅ 默认环境变量文件已创建"
fi

echo ""
echo "📋 方法1：直接设置环境变量（推荐）"
echo "执行以下命令手动设置环境变量："

# 提取 DATABASE_URL 并设置
DATABASE_URL=$(grep "DATABASE_URL=" .env | cut -d'=' -f2-)
echo "export DATABASE_URL=\"$DATABASE_URL\""
echo ""

echo "🔧 现在执行数据库迁移（带环境变量）:"

# 使用环境变量运行 Prisma
export DATABASE_URL="$DATABASE_URL"
echo "📊 同步数据库结构..."
npx prisma db push

if [ $? -eq 0 ]; then
    echo "✅ 数据库迁移成功！"
else
    echo "❌ 数据库迁移失败，尝试备用方法..."
    
    echo ""
    echo "📋 方法2：使用 dotenv 加载环境变量"
    # 安装和使用 dotenv
    npm install --save-dev dotenv
    npx dotenv -e .env -- npx prisma db push
    
    if [ $? -eq 0 ]; then
        echo "✅ 数据库迁移成功！"
    else
        echo "❌ 备用方法也失败"
        echo ""
        echo "📋 方法3：临时手动设置环境变量"
        echo "请手动运行以下命令："
        echo "export DATABASE_URL=\"postgresql://postgres.ijcbozvagquzwgjvxtsu:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqY2JvenZhZ3F1endnanZ4dHN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTYzMjgxMiwiZXhwIjoyMDc3MjA4ODEyfQ.fGirFEOTEim8lPqAJpsIyqqblBLx0wxubvD7p1SxztI@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres\""
        echo "npx prisma db push"
    fi
fi

echo ""
echo "🎉 环境变量修复流程完成！"