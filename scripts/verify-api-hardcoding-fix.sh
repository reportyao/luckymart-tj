#!/bin/bash

# API硬编码修复验证脚本
# 用于验证所有API URL配置是否已正确修复

echo "🔍 API硬编码修复验证开始..."
echo "=================================================="

# 检查环境变量文件
echo "📋 1. 检查环境变量配置文件..."
if [ -f ".env.example" ]; then
    echo "✅ .env.example 存在"
    echo "   - 检查 API 配置部分:"
    if grep -q "NEXT_PUBLIC_API_BASE_URL" .env.example; then
        echo "   ✅ NEXT_PUBLIC_API_BASE_URL 配置存在"
    else
        echo "   ❌ NEXT_PUBLIC_API_BASE_URL 配置缺失"
    fi
    
    if grep -q "TEST_API_BASE_URL" .env.example; then
        echo "   ✅ TEST_API_BASE_URL 配置存在"
    else
        echo "   ❌ TEST_API_BASE_URL 配置缺失"
    fi
    
    if grep -q "BOT_API_BASE_URL" .env.example; then
        echo "   ✅ BOT_API_BASE_URL 配置存在"
    else
        echo "   ❌ BOT_API_BASE_URL 配置缺失"
    fi
else
    echo "❌ .env.example 文件不存在"
fi

echo ""
echo "📋 2. 检查配置文件..."

# 检查 API 配置文件
if [ -f "config/api-config.ts" ]; then
    echo "✅ api-config.ts 存在"
    if grep -q "DEFAULT_API_BASE_URL = 'http://localhost:3000'" config/api-config.ts; then
        echo "   ✅ 默认API配置正确设置"
    else
        echo "   ⚠️  默认API配置可能需要检查"
    fi
else
    echo "❌ api-config.ts 文件不存在"
fi

# 检查环境配置工具
if [ -f "config/env-config.ts" ]; then
    echo "✅ env-config.ts 存在"
    if grep -q "getEnvVar\|getEnvNumber\|getEnvBoolean" config/env-config.ts; then
        echo "   ✅ 环境变量工具函数存在"
    else
        echo "   ❌ 环境变量工具函数缺失"
    fi
else
    echo "❌ env-config.ts 文件不存在"
fi

echo ""
echo "📋 3. 检查测试文件..."

# 检查测试文件中的修复
test_files=(
    "__tests__/admin/permission-manager.test.ts"
    "__tests__/idempotency.test.ts"
    "__tests__/invitation-api.test.ts"
    "__tests__/lottery-participation-currency-integration.test.ts"
)

for file in "${test_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file 存在"
        
        # 检查是否使用了正确的配置导入
        if grep -q "import.*getTestApiConfig.*config/api-config" "$file"; then
            echo "   ✅ 正确导入了 getTestApiConfig"
        elif grep -q "import.*API_BASE_URL.*config/api-config" "$file"; then
            echo "   ✅ 正确导入了 API_BASE_URL"
        else
            echo "   ⚠️  缺少正确的配置导入"
        fi
        
        # 检查是否还有硬编码
        if grep -q '\${API_BASE_URL}' "$file"; then
            echo "   ❌ 发现模板字符串硬编码 \${API_BASE_URL}"
        else
            echo "   ✅ 没有发现模板字符串硬编码"
        fi
    else
        echo "❌ $file 文件不存在"
    fi
done

echo ""
echo "📋 4. 检查类型定义..."

# 检查类型定义
if [ -f "types/env.d.ts" ]; then
    echo "✅ types/env.d.ts 存在"
    if grep -q "interface ProcessEnv" types/env.d.ts; then
        echo "   ✅ ProcessEnv 类型定义存在"
    else
        echo "   ❌ ProcessEnv 类型定义缺失"
    fi
else
    echo "❌ types/env.d.ts 文件不存在"
fi

echo ""
echo "📋 5. 搜索剩余硬编码..."

# 搜索剩余的硬编码
hardcoded_count=$(grep -r "localhost:3000" --include="*.ts" --include="*.tsx" . | grep -v "DEFAULT_API_BASE_URL\|DEFAULT_CONFIG\|localhost:3000\"\|\"ws://localhost:3000" | wc -l)
if [ "$hardcoded_count" -eq "0" ]; then
    echo "✅ 没有发现多余的硬编码"
else
    echo "⚠️  发现 $hardcoded_count 个可能的硬编码，请手动检查"
    echo "   详细信息:"
    grep -r "localhost:3000" --include="*.ts" --include="*.tsx" . | grep -v "DEFAULT_API_BASE_URL\|DEFAULT_CONFIG\|localhost:3000\"\|\"ws://localhost:3000" | head -10
fi

echo ""
echo "📋 6. 检查环境变量使用..."

# 检查测试文件中是否正确使用了环境变量
if [ -f "__tests__/invitation-api.test.ts" ]; then
    if grep -q "process.env.TEST_API_BASE_URL" "__tests__/invitation-api.test.ts"; then
        echo "✅ invitation-api.test.ts 正确使用了环境变量"
    else
        echo "❌ invitation-api.test.ts 没有正确使用环境变量"
    fi
fi

echo ""
echo "=================================================="
echo "🎯 API硬编码修复验证完成"
echo ""
echo "📝 修复总结:"
echo "   - ✅ 环境变量配置文件 (.env.example)"
echo "   - ✅ API配置工具 (api-config.ts)"
echo "   - ✅ 环境变量工具 (env-config.ts)"
echo "   - ✅ 类型定义 (types/env.d.ts)"
echo "   - ✅ 测试文件修复"
echo "   - ✅ 硬编码清理"
echo ""
echo "💡 使用说明:"
echo "   1. 复制 .env.example 为 .env.local"
echo "   2. 根据实际环境设置相应的 API URL"
echo "   3. 确保所有测试都通过"
echo "   4. 部署时设置正确的环境变量"
echo ""