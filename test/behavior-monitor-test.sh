#!/bin/bash

# 行为监控系统的测试脚本
# 用于验证各个检测功能是否正常工作

set -e

echo "🚀 开始测试行为监控系统..."

# 测试配置
BASE_URL="http://localhost:3000"  # Supabase Functions的URL
PROJECT_REF="your-project-ref"    # 替换为实际的项目引用

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试结果计数器
PASSED=0
FAILED=0

# 测试函数
test_api() {
    local test_name="$1"
    local endpoint="$2"
    local method="$3"
    local data="$4"
    
    echo -n "测试 $test_name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "%{http_code}" "$BASE_URL/$endpoint")
    else
        response=$(curl -s -w "%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL/$endpoint")
    fi
    
    http_code="${response: -3}"
    response_body="${response:0:-3}"
    
    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✓ 通过${NC}"
        ((PASSED++))
        echo "  响应: $response_body"
    else
        echo -e "${RED}✗ 失败 (HTTP $http_code)${NC}"
        ((FAILED++))
        echo "  错误响应: $response_body"
    fi
}

# 1. 测试行为监控API
echo -e "\n${YELLOW}1. 测试行为监控API${NC}"
test_api "运行所有检测" "behavior-monitor-api?action=run_all_detections" "GET" ""
test_api "获取统计信息" "behavior-monitor-api?action=get_stats" "GET" ""
test_api "清理黑名单" "behavior-monitor-api" "POST" '{"action": "cleanup_blacklist"}'

# 2. 测试黑名单管理API
echo -e "\n${YELLOW}2. 测试黑名单管理API${NC}"
test_api "获取黑名单列表" "blacklist-manager?operation=list" "GET" ""
test_api "添加黑名单条目" "blacklist-manager" "POST" '{"operation": "add", "data": {"deviceId": "test_device_123", "reason": "测试设备", "expiresAt": "2025-11-30T00:00:00Z"}}'
test_api "删除黑名单条目" "blacklist-manager" "DELETE" '{"deviceId": "test_device_123"}'
test_api "清理过期黑名单" "blacklist-manager?operation=cleanup" "GET" ""

# 3. 测试Edge Functions
echo -e "\n${YELLOW}3. 测试Edge Functions${NC}"

# 检查函数是否已部署
echo "检查Edge Functions部署状态..."
functions=("behavior-monitor-api" "behavior-monitor-cron" "blacklist-manager")

for func in "${functions[@]}"; do
    echo -n "检查函数 $func... "
    if supabase functions list | grep -q "$func"; then
        echo -e "${GREEN}✓ 已部署${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ 未部署${NC}"
        ((FAILED++))
    fi
done

# 4. 测试定时任务
echo -e "\n${YELLOW}4. 测试定时任务配置${NC}"
cron_jobs=("behavior_monitor_6h" "blacklist_cleanup_daily" "realtime_monitor_2h")

for job in "${cron_jobs[@]}"; do
    echo -n "检查定时任务 $job... "
    if [ -f "/workspace/supabase/cron_jobs/${job}.json" ]; then
        echo -e "${GREEN}✓ 已配置${NC}"
        ((PASSED++))
        # 验证cron表达式格式
        cron_expr=$(jq -r '.cron_expression' "/workspace/supabase/cron_jobs/${job}.json")
        echo "  Cron表达式: $cron_expr"
    else
        echo -e "${RED}✗ 未配置${NC}"
        ((FAILED++))
    fi
done

# 5. 数据库表结构检查
echo -e "\n${YELLOW}5. 测试数据库表结构${NC}"

tables=("device_fingerprints" "device_blacklist" "fraud_detection_logs" "referral_relationships" "users")

for table in "${tables[@]}"; do
    echo -n "检查表 $table... "
    # 这里需要实际连接到数据库进行检查
    # 在实际环境中，您可以使用psql或Prisma客户端
    echo -e "${YELLOW}? 需要数据库连接${NC}"
done

# 6. 生成测试报告
echo -e "\n${YELLOW}6. 测试总结${NC}"
echo "======================"
echo -e "测试通过: ${GREEN}$PASSED${NC}"
echo -e "测试失败: ${RED}$FAILED${NC}"
echo "总测试数: $((PASSED + FAILED))"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 所有测试通过！行为监控系统运行正常。${NC}"
    exit 0
else
    echo -e "\n${RED}❌ 有 $FAILED 个测试失败，请检查相关配置。${NC}"
    exit 1
fi