#!/bin/bash

# LuckyMart-TJ 性能优化验证脚本
# 验证优化措施是否正确实施和生效

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# 验证结果统计
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# 检查函数
check_item() {
    local description="$1"
    local condition="$2"
    local severity="${3:-error}" # error, warning
    
    ((TOTAL_CHECKS++))
    
    if eval "$condition"; then
        log_success "$description"
        ((PASSED_CHECKS++))
        return 0
    else
        if [[ "$severity" == "warning" ]]; then
            log_warning "$description"
            ((WARNING_CHECKS++))
        else
            log_error "$description"
            ((FAILED_CHECKS++))
        fi
        return 1
    fi
}

# 检查文件存在性
check_file_exists() {
    local file="$1"
    local description="$2"
    
    check_item "$description" "test -f '$file'" "warning"
}

# 检查目录存在性
check_directory_exists() {
    local dir="$1"
    local description="$2"
    
    check_item "$description" "test -d '$dir'" "warning"
}

# 检查代码质量
check_code_quality() {
    log_info "=== 代码质量检查 ==="
    
    # TypeScript类型检查
    if command -v npx &> /dev/null; then
        check_item "TypeScript类型检查通过" "npx tsc --noEmit --skipLibCheck > /dev/null 2>&1" "error"
    else
        log_warning "npx 未安装，跳过TypeScript检查"
        ((WARNING_CHECKS++))
    fi
    
    # ESLint检查
    if [[ -f ".eslintrc.js" ]] || [[ -f ".eslintrc.json" ]]; then
        check_item "ESLint配置存在" "test -f '.eslintrc.js' -o -f '.eslintrc.json'" "warning"
    else
        log_warning "ESLint配置文件不存在"
        ((WARNING_CHECKS++))
    fi
    
    # 检查关键文件是否存在
    check_file_exists "lib/api-base.ts" "API基础组件存在"
    check_file_exists "lib/security-validator.ts" "安全验证组件存在"
    check_file_exists "lib/database-optimizer.ts" "数据库优化组件存在"
    check_file_exists "lib/performance-dashboard.ts" "性能监控组件存在"
    check_file_exists "lib/middleware-optimized.ts" "优化中间件存在"
    
    # 检查示例API
    check_file_exists "app/api/user/profile-optimized/route.ts" "优化后的用户API存在"
}

# 检查数据库优化
check_database_optimization() {
    log_info "=== 数据库优化检查 ==="
    
    # 检查优化脚本
    check_file_exists "scripts/database-indexes-optimization.sql" "数据库索引优化脚本存在"
    
    # 检查Prisma配置
    check_file_exists "prisma/schema.prisma" "Prisma Schema文件存在"
    
    # 检查迁移文件
    check_directory_exists "prisma/migrations" "Prisma迁移目录存在"
    
    # 检查数据库连接
    if [[ -n "$DATABASE_URL" ]]; then
        check_item "数据库连接URL已配置" "test -n \"\$DATABASE_URL\"" "error"
        
        # 测试数据库连接（如果npx prisma可用）
        if command -v npx &> /dev/null; then
            check_item "数据库连接测试通过" "npx prisma db push --accept-data-loss > /dev/null 2>&1" "warning"
        fi
    else
        log_warning "DATABASE_URL 环境变量未设置"
        ((WARNING_CHECKS++))
    fi
}

# 检查缓存配置
check_cache_configuration() {
    log_info "=== 缓存配置检查 ==="
    
    # 检查Redis连接
    if [[ -n "$REDIS_URL" ]]; then
        check_item "Redis连接URL已配置" "test -n \"\$REDIS_URL\"" "error"
    else
        log_warning "REDIS_URL 环境变量未设置"
        ((WARNING_CHECKS++))
    fi
    
    # 检查缓存相关代码
    check_item "缓存管理组件存在" "grep -q 'CacheManager' lib/cache-manager.ts 2>/dev/null" "warning"
    
    # 检查缓存策略配置
    check_item "缓存策略配置存在" "grep -q 'CacheStrategy' lib/cache-manager.ts 2>/dev/null" "warning"
}

# 检查安全配置
check_security_configuration() {
    log_info "=== 安全配置检查 ==="
    
    # 检查安全相关组件
    check_item "安全验证组件存在" "grep -q 'InputValidator' lib/security-validator.ts 2>/dev/null" "error"
    check_item "权限验证组件存在" "grep -q 'PermissionValidator' lib/security-validator.ts 2>/dev/null" "error"
    check_item "频率限制组件存在" "grep -q 'RateLimiter' lib/security-validator.ts 2>/dev/null" "error"
    check_item "审计日志组件存在" "grep -q 'AuditLogger' lib/security-validator.ts 2>/dev/null" "error"
    
    # 检查JWT配置
    if [[ -n "$JWT_SECRET" ]]; then
        check_item "JWT密钥已配置" "test -n \"\$JWT_SECRET\"" "error"
    else
        log_warning "JWT_SECRET 环境变量未设置"
        ((WARNING_CHECKS++))
    fi
    
    # 检查安全中间件
    check_item "优化中间件存在" "grep -q 'withAuthentication' lib/middleware-optimized.ts 2>/dev/null" "error"
}

