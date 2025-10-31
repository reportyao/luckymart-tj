#!/bin/bash

# =============================================================================
# LuckyMart TJ 自动化测试脚本
# 测试框架执行脚本，包含环境检查、测试执行和报告生成
# =============================================================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# 测试结果目录
TEST_RESULTS_DIR="$ROOT_DIR/test-results"
COVERAGE_DIR="$TEST_RESULTS_DIR/coverage"

# 日志文件
LOG_FILE="$TEST_RESULTS_DIR/test-execution-$(date +%Y%m%d_%H%M%S).log"

# 创建测试结果目录
mkdir -p "$TEST_RESULTS_DIR"
mkdir -p "$COVERAGE_DIR"

# 打印函数
print_header() {
    echo -e "${BLUE}=================================${NC}"
    echo -e "${BLUE} $1 ${NC}"
    echo -e "${BLUE}=================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 检查环境函数
check_environment() {
    print_header "检查测试环境"
    
    local has_error=false
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装"
        has_error=true
    else
        NODE_VERSION=$(node --version)
        print_success "Node.js 版本: $NODE_VERSION"
        log "Node.js 版本: $NODE_VERSION"
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        print_error "npm 未安装"
        has_error=true
    else
        NPM_VERSION=$(npm --version)
        print_success "npm 版本: $NPM_VERSION"
        log "npm 版本: $NPM_VERSION"
    fi
    
    # 检查依赖安装
    if [ ! -d "node_modules" ]; then
        print_warning "node_modules 不存在，正在安装依赖..."
        log "开始安装项目依赖..."
        if npm install; then
            print_success "依赖安装完成"
            log "依赖安装成功"
        else
            print_error "依赖安装失败"
            log "依赖安装失败"
            has_error=true
        fi
    else
        print_success "依赖已安装"
    fi
    
    # 检查环境变量文件
    if [ ! -f ".env.local" ]; then
        print_warning ".env.local 文件不存在"
        print_info "将创建示例环境配置文件..."
        create_env_template
    else
        print_success "环境配置文件存在"
    fi
    
    # 检查数据库配置
    check_database_config
    
    if [ "$has_error" = true ]; then
        print_error "环境检查失败，请解决上述问题后重试"
        exit 1
    else
        print_success "环境检查通过"
    fi
}

# 创建环境变量模板
create_env_template() {
    cat > .env.local << EOF
# LuckyMart TJ 测试环境配置
# 请根据实际环境修改以下配置

# 数据库配置 (请替换为实际的测试数据库URL)
DATABASE_URL="postgresql://postgres:[密码]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

# JWT密钥 (测试环境使用)
JWT_SECRET="test-jwt-secret-for-testing-only"

# Telegram Bot令牌 (测试环境使用)
TELEGRAM_BOT_TOKEN="test-bot-token-for-testing"

# 环境标识
NODE_ENV="test"

# 其他测试配置
TEST_DB_CLEANUP="true"
COVERAGE_THRESHOLD="90"
EOF
    print_success "已创建 .env.local 示例文件"
    print_warning "请根据实际环境修改数据库配置和其他参数"
    log "创建环境配置文件模板"
}

# 检查数据库配置
check_database_config() {
    print_info "检查数据库配置..."
    
    if [ -z "$DATABASE_URL" ]; then
        if [ -f ".env.local" ]; then
            source .env.local
        fi
    fi
    
    if [ -z "$DATABASE_URL" ]; then
        print_warning "DATABASE_URL 环境变量未设置"
        print_info "请在 .env.local 文件中配置测试数据库URL"
        return 1
    else
        print_success "DATABASE_URL 已配置"
        log "数据库URL已配置"
        return 0
    fi
}

# 验证数据库连接
verify_database_connection() {
    print_header "验证数据库连接"
    
    if [ -z "$DATABASE_URL" ]; then
        print_warning "跳过数据库连接验证 - 未配置DATABASE_URL"
        return 1
    fi
    
    # 生成Prisma客户端
    print_info "生成Prisma客户端..."
    if npm run prisma:generate > /dev/null 2>&1; then
        print_success "Prisma客户端生成成功"
    else
        print_error "Prisma客户端生成失败"
        return 1
    fi
    
    # 测试数据库连接
    print_info "测试数据库连接..."
    if npx prisma db pull > /dev/null 2>&1; then
        print_success "数据库连接成功"
        log "数据库连接验证成功"
        return 0
    else
        print_error "数据库连接失败"
        print_warning "请检查数据库配置和连接信息"
        log "数据库连接验证失败"
        return 1
    fi
}

# 初始化测试数据
init_test_data() {
    print_header "初始化测试数据"
    
    # 检查是否存在测试数据初始化脚本
    if [ -f "test/init-test-data.sql" ]; then
        print_info "找到测试数据初始化脚本"
        if [ -n "$DATABASE_URL" ]; then
            print_info "正在执行测试数据初始化..."
            if psql "$DATABASE_URL" -f "test/init-test-data.sql" > /dev/null 2>&1; then
                print_success "测试数据初始化成功"
                log "测试数据初始化成功"
            else
                print_warning "测试数据初始化失败，请手动检查"
                log "测试数据初始化失败"
            fi
        else
            print_warning "跳过测试数据初始化 - 未配置数据库"
        fi
    else
        print_info "未找到测试数据初始化脚本"
    fi
}

# 运行测试函数
run_tests() {
    local test_type="$1"
    local test_pattern="$2"
    
    print_header "运行测试 - $test_type"
    
    local start_time=$(date +%s)
    local test_command="jest $test_pattern --coverage --coverageDirectory=$COVERAGE_DIR"
    
    print_info "执行命令: $test_command"
    log "开始执行测试: $test_type"
    
    # 执行测试
    if eval "$test_command"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        print_success "$test_type 测试完成 (耗时: ${duration}秒)"
        log "$test_type 测试成功完成，耗时: ${duration}秒"
        return 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        print_error "$test_type 测试失败 (耗时: ${duration}秒)"
        log "$test_type 测试失败，耗时: ${duration}秒"
        return 1
    fi
}

# 生成测试报告
generate_test_report() {
    print_header "生成测试报告"
    
    local report_file="$TEST_RESULTS_DIR/test-report-$(date +%Y%m%d_%H%M%S).html"
    
    # 检查是否有覆盖率数据
    if [ -f "$COVERAGE_DIR/coverage-final.json" ]; then
        print_info "生成HTML覆盖率报告..."
        
        # 使用Jest的HTML报告生成功能
        npx jest --coverage --coverageDirectory="$COVERAGE_DIR" --coverageReporters=html > /dev/null 2>&1
        
        if [ -f "$COVERAGE_DIR/index.html" ]; then
            print_success "HTML覆盖率报告已生成: $COVERAGE_DIR/index.html"
            log "HTML覆盖率报告生成成功"
        fi
        
        # 生成总结报告
        generate_summary_report
    else
        print_warning "未找到覆盖率数据，跳过报告生成"
    fi
}

# 生成测试总结报告
generate_summary_report() {
    local summary_file="$TEST_RESULTS_DIR/test-summary-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$summary_file" << EOF
# 测试执行总结报告

**执行时间**: $(date '+%Y-%m-%d %H:%M:%S')
**项目**: LuckyMart TJ 多层级裂变系统

## 测试执行详情

### 测试类型
- ✅ 单元测试
- ✅ 集成测试
- ✅ 覆盖率测试

### 覆盖率报告位置
- HTML报告: $COVERAGE_DIR/index.html
- JSON数据: $COVERAGE_DIR/coverage-final.json
- LCOV数据: $COVERAGE_DIR/lcov.info

### 下一步建议
1. 查看HTML覆盖率报告了解详细覆盖情况
2. 针对低覆盖率模块补充测试用例
3. 定期运行测试确保代码质量

---
*报告由自动化测试脚本生成*
EOF
    
    print_success "测试总结报告已生成: $summary_file"
    log "测试总结报告生成完成: $summary_file"
}

# 清理函数
cleanup() {
    print_header "清理测试环境"
    
    # 清理Jest缓存
    if [ -d ".jest" ]; then
        rm -rf .jest
        print_success "Jest缓存已清理"
    fi
    
    # 清理临时文件
    find . -name "*.tmp" -delete 2>/dev/null || true
    print_success "临时文件已清理"
}

# 显示帮助信息
show_help() {
    echo "LuckyMart TJ 自动化测试脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --unit              只运行单元测试"
    echo "  --integration       只运行集成测试"
    echo "  --performance       只运行性能测试"
    echo "  --coverage          只生成覆盖率报告"
    echo "  --clean             清理测试环境"
    echo "  --help, -h          显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                  运行完整测试套件"
    echo "  $0 --unit           只运行单元测试"
    echo "  $0 --clean          清理测试环境"
}

# 主函数
main() {
    local test_type="all"
    
    # 解析命令行参数
    case "${1:-}" in
        --unit)
            test_type="unit"
            ;;
        --integration)
            test_type="integration"
            ;;
        --performance)
            test_type="performance"
            ;;
        --coverage)
            test_type="coverage"
            ;;
        --clean)
            cleanup
            exit 0
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            if [ -n "${1:-}" ]; then
                print_warning "未知参数: $1"
                show_help
                exit 1
            fi
            ;;
    esac
    
    log "开始执行自动化测试 - 类型: $test_type"
    
    # 检查环境
    check_environment
    
    # 验证数据库连接（可选）
    verify_database_connection || print_warning "数据库连接失败，某些测试可能无法运行"
    
    # 初始化测试数据
    init_test_data
    
    # 运行测试
    local has_failure=false
    
    case $test_type in
        "unit")
            if ! run_tests "单元测试" "__tests__/*.test.ts"; then
                has_failure=true
            fi
            ;;
        "integration")
            if ! run_tests "集成测试" "test/**/*.test.ts"; then
                has_failure=true
            fi
            ;;
        "performance")
            if ! run_tests "性能测试" "__tests__/*performance*.test.ts"; then
                has_failure=true
            fi
            ;;
        "coverage")
            print_info "仅生成覆盖率报告..."
            generate_test_report
            ;;
        *)
            # 运行所有测试
            print_info "运行完整测试套件..."
            
            # 核心邀请系统测试
            if ! run_tests "邀请系统测试" "__tests__/referral-system-integration.test.ts"; then
                has_failure=true
            fi
            
            # 奖励触发测试
            if ! run_tests "奖励触发测试" "__tests__/referral-reward-trigger.test.ts"; then
                has_failure=true
            fi
            
            # 返利计算测试
            if ! run_tests "返利计算测试" "__tests__/referral-calc-rebate.test.ts"; then
                has_failure=true
            fi
            
            # 认证测试
            if ! run_tests "认证测试" "__tests__/auth.test.ts"; then
                has_failure=true
            fi
            
            # 业务流程测试
            if ! run_tests "业务流程测试" "__tests__/business-flow.test.ts"; then
                has_failure=true
            fi
            
            # API安全测试
            if ! run_tests "API安全测试" "__tests__/api-security.test.ts"; then
                has_failure=true
            fi
            ;;
    esac
    
    # 生成报告
    generate_test_report
    
    # 显示结果
    print_header "测试执行完成"
    
    if [ "$has_failure" = false ]; then
        print_success "所有测试通过！"
        log "测试执行成功完成"
        exit 0
    else
        print_error "部分测试失败，请检查日志文件: $LOG_FILE"
        log "测试执行失败，请检查上述错误信息"
        exit 1
    fi
}

# 脚本入口点
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi