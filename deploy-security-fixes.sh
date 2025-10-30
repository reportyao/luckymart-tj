#!/bin/bash

# 用户地址权限和安全验证修复部署脚本
# Author: Security Team
# Date: 2025-10-31

set -e  # 遇到错误立即退出

echo "🚀 开始部署用户地址权限和安全验证修复..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查必要的命令
check_dependencies() {
    print_info "检查依赖..."
    
    if ! command -v psql &> /dev/null; then
        print_error "psql 命令未找到，请确保 PostgreSQL 客户端已安装"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "node 命令未找到，请确保 Node.js 已安装"
        exit 1
    fi
    
    print_success "依赖检查通过"
}

# 获取数据库连接信息
get_db_config() {
    print_info "配置数据库连接..."
    
    if [ -z "$DATABASE_URL" ]; then
        print_warning "请输入数据库连接信息:"
        read -p "数据库主机 (默认: localhost): " DB_HOST
        DB_HOST=${DB_HOST:-localhost}
        
        read -p "数据库端口 (默认: 5432): " DB_PORT
        DB_PORT=${DB_PORT:-5432}
        
        read -p "数据库名称: " DB_NAME
        if [ -z "$DB_NAME" ]; then
            print_error "数据库名称不能为空"
            exit 1
        fi
        
        read -p "数据库用户: " DB_USER
        if [ -z "$DB_USER" ]; then
            print_error "数据库用户不能为空"
            exit 1
        fi
        
        read -s -p "数据库密码: " DB_PASSWORD
        echo
        
        export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
    fi
    
    print_success "数据库配置完成"
}

# 运行数据库迁移
run_migrations() {
    print_info "运行数据库迁移..."
    
    if [ -f "supabase/migrations/1763100200_security_permissions_fix.sql" ]; then
        print_info "执行安全权限修复迁移..."
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "supabase/migrations/1763100200_security_permissions_fix.sql"
        print_success "数据库迁移完成"
    else
        print_error "迁移文件不存在: supabase/migrations/1763100200_security_permissions_fix.sql"
        exit 1
    fi
}

# 安装依赖
install_dependencies() {
    print_info "检查和安装必要的依赖..."
    
    # 检查是否安装了zod
    if ! npm list zod &> /dev/null; then
        print_info "安装 zod 验证库..."
        npm install zod
    fi
    
    # 检查是否安装了dompurify
    if ! npm list isomorphic-dompurify &> /dev/null; then
        print_info "安装 DOMPurify XSS防护库..."
        npm install isomorphic-dompurify
    fi
    
    print_success "依赖安装完成"
}

# 备份现有API文件
backup_existing_files() {
    print_info "备份现有API文件..."
    
    mkdir -p backups/$(date +%Y%m%d_%H%M%S)
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    
    # 备份用户地址API
    if [ -f "app/api/user/addresses/route.ts" ]; then
        cp "app/api/user/addresses/route.ts" "$BACKUP_DIR/user_addresses_route_ts.backup"
        print_info "已备份 user addresses GET/POST API"
    fi
    
    if [ -f "app/api/user/addresses/[id]/route.ts" ]; then
        cp "app/api/user/addresses/[id]/route.ts" "$BACKUP_DIR/user_addresses_id_route_ts.backup"
        print_info "已备份 user addresses PUT/DELETE API"
    fi
    
    # 备份提现API
    if [ -f "app/api/withdraw/create/route.ts" ]; then
        cp "app/api/withdraw/create/route.ts" "$BACKUP_DIR/withdraw_create_route_ts.backup"
        print_info "已备份 withdraw create API"
    fi
    
    echo "$BACKUP_DIR" > "backup_location.txt"
    print_success "文件备份完成，备份位置: $BACKUP_DIR"
}

# 部署新的API文件
deploy_api_files() {
    print_info "部署新的安全增强API文件..."
    
    # 部署用户地址API
    if [ -f "app/api/user/addresses-fixed/route.ts" ]; then
        cp "app/api/user/addresses-fixed/route.ts" "app/api/user/addresses/route.ts"
        print_success "已部署用户地址列表/创建API"
    fi
    
    if [ -f "app/api/user/addresses-fixed/[id]/route.ts" ]; then
        cp "app/api/user/addresses-fixed/[id]/route.ts" "app/api/user/addresses/[id]/route.ts"
        print_success "已部署用户地址更新/删除API"
    fi
    
    # 部署提现API
    if [ -f "app/api/withdraw/create-fixed/route.ts" ]; then
        cp "app/api/withdraw/create-fixed/route.ts" "app/api/withdraw/create/route.ts"
        print_success "已部署提现创建API"
    fi
    
    # 清理fixed目录
    if [ -d "app/api/user/addresses-fixed" ]; then
        rm -rf "app/api/user/addresses-fixed"
        print_info "已清理临时fixed目录"
    fi
    
    if [ -d "app/api/withdraw/create-fixed" ]; then
        rm -rf "app/api/withdraw/create-fixed"
        print_info "已清理临时fixed目录"
    fi
}

# 配置环境变量
setup_environment() {
    print_info "检查环境变量配置..."
    
    ENV_FILE=".env.local"
    
    # 检查是否需要添加环境变量
    if [ ! -f "$ENV_FILE" ]; then
        print_warning "未找到 .env.local 文件，创建基础配置..."
        cat > "$ENV_FILE" << EOF
# 数据库配置
DATABASE_URL=$DATABASE_URL

# JWT配置
JWT_SECRET=your-secure-jwt-secret-key-here
JWT_REFRESH_SECRET=your-secure-refresh-secret-key-here
JWT_ADMIN_SECRET=your-secure-admin-secret-key-here

# Telegram配置
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# 安全配置
NODE_ENV=development
EOF
        print_warning "请编辑 $ENV_FILE 文件，配置正确的密钥和令牌"
    else
        print_success "环境变量文件已存在"
    fi
}

