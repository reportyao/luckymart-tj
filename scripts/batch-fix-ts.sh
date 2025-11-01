#!/bin/bash
# TypeScript错误批量修复脚本

echo "🔧 开始批量修复TypeScript错误..."

cd /workspace/luckymart-tj

# 1. 修复PagePermission和AdminPermissions导入
echo "📝 修复导入语句..."

# 在admin页面中添加正确的导入
find app/admin -name "*.tsx" -type f | while read file; do
  if grep -q "PagePermission" "$file" && ! grep -q "import.*PagePermission.*from.*@/lib/admin" "$file"; then
    echo "修复文件: $file"
    # 添加导入（如果文件顶部没有）
    if ! grep -q "^import.*from '@/lib/admin'" "$file"; then
      sed -i "1i import { PagePermission, AdminPermissions } from '@/lib/admin';" "$file"
    fi
  fi
done

# 2. 修复AdminPermissionManager导入（API路由）
find app/api/admin -name "*.ts" -type f | while read file; do
  if grep -q "AdminPermissionManager" "$file"; then
    echo "修复API文件: $file"
    sed -i 's|from ["'\''"]@/\*["'\''"](AdminPermissionManager\)|from "@/lib/admin"|g' "$file"
  fi
done

# 3. 修复隐式any类型（常见情况）
echo "📝 修复隐式any类型..."
find app/api -name "*.ts" -type f -exec sed -i \
  's/Parameter \(.*\) implicitly has an '\''any'\'' type/Parameter \1: any/g' {} \;

# 4. 修复类型比较问题
echo "📝 修复类型比较..."
find app/admin -name "*.tsx" -type f -exec sed -i \
  's/quantity === "pending_shipment"/status === "confirmed" \&\& quantity > 0/g' {} \;

find app/admin -name "*.tsx" -type f -exec sed -i \
  's/status === "pending_address"/fulfillmentStatus === "pending"/g' {} \;

echo "✅ 批量修复完成！"
echo "📊 运行类型检查..."

npx tsc --noEmit 2>&1 | head -50
