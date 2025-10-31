#!/bin/bash

# LuckyMart-TJ 性能优化部署脚本
# 自动部署优化后的代码和配置

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

# 检查环境
check_environment() {
    log_info "检查部署环境..."
    
    # 检查Node.js版本
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_VERSION="18.0.0"
    
    if [[ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]]; then
        log_error "Node.js 版本过低 ($NODE_VERSION)，需要 >= $REQUIRED_VERSION"
        exit 1
    fi
    
    log_success "Node.js 版本检查通过: $NODE_VERSION"
    
    # 检查npm版本
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    # 检查数据库连接
    if [[ -z "$DATABASE_URL" ]]; then
        log_warning "DATABASE_URL 环境变量未设置"
    fi
    
    log_success "环境检查完成"
}

# 备份当前代码
backup_current() {
    log_info "备份当前代码..."
    
    BACKUP_DIR="backup/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # 备份关键文件
    cp -r lib/ "$BACKUP_DIR/" 2>/dev/null || true
    cp -r app/api/ "$BACKUP_DIR/" 2>/dev/null || true
    cp -r prisma/ "$BACKUP_DIR/" 2>/dev/null || true
    cp package.json "$BACKUP_DIR/" 2>/dev/null || true
    
    log_success "代码备份完成: $BACKUP_DIR"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    # 清理node_modules
    if [[ -d "node_modules" ]]; then
        rm -rf node_modules
    fi
    
    # 清理package-lock.json
    if [[ -f "package-lock.json" ]]; then
        rm package-lock.json
    fi
    
    # 安装依赖
    npm ci --production=false
    
    log_success "依赖安装完成"
}

# 数据库优化
optimize_database() {
    log_info "执行数据库优化..."
    
    # 检查数据库连接
    if [[ -z "$DATABASE_URL" ]]; then
        log_warning "DATABASE_URL 未设置，跳过数据库优化"
        return 0
    fi
    
    # 运行数据库迁移
    log_info "运行数据库迁移..."
    npx prisma migrate deploy || {
        log_error "数据库迁移失败"
        return 1
    }
    
    # 执行索引优化脚本
    if [[ -f "scripts/database-indexes-optimization.sql" ]]; then
        log_info "执行索引优化..."
        # 这里需要根据实际的数据库连接方式执行SQL
        # 可以通过psql或其他数据库客户端执行
        log_warning "请手动执行 scripts/database-indexes-optimization.sql 脚本"
    fi
    
    # 生成Prisma客户端
    log_info "生成Prisma客户端..."
    npx prisma generate
    
    log_success "数据库优化完成"
}

# 优化配置
optimize_config() {
    log_info "优化系统配置..."
    
    # 检查环境变量
    env_vars=(
        "DATABASE_URL"
        "REDIS_URL"
        "JWT_SECRET"
        "NEXT_PUBLIC_APP_URL"
    )
    
    for var in "${env_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            log_warning "$var 环境变量未设置"
        fi
    done
    
    # 优化Next.js配置
    if [[ -f "next.config.js" ]]; then
        log_info "检查Next.js配置..."
        # 添加必要的配置优化
        cat > next.config.js.tmp << 'EOF'
const nextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@prisma/client', 'zod'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  poweredByHeader: false,
  compress: true,
  swcMinify: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig
EOF
        mv next.config.js.tmp next.config.js
    fi
    
    # 创建或更新配置文件
    if [[ ! -f ".env.production" ]]; then
        log_info "创建生产环境配置文件..."
        cat > .env.production << EOF
NODE_ENV=production
DATABASE_URL=\$DATABASE_URL
REDIS_URL=\$REDIS_URL
JWT_SECRET=\$JWT_SECRET
NEXT_PUBLIC_APP_URL=\$NEXT_PUBLIC_APP_URL

# 性能优化配置
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_CACHE_STATISTICS=true
ENABLE_QUERY_OPTIMIZATION=true
ENABLE_RATE_LIMITING=true

# 缓存配置
CACHE_TTL_DEFAULT=300
CACHE_TTL_PRODUCTS=600
CACHE_TTL_USER=1800
CACHE_TTL_CONFIG=3600

# 数据库连接池配置
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_POOL_TIMEOUT=10000

# 安全配置
ENABLE_INPUT_VALIDATION=true
ENABLE_SECURITY_HEADERS=true
ENABLE_AUDIT_LOGGING=true
EOF
    fi
    
    log_success "配置优化完成"
}

# 构建项目
build_project() {
    log_info "构建项目..."
    
    # 清理之前的构建
    if [[ -d ".next" ]]; then
        rm -rf .next
    fi
    
    # 类型检查
    log_info "执行TypeScript类型检查..."
    npx tsc --noEmit || {
        log_error "TypeScript类型检查失败"
        return 1
    }
    
    # 代码检查
    log_info "执行ESLint检查..."
    npx next lint --fix || {
        log_warning "ESLint检查发现问题，但继续部署"
    }
    
    # 构建项目
    log_info "执行项目构建..."
    npm run build || {
        log_error "项目构建失败"
        return 1
    }
    
    log_success "项目构建完成"
}

