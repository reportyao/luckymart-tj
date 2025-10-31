#!/bin/bash

# 推荐统计API测试脚本
# 创建时间: 2025-10-31 02:00:22

echo "================================================"
echo "    推荐统计API测试脚本"
echo "================================================"
echo

# 配置变量
API_BASE_URL="http://localhost:3000/api"
TEST_ENDPOINT="${API_BASE_URL}/referral/stats"

# 测试用的认证token（需要从实际的登录API获取）
AUTH_TOKEN="${AUTH_TOKEN:-}"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "API端点: $TEST_ENDPOINT"
echo "认证Token: ${AUTH_TOKEN:0:20}..."
echo

# 检查是否提供了认证token
if [ -z "$AUTH_TOKEN" ]; then
    echo -e "${YELLOW}警告: 未提供认证token，请设置AUTH_TOKEN环境变量${NC}"
    echo "可以从以下方式获取token:"
    echo "1. 调用 /api/auth/telegram 获取"
    echo "2. 登录Telegram Web App"
    echo
    read -p "是否继续测试？(需要有效token才能成功) [y/N]: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "测试已取消"
        exit 1
    fi
fi

# 测试用例
echo "开始执行测试用例..."
echo

# 测试1: 基础请求（需要认证）
test_case_1() {
    echo "测试1: 基础推荐统计查询"
    echo "请求: GET $TEST_ENDPOINT"
    
    if [ -z "$AUTH_TOKEN" ]; then
        echo -e "${RED}❌ 跳过 - 需要认证token${NC}"
        return
    fi
    
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$TEST_ENDPOINT")
    
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_CODE:/d')
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ 请求成功 (HTTP $http_code)${NC}"
        echo "响应摘要:"
        echo "$body" | jq -r '.data.referral_stats.total_referrals // "N/A"' 2>/dev/null | head -1 | sed 's/^/  总推荐数: /'
        echo "$body" | jq -r '.data.referral_stats.rewards.total_rewards // "N/A"' 2>/dev/null | head -1 | sed 's/^/  总奖励: /'
    else
        echo -e "${RED}❌ 请求失败 (HTTP $http_code)${NC}"
        echo "响应: $body"
    fi
    echo
}

# 测试2: 分页测试
test_case_2() {
    echo "测试2: 分页参数测试"
    echo "请求: GET $TEST_ENDPOINT?page=1&limit=5"
    
    if [ -z "$AUTH_TOKEN" ]; then
        echo -e "${RED}❌ 跳过 - 需要认证token${NC}"
        return
    fi
    
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "${TEST_ENDPOINT}?page=1&limit=5")
    
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_CODE:/d')
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ 分页请求成功 (HTTP $http_code)${NC}"
        echo "分页信息:"
        echo "$body" | jq -r '.data.referral_list.pagination | "  当前页: \(.page), 总页数: \(.total_pages), 总记录: \(.total)"' 2>/dev/null
    else
        echo -e "${RED}❌ 分页请求失败 (HTTP $http_code)${NC}"
        echo "响应: $body"
    fi
    echo
}

# 测试3: 级别过滤测试
test_case_3() {
    echo "测试3: 推荐级别过滤测试"
    echo "请求: GET $TEST_ENDPOINT?level=1"
    
    if [ -z "$AUTH_TOKEN" ]; then
        echo -e "${RED}❌ 跳过 - 需要认证token${NC}"
        return
    fi
    
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "${TEST_ENDPOINT}?level=1")
    
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_CODE:/d')
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ 级别过滤请求成功 (HTTP $http_code)${NC}"
        echo "过滤信息:"
        echo "$body" | jq -r '.data.filters.level_filter // "N/A"' 2>/dev/null | sed 's/^/  过滤级别: /'
    else
        echo -e "${RED}❌ 级别过滤请求失败 (HTTP $http_code)${NC}"
        echo "响应: $body"
    fi
    echo
}

