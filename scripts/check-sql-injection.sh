#!/bin/bash

echo "=== SQL注入风险检查脚本 ==="
echo "检查所有使用\$queryRawUnsafe的文件"
echo ""

cd /workspace/luckymart-tj

# 创建临时文件保存结果
TEMP_FILE="/tmp/sql_injection_check.txt"
> "$TEMP_FILE"

# 查找所有使用$queryRawUnsafe的文件
echo "扫描中..."
grep -rn "\$queryRawUnsafe" --include="*.ts" --include="*.tsx" app/ lib/ | while IFS=: read -r file line content; do
  echo "文件: $file" >> "$TEMP_FILE"
  echo "行号: $line" >> "$TEMP_FILE"
  echo "代码: $content" >> "$TEMP_FILE"
  echo "---" >> "$TEMP_FILE"
done

# 统计结果
TOTAL_COUNT=$(grep -c "文件:" "$TEMP_FILE" 2>/dev/null || echo "0")

echo ""
echo "=== 检查结果 ==="
echo "发现 $TOTAL_COUNT 处使用 \$queryRawUnsafe"
echo ""
echo "详细信息保存在: $TEMP_FILE"
echo ""

# 显示前20个结果
if [ "$TOTAL_COUNT" -gt 0 ]; then
  echo "前20个结果："
  head -80 "$TEMP_FILE"
fi

echo ""
echo "=== 修复建议 ==="
echo "1. 将 \$queryRawUnsafe 改为 \$queryRaw"
echo "2. 使用参数化查询，不要使用字符串插值"
echo "3. 示例："
echo "   错误: prisma.\$queryRawUnsafe(\`SELECT * FROM users WHERE id = '\${userId}'\`)"
echo "   正确: prisma.\$queryRaw\`SELECT * FROM users WHERE id = \${userId}\`"
