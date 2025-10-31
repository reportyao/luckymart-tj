#!/bin/bash

# 代码质量报告生成脚本
# 生成详细的代码质量分析报告

set -e

echo "📊 开始生成代码质量报告..."
echo "============================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 创建报告目录
REPORT_DIR="./quality-reports"
mkdir -p "$REPORT_DIR"

# 生成时间戳
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
REPORT_FILE="$REPORT_DIR/quality-report-$TIMESTAMP.md"

# 报告内容
cat > "$REPORT_FILE" << 'EOF'
# 代码质量报告

## 报告概览

EOF

echo "📅 报告生成时间: $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 1. 项目基本信息
echo "🔍 分析项目基本信息..."
echo "### 项目信息" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "- 项目名称: $(basename $(pwd))" >> "$REPORT_FILE"
echo "- Node.js 版本: $(node --version 2>/dev/null || echo 'N/A')" >> "$REPORT_FILE"
echo "- NPM 版本: $(npm --version 2>/dev/null || echo 'N/A')" >> "$REPORT_FILE"
echo "- TypeScript 版本: $(npx tsc --version 2>/dev/null | grep -o 'Version [0-9.]*' || echo 'N/A')" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 2. 代码统计
echo "📈 分析代码统计..."
echo "### 代码统计" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 文件统计
echo "| 文件类型 | 数量 |" >> "$REPORT_FILE"
echo "|---------|------|" >> "$REPORT_FILE"
echo "| TypeScript 文件 (.ts) | $(find . -name "*.ts" -not -path "./node_modules/*" | wc -l) |" >> "$REPORT_FILE"
echo "| TypeScript React 文件 (.tsx) | $(find . -name "*.tsx" -not -path "./node_modules/*" | wc -l) |" >> "$REPORT_FILE"
echo "| JavaScript 文件 (.js) | $(find . -name "*.js" -not -path "./node_modules/*" | wc -l) |" >> "$REPORT_FILE"
echo "| 配置文件 | $(find . -name "*.json" -o -name "*.yaml" -o -name "*.yml" -o -name "*.config.*" | grep -v node_modules | wc -l) |" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 代码行数统计
echo "### 代码行数统计" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "| 统计类型 | 行数 |" >> "$REPORT_FILE"
echo "|---------|------|" >> "$REPORT_FILE"
echo "| 总代码行数 | $(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo '0') |" >> "$REPORT_FILE"
echo "| 有效代码行数 | $(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -v "^[[:space:]]*$//\|^[[:space:]]*//" 2>/dev/null | wc -l || echo '0') |" >> "$REPORT_FILE"
echo "| 注释行数 | $(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep "^[[:space:]]*//" 2>/dev/null | wc -l || echo '0') |" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 3. TypeScript 类型检查
echo "🔍 运行 TypeScript 类型检查..."
echo "### TypeScript 类型检查" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if npm run type-check > "$REPORT_DIR/ts-check.log" 2>&1; then
    echo "✅ TypeScript 类型检查: 通过" >> "$REPORT_FILE"
    TYPE_CHECK_STATUS="通过"
else
    echo "❌ TypeScript 类型检查: 失败" >> "$REPORT_FILE"
    TYPE_CHECK_STATUS="失败"
fi
echo "" >> "$REPORT_FILE"

# 4. ESLint 检查
echo "🔍 运行 ESLint 检查..."
echo "### ESLint 检查结果" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if npm run lint > "$REPORT_DIR/eslint-check.log" 2>&1; then
    echo "✅ ESLint 检查: 通过" >> "$REPORT_FILE"
    ESLINT_STATUS="通过"
else
    echo "❌ ESLint 检查: 失败" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "**ESLint 问题详情:**" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    tail -50 "$REPORT_DIR/eslint-check.log" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    ESLINT_STATUS="失败"
fi
echo "" >> "$REPORT_FILE"

# 5. 代码格式检查
echo "🎨 运行代码格式检查..."
echo "### 代码格式检查" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if npm run format:check > "$REPORT_DIR/format-check.log" 2>&1; then
    echo "✅ 代码格式检查: 通过" >> "$REPORT_FILE"
    FORMAT_STATUS="通过"