# 测试4: 活跃用户过滤测试
test_case_4() {
    echo "测试4: 活跃用户过滤测试"
    echo "请求: GET $TEST_ENDPOINT?active_only=true"
    
    if [ -z "$AUTH_TOKEN" ]; then
        echo -e "${RED}❌ 跳过 - 需要认证token${NC}"
        return
    fi
    
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "${TEST_ENDPOINT}?active_only=true")
    
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_CODE:/d')
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ 活跃用户过滤请求成功 (HTTP $http_code)${NC}"
        echo "活跃用户统计:"
        echo "$body" | jq -r '.data.referral_list.summary | "  总用户: \(.total_users), 活跃用户: \(.active_users), 活跃率: \(.active_rate)%"' 2>/dev/null
    else
        echo -e "${RED}❌ 活跃用户过滤请求失败 (HTTP $http_code)${NC}"
        echo "响应: $body"
    fi
    echo
}

# 测试5: 无认证测试
test_case_5() {
    echo "测试5: 无认证token测试（应该返回401）"
    echo "请求: GET $TEST_ENDPOINT (无Authorization头)"
    
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
        "$TEST_ENDPOINT")
    
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_CODE:/d')
    
    if [ "$http_code" = "401" ]; then
        echo -e "${GREEN}✅ 正确返回401未授权 (HTTP $http_code)${NC}"
        echo "错误信息:"
        echo "$body" | jq -r '.error // "N/A"' 2>/dev/null | sed 's/^/  /'
    else
        echo -e "${RED}❌ 预期401但得到 $http_code${NC}"
        echo "响应: $body"
    fi
    echo
}

# 测试6: 无效参数测试
test_case_6() {
    echo "测试6: 无效参数测试（应该返回400）"
    echo "请求: GET $TEST_ENDPOINT?page=0&limit=101"
    
    if [ -z "$AUTH_TOKEN" ]; then
        echo -e "${RED}❌ 跳过 - 需要认证token${NC}"
        return
    fi
    
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "${TEST_ENDPOINT}?page=0&limit=101")
    
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_CODE:/d')
    
    if [ "$http_code" = "400" ]; then
        echo -e "${GREEN}✅ 正确返回400参数错误 (HTTP $http_code)${NC}"
        echo "错误信息:"
        echo "$body" | jq -r '.error // "N/A"' 2>/dev/null | sed 's/^/  /'
    else
        echo -e "${RED}❌ 预期400但得到 $http_code${NC}"
        echo "响应: $body"
    fi
    echo
}

# 测试7: 无效级别参数测试
test_case_7() {
    echo "测试7: 无效级别参数测试（应该返回400）"
    echo "请求: GET $TEST_ENDPOINT?level=4"
    
    if [ -z "$AUTH_TOKEN" ]; then
        echo -e "${RED}❌ 跳过 - 需要认证token${NC}"
        return
    fi
    
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "${TEST_ENDPOINT}?level=4")
    
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_CODE:/d')
    
    if [ "$http_code" = "400" ]; then
        echo -e "${GREEN}✅ 正确返回400参数错误 (HTTP $http_code)${NC}"
        echo "错误信息:"
        echo "$body" | jq -r '.error // "N/A"' 2>/dev/null | sed 's/^/  /'
    else
        echo -e "${RED}❌ 预期400但得到 $http_code${NC}"
        echo "响应: $body"
    fi
    echo
}

# 执行所有测试
echo "=== 执行测试用例 ==="
test_case_1
test_case_2
test_case_3
test_case_4
test_case_5
test_case_6
test_case_7

echo "=== 测试完成 ==="
echo
echo "使用说明:"
echo "1. 设置AUTH_TOKEN环境变量以进行完整测试"
echo "2. 确保服务运行在 $API_BASE_URL"
echo "3. 成功测试需要有效的用户账户和推荐关系数据"
echo
echo "示例:"
echo "  export AUTH_TOKEN='your_jwt_token_here'"
echo "  ./test_referral_stats.sh"
echo

# 性能测试（可选）
read -p "是否进行简单的性能测试？[y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "=== 性能测试 ==="
    echo "发送10个并发请求..."
    
    if [ -z "$AUTH_TOKEN" ]; then
        echo -e "${YELLOW}跳过性能测试 - 需要认证token${NC}"
    else
        start_time=$(date +%s.%N)
        for i in {1..10}; do
            curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
                "${TEST_ENDPOINT}?page=1&limit=5" > /dev/null &
        done
        wait
        end_time=$(date +%s.%N)
        
        duration=$(echo "$end_time - $start_time" | bc)
        echo "10个并发请求完成，耗时: ${duration}秒"
        echo -e "${GREEN}✅ 性能测试完成${NC}"
    fi
fi

echo
echo "测试脚本执行完毕！"