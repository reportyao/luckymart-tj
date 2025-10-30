#!/bin/bash

echo "🚀 最直接的数据库迁移修复方案"
echo "============================================"
echo "📋 第1步：确保在正确目录"
cd /var/www/luckymart-tj || { echo "❌ 无法进入项目目录"; exit 1; }
echo "✅ 当前目录: $(pwd)"

echo ""
echo "📋 第2步：设置环境变量并执行迁移"
echo "🔧 执行数据库迁移..."

# 使用多个方法确保环境变量被正确加载
export DATABASE_URL="postgresql://postgres.ijcbozvagquzwgjvxtsu:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqY2JvenZhZ3F1endnanZ4dHN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTYzMjgxMiwiZXhwIjoyMDc3MjA4ODEyfQ.fGirFEOTEim8lPqAJpsIyqqblBLx0wxubvD7p1SxztI@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

echo "✅ DATABASE_URL 已设置: $DATABASE_URL"

# 方法1：直接执行
echo "📊 正在执行数据库迁移..."
npx prisma db push

if [ $? -eq 0 ]; then
    echo "✅ 数据库迁移成功！"
else
    echo "❌ 直接方法失败，尝试备用方法..."
    
    # 方法2：使用env命令
    echo "📊 尝试使用env命令..."
    env DATABASE_URL="$DATABASE_URL" npx prisma db push
    
    if [ $? -eq 0 ]; then
        echo "✅ 数据库迁移成功！"
    else
        echo "❌ 备用方法也失败"
        
        # 方法3：临时修改schema文件
        echo "📋 尝试临时修改schema文件..."
        cp prisma/schema.prisma prisma/schema.prisma.backup
        
        # 临时替换env变量
        sed "s/url = env(\"DATABASE_URL\")/url = \"$DATABASE_URL\"/g" prisma/schema.prisma > prisma/schema_temp.prisma
        mv prisma/schema_temp.prisma prisma/schema.prisma
        
        npx prisma db push
        
        if [ $? -eq 0 ]; then
            echo "✅ 数据库迁移成功！"
        else
            echo "❌ 所有方法都失败"
            # 恢复原文件
            mv prisma/schema.prisma.backup prisma/schema.prisma
        fi
    fi
fi

echo ""
echo "📋 第3步：生成客户端"
npx prisma generate

echo ""
echo "🎉 数据库迁移流程完成！"
echo "============================================"