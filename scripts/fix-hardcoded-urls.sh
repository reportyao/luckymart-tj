#!/bin/bash
# 批量修复API硬编码URL脚本

echo "🔧 开始批量修复API硬编码URL..."

# 1. 修复TS/TSX文件中的localhost:3000
echo "📝 修复TypeScript/TSX文件..."

# 找到所有包含localhost:3000的TS/TSX文件并修复
find /workspace/luckymart-tj -name "*.ts" -o -name "*.tsx" | while read file; do
    if grep -q "localhost:3000" "$file"; then
        echo "  修复文件: $file"
        
        # 创建备份
        cp "$file" "$file.backup"
        
        # 修复各种硬编码模式
        sed -i 's|http://localhost:3000|${API_BASE_URL}|g' "$file"
        sed -i 's|localhost:3000|${API_BASE_URL}|g' "$file"
        sed -i 's|\"http://localhost:3000\"|`${API_BASE_URL}`|g' "$file"
        sed -i 's|\x27http://localhost:3000\x27|`${API_BASE_URL}`|g' "$file"
    fi
done

# 2. 修复JS/JSX文件中的localhost:3000
echo "📝 修复JavaScript/JSX文件..."
find /workspace/luckymart-tj -name "*.js" -o -name "*.jsx" | while read file; do
    if grep -q "localhost:3000" "$file"; then
        echo "  修复文件: $file"
        
        # 创建备份
        cp "$file" "$file.backup"
        
        # 修复各种硬编码模式
        sed -i 's|http://localhost:3000|\${API_BASE_URL}|g' "$file"
        sed -i 's|localhost:3000|\${API_BASE_URL}|g' "$file"
        sed -i 's|"http://localhost:3000"|`${API_BASE_URL}`|g' "$file"
        sed -i 's|'\''http://localhost:3000'\''|`${API_BASE_URL}`|g' "$file"
    fi
done

echo "✅ 批量修复完成！"
echo "📋 已创建备份文件：.backup" 

# 显示统计信息
echo ""
echo "📊 修复统计："
echo "修复的文件数量：$(find /workspace/luckymart-tj -name "*.backup" | wc -l)"
echo ""
echo "💡 请检查修复结果并运行测试验证功能正常！"