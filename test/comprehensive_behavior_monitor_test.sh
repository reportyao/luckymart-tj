#!/bin/bash

# 行为监控系统完整测试脚本
# 验证所有检测功能和API

set -e

echo "🔍 开始全面测试行为监控系统..."
echo "================================================"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# 测试配置
SUPABASE_URL="${SUPABASE_URL:-http://localhost:54321}"
PROJECT_REF="${SUPABASE_PROJECT_REF:-your-project-ref}"

# 测试结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED_TESTS++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED_TESTS++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 测试函数
test_command() {
    local test_name="$1"
    local command="$2"
    local expected_status="${3:-0}"
    
    ((TOTAL_TESTS++))
    log_info "测试: $test_name"
    
    if eval "$command" > /tmp/test_output.log 2>&1; then
        if [ $expected_status -eq 0 ]; then
            log_success "$test_name - 命令执行成功"
        else
            log_fail "$test_name - 预期失败但成功了"
        fi
    else
        if [ $expected_status -ne 0 ]; then
            log_success "$test_name - 按预期失败"
        else
            log_fail "$test_name - 命令执行失败"
            echo "错误输出:"
            cat /tmp/test_output.log
        fi
    fi
}

test_api_endpoint() {
    local test_name="$1"
    local endpoint="$2"
    local method="${3:-GET}"
    local data="$4"
    
    ((TOTAL_TESTS++))
    log_info "测试API: $test_name"
    
    local url="${SUPABASE_URL}/functions/v1/${endpoint}"
    local response
    local http_code
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "%{http_code}" "$url" -H "Authorization: Bearer ${SUPABASE_ANON_KEY:-test-key}")
    else
        response=$(curl -s -w "%{http_code}" -X "$method" \
            -H "Authorization: Bearer ${SUPABASE_ANON_KEY:-test-key}" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$url")
    fi
    
    http_code="${response: -3}"
    response_body="${response:0:-3}"
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        log_success "$test_name - HTTP $http_code"
        echo "  响应: $(echo $response_body | jq -c . 2>/dev/null || echo $response_body | head -c 200)"
    else
        log_fail "$test_name - HTTP $http_code"
        echo "  错误: $response_body"
    fi
}

# 1. 检查文件结构
echo -e "\n${YELLOW}1. 检查文件结构${NC}"
echo "--------------------------------"

files_to_check=(
    "lib/anti-fraud/behavior-monitor.ts"
    "lib/anti-fraud/device-fingerprint.ts"
    "lib/anti-fraud/fraud-checker.ts"
    "supabase/functions/behavior-monitor-cron/index.ts"
    "supabase/functions/behavior-monitor-api/index.ts"
    "supabase/functions/blacklist-manager/index.ts"
    "supabase/migrations/1846500000_create_behavior_monitoring_tables.sql"
    "supabase/migrations/1846500001_create_behavior_detection_functions.sql"
    "__tests__/behavior-monitor.test.ts"
    "test/behavior-monitor-test.sh"
)

for file in "${files_to_check[@]}"; do
    ((TOTAL_TESTS++))
    if [ -f "$file" ]; then
        log_success "文件存在: $file"
    else
        log_fail "文件缺失: $file"
    fi
done

# 2. 检查定时任务配置
echo -e "\n${YELLOW}2. 检查定时任务配置${NC}"
echo "--------------------------------"

cron_jobs=(
    "supabase/cron_jobs/behavior_monitor_6h.json"
    "supabase/cron_jobs/blacklist_cleanup_daily.json"
    "supabase/cron_jobs/realtime_monitor_2h.json"
)

for job in "${cron_jobs[@]}"; do
    ((TOTAL_TESTS++))
    if [ -f "$job" ]; then
        log_success "定时任务配置存在: $(basename $job)"
        # 验证JSON格式
        if jq empty "$job" 2>/dev/null; then
            log_success "  JSON格式正确"
            cron_expr=$(jq -r '.cron_expression' "$job")
            echo "  Cron表达式: $cron_expr"
        else
            log_fail "  JSON格式错误"
        fi
    else
        log_fail "定时任务配置缺失: $(basename $job)"
    fi
done

# 3. 测试TypeScript编译
echo -e "\n${YELLOW}3. 测试TypeScript编译${NC}"
echo "--------------------------------"

test_command "TypeScript类型检查" "npx tsc --noEmit lib/anti-fraud/behavior-monitor.ts"

# 4. 测试Jest单元测试
echo -e "\n${YELLOW}4. 运行Jest单元测试${NC}"
echo "--------------------------------"

if command -v npm &> /dev/null; then
    test_command "Jest单元测试" "npm test -- --testPathPattern=behavior-monitor.test.ts --passWithNoTests" 0
else
    log_warning "npm未安装，跳过Jest测试"
fi

# 5. 测试API端点（需要在Supabase运行）
echo -e "\n${YELLOW}5. 测试API端点${NC}"
echo "--------------------------------"

