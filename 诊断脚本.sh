#!/bin/bash

# 快速诊断脚本
echo "🔍 LuckyMart TJ 模块解析诊断"
echo "=================================="

cd /var/www/luckymart-tj || exit 1

echo "📁 当前工作目录：$(pwd)"
echo ""

echo "📋 文件结构检查："
echo "----------------------------------------"
echo "✅ 检查项目根目录关键文件："
for file in "package.json" "next.config.js" "jsconfig.json" "tsconfig.json" ".env"; do
    if [ -f "$file" ]; then
        echo "✅ $file - 存在"
    else
        echo "❌ $file - 缺失"
    fi
done

echo ""
echo "✅ 检查lib目录："
if [ -d "lib" ]; then
    echo "✅ lib/ 目录存在"
    ls -la lib/ | head -10
else
    echo "❌ lib/ 目录不存在"
fi

echo ""
echo "✅ 检查hooks目录："
if [ -d "hooks" ]; then
    echo "✅ hooks/ 目录存在"
    ls -la hooks/ | head -10
else
    echo "❌ hooks/ 目录不存在"
fi

echo ""
echo "🔧 配置检查："
echo "----------------------------------------"
echo "📋 Next.js配置："
if [ -f "next.config.js" ]; then
    echo "✅ next.config.js 存在"
    grep -E "(webpack|resolve|alias)" next.config.js || echo "未找到webpack配置"
else
    echo "❌ next.config.js 缺失"
fi

echo ""
echo "📋 JavaScript配置："
if [ -f "jsconfig.json" ]; then
    echo "✅ jsconfig.json 存在"
    grep -A 5 -B 5 '"paths"' jsconfig.json || echo "未找到paths配置"
else
    echo "❌ jsconfig.json 缺失"
fi

echo ""
echo "📋 TypeScript配置："
if [ -f "tsconfig.json" ]; then
    echo "✅ tsconfig.json 存在"
    grep -A 5 -B 5 '"paths"' tsconfig.json || echo "未找到paths配置"
else
    echo "❌ tsconfig.json 缺失"
fi

echo ""
echo "🔍 环境变量检查："
echo "----------------------------------------"
if [ -f ".env" ]; then
    echo "✅ .env 文件存在"
    if grep -q "DATABASE_URL=" .env; then
        echo "✅ DATABASE_URL 已配置"
    else
        echo "❌ DATABASE_URL 未配置"
    fi
else
    echo "❌ .env 文件不存在"
fi

echo ""
echo "📦 依赖检查："
echo "----------------------------------------"
if [ -d "node_modules" ]; then
    echo "✅ node_modules 存在"
    echo "📊 已安装包数量：$(find node_modules -maxdepth 1 -type d | wc -l)"
else
    echo "❌ node_modules 不存在"
fi

echo ""
echo "=================================="
echo "🔍 诊断完成"
echo "如需完整修复，请运行："
echo "chmod +x 终极修复脚本.sh && ./终极修复脚本.sh"
echo "=================================="