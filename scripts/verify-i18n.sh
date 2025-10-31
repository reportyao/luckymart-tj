#!/bin/bash

# LuckyMartTJ i18n系统完整性验证脚本

echo "==================================="
echo "  LuckyMartTJ i18n 系统验证"
echo "==================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查计数
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# 检查函数
check() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}✗${NC} $2"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# 1. 检查依赖是否安装
echo "1. 检查依赖安装..."
pnpm list i18next &> /dev/null
check $? "i18next已安装"

pnpm list react-i18next &> /dev/null
check $? "react-i18next已安装"

pnpm list i18next-browser-languagedetector &> /dev/null
check $? "i18next-browser-languagedetector已安装"

echo ""

# 2. 检查核心文件
echo "2. 检查核心文件..."
[ -f "src/i18n/config.ts" ]
check $? "src/i18n/config.ts存在"

[ -f "src/i18n/I18nProvider.tsx" ]
check $? "src/i18n/I18nProvider.tsx存在"

[ -f "src/i18n/useLanguageCompat.ts" ]
check $? "src/i18n/useLanguageCompat.ts存在"

[ -f "components/LanguageSwitcher.tsx" ]
check $? "components/LanguageSwitcher.tsx存在"

echo ""

# 3. 检查翻译文件完整性
echo "3. 检查翻译文件..."

languages=("zh-CN" "en-US" "ru-RU" "tg-TJ")
namespaces=("common" "auth" "lottery" "wallet" "referral" "task" "error" "admin")

missing_files=0

for lang in "${languages[@]}"; do
    for ns in "${namespaces[@]}"; do
        file="src/locales/$lang/$ns.json"
        if [ -f "$file" ]; then
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            echo -e "${RED}✗${NC} 缺失: $file"
            missing_files=$((missing_files + 1))
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    done
done

if [ $missing_files -eq 0 ]; then
    echo -e "${GREEN}✓${NC} 所有翻译文件完整 (32个文件)"
else
    echo -e "${RED}✗${NC} 缺失 $missing_files 个翻译文件"
fi

echo ""

# 4. 检查JSON文件格式
echo "4. 检查JSON格式..."

json_errors=0
for lang in "${languages[@]}"; do
    for ns in "${namespaces[@]}"; do
        file="src/locales/$lang/$ns.json"
        if [ -f "$file" ]; then
            if python3 -m json.tool "$file" &> /dev/null; then
                : # JSON有效
            else
                echo -e "${RED}✗${NC} JSON格式错误: $file"
                json_errors=$((json_errors + 1))
            fi
        fi
    done
done

if [ $json_errors -eq 0 ]; then
    check 0 "所有JSON文件格式正确"
else
    check 1 "$json_errors 个JSON文件格式错误"
fi

echo ""

# 5. 检查tsconfig配置
echo "5. 检查TypeScript配置..."

if grep -q "resolveJsonModule" tsconfig.json; then
    check 0 "tsconfig.json配置resolveJsonModule"
else
    check 1 "tsconfig.json未配置resolveJsonModule"
fi

echo ""

# 6. 检查文档
echo "6. 检查文档..."

[ -f "docs/I18N_GUIDE.md" ]
check $? "使用指南文档存在"

[ -f "docs/I18N_DEPLOYMENT.md" ]
check $? "部署指南文档存在"

[ -f "docs/I18N_PHASE1_COMPLETION_REPORT.md" ]
check $? "完成报告存在"

echo ""

# 7. 统计翻译条目数
echo "7. 统计翻译条目..."

count_keys() {
    local file=$1
    if [ -f "$file" ]; then
        # 粗略计算key数量（统计冒号数量）
        grep -o '"[^"]*":' "$file" | wc -l
    else
        echo "0"
    fi
}

total_keys=0
for lang in "${languages[@]}"; do
    lang_keys=0
    for ns in "${namespaces[@]}"; do
        file="src/locales/$lang/$ns.json"
        keys=$(count_keys "$file")
        lang_keys=$((lang_keys + keys))
    done
    total_keys=$((total_keys + lang_keys))
    echo "  $lang: ~$lang_keys 个翻译条目"
done

echo "  总计: ~$total_keys 个翻译条目"
echo ""

# 8. 构建测试
echo "8. 尝试构建项目..."
echo "  (跳过实际构建，可手动运行: pnpm build)"
echo ""

# 总结
echo "==================================="
echo "           验证结果"
echo "==================================="
echo ""
echo "总检查项: $TOTAL_CHECKS"
echo -e "${GREEN}通过: $PASSED_CHECKS${NC}"
echo -e "${RED}失败: $FAILED_CHECKS${NC}"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}🎉 所有检查通过！i18n系统已正确配置。${NC}"
    echo ""
    echo "下一步:"
    echo "  1. 运行 'pnpm dev' 启动开发服务器"
    echo "  2. 访问测试页面验证功能"
    echo "  3. 查看文档: docs/I18N_GUIDE.md"
    exit 0
else
    echo -e "${RED}⚠️  发现 $FAILED_CHECKS 个问题，请修复后再继续。${NC}"
    echo ""
    echo "排查建议:"
    echo "  - 检查所有翻译文件是否存在"
    echo "  - 验证JSON格式是否正确"
    echo "  - 确认依赖是否正确安装"
    exit 1
fi
