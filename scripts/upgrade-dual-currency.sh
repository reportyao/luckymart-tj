#!/bin/bash

# 双货币系统数据库升级脚本
# 用于执行数据库迁移并更新 Prisma 客户端

set -e  # 遇到错误时立即退出

echo "🚀 开始执行双货币系统数据库升级..."
echo "=================================================="

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录执行此脚本"
    exit 1
fi

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  警告：未设置 DATABASE_URL 环境变量"
    echo "请确保已配置正确的数据库连接字符串"
fi

echo ""
echo "📋 执行步骤："
echo "1. 应用数据库迁移..."
echo "2. 生成 Prisma 客户端..."
echo "3. 验证迁移结果..."
echo ""

# 步骤 1: 应用数据库迁移
echo "📦 步骤 1: 应用数据库迁移..."
npx prisma migrate deploy
echo "✅ 迁移应用完成"
echo ""

# 步骤 2: 生成 Prisma 客户端
echo "🔧 步骤 2: 生成 Prisma 客户端..."
npx prisma generate
echo "✅ Prisma 客户端生成完成"
echo ""

# 步骤 3: 验证迁移结果
echo "🔍 步骤 3: 验证迁移结果..."

# 检查新字段是否存在
echo "   检查新字段..."
if npx prisma db execute --file - <<< "
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('lucky_coins', 'lucky_coins_version');
" | grep -q "lucky_coins"; then
    echo "   ✅ 新字段已成功添加"
else
    echo "   ⚠️  新字段检查失败，请手动验证"
fi

# 检查索引是否创建
echo "   检查索引..."
INDEX_COUNT=$(npx prisma db execute --file - <<< "
SELECT count(*) 
FROM pg_indexes 
WHERE tablename = 'users' 
AND indexname LIKE '%lucky_coins%';
" | tail -n 1)

if [ "$INDEX_COUNT" -ge "3" ]; then
    echo "   ✅ 所有索引已成功创建 (创建了 $INDEX_COUNT 个索引)"
else
    echo "   ⚠️  索引检查失败，预期至少 3 个索引，实际创建了 $INDEX_COUNT 个"
fi

echo ""
echo "🎉 双货币系统数据库升级完成！"
echo "=================================================="
echo ""
echo "📚 详细信息请查看："
echo "   - 升级说明文档: docs/database-upgrade-dual-currency.md"
echo "   - 迁移文件: prisma/migrations/20251031_add_lucky_coins/migration.sql"
echo ""
echo "💡 下一步建议："
echo "   1. 更新业务代码以支持幸运币操作"
echo "   2. 测试幸运币相关功能"
echo "   3. 部署到生产环境（谨慎操作）"
echo ""
echo "⚠️  重要提醒："
echo "   - 升级前请备份数据库"
echo "   - 在测试环境先验证功能"
echo "   - 生产环境部署需要额外监控"