# 检查Supabase服务是否运行
if curl -s --connect-timeout 5 "${SUPABASE_URL}/health" > /dev/null 2>&1; then
    log_success "Supabase服务可访问"
    
    # 测试API端点
    test_api_endpoint "运行所有检测" "behavior-monitor-api?action=run_all_detections" "GET"
    test_api_endpoint "获取统计信息" "behavior-monitor-api?action=get_stats" "GET"
    test_api_endpoint "清理黑名单" "behavior-monitor-api" "POST" '{"action": "cleanup_blacklist"}'
    test_api_endpoint "获取黑名单列表" "blacklist-manager?operation=list" "GET"
else
    log_warning "Supabase服务不可访问，跳过API测试"
    ((TOTAL_TESTS += 4))
fi

# 6. 验证数据库迁移文件
echo -e "\n${YELLOW}6. 验证数据库迁移文件${NC}"
echo "--------------------------------"

migration_files=(
    "supabase/migrations/1846500000_create_behavior_monitoring_tables.sql"
    "supabase/migrations/1846500001_create_behavior_detection_functions.sql"
)

for migration in "${migration_files[@]}"; do
    ((TOTAL_TESTS++))
    if [ -f "$migration" ]; then
        log_success "迁移文件存在: $(basename $migration)"
        
        # 检查关键SQL语句
        if grep -q "CREATE TABLE" "$migration"; then
            log_success "  包含CREATE TABLE语句"
        else
            log_warning "  未找到CREATE TABLE语句"
        fi
        
        if grep -q "CREATE OR REPLACE FUNCTION" "$migration"; then
            log_success "  包含数据库函数定义"
        else
            log_warning "  未找到数据库函数定义"
        fi
    else
        log_fail "迁移文件缺失: $(basename $migration)"
    fi
done

# 7. 检查README文档
echo -e "\n${YELLOW}7. 检查文档完整性${NC}"
echo "--------------------------------"

doc_files=(
    "lib/anti-fraud/BEHAVIOR_MONITOR_README.md"
    "lib/anti-fraud/README.md"
)

for doc in "${doc_files[@]}"; do
    ((TOTAL_TESTS++))
    if [ -f "$doc" ]; then
        log_success "文档文件存在: $(basename $doc)"
        
        # 检查文档内容
        local content=$(cat "$doc" 2>/dev/null || echo "")
        
        if echo "$content" | grep -q "行为异常检测"; then
            log_success "  包含行为检测说明"
        fi
        
        if echo "$content" | grep -q "API"; then
            log_success "  包含API文档"
        fi
        
        if echo "$content" | grep -q "定时任务"; then
            log_success "  包含定时任务说明"
        fi
    else
        log_fail "文档文件缺失: $(basename $doc)"
    fi
done

# 8. 生成测试报告
echo -e "\n${YELLOW}8. 测试总结报告${NC}"
echo "================================================"

echo "测试统计:"
echo "  总测试数: $TOTAL_TESTS"
echo -e "  通过测试: ${GREEN}$PASSED_TESTS${NC}"
echo -e "  失败测试: ${RED}$FAILED_TESTS${NC}"
echo "  通过率: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"

# 计算系统完整性评分
integrity_score=$(( PASSED_TESTS * 100 / TOTAL_TESTS ))

echo -e "\n系统完整性评分: ${integrity_score}%"

if [ $integrity_score -ge 90 ]; then
    echo -e "${GREEN}🎉 行为监控系统完整性优秀！${NC}"
elif [ $integrity_score -ge 70 ]; then
    echo -e "${YELLOW}⚠️ 行为监控系统基本完整，有少量问题需要解决${NC}"
else
    echo -e "${RED}❌ 行为监控系统存在较多问题，需要修复${NC}"
fi

# 9. 提供后续建议
echo -e "\n${YELLOW}9. 后续步骤建议${NC}"
echo "================================================"

if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}需要修复的问题:${NC}"
    echo "1. 检查失败的测试项目并修复相关文件"
    echo "2. 确保所有依赖文件都存在"
    echo "3. 验证数据库迁移文件语法正确"
else
    echo -e "${GREEN}建议的下一步操作:${NC}"
    echo "1. 应用数据库迁移文件"
    echo "2. 部署Edge Functions到Supabase"
    echo "3. 设置定时任务"
    echo "4. 运行集成测试验证功能"
    echo "5. 创建监控面板显示检测结果"
fi

echo -e "\n部署命令:"
echo "supabase db push"
echo "supabase functions deploy"
echo "supabase functions serve --env-file .env"

echo -e "\n测试命令:"
echo "./test/behavior-monitor-test.sh"

# 保存测试报告
REPORT_FILE="behavior_monitor_test_report_$(date +%Y%m%d_%H%M%S).txt"
{
    echo "行为监控系统测试报告"
    echo "生成时间: $(date)"
    echo "================================================"
    echo "总测试数: $TOTAL_TESTS"
    echo "通过测试: $PASSED_TESTS"
    echo "失败测试: $FAILED_TESTS"
    echo "通过率: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
    echo "完整性评分: ${integrity_score}%"
    echo ""
    echo "建议:"
    if [ $FAILED_TESTS -eq 0 ]; then
        echo "系统准备就绪，可以进行部署"
    else
        echo "需要修复 $FAILED_TESTS 个问题后再部署"
    fi
} > "$REPORT_FILE"

echo -e "\n测试报告已保存到: $REPORT_FILE"

# 返回适当的退出码
if [ $FAILED_TESTS -eq 0 ]; then
    exit 0
else
    exit 1
fi