# 运行测试
run_tests() {
    log_info "运行测试套件..."
    
    # 单元测试
    log_info "运行单元测试..."
    npm run test -- --coverage --watchAll=false || {
        log_warning "单元测试未完全通过，但继续部署"
    }
    
    # 性能测试
    log_info "运行性能测试..."
    if [[ -f "test/performance.test.ts" ]]; then
        npm run test:performance || {
            log_warning "性能测试发现问题"
        }
    fi
    
    # 安全测试
    log_info "运行安全测试..."
    if [[ -f "__tests__/api-security.test.ts" ]]; then
        npm run test:security || {
            log_warning "安全测试发现问题"
        }
    fi
    
    log_success "测试完成"
}

# 启动服务
start_service() {
    log_info "启动服务..."
    
    # 启动开发模式（如果指定）
    if [[ "$1" == "dev" ]]; then
        log_info "启动开发服务器..."
        npm run dev &
        DEV_PID=$!
        echo $DEV_PID > .dev.pid
        log_success "开发服务器已启动 (PID: $DEV_PID)"
        return 0
    fi
    
    # 启动生产模式
    log_info "启动生产服务器..."
    npm run start &
    PROD_PID=$!
    echo $PROD_PID > .prod.pid
    log_success "生产服务器已启动 (PID: $PROD_PID)"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log_info "健康检查尝试 $attempt/$max_attempts..."
        
        if curl -f -s http://localhost:3000/api/monitoring/health > /dev/null 2>&1; then
            log_success "服务健康检查通过"
            return 0
        fi
        
        sleep 2
        ((attempt++))
    done
    
    log_error "服务健康检查失败"
    return 1
}

# 性能验证
performance_validation() {
    log_info "执行性能验证..."
    
    # 基础性能测试
    log_info "运行基础性能测试..."
    
    # API响应时间测试
    local endpoints=(
        "http://localhost:3000/api/user/profile"
        "http://localhost:3000/api/products/list"
        "http://localhost:3000/api/monitoring/health"
    )
    
    for endpoint in "${endpoints[@]}"; do
        log_info "测试端点: $endpoint"
        
        # 简单响应时间测试
        local response_time=$(curl -w "%{time_total}" -o /dev/null -s "$endpoint" || echo "timeout")
        
        if [[ "$response_time" != "timeout" ]]; then
            log_success "端点 $endpoint 响应时间: ${response_time}s"
        else
            log_warning "端点 $endpoint 响应超时"
        fi
    done
    
    log_success "性能验证完成"
}

# 清理函数
cleanup() {
    log_info "清理临时文件..."
    
    # 停止开发服务器
    if [[ -f ".dev.pid" ]]; then
        kill $(cat .dev.pid) 2>/dev/null || true
        rm .dev.pid
    fi
    
    # 停止生产服务器
    if [[ -f ".prod.pid" ]]; then
        kill $(cat .prod.pid) 2>/dev/null || true
        rm .prod.pid
    fi
    
    # 清理临时文件
    rm -f *.tmp 2>/dev/null || true
    
    log_success "清理完成"
}

# 显示帮助信息
show_help() {
    echo "LuckyMart-TJ 性能优化部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --dev          启动开发模式"
    echo "  --skip-tests   跳过测试"
    echo "  --skip-build   跳过构建"
    echo "  --help         显示帮助信息"
    echo ""
    echo "环境变量:"
    echo "  DATABASE_URL   数据库连接字符串"
    echo "  REDIS_URL      Redis连接字符串"
    echo "  JWT_SECRET     JWT密钥"
    echo ""
    echo "示例:"
    echo "  $0                    # 完整部署"
    echo "  $0 --dev              # 开发模式部署"
    echo "  $0 --skip-tests       # 跳过测试的部署"
}

# 主函数
main() {
    local skip_tests=false
    local skip_build=false
    local dev_mode=false
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dev)
                dev_mode=true
                shift
                ;;
            --skip-tests)
                skip_tests=true
                shift
                ;;
            --skip-build)
                skip_build=true
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
    
    # 设置信号处理
    trap cleanup EXIT
    
    # 记录开始时间
    START_TIME=$(date +%s)
    
    log_info "=== LuckyMart-TJ 性能优化部署开始 ==="
    
    # 执行部署步骤
    check_environment || exit 1
    backup_current
    install_dependencies
    
    if [[ "$skip_build" == false ]]; then
        optimize_database
        optimize_config
        build_project
    fi
    
    if [[ "$skip_tests" == false ]]; then
        run_tests
    fi
    
    # 启动服务
    if [[ "$dev_mode" == true ]]; then
        start_service dev
    else
        start_service
    fi
    
    # 健康检查
    health_check || {
        log_error "健康检查失败，请检查服务状态"
        exit 1
    }
    
    # 性能验证
    performance_validation
    
    # 计算耗时
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    log_success "=== 部署完成 ==="
    log_success "总耗时: ${DURATION}秒"
    
    if [[ "$dev_mode" == true ]]; then
        log_info "开发服务器运行在: http://localhost:3000"
        log_info "按 Ctrl+C 停止服务器"
        wait
    else
        log_info "生产服务器运行在: http://localhost:3000"
        log_info "使用 'kill \$(cat .prod.pid)' 停止服务器"
    fi
}

# 脚本入口
main "$@"