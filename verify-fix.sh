#!/bin/bash

echo "🔧 LuckyMartTJ 部署修复验证脚本"
echo "======================================"

# 检查项目结构
echo "📁 检查项目结构..."
if [ -f "/workspace/luckymart-tj/package.json" ]; then
    echo "✅ 项目根目录存在"
else
    echo "❌ 项目根目录不存在"
    exit 1
fi

# 检查关键文件
echo ""
echo "📋 检查关键文件..."

files=(
    "/workspace/luckymart-tj/lib/api-client.ts"
    "/workspace/luckymart-tj/lib/middleware.ts" 
    "/workspace/luckymart-tj/app/page.tsx"
    "/workspace/luckymart-tj/app/api/products/list/route.ts"
    "/workspace/luckymart-tj/app/api/monitoring/health/route.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (缺失)"
    fi
done

# 检查API路由修复
echo ""
echo "🔍 检查API路由修复..."

health_file="/workspace/luckymart-tj/app/api/monitoring/health/route.ts"
if grep -q "from '../../../lib/middleware'" "$health_file"; then
    echo "✅ Health API 导入路径已修复"
else
    echo "❌ Health API 导入路径未修复"
fi

# 检查API客户端修复
echo ""
echo "🔧 检查API客户端修复..."

api_client="/workspace/luckymart-tj/lib/api-client.ts"
if grep -q "ApiResponse<T>" "$api_client"; then
    echo "✅ API客户端响应格式已修复"
else
    echo "❌ API客户端响应格式未修复"
fi

# 检查Products API简化
echo ""
echo "🛍️ 检查Products API简化..."

products_api="/workspace/luckymart-tj/app/api/products/list/route.ts"
if grep -q "mockProducts" "$products_api" && ! grep -q "prisma" "$products_api"; then
    echo "✅ Products API已简化，使用模拟数据"
else
    echo "❌ Products API仍然依赖复杂库"
fi

# 检查HomePage组件
echo ""
echo "🏠 检查HomePage组件..."

homepage="/workspace/luckymart-tj/app/page.tsx"
if grep -q "response.success" "$homepage"; then
    echo "✅ HomePage组件使用正确的API响应格式"
else
    echo "❌ HomePage组件API调用格式可能有问题"
fi

echo ""
echo "🎯 验证完成！"
echo ""
echo "建议操作："
echo "1. 重新构建项目: npm run build"
echo "2. 重启服务器: npm run start"  
echo "3. 访问主页测试: http://47.243.83.253:3000"
echo "4. 测试健康检查: http://47.243.83.253:3000/api/monitoring/health"
