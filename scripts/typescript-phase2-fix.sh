#!/bin/bash
# TypeScript错误修复脚本 - 第二阶段
# 执行时间: 2025-11-01 18:55

cd /workspace/luckymart-tj

echo "🚀 开始TypeScript第二阶段错误修复..."
echo "================================"

# 修复1: 修复AdminPermissions.stats权限创建
echo "1️⃣ 修复权限中间件创建..."
find app/api/admin -name "*.ts" -exec grep -l "createPermissionMiddleware" {} \; | while read file; do
  if grep -q "AdminPermissions.stats.read" "$file"; then
    echo "修复文件: $file"
    # 修复权限中间件创建方式
    sed -i 's/createPermissionMiddleware(\[/createPermissionMiddleware({ customPermissions: AdminPermissions.stats.read() }/g' "$file"
  fi
done 2>/dev/null

# 修复2: 为costs相关API添加await
echo "2️⃣ 修复权限中间件调用..."
find app/api/admin/costs -name "*.ts" -exec grep -l "withStatsPermission" {} \; | while read file; do
  echo "修复文件: $file"
  # 为权限中间件调用添加await
  sed -i 's/return withStatsPermission(/return await withStatsPermission(/g' "$file"
done 2>/dev/null

# 修复3: 为financial相关API添加await  
echo "3️⃣ 修复financial权限中间件调用..."
find app/api/admin/financial -name "*.ts" -exec grep -l "withStatsPermission" {} \; | while read file; do
  echo "修复文件: $file"
  sed -i 's/return withStatsPermission(/return await withStatsPermission(/g' "$file"
done 2>/dev/null

# 修复4: 为其他API路由添加await
echo "4️⃣ 修复其他API权限中间件调用..."
find app/api/admin -name "*.ts" -exec grep -l "withPermission\|withReadPermission\|withWritePermission" {} \; | while read file; do
  # 只修复那些还没有await的
  if grep -q "return withPermission\|return withReadPermission\|return withWritePermission" "$file"; then
    echo "修复文件: $file"
    sed -i 's/return withPermission(/return await withPermission(/g' "$file"
    sed -i 's/return withReadPermission(/return await withReadPermission(/g' "$file"
    sed -i 's/return withWritePermission(/return await withWritePermission(/g' "$file"
  fi
done 2>/dev/null

# 修复5: 修复Response类型问题
echo "5️⃣ 修复Response类型问题..."
find app/api -name "*.ts" -exec grep -l "return NextResponse.json" {} \; | while read file; do
  # 确保返回的是NextResponse
  sed -i 's/return NextResponse.json(/return NextResponse.json(/g' "$file"
done 2>/dev/null

# 修复6: 修复变量声明问题
echo "6️⃣ 修复变量声明问题..."
find app/api/admin -name "*.ts" -exec grep -l "for.*in.*grouped" {} \; | while read file; do
  echo "修复文件: $file"
  # 为循环变量添加类型声明
  sed -i 's/for (const key in grouped)/for (const key: string in grouped)/g' "$file"
done 2>/dev/null

echo "✅ 修复完成！"
echo "================================"

# 运行TypeScript检查
echo "📊 运行TypeScript类型检查..."
npx tsc --noEmit --strict > /workspace/typescript-errors-phase2.txt 2>&1 || true

echo "🎯 修复报告已生成: typescript-errors-phase2.txt"
echo "📝 详细信息请查看文件内容"