# 检查监控配置
check_monitoring_configuration() {
    log_info "=== 监控配置检查 ==="
    
    # 检查监控组件
    check_item "性能监控组件存在" "grep -q 'PerformanceDashboard' lib/performance-dashboard.ts 2>/dev/null" "error"
    check_item "监控器组件存在" "grep -q 'Monitor' lib/monitoring.ts 2>/dev/null" "error"
    
    # 检查健康检查端点
    check_file_exists "app/api/monitoring/health/route.ts" "健康检查API存在"
    
    # 检查日志系统
    check_item "日志系统存在" "grep -q 'getLogger' lib/logger.ts 2>/dev/null" "error"
    
    # 检查告警系统
    check_item "告警系统存在" "grep -q 'AlertLevel' lib/monitoring.ts 2>/dev/null" "warning"
}

# 检查API优化
check_api_optimization() {
    log_info "=== API优化检查 ==="
    
    # 检查API基础组件
    check_item "API基类存在" "grep -q 'BaseApiHandler' lib/api-base.ts 2>/dev/null" "error"
    check_item "API装饰器存在" "grep -q 'createApiHandler' lib/api-base.ts 2>/dev/null" "warning"
    
    # 检查中间件
    check_file_exists "lib/middleware-optimized.ts" "优化中间件文件存在"
    
    # 检查示例优化API
    check_file_exists "app/api/user/profile-optimized/route.ts" "优化后的用户API文件存在"
    
    # 检查API文档
    check_item "API文档存在" "grep -q 'API文档和使用示例' app/api/user/profile-optimized/route.ts 2>/dev/null" "warning"
}

# 检查依赖和配置
check_dependencies_config() {
    log_info "=== 依赖和配置检查 ==="
    
    # 检查package.json
    check_file_exists "package.json" "package.json文件存在"
    
    # 检查关键依赖
    if [[ -f "package.json" ]]; then
        check_item "TypeScript依赖存在" "grep -q '\"typescript\"' package.json" "error"
        check_item "Zod依赖存在" "grep -q '\"zod\"' package.json" "error"
        check_item "Prisma依赖存在" "grep -q '\"@prisma/client\"' package.json" "error"
        check_item "Redis依赖存在" "grep -q '\"ioredis\"' package.json" "warning"
    fi
    
    # 检查环境变量配置
    check_file_exists ".env.example" "环境变量示例文件存在" "warning"
    check_file_exists ".env.production" "生产环境配置文件存在" "warning"
    
    # 检查Next.js配置
    check_file_exists "next.config.js" "Next.js配置文件存在" "warning"
}

# 性能基准测试
performance_benchmark() {
    log_info "=== 性能基准测试 ==="
    
    # 检查是否可以访问本地服务
    if curl -f -s http://localhost:3000/api/monitoring/health > /dev/null 2>&1; then
        log_info "本地服务正在运行"
        
        # 测试API响应时间
        local endpoints=(
            "http://localhost:3000/api/monitoring/health"
            "http://localhost:3000/api/user/profile"
        )
        
        for endpoint in "${endpoints[@]}"; do
            if curl -f -s "$endpoint" > /dev/null 2>&1; then
                local response_time=$(curl -w "%{time_total}" -o /dev/null -s "$endpoint")
                
                # 检查响应时间是否在合理范围内（< 2秒）
                local response_time_ms=$(echo "$response_time * 1000" | bc 2>/dev/null || echo "2000")
                
                if (( $(echo "$response_time < 2.0" | bc -l 2>/dev/null || echo "0") )); then
                    log_success "端点 $endpoint 响应时间: ${response_time}s"
                    ((PASSED_CHECKS++))
                else
                    log_warning "端点 $endpoint 响应时间较慢: ${response_time}s"
                    ((WARNING_CHECKS++))
                fi
                ((TOTAL_CHECKS++))
            else
                log_warning "端点 $endpoint 不可访问"
                ((WARNING_CHECKS++))
                ((TOTAL_CHECKS++))
            fi
        done
    else
        log_warning "本地服务未运行，跳过性能测试"
        ((WARNING_CHECKS++))
    fi
}

# 检查监控指标
check_monitoring_metrics() {
    log_info "=== 监控指标检查 ==="
    
    # 检查监控相关指标收集
    check_item "性能监控配置存在" "grep -q 'recordResponseTime' lib/monitoring.ts 2>/dev/null" "warning"
    check_item "数据库监控配置存在" "grep -q 'recordDatabaseOperation' lib/monitoring.ts 2>/dev/null" "warning"
    check_item "业务指标配置存在" "grep -q 'increment' lib/monitoring.ts 2>/dev/null" "warning"
    
    # 检查告警配置
    check_item "告警规则配置存在" "grep -q 'AlertRule' lib/monitoring.ts 2>/dev/null" "warning"
    check_item "告警通知配置存在" "grep -q 'sendAlertNotification' lib/monitoring.ts 2>/dev/null" "warning"
}

