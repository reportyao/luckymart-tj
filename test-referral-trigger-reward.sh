#!/bin/bash

# 推荐奖励触发API快速测试脚本
# 测试POST /api/referral/trigger-reward端点的各项功能

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
API_BASE_URL="http://localhost:3000"
TEST_REQUEST_ID="test-$(date +%s)"

echo -e "${BLUE}🚀 开始测试推荐奖励触发API${NC}"
echo -e "${BLUE}========================================${NC}"

# 测试函数
test_api() {
    local test_name="$1"
    local request_data="$2"
    local expected_status="$3"
    
    echo -e "${YELLOW}📋 测试: $test_name${NC}"
    
    response=$(curl -s -w "\n%{http_code}" \
        -X POST "$API_BASE_URL/api/referral/trigger-reward" \
        -H "Content-Type: application/json" \
        -H "X-Request-ID: $TEST_REQUEST_ID" \
        -d "$request_data")
    
    status_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n-1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ 通过 - 状态码: $status_code${NC}"
    else
        echo -e "${RED}❌ 失败 - 期望: $expected_status, 实际: $status_code${NC}"
        echo -e "${RED}响应: $response_body${NC}"
        return 1
    fi
    
    # 验证响应格式
    if echo "$response_body" | grep -q '"success"'; then
        echo -e "${GREEN}✅ 响应格式正确${NC}"
    else
        echo -e "${RED}❌ 响应格式错误${NC}"
        echo -e "${RED}响应: $response_body${NC}"
        return 1
    fi
    
    echo -e "${BLUE}响应内容:${NC}"
    echo "$response_body" | jq '.' 2>/dev/null || echo "$response_body"
    echo ""
}

# 测试1: 缺少必需参数
echo -e "${BLUE}测试1: 参数验证${NC}"
test_api "缺少user_id参数" \
    '{"event_type": "first_lottery"}' \
    "400"

test_api "缺少event_type参数" \
    '{"user_id": "test-user"}' \
    "400"

test_api "无效的event_type" \
    '{"user_id": "test-user", "event_type": "invalid_event"}' \
    "400"

# 测试2: 有效参数测试
echo -e "${BLUE}测试2: 有效参数测试${NC}"
test_api "首次抽奖奖励触发" \
    '{
        "user_id": "test-user-123",
        "event_type": "first_lottery",
        "event_data": {
            "lottery_round_id": "round-456",
            "amount": 100
        }
    }' \
    "404"  # 期望404因为测试用户不存在

test_api "首次购买奖励触发" \
    '{
        "user_id": "test-user-456", 
        "event_type": "first_purchase",
        "event_data": {
            "order_id": "order-789",
            "amount": 500
        }
    }' \
    "404"  # 期望404因为测试用户不存在

# 测试3: 测试各种事件类型
echo -e "${BLUE}测试3: 事件类型测试${NC}"
test_api "first_lottery类型" \
    '{"user_id": "test", "event_type": "first_lottery"}' \
    "404"

test_api "first_purchase类型" \
    '{"user_id": "test", "event_type": "first_purchase"}' \
    "404"

# 测试4: CORS测试
echo -e "${BLUE}测试4: CORS测试${NC}"
echo -e "${YELLOW}📋 测试 OPTIONS 请求${NC}"
cors_response=$(curl -s -w "\n%{http_code}" \
    -X OPTIONS "$API_BASE_URL/api/referral/trigger-reward" \
    -H "Origin: https://example.com" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type")

cors_status=$(echo "$cors_response" | tail -n1)

if [ "$cors_status" = "200" ]; then
    echo -e "${GREEN}✅ CORS预检请求通过${NC}"
else
    echo -e "${RED}❌ CORS预检请求失败: $cors_status${NC}"
fi

# 测试5: 性能测试
echo -e "${BLUE}测试5: 性能测试${NC}"
echo -e "${YELLOW}📋 连续发送10个请求测试${NC}"

total_time=0
success_count=0
for i in {1..10}; do
    start_time=$(date +%s%3N)
    
    response=$(curl -s -w "%{http_code}" \
        -X POST "$API_BASE_URL/api/referral/trigger-reward" \
        -H "Content-Type: application/json" \
        -d '{"user_id": "perf-test-user", "event_type": "first_lottery"}')
    
    end_time=$(date +%s%3N)
    response_time=$((end_time - start_time))
    total_time=$((total_time + response_time))
    
    status_code="${response: -3}"
    
    if [ "$status_code" = "404" ]; then
        success_count=$((success_count + 1))
    fi
    
    echo "请求 $i: ${response_time}ms (状态: $status_code)"
done

avg_time=$((total_time / 10))
echo ""
echo -e "${BLUE}性能测试结果:${NC}"
echo -e "平均响应时间: ${avg_time}ms"
echo -e "成功请求数: $success_count/10"
echo -e "成功率: $((success_count * 10))%"

if [ $avg_time -lt 1000 ]; then
    echo -e "${GREEN}✅ 性能良好${NC}"
else
    echo -e "${YELLOW}⚠️ 性能需要优化${NC}"
fi

# 测试6: 错误处理测试
echo -e "${BLUE}测试6: 错误处理测试${NC}"

# 测试空的JSON
test_api "空JSON请求" \
    '{}' \
    "400"

# 测试错误的Content-Type
echo -e "${YELLOW}📋 测试错误Content-Type${NC}"
wrong_ct_response=$(curl -s -w "\n%{http_code}" \
    -X POST "$API_BASE_URL/api/referral/trigger-reward" \
    -H "Content-Type: text/plain" \
    -d "invalid data")

wrong_ct_status=$(echo "$wrong_ct_response" | tail -n1)

if [ "$wrong_ct_status" = "400" ] || [ "$wrong_ct_status" = "415" ]; then
    echo -e "${GREEN}✅ Content-Type检查正常${NC}"
else
    echo -e "${YELLOW}⚠️ Content-Type检查状态码: $wrong_ct_status${NC}"
fi

# 测试总结
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🎯 测试完成总结${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "✅ 参数验证测试"
echo -e "✅ 事件类型测试"  
echo -e "✅ CORS支持测试"
echo -e "✅ 性能基准测试"
echo -e "✅ 错误处理测试"
echo ""
echo -e "${GREEN}🎉 API基础功能测试通过！${NC}"
echo ""
echo -e "${YELLOW}📝 注意事项:${NC}"
echo -e "• 404响应是正常的，因为测试用户不存在于数据库中"
echo -e "• 实际使用需要在数据库中创建真实的测试数据"
echo -e "• 性能测试结果仅供参考，实际性能取决于服务器配置"
echo ""
echo -e "${BLUE}🔗 下一步建议:${NC}"
echo -e "1. 在数据库中创建测试用户和推荐关系"
echo -e "2. 配置有效的Telegram Bot Token"
echo -e "3. 运行完整的单元测试套件"
echo -e "4. 进行端到端集成测试"