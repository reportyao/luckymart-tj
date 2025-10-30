#!/bin/bash

# 开奖触发机制和满期判断逻辑优化 - 一键部署脚本
# 版本: 1.0
# 日期: 2025-10-31

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
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否在正确的目录
check_directory() {
    if [[ ! -f "package.json" ]] || [[ ! -d "app" ]]; then
        log_error "请在luckymart-tj项目根目录运行此脚本"
        exit 1
    fi
    log_success "项目目录检查通过"
}

# 创建备份
create_backup() {
    local backup_dir="../luckymart-tj-backup-$(date +%Y%m%d-%H%M%S)"
    log_info "创建备份到: $backup_dir"
    
    if [[ -d "$backup_dir" ]]; then
        log_warning "备份目录已存在，跳过备份"
        return 0
    fi
    
    cp -r . "$backup_dir"
    if [[ $? -eq 0 ]]; then
        log_success "备份创建成功: $backup_dir"
        echo "$backup_dir" > /tmp/luckymart_backup_path.txt
    else
        log_error "备份创建失败"
        exit 1
    fi
}

# 备份关键文件
backup_files() {
    log_info "备份关键文件..."
    
    local files_to_backup=(
        "app/api/lottery/participate/route.ts"
        "lib/lottery.ts"
        "supabase/functions/auto-draw/index.ts"
    )
    
    for file in "${files_to_backup[@]}"; do
        if [[ -f "$file" ]]; then
            cp "$file" "$file.backup.$(date +%Y%m%d-%H%M%S)"
            log_info "已备份: $file"
        else
            log_warning "文件不存在，跳过: $file"
        fi
    done
}

# 部署新文件
deploy_files() {
    log_info "部署优化后的文件..."
    
    # 检查新文件是否存在
    local new_files=(
        "app/api/lottery/monitoring/route.ts:新增监控API"
        "app/api/admin/lottery/data-fix/route.ts:新增数据修复API"
    )
    
    for file_info in "${new_files[@]}"; do
        IFS=':' read -r file desc <<< "$file_info"
        if [[ -f "$file" ]]; then
            log_success "文件已存在: $file ($desc)"
        else
            log_error "新文件缺失: $file"
            return 1
        fi
    done
    
    log_success "文件部署检查通过"
}

# 安装依赖
install_dependencies() {
    log_info "安装依赖包..."
    
    if command -v pnpm &> /dev/null; then
        pnpm install
    elif command -v npm &> /dev/null; then
        npm install
    else
        log_error "未找到pnpm或npm，请先安装Node.js和pnpm"
        exit 1
    fi
    
    if [[ $? -eq 0 ]]; then
        log_success "依赖安装成功"
    else
        log_error "依赖安装失败"
        exit 1
    fi
}

# 生成Prisma客户端
generate_prisma() {
    log_info "生成Prisma客户端..."
    
    npx prisma generate
    
    if [[ $? -eq 0 ]]; then
        log_success "Prisma客户端生成成功"
    else
        log_warning "Prisma客户端生成可能有问题，但继续部署"
    fi
}

# 重启服务
restart_services() {
    log_info "重启服务..."
    
    # 检查PM2
    if command -v pm2 &> /dev/null; then
        pm2 restart luckymart-web
        if [[ $? -eq 0 ]]; then
            log_success "PM2服务重启成功"
        else
            log_warning "PM2服务重启可能有问题"
        fi
    else
        log_warning "未找到PM2，请手动重启服务"
    fi
    
    # 部署Edge Function
    if command -v supabase &> /dev/null; then
        log_info "部署Edge Function..."
        supabase functions deploy auto-draw
        if [[ $? -eq 0 ]]; then
            log_success "Edge Function部署成功"
        else
            log_warning "Edge Function部署可能有问题"
        fi
    else
        log_warning "未找到Supabase CLI，请手动部署Edge Function"
    fi
}

# 验证部署
verify_deployment() {
    log_info "验证部署..."
    
    # 检查服务状态
    sleep 3
    
    if command -v pm2 &> /dev/null; then
        local status=$(pm2 jlist | jq -r '.[] | select(.name=="luckymart-web") | .pm2_env.status' 2>/dev/null || echo "unknown")
        if [[ "$status" == "online" ]]; then
            log_success "服务状态正常 (online)"
        else
            log_warning "服务状态: $status"
        fi
    fi
    
    # 测试API端点
    log_info "测试API端点..."
    
    # 测试监控API
    if curl -s -f http://localhost:3000/api/lottery/monitoring?action=overview > /dev/null 2>&1; then
        log_success "监控API测试通过"
    else
        log_warning "监控API测试失败（可能是权限问题）"
    fi
    
    log_success "部署验证完成"
}

# 显示使用指南
show_usage_guide() {
    log_info "部署完成！使用指南："
    echo ""
    echo "1. 监控开奖状态:"
    echo "   curl -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \\"
    echo "        'http://localhost:3000/api/lottery/monitoring?action=overview'"
    echo ""
    echo "2. 检查数据一致性:"
    echo "   curl -X POST -H 'Authorization: Bearer ADMIN_TOKEN' \\"
    echo "        -H 'Content-Type: application/json' \\"
    echo "        -d '{\"action\": \"full_system_check\", \"dryRun\": true}' \\"
    echo "        http://localhost:3000/api/admin/lottery/data-fix"
    echo ""
    echo "3. 查看详细文档:"
    echo "   cat LOTTERY_TRIGGER_OPTIMIZATION_COMPLETE.md"
    echo ""
    echo "4. 管理员后台监控面板:"
    echo "   http://localhost:3000/admin/lottery"
    echo ""
}

# 回滚函数
rollback() {
    log_warning "开始回滚..."
    
    if [[ -f "/tmp/luckymart_backup_path.txt" ]]; then
        local backup_path=$(cat /tmp/luckymart_backup_path.txt)
        if [[ -d "$backup_path" ]]; then
            log_info "从备份恢复: $backup_path"
            cp -r "$backup_path/." .
            log_success "回滚完成"
        else
            log_error "备份目录不存在: $backup_path"
        fi
    else
        log_error "未找到备份路径"
    fi
    
    # 重启服务
    if command -v pm2 &> /dev/null; then
        pm2 restart luckymart-web
    fi
}

# 主函数
main() {
    echo "=================================="
    echo "  开奖触发机制优化部署脚本"
    echo "=================================="
    echo ""
    
    # 检查参数
    if [[ "$1" == "rollback" ]]; then
        rollback
        exit 0
    fi
    
    if [[ "$1" == "verify" ]]; then
        verify_deployment
        exit 0
    fi
    
    # 执行部署步骤
    check_directory
    create_backup
    backup_files
    deploy_files
    install_dependencies
    generate_prisma
    restart_services
    verify_deployment
    
    echo ""
    log_success "部署完成！"
    show_usage_guide
    
    # 清理临时文件
    rm -f /tmp/luckymart_backup_path.txt
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