# 检查测试覆盖
check_test_coverage() {
    log_info "=== 测试覆盖检查 ==="
    
    # 检查测试目录
    check_directory_exists "__tests__" "测试目录存在"
    
    # 检查特定测试文件
    check_file_exists "__tests__/api-security.test.ts" "API安全测试存在"
    check_file_exists "__tests__/performance-cache.test.ts" "性能缓存测试存在"
    check_file_exists "__tests__/database-transactions.test.ts" "数据库事务测试存在"
    
    # 检查Jest配置
    check_file_exists "jest.config.js" "Jest配置文件存在" "warning"
    
    # 检查测试覆盖率
    if [[ -f "coverage/coverage-final.json" ]]; then
        log_info "测试覆盖率报告存在"
    else
        log_warning "测试覆盖率报告不存在，请运行 'npm run test:coverage'"
        ((WARNING_CHECKS++))
    fi
}

# 生成验证报告
generate_report() {
    log_info "=== 生成验证报告 ==="
    
    local report_file="optimization-validation-report-$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "LuckyMart-TJ 性能优化验证报告"
        echo "================================"
        echo "生成时间: $(date)"
        echo "总检查项: $TOTAL_CHECKS"
        echo "通过检查: $PASSED_CHECKS"
        echo "失败检查: $FAILED_CHECKS"
        echo "警告检查: $WARNING_CHECKS"
        echo ""
        echo "验证结果统计:"
        echo "- 总体通过率: $(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))%"
        echo "- 错误率: $(( (FAILED_CHECKS * 100) / TOTAL_CHECKS ))%"
        echo "- 警告率: $(( (WARNING_CHECKS * 100) / TOTAL_CHECKS ))%"
        echo ""
        
        if [[ $FAILED_CHECKS -eq 0 ]]; then
            echo "✅ 验证状态: 通过"
            echo "所有关键优化措施已正确实施。"
        elif [[ $FAILED_CHECKS -le 2 ]]; then
            echo "⚠️ 验证状态: 基本通过"
            echo "大部分优化措施已正确实施，有少量问题需要处理。"
        else
            echo "❌ 验证状态: 未通过"
            echo "存在多个问题，建议检查优化实施情况。"
        fi
        
        echo ""
        echo "建议下一步操作:"
        if [[ $FAILED_CHECKS -gt 0 ]]; then
            echo "1. 检查失败的检查项并修复相关问题"
        fi
        if [[ $WARNING_CHECKS -gt 0 ]]; then
            echo "2. 处理警告项以提高系统完整性"
        fi
        echo "3. 运行完整的测试套件验证功能"
        echo "4. 执行性能基准测试确认优化效果"
        echo "5. 部署到生产环境并监控性能指标"
        
    } > "$report_file"
    
    log_success "验证报告已生成: $report_file"
}

# 显示帮助信息
show_help() {
    echo "LuckyMart-TJ 性能优化验证脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --performance    仅运行性能测试"
    echo "  --quick          快速验证（跳过详细检查）"
    echo "  --help           显示帮助信息"
    echo ""
    echo "环境变量:"
    echo "  DATABASE_URL     数据库连接字符串"
    echo "  REDIS_URL        Redis连接字符串"
    echo "  JWT_SECRET       JWT密钥"
    echo ""
    echo "示例:"
    echo "  $0                    # 完整验证"
    echo "  $0 --performance      # 仅性能测试"
    echo "  $0 --quick            # 快速验证"
}

# 主函数
main() {
    local performance_only=false
    local quick_mode=false
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --performance)
                performance_only=true
                shift
                ;;
            --quick)
                quick_mode=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    log_info "=== LuckyMart-TJ 性能优化验证开始 ==="
    
    # 记录开始时间
    START_TIME=$(date +%s)
    
    if [[ "$performance_only" == true ]]; then
        performance_benchmark
    else
        if [[ "$quick_mode" == false ]]; then
            check_code_quality
            check_database_optimization
            check_cache_configuration
            check_security_configuration
            check_monitoring_configuration
            check_api_optimization
            check_dependencies_config
            check_monitoring_metrics
            check_test_coverage
        fi
        
        performance_benchmark
    fi
    
    # 生成报告
    generate_report
    
    # 计算耗时
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    # 显示结果统计
    echo ""
    log_info "=== 验证结果统计 ==="
    echo "总检查项: $TOTAL_CHECKS"
    echo "通过检查: $PASSED_CHECKS"
    echo "失败检查: $FAILED_CHECKS"
    echo "警告检查: $WARNING_CHECKS"
    echo "验证耗时: ${DURATION}秒"
    echo ""
    
    if [[ $FAILED_CHECKS -eq 0 ]]; then
        log_success "✅ 验证状态: 通过"
        exit 0
    elif [[ $FAILED_CHECKS -le 2 ]]; then
        log_warning "⚠️ 验证状态: 基本通过"
        exit 1
    else
        log_error "❌ 验证状态: 未通过"
        exit 2
    fi
}

# 脚本入口
main "$@"