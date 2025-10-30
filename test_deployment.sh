#!/bin/bash

# LuckyMart TJ 移动端优化 - 自动化测试脚本
# 在服务器上部署后执行此脚本进行验证

SERVER_URL="http://47.243.83.253:3000"

echo "============================================"
echo "LuckyMart TJ 移动端优化 - 功能测试"
echo "============================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数器
PASSED=0
FAILED=0
TOTAL=0

# 测试函数
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_code="$3"
    
    TOTAL=$((TOTAL + 1))
    echo -n "测试 $TOTAL: $name ... "
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "$expected_code" ]; then
        echo -e "${GREEN}通过${NC} (HTTP $HTTP_CODE)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}失败${NC} (HTTP $HTTP_CODE, 预期 $expected_code)"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

test_component_exists() {
    local name="$1"
    local file="$2"
    
    TOTAL=$((TOTAL + 1))
    echo -n "测试 $TOTAL: $name ... "
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}存在${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}缺失${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# 阶段1: 基础功能测试
echo "======== 阶段1: 网站基础功能测试 ========"
echo ""

test_endpoint "首页访问" "$SERVER_URL/" "200"
test_endpoint "商品详情页" "$SERVER_URL/product/test" "200"
test_endpoint "管理后台" "$SERVER_URL/admin" "200"
test_endpoint "API端点" "$SERVER_URL/api/products/list" "200"

echo ""

# 阶段2: 文件存在性检查
echo "======== 阶段2: 新增组件文件检查 ========"
echo ""

PROJECT_DIR="/var/www/luckymart-tj"

test_component_exists "图片轮播组件" "$PROJECT_DIR/components/ProductImageCarousel.tsx"
test_component_exists "营销角标组件" "$PROJECT_DIR/components/MarketingBadgeDisplay.tsx"
test_component_exists "移动端导航组件" "$PROJECT_DIR/components/MobileNavigation.tsx"

echo ""

# 阶段3: Prisma Schema检查
echo "======== 阶段3: 数据库Schema检查 ========"
echo ""

TOTAL=$((TOTAL + 1))
echo -n "测试 $TOTAL: marketing_badge字段存在 ... "
if grep -q "marketingBadge" "$PROJECT_DIR/prisma/schema.prisma" 2>/dev/null; then
    echo -e "${GREEN}通过${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}失败${NC}"
    FAILED=$((FAILED + 1))
fi

echo ""

# 阶段4: PM2服务检查
echo "======== 阶段4: PM2服务状态检查 ========"
echo ""

TOTAL=$((TOTAL + 1))
echo -n "测试 $TOTAL: luckymart-web服务运行 ... "
if pm2 list | grep -q "luckymart-web.*online" 2>/dev/null; then
    echo -e "${GREEN}运行中${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}未运行${NC}"
    FAILED=$((FAILED + 1))
fi

echo ""

# 阶段5: 依赖检查
echo "======== 阶段5: Node依赖检查 ========"
echo ""

TOTAL=$((TOTAL + 1))
echo -n "测试 $TOTAL: node_modules存在 ... "
if [ -d "$PROJECT_DIR/node_modules" ]; then
    echo -e "${GREEN}存在${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}缺失${NC}"
    FAILED=$((FAILED + 1))
fi

TOTAL=$((TOTAL + 1))
echo -n "测试 $TOTAL: Prisma客户端生成 ... "
if [ -d "$PROJECT_DIR/node_modules/.prisma" ] || [ -d "$PROJECT_DIR/node_modules/@prisma/client" ]; then
    echo -e "${GREEN}已生成${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}未生成${NC}"
    FAILED=$((FAILED + 1))
fi

echo ""

# 测试总结
echo "============================================"
echo "测试总结"
echo "============================================"
echo ""
echo "总测试数: $TOTAL"
echo -e "通过: ${GREEN}$PASSED${NC}"
echo -e "失败: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}所有测试通过！✓${NC}"
    echo ""
    echo "下一步："
    echo "1. 在浏览器打开 $SERVER_URL"
    echo "2. 测试移动端布局（F12开发者工具）"
    echo "3. 验证图片轮播功能"
    echo "4. 检查营销角标显示"
    echo "5. 测试汉堡菜单和侧边栏"
    echo ""
    exit 0
else
    echo -e "${RED}部分测试失败，请检查上述错误${NC}"
    echo ""
    echo "建议："
    echo "1. 检查文件是否正确部署"
    echo "2. 运行: pm2 logs luckymart-web"
    echo "3. 运行: pm2 restart luckymart-web"
    echo ""
    exit 1
fi
