#!/bin/bash

# 批量修复TypeScript语法错误
echo "🔧 开始批量修复TypeScript语法错误..."

# 要修复的错误模式
ERRORS=(
    ": any)"       # 箭头函数参数类型定义错误
    " : any)"      # 带空格的箭头函数参数类型定义错误
)

# 修复模式
PATTERNS=(
    "s/(\([a-zA-Z0-9_,: ]*\)) : any)/(\1)/g"      # 修复 (param: Type) : any -> (param: Type)
    "s/(\([a-zA-Z0-9_,: ]*\)): any)/(\1)/g"       # 修复 (param: Type): any -> (param: Type)
    "s/(\([a-zA-Z0-9_,: ]*)) : any)/((\1))/g"     # 修复 ((param: Type)) : any -> ((param: Type))
)

# 计数器
FIXED_COUNT=0
TOTAL_FILES=0

# 查找所有包含错误模式的文件
echo "📁 扫描app/api目录下的文件..."
FILES=$(find app/api -name "*.ts" -type f)

for file in $FILES; do
    if grep -q ": any)" "$file" 2>/dev/null; then
        TOTAL_FILES=$((TOTAL_FILES + 1))
        echo "📝 检查文件: $file"
        
        # 应用所有修复模式
        for pattern in "${PATTERNS[@]}"; do
            sed -i "$pattern" "$file"
        done
        
        # 验证修复
        if ! grep -q ": any)" "$file" 2>/dev/null; then
            FIXED_COUNT=$((FIXED_COUNT + 1))
            echo "  ✅ 修复成功"
        else
            echo "  ⚠️  可能还有其他错误"
        fi
    fi
done

echo ""
echo "🎉 修复完成！"
echo "   总共检查了 $(echo "$FILES" | wc -w) 个文件"
echo "   发现 $TOTAL_FILES 个文件包含语法错误"
echo "   成功修复 $FIXED_COUNT 个文件"

# 运行TypeScript检查
echo ""
echo "🔍 运行TypeScript编译检查..."
npx tsc --noEmit 2>&1 | grep -E "error TS|Found [0-9]+ errors" | head -20