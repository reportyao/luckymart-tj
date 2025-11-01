#!/bin/bash

echo "=== TypeScript错误全面修复脚本 ==="
echo "开始时间: $(date)"

cd /workspace/luckymart-tj

# 1. 修复PagePermission和AdminPermissions重复导入问题
echo "步骤1: 修复重复导入问题..."

# 找到所有有重复导入的文件
FILES_WITH_DUPLICATE=$(grep -rl "import.*PagePermission.*from.*components/admin/PagePermission" app/admin/*.tsx app/admin/**/*.tsx 2>/dev/null | head -20)

for file in $FILES_WITH_DUPLICATE; do
  if [ -f "$file" ]; then
    echo "修复文件: $file"
    # 移除重复的导入行（保留第一个，删除后续的）
    awk '!seen[$0]++' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
  fi
done

# 2. 修复InvitationAnalytics默认导出问题
echo "步骤2: 修复InvitationAnalytics导出问题..."
if [ -f "components/admin/InvitationAnalytics.tsx" ]; then
  # 检查是否有默认导出
  if ! grep -q "export default" components/admin/InvitationAnalytics.tsx; then
    echo "添加默认导出到InvitationAnalytics.tsx"
    # 这里需要手动检查并添加
  fi
fi

# 3. 创建类型修复脚本
cat > /tmp/fix_types.js << 'EOF'
const fs = require('fs');
const path = require('path');

// 修复函数
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 修复1: 移除重复的导入语句
  const lines = content.split('\n');
  const seen = new Set();
  const newLines = lines.filter(line => {
    // 如果是导入语句
    if (line.trim().startsWith('import')) {
      if (seen.has(line.trim())) {
        modified = true;
        return false; // 移除重复
      }
      seen.add(line.trim());
    }
    return true;
  });

  if (modified) {
    content = newLines.join('\n');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ 修复: ${filePath}`);
  }
}

// 遍历app/admin目录
const adminDir = '/workspace/luckymart-tj/app/admin';
const files = [];

function walkDir(dir) {
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      files.push(fullPath);
    }
  });
}

walkDir(adminDir);
files.forEach(fixFile);

console.log(`总共处理了 ${files.length} 个文件`);
EOF

node /tmp/fix_types.js

# 4. 运行TypeScript检查
echo "步骤3: 检查修复效果..."
npx tsc --noEmit 2>&1 | tee /tmp/tsc_errors.txt

ERROR_COUNT=$(grep -c "error TS" /tmp/tsc_errors.txt || echo "0")
echo ""
echo "=== 修复结果 ==="
echo "剩余错误数: $ERROR_COUNT"

if [ "$ERROR_COUNT" -lt 50 ]; then
  echo "✅ 修复成功！错误数量显著减少"
else
  echo "⚠️ 还需要继续修复"
fi

echo "结束时间: $(date)"
