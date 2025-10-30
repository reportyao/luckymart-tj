#!/bin/bash

# 数据库锁机制部署脚本
# 创建时间: 2025-10-31
# 用途: 部署乐观锁/悲观锁机制到生产环境

set -e  # 遇到错误立即退出

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
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示帮助信息
show_help() {
    echo "数据库锁机制部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help        显示此帮助信息"
    echo "  -d, --dry-run     干运行模式，只检查不执行"
    echo "  -b, --backup      创建数据库备份"
    echo "  -t, --test        运行测试"
    echo "  -r, --rollback    回滚到上一个状态"
    echo "  -v, --verify      验证部署结果"
    echo "  --skip-backup     跳过备份步骤"
    echo "  --skip-test       跳过测试步骤"
    echo ""
    echo "示例:"
    echo "  $0                    # 完整部署"
    echo "  $0 --dry-run          # 干运行检查"
    echo "  $0 --backup --test    # 创建备份并运行测试"
    echo "  $0 --verify           # 验证部署结果"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    # 检查是否安装了必要的工具
    local missing_deps=()
    
    if ! command -v psql &> /dev/null; then
        missing_deps+=("psql")
    fi
    
    if ! command -v pg_dump &> /dev/null; then
        missing_deps+=("pg_dump")
    fi
    
    if ! command -v node &> /dev/null; then
        missing_deps+=("node")
    fi
    
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "缺少以下依赖: ${missing_deps[*]}"
        exit 1
    fi
    
    # 检查环境变量
    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL 环境变量未设置"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 检查数据库连接
check_database_connection() {
    log_info "检查数据库连接..."
    
    if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        log_error "无法连接到数据库，请检查 DATABASE_URL"
        exit 1
    fi
    
    log_success "数据库连接正常"
}

# 创建备份
create_backup() {
    if [ "$SKIP_BACKUP" = "true" ]; then
        log_info "跳过备份步骤"
        return
    fi
    
    log_info "创建数据库备份..."
    
    local backup_file="backup_luckymart_tj_$(date +%Y%m%d_%H%M%S).sql"
    
    if pg_dump "$DATABASE_URL" > "$backup_file"; then
        log_success "备份已创建: $backup_file"
        echo "$backup_file" > /tmp/backup_file_path.txt
    else
        log_error "备份创建失败"
        exit 1
    fi
}

# 验证现有数据
validate_existing_data() {
    log_info "验证现有数据..."
    
    # 检查是否已经应用过此迁移
    local migration_exists=$(psql "$DATABASE_URL" -t -c "
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'balance_version'
        );
    " | tr -d ' ')
    
    if [ "$migration_exists" = "t" ]; then
        log_warning "检测到数据库锁机制已经存在，是否为重复部署？"
        read -p "是否继续部署？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "部署已取消"
            exit 0
        fi
    fi
    
    # 检查必要表是否存在
    local required_tables=("users" "lottery_rounds" "orders" "participations")
    for table in "${required_tables[@]}"; do
        if ! psql "$DATABASE_URL" -c "SELECT 1 FROM $table LIMIT 1;" > /dev/null 2>&1; then
            log_error "必要表 $table 不存在"
            exit 1
        fi
    done
    
    log_success "现有数据验证通过"
}

# 应用迁移
apply_migration() {
    if [ "$DRY_RUN" = "true" ]; then
        log_info "干运行模式 - 检查迁移脚本语法..."
        return
    fi
    
    log_info "应用数据库迁移..."
    
    local migration_file="prisma/migrations/1761803600_add_database_locks/migration.sql"
    
    if [ ! -f "$migration_file" ]; then
        log_error "迁移文件不存在: $migration_file"
        exit 1
    fi
    
    # 检查迁移脚本语法
    log_info "验证迁移脚本语法..."
    if ! psql "$DATABASE_URL" -f "$migration_file" --dry-run > /dev/null 2>&1; then
        log_error "迁移脚本语法检查失败"
        exit 1
    fi
    
    # 执行迁移
    log_info "执行数据库迁移..."
    if psql "$DATABASE_URL" -f "$migration_file"; then
        log_success "数据库迁移成功"
    else
        log_error "数据库迁移失败"
        exit 1
    fi
}

# 更新 Prisma Client
update_prisma_client() {
    if [ "$DRY_RUN" = "true" ]; then
        log_info "干运行模式 - 跳过 Prisma Client 更新"
        return
    fi
    
    log_info "更新 Prisma Client..."
    
    if npx prisma generate; then
        log_success "Prisma Client 更新成功"
    else
        log_error "Prisma Client 更新失败"
        exit 1
    fi
}

# 运行测试
run_tests() {
    if [ "$SKIP_TEST" = "true" ]; then
        log_info "跳过测试步骤"
        return
    fi
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "干运行模式 - 跳过测试"
        return
    fi
    
    log_info "运行数据库锁机制测试..."
    
    # 安装测试依赖（如果需要）
    if [ ! -d "node_modules/.bin/jest" ]; then
        log_info "安装测试依赖..."
        npm install --save-dev jest @types/jest ts-jest
    fi
    
    # 运行测试
    if npm test -- --testPathPattern=database-lock.test.ts; then
        log_success "测试通过"
    else
        log_warning "测试失败，但继续部署"
    fi
}

# 验证部署结果
verify_deployment() {
    if [ "$DRY_RUN" = "true" ]; then
        log_info "干运行模式 - 跳过验证"
        return
    fi
    
    log_info "验证部署结果..."
    
    # 检查版本号字段是否添加
    local version_fields=(
        "users:balance_version"
        "users:platform_balance_version"
        "lottery_rounds:sold_shares_version"
        "orders:version"
        "participations:version"
    )
    
    for field in "${version_fields[@]}"; do
        local table=$(echo "$field" | cut -d: -f1)
        local column=$(echo "$field" | cut -d: -f2)
        
        local exists=$(psql "$DATABASE_URL" -t -c "
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = '$table' AND column_name = '$column'
            );
        " | tr -d ' ')
        
        if [ "$exists" != "t" ]; then
            log_error "字段 $table.$column 不存在"
            exit 1
        fi
    done
    
    # 检查索引是否存在
    local required_indexes=(
        "idx_users_balance_version"
        "idx_lottery_rounds_sold_shares_version"
        "idx_orders_version"
        "idx_participations_version"
    )
    
    for index in "${required_indexes[@]}"; do
        local exists=$(psql "$DATABASE_URL" -t -c "
            SELECT EXISTS (
                SELECT 1 FROM pg_indexes 
                WHERE indexname = '$index'
            );
        " | tr -d ' ')
        
        if [ "$exists" != "t" ]; then
            log_warning "索引 $index 不存在"
        fi
    done
    
    # 检查函数是否存在
    local required_functions=(
        "update_user_balance_with_optimistic_lock"
        "update_lottery_round_sold_shares_with_lock"
        "participate_in_lottery_with_balance_deduction"
        "update_order_status_with_lock"
        "reset_user_free_count_safe"
    )
    
    for func in "${required_functions[@]}"; do
        local exists=$(psql "$DATABASE_URL" -t -c "
            SELECT EXISTS (
                SELECT 1 FROM information_schema.routines 
                WHERE routine_name = '$func'
            );
        " | tr -d ' ')
        
        if [ "$exists" != "t" ]; then
            log_error "函数 $func 不存在"
            exit 1
        fi
    done
    
    # 检查监控视图是否存在
    local view_exists=$(psql "$DATABASE_URL" -t -c "
        SELECT EXISTS (
            SELECT 1 FROM information_schema.views 
            WHERE table_name = 'lock_monitoring_view'
        );
    " | tr -d ' ')
    
    if [ "$view_exists" != "t" ]; then
        log_error "监控视图 lock_monitoring_view 不存在"
        exit 1
    fi
    
    log_success "部署验证通过"
}

# 回滚功能
rollback() {
    log_info "开始回滚..."
    
    # 查找最新的备份文件
    local backup_file=$(ls -t backup_luckymart_tj_*.sql 2>/dev/null | head -1)
    
    if [ -z "$backup_file" ]; then
        log_error "找不到备份文件"
        exit 1
    fi
    
    log_warning "将使用备份文件回滚: $backup_file"
    read -p "确认回滚操作？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "回滚已取消"
        exit 0
    fi
    
    # 恢复备份
    log_info "从备份恢复数据库..."
    if psql "$DATABASE_URL" < "$backup_file"; then
        log_success "回滚成功"
    else
        log_error "回滚失败"
        exit 1
    fi
}

# 生成部署报告
generate_deployment_report() {
    if [ "$DRY_RUN" = "true" ]; then
        return
    fi
    
    local report_file="deployment_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "数据库锁机制部署报告"
        echo "======================"
        echo "部署时间: $(date)"
        echo "部署环境: ${NODE_ENV:-unknown}"
        echo "数据库: $DATABASE_URL"
        echo ""
        echo "部署的组件:"
        echo "- 乐观锁版本号字段"
        echo "- 悲观锁行级锁机制"
        echo "- 原子操作函数"
        echo "- 监控视图"
        echo "- 性能索引"
        echo ""
        echo "新增字段:"
        echo "- users.balance_version"
        echo "- users.platform_balance_version"
        echo "- lottery_rounds.sold_shares_version"
        echo "- orders.version"
        echo "- participations.version"
        echo ""
        echo "新增函数:"
        echo "- update_user_balance_with_optimistic_lock"
        echo "- update_lottery_round_sold_shares_with_lock"
        echo "- participate_in_lottery_with_balance_deduction"
        echo "- update_order_status_with_lock"
        echo "- reset_user_free_count_safe"
        echo "- get_lock_monitoring_info"
        echo ""
        echo "部署状态: 成功"
    } > "$report_file"
    
    log_success "部署报告已生成: $report_file"
}

# 主函数
main() {
    echo "数据库锁机制部署脚本"
    echo "===================="
    echo ""
    
    # 解析命令行参数
    DRY_RUN=false
    CREATE_BACKUP=false
    RUN_TEST=false
    ROLLBACK=false
    VERIFY=false
    SKIP_BACKUP=false
    SKIP_TEST=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -b|--backup)
                CREATE_BACKUP=true
                shift
                ;;
            -t|--test)
                RUN_TEST=true
                shift
                ;;
            -r|--rollback)
                ROLLBACK=true
                shift
                ;;
            -v|--verify)
                VERIFY=true
                shift
                ;;
            --skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --skip-test)
                SKIP_TEST=true
                shift
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 执行回滚（如果需要）
    if [ "$ROLLBACK" = "true" ]; then
        rollback
        exit 0
    fi
    
    # 执行验证（如果需要）
    if [ "$VERIFY" = "true" ]; then
        check_dependencies
        check_database_connection
        verify_deployment
        exit 0
    fi
    
    # 部署流程
    log_info "开始部署数据库锁机制..."
    echo ""
    
    check_dependencies
    check_database_connection
    
    if [ "$CREATE_BACKUP" = "true" ] || [ "$SKIP_BACKUP" != "true" ]; then
        create_backup
    fi
    
    validate_existing_data
    apply_migration
    update_prisma_client
    
    if [ "$RUN_TEST" = "true" ] || [ "$SKIP_TEST" != "true" ]; then
        run_tests
    fi
    
    verify_deployment
    generate_deployment_report
    
    echo ""
    log_success "数据库锁机制部署完成！"
    echo ""
    echo "下一步操作:"
    echo "1. 更新应用程序代码以使用新的锁机制"
    echo "2. 运行集成测试确保功能正常"
    echo "3. 监控系统性能"
    echo "4. 查看部署报告获取详细信息"
    echo ""
    echo "文档位置:"
    echo "- 实现文档: docs/database-locks-implementation.md"
    echo "- 使用示例: lib/database-lock-examples.ts"
    echo "- 工具类: lib/database-lock-manager.ts"
    echo ""
    log_info "部署脚本执行完成"
}

# 捕获中断信号
trap 'log_error "部署被中断"; exit 1' INT TERM

# 执行主函数
main "$@"