else
    echo "⚠️ 代码格式检查: 需要格式化" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "**格式问题详情:**" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    tail -30 "$REPORT_DIR/format-check.log" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    FORMAT_STATUS="需要格式化"
fi
echo "" >> "$REPORT_FILE"

# 6. 安全性检查
echo "🔒 运行安全检查..."
echo "### 安全检查" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if npm audit --audit-level=high > "$REPORT_DIR/security-check.log" 2>&1; then
    echo "✅ 安全检查: 通过" >> "$REPORT_FILE"
    SECURITY_STATUS="通过"
else
    echo "⚠️ 安全检查: 发现问题" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "**安全问题详情:**" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    tail -50 "$REPORT_DIR/security-check.log" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    SECURITY_STATUS="有问题"
fi
echo "" >> "$REPORT_FILE"

# 7. 代码复杂度分析
echo "🧮 运行复杂度分析..."
echo "### 代码复杂度分析" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if command -v eslint &> /dev/null; then
    if eslint . --ext .ts,.tsx --no-eslintrc --rule 'complexity: [error, 10]' --format json > "$REPORT_DIR/complexity-check.json" 2>&1; then
        echo "✅ 代码复杂度检查: 通过" >> "$REPORT_FILE"
        COMPLEXITY_STATUS="通过"
    else
        echo "❌ 代码复杂度检查: 超出限制" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        COMPLEXITY_STATUS="有问题"
    fi
else
    echo "ℹ️ ESLint 未安装，跳过复杂度分析" >> "$REPORT_FILE"
    COMPLEXITY_STATUS="未执行"
fi
echo "" >> "$REPORT_FILE"

# 8. 依赖分析
echo "📦 分析依赖信息..."
echo "### 依赖分析" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "| 依赖类型 | 数量 |" >> "$REPORT_FILE"
echo "|---------|------|" >> "$REPORT_FILE"
echo "| 生产依赖 | $(jq -r '.dependencies | length' package.json 2>/dev/null || echo 'N/A') |" >> "$REPORT_FILE"
echo "| 开发依赖 | $(jq -r '.devDependencies | length' package.json 2>/dev/null || echo 'N/A') |" >> "$REPORT_FILE"
echo "| 总依赖 | $(jq -r '.dependencies | length + .devDependencies | length' package.json 2>/dev/null || echo 'N/A') |" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 9. 性能检查
echo "⚡ 运行性能检查..."
echo "### 性能检查" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 检查大文件
echo "**大文件检查 (>500行):**" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

LARGE_FILES=$(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs wc -l 2>/dev/null | awk '$1 > 500 {print $2 " (" $1 " 行)"}' | head -10 || echo "无")
if [ -n "$LARGE_FILES" ] && [ "$LARGE_FILES" != "无" ]; then
    echo "$LARGE_FILES" | while read file; do
        echo "- $file" >> "$REPORT_FILE"
    done
else
    echo "✅ 无大文件问题" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# 10. 测试覆盖率（如果有测试）
echo "🧪 检查测试配置..."
echo "### 测试配置" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ -f "jest.config.js" ] || [ -f "jest.config.ts" ] || [ -f "jest.config.json" ]; then
    echo "✅ Jest 测试配置: 已配置" >> "$REPORT_FILE"
    if npm run test:coverage > /dev/null 2>&1; then
        echo "✅ 测试覆盖率检查: 可运行" >> "$REPORT_FILE"
    else
        echo "⚠️ 测试覆盖率检查: 配置问题" >> "$REPORT_FILE"
    fi
else
    echo "ℹ️ Jest 测试配置: 未配置" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# 11. 总结和建议
echo "📋 生成总结和建议..."
echo "## 总结" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 计算总体状态
TOTAL_SCORE=0
if [ "$TYPE_CHECK_STATUS" = "通过" ]; then ((TOTAL_SCORE += 20)); fi
if [ "$ESLINT_STATUS" = "通过" ]; then ((TOTAL_SCORE += 20)); fi
if [ "$FORMAT_STATUS" = "通过" ]; then ((TOTAL_SCORE += 20)); fi
if [ "$SECURITY_STATUS" = "通过" ]; then ((TOTAL_SCORE += 20)); fi
if [ "$COMPLEXITY_STATUS" = "通过" ]; then ((TOTAL_SCORE += 20)); fi