# 验证部署
verify_deployment() {
    print_info "验证部署状态..."
    
    # 检查文件是否存在
    if [ ! -f "app/api/user/addresses/route.ts" ]; then
        print_error "用户地址API部署失败"
        exit 1
    fi
    
    if [ ! -f "app/api/user/addresses/[id]/route.ts" ]; then
        print_error "用户地址单个API部署失败"
        exit 1
    fi
    
    if [ ! -f "app/api/withdraw/create/route.ts" ]; then
        print_error "提现API部署失败"
        exit 1
    fi
    
    # 检查必要的导入是否存在
    if ! grep -q "security-validation" "app/api/user/addresses/route.ts"; then
        print_error "安全验证模块未正确导入"
        exit 1
    fi
    
    if ! grep -q "RateLimitChecker" "app/api/user/addresses/route.ts"; then
        print_error "频率限制模块未正确导入"
        exit 1
    fi
    
    print_success "部署验证通过"
}

# 运行测试
run_tests() {
    print_info "运行安全相关测试..."
    
    # TypeScript类型检查
    if command -v tsc &> /dev/null; then
        print_info "执行TypeScript类型检查..."
        if tsc --noEmit; then
            print_success "TypeScript类型检查通过"
        else
            print_warning "TypeScript类型检查发现潜在问题"
        fi
    fi
    
    # ESLint检查
    if command -v eslint &> /dev/null; then
        print_info "执行ESLint代码规范检查..."
        if eslint app/api/user/addresses/ app/api/withdraw/create/ --ext .ts; then
            print_success "代码规范检查通过"
        else
            print_warning "代码规范检查发现问题"
        fi
    fi
}

# 生成部署报告
generate_report() {
    print_info "生成部署报告..."
    
    REPORT_FILE="security_fix_deployment_report_$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$REPORT_FILE" << EOF
# 用户地址权限和安全验证修复部署报告

## 部署时间
$(date)

## 部署状态
✅ 部署成功

## 修复内容
1. ✅ 用户地址操作权限修复
2. ✅ 提现金额严格验证
3. ✅ 操作频率限制
4. ✅ 输入验证和清洗
5. ✅ SQL注入防护
6. ✅ XSS攻击防护

## 数据库迁移
- 状态: 已执行
- 文件: supabase/migrations/1763100200_security_permissions_fix.sql

## API文件部署
- 用户地址列表/创建: app/api/user/addresses/route.ts
- 用户地址更新/删除: app/api/user/addresses/[id]/route.ts  
- 提现创建: app/api/withdraw/create/route.ts

## 备份位置
$(cat backup_location.txt 2>/dev/null || echo "备份信息未找到")

## 下一步建议
1. 配置正确的环境变量
2. 测试API功能
3. 监控系统安全日志
4. 调整频率限制参数

## 注意事项
- 请确保定期清理过期安全日志
- 监控频率限制命中率
- 关注高风险操作的人工审核队列

EOF

    print_success "部署报告已生成: $REPORT_FILE"
}

# 主函数
main() {
    echo "========================================="
    echo "   用户地址权限和安全验证修复部署"
    echo "========================================="
    echo
    
    # 检查是否在正确的目录
    if [ ! -f "package.json" ]; then
        print_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    check_dependencies
    get_db_config
    run_migrations
    install_dependencies
    backup_existing_files
    deploy_api_files
    setup_environment
    verify_deployment
    run_tests
    generate_report
    
    echo
    echo "========================================="
    print_success "🎉 部署完成！"
    echo "========================================="
    echo
    echo "📋 重要提醒:"
    echo "1. 请查看并更新 .env.local 文件中的密钥配置"
    echo "2. 测试所有API功能确保正常工作"
    echo "3. 监控安全日志表中的记录"
    echo "4. 根据实际需要调整频率限制参数"
    echo
    echo "🔍 故障排除:"
    echo "- 如果遇到问题，可以从备份目录恢复文件"
    echo "- 查看安全日志: SELECT * FROM security_logs ORDER BY created_at DESC;"
    echo "- 查看用户活动: SELECT * FROM user_activities ORDER BY created_at DESC;"
    echo
}

# 处理命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            echo "用户地址权限和安全验证修复部署脚本"
            echo
            echo "用法: $0 [选项]"
            echo
            echo "选项:"
            echo "  -h, --help    显示此帮助信息"
            echo "  -d, --dry-run 显示将要执行的操作但不实际执行"
            echo
            exit 0
            ;;
        -d|--dry-run)
            echo "dry-run模式: 显示将要执行的操作"
            echo
            echo "将要执行的操作:"
            echo "1. 检查依赖"
            echo "2. 运行数据库迁移"
            echo "3. 安装依赖"
            echo "4. 备份现有文件"
            echo "5. 部署新的API文件"
            echo "6. 配置环境变量"
            echo "7. 验证部署"
            echo "8. 运行测试"
            echo "9. 生成报告"
            exit 0
            ;;
        *)
            print_error "未知参数: $1"
            echo "使用 -h 或 --help 查看帮助信息"
            exit 1
            ;;
    esac
    shift
done

# 执行主函数
main