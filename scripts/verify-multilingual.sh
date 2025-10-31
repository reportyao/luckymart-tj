#!/bin/bash

# LuckyMartTJ 多语言系统验证脚本
# 用途：验证Phase 2数据库多语言改造的完整性

set -e

echo "========================================"
echo "LuckyMartTJ 多语言系统验证"
echo "========================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 数据库连接
DB_URL="${DATABASE_URL:-postgresql://postgres.ijcbozvagquzwgjvxtsu:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqY2JvenZhZ3F1endnanZ4dHN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTYzMjgxMiwiZXhwIjoyMDc3MjA4ODEyfQ.fGirFEOTEim8lPqAJpsIyqqblBLx0wxubvD7p1SxztI@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres}"

# 测试计数器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试函数
test_case() {
    local test_name=$1
    local sql_query=$2
    local expected_result=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "测试 $TOTAL_TESTS: $test_name ... "
    
    result=$(psql "$DB_URL" -t -A -c "$sql_query" 2>&1)
    exit_code=$?
    
    if [ $exit_code -eq 0 ] && [ "$result" = "$expected_result" ]; then
        echo -e "${GREEN}通过${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}失败${NC}"
        echo "  预期: $expected_result"
        echo "  实际: $result"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

echo "========================================" 
echo "第1部分：Schema验证"
echo "========================================" 
echo ""

# 测试1: 用户表preferred_language字段存在
test_case \
    "users.preferred_language字段存在" \
    "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='preferred_language');" \
    "t"

# 测试2: products.name_multilingual字段类型为jsonb
test_case \
    "products.name_multilingual类型为JSONB" \
    "SELECT data_type FROM information_schema.columns WHERE table_name='products' AND column_name='name_multilingual';" \
    "jsonb"

# 测试3: products.description_multilingual字段存在
test_case \
    "products.description_multilingual字段存在" \
    "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='description_multilingual');" \
    "t"

# 测试4: products.category_multilingual字段存在
test_case \
    "products.category_multilingual字段存在" \
    "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='category_multilingual');" \
    "t"

# 测试5: recharge_packages.name_multilingual字段存在
test_case \
    "recharge_packages.name_multilingual字段存在" \
    "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='recharge_packages' AND column_name='name_multilingual');" \
    "t"

echo ""
echo "========================================" 
echo "第2部分：索引验证"
echo "========================================" 
echo ""

# 测试6: 用户语言索引存在
test_case \
    "users_preferred_language_idx索引存在" \
    "SELECT EXISTS(SELECT 1 FROM pg_indexes WHERE indexname='users_preferred_language_idx');" \
    "t"

# 测试7: 产品名称多语言索引存在
test_case \
    "idx_products_name_multilingual索引存在" \
    "SELECT EXISTS(SELECT 1 FROM pg_indexes WHERE indexname='idx_products_name_multilingual');" \
    "t"

# 测试8: 产品描述多语言索引存在
test_case \
    "idx_products_description_multilingual索引存在" \
    "SELECT EXISTS(SELECT 1 FROM pg_indexes WHERE indexname='idx_products_description_multilingual');" \
    "t"

# 测试9: 产品分类多语言索引存在
test_case \
    "idx_products_category_multilingual索引存在" \
    "SELECT EXISTS(SELECT 1 FROM pg_indexes WHERE indexname='idx_products_category_multilingual');" \
    "t"

# 测试10: 充值包名称多语言索引存在
test_case \
    "idx_recharge_packages_name_multilingual索引存在" \
    "SELECT EXISTS(SELECT 1 FROM pg_indexes WHERE indexname='idx_recharge_packages_name_multilingual');" \
    "t"

echo ""
echo "========================================" 
echo "第3部分：数据完整性验证"
echo "========================================" 
echo ""

# 测试11: 所有产品都有多语言名称
test_case \
    "所有产品都有多语言名称" \
    "SELECT COUNT(*) = COUNT(name_multilingual) FROM products;" \
    "t"

# 测试12: 所有产品都有多语言描述
test_case \
    "所有产品都有多语言描述" \
    "SELECT COUNT(*) = COUNT(description_multilingual) FROM products;" \
    "t"

# 测试13: 所有充值包都有多语言名称
test_case \
    "所有充值包都有多语言名称" \
    "SELECT COUNT(*) = COUNT(name_multilingual) FROM recharge_packages;" \
    "t"

echo ""
echo "========================================" 
echo "第4部分：数据格式验证"
echo "========================================" 
echo ""

# 测试14: 产品多语言名称包含所有必需语言
test_case \
    "产品名称包含zh-CN" \
    "SELECT bool_and(name_multilingual ? 'zh-CN') FROM products WHERE name_multilingual IS NOT NULL;" \
    "t"

test_case \
    "产品名称包含en-US" \
    "SELECT bool_and(name_multilingual ? 'en-US') FROM products WHERE name_multilingual IS NOT NULL;" \
    "t"

test_case \
    "产品名称包含ru-RU" \
    "SELECT bool_and(name_multilingual ? 'ru-RU') FROM products WHERE name_multilingual IS NOT NULL;" \
    "t"

test_case \
    "产品名称包含tg-TJ" \
    "SELECT bool_and(name_multilingual ? 'tg-TJ') FROM products WHERE name_multilingual IS NOT NULL;" \
    "t"

echo ""
echo "========================================" 
echo "第5部分：向后兼容性验证"
echo "========================================" 
echo ""

# 测试18: 旧的name_zh字段仍然存在
test_case \
    "products.name_zh字段保留" \
    "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='name_zh');" \
    "t"

# 测试19: 旧的name_en字段仍然存在
test_case \
    "products.name_en字段保留" \
    "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='name_en');" \
    "t"

# 测试20: 旧的name_ru字段仍然存在
test_case \
    "products.name_ru字段保留" \
    "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='name_ru');" \
    "t"

echo ""
echo "========================================" 
echo "第6部分：文件完整性验证"
echo "========================================" 
echo ""

# 测试21: Prisma schema文件存在
if [ -f "prisma/schema.prisma" ]; then
    echo -e "测试 21: prisma/schema.prisma存在 ... ${GREEN}通过${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "测试 21: prisma/schema.prisma存在 ... ${RED}失败${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# 测试22: 迁移脚本存在
if [ -f "scripts/migrate-to-multilingual.sql" ]; then
    echo -e "测试 22: scripts/migrate-to-multilingual.sql存在 ... ${GREEN}通过${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "测试 22: scripts/migrate-to-multilingual.sql存在 ... ${RED}失败${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# 测试23: 多语言查询服务文件存在
if [ -f "lib/services/multilingual-query.ts" ]; then
    echo -e "测试 23: lib/services/multilingual-query.ts存在 ... ${GREEN}通过${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "测试 23: lib/services/multilingual-query.ts存在 ... ${RED}失败${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# 测试24: 使用示例文件存在
if [ -f "lib/services/multilingual-query.examples.ts" ]; then
    echo -e "测试 24: lib/services/multilingual-query.examples.ts存在 ... ${GREEN}通过${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "测试 24: lib/services/multilingual-query.examples.ts存在 ... ${RED}失败${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# 测试25: 完成报告文件存在
if [ -f "docs/I18N_PHASE2_COMPLETION_REPORT.md" ]; then
    echo -e "测试 25: docs/I18N_PHASE2_COMPLETION_REPORT.md存在 ... ${GREEN}通过${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "测试 25: docs/I18N_PHASE2_COMPLETION_REPORT.md存在 ... ${RED}失败${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo ""
echo "========================================" 
echo "验证结果汇总"
echo "========================================" 
echo ""

echo "总测试数: $TOTAL_TESTS"
echo -e "${GREEN}通过: $PASSED_TESTS${NC}"

if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}失败: $FAILED_TESTS${NC}"
else
    echo -e "${GREEN}失败: $FAILED_TESTS${NC}"
fi

PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo "通过率: $PASS_RATE%"

echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}所有测试通过！多语言系统验证成功！${NC}"
    echo -e "${GREEN}========================================${NC}"
    exit 0
else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}部分测试失败，请检查上述错误信息${NC}"
    echo -e "${RED}========================================${NC}"
    exit 1
fi