echo "| 检查项目 | 状态 | 分数 |" >> "$REPORT_FILE"
echo "|---------|------|------|" >> "$REPORT_FILE"
echo "| TypeScript 类型检查 | $TYPE_CHECK_STATUS | $([ "$TYPE_CHECK_STATUS" = "通过" ] && echo "20" || echo "0")/20 |" >> "$REPORT_FILE"
echo "| ESLint 代码检查 | $ESLINT_STATUS | $([ "$ESLINT_STATUS" = "通过" ] && echo "20" || echo "0")/20 |" >> "$REPORT_FILE"
echo "| 代码格式检查 | $FORMAT_STATUS | $([ "$FORMAT_STATUS" = "通过" ] && echo "20" || echo "0")/20 |" >> "$REPORT_FILE"
echo "| 安全检查 | $SECURITY_STATUS | $([ "$SECURITY_STATUS" = "通过" ] && echo "20" || echo "0")/20 |" >> "$REPORT_FILE"
echo "| 代码复杂度检查 | $COMPLEXITY_STATUS | $([ "$COMPLEXITY_STATUS" = "通过" ] && echo "20" || echo "0")/20 |" >> "$REPORT_FILE"
echo "| **总分** | | **$TOTAL_SCORE/100** |" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "### 质量等级" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ $TOTAL_SCORE -eq 100 ]; then
    echo "🏆 **优秀** - 代码质量非常高，符合最佳实践" >> "$REPORT_FILE"
elif [ $TOTAL_SCORE -ge 80 ]; then
    echo "✅ **良好** - 代码质量较好，建议小幅优化" >> "$REPORT_FILE"
elif [ $TOTAL_SCORE -ge 60 ]; then
    echo "⚠️ **中等** - 代码质量需要改进" >> "$REPORT_FILE"
else
    echo "❌ **需改进** - 代码质量问题较多，需要修复" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# 建议
echo "### 改进建议" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ "$TYPE_CHECK_STATUS" != "通过" ]; then
    echo "- 🔧 修复 TypeScript 类型错误，使用严格模式" >> "$REPORT_FILE"
fi

if [ "$ESLINT_STATUS" != "通过" ]; then
    echo "- 🔍 运行 \`npm run lint:fix\` 修复 ESLint 问题" >> "$REPORT_FILE"
fi

if [ "$FORMAT_STATUS" != "通过" ]; then
    echo "- 🎨 运行 \`npm run format\` 格式化代码" >> "$REPORT_FILE"
fi

if [ "$SECURITY_STATUS" != "通过" ]; then
    echo "- 🔒 运行 \`npm audit fix\` 修复安全漏洞" >> "$REPORT_FILE"
fi

if [ "$COMPLEXITY_STATUS" != "通过" ]; then
    echo "- 🧮 简化复杂函数，分解大函数为小函数" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

# 下一步操作
echo "## 下一步操作" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "1. 运行 \`npm run quality:full\` 执行完整的质量检查" >> "$REPORT_FILE"
echo "2. 根据发现的问题进行修复" >> "$REPORT_FILE"
echo "3. 重新运行本脚本验证改进效果" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "---" >> "$REPORT_FILE"
echo "报告生成时间: $(date)" >> "$REPORT_FILE"
echo "脚本版本: 1.0" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"

echo ""
echo -e "${GREEN}✅ 代码质量报告已生成: $REPORT_FILE${NC}"
echo ""
echo "📊 报告摘要:"
echo "  - 总分: $TOTAL_SCORE/100"
echo "  - TypeScript 检查: $TYPE_CHECK_STATUS"
echo "  - ESLint 检查: $ESLINT_STATUS" 
echo "  - 代码格式: $FORMAT_STATUS"
echo "  - 安全检查: $SECURITY_STATUS"
echo "  - 复杂度检查: $COMPLEXITY_STATUS"
echo ""
echo -e "${BLUE}💡 提示: 使用 \`npm run quality:full\` 进行完整质量检查${NC}"
echo ""

# 可选：在浏览器中打开报告
if command -v open &> /dev/null; then
    echo -e "${YELLOW}🔗 是否在浏览器中打开报告？ (y/N)${NC}"
    read -t 5 -n 1 -r response || response="n"
    if [[ $response =~ ^[Yy]$ ]]; then
        open "$REPORT_FILE"
    fi
fi