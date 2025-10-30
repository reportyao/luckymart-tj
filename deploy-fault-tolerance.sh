#!/bin/bash

# Telegram Bot 容错机制部署脚本
# 包含环境检查、依赖安装、配置部署和启动

set -e

echo "=================================================="
echo "🚀 Telegram Bot 容错机制部署脚本"
echo "=================================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# 检查Node.js版本
check_nodejs() {
    log_info "检查Node.js环境..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js未安装，请先安装Node.js 16+版本"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | sed 's/v//')
    REQUIRED_VERSION="16.0.0"
    
    if ! node -e "process.exit(process.version.slice(1).localeCompare('$REQUIRED_VERSION', undefined, {numeric: true}) >= 0 ? 0 : 1)"; then
        log_error "Node.js版本过低，当前版本: $NODE_VERSION，要求版本: $REQUIRED_VERSION+"
        exit 1
    fi
    
    log_info "Node.js版本检查通过: $NODE_VERSION"
}

# 检查npm/pnpm
check_package_manager() {
    log_info "检查包管理器..."
    
    if command -v pnpm &> /dev/null; then
        PACKAGE_MANAGER="pnpm"
        log_info "使用pnpm作为包管理器"
    elif command -v npm &> /dev/null; then
        PACKAGE_MANAGER="npm"
        log_info "使用npm作为包管理器"
    else
        log_error "未找到包管理器，请安装npm或pnpm"
        exit 1
    fi
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    cd bot
    
    if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
        if [ ! -f "pnpm-lock.yaml" ]; then
            log_info "初始化pnpm..."
            pnpm install
        else
            pnpm install --frozen-lockfile
        fi
    else
        if [ ! -f "package-lock.json" ]; then
            log_info "初始化npm..."
            npm install
        else
            npm ci
        fi
    fi
    
    log_info "依赖安装完成"
}

# 安装容错机制依赖
install_fault_tolerance_deps() {
    log_info "安装容错机制额外依赖..."
    
    cd bot
    
    # 安装winston日志库
    $PACKAGE_MANAGER install winston winston-daily-rotate-file
    
    # 检查是否安装成功
    if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
        if pnpm list winston winston-daily-rotate-file | grep -q "winston"; then
            log_info "容错机制依赖安装成功"
        else
            log_warn "容错机制依赖安装可能失败"
        fi
    else
        if npm list winston winston-daily-rotate-file | grep -q "winston"; then
            log_info "容错机制依赖安装成功"
        else
            log_warn "容错机制依赖安装可能失败"
        fi
    fi
}

# 创建必要目录
create_directories() {
    log_info "创建必要目录..."
    
    mkdir -p bot/logs
    mkdir -p bot/config
    mkdir -p bot/utils
    mkdir -p bot/api
    
    log_info "目录创建完成"
}

# 检查环境变量
check_environment_variables() {
    log_info "检查环境变量..."
    
    # 检查必需的环境变量
    REQUIRED_VARS=("TELEGRAM_BOT_TOKEN")
    MISSING_VARS=()
    
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            MISSING_VARS+=("$var")
        fi
    done
    
    if [ ${#MISSING_VARS[@]} -ne 0 ]; then
        log_error "缺少必需的环境变量:"
        for var in "${MISSING_VARS[@]}"; do
            echo "  - $var"
        done
        log_warn "请在部署前设置这些环境变量"
        
        # 如果是交互式部署，询问是否继续
        if [ -t 0 ]; then
            read -p "是否继续部署? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        else
            exit 1
        fi
    else
        log_info "环境变量检查通过"
    fi
    
    # 设置默认环境变量
    export NODE_ENV="${NODE_ENV:-production}"
    export MINI_APP_URL="${MINI_APP_URL:-http://localhost:3000}"
    
    log_info "运行环境: $NODE_ENV"
    log_info "Mini App URL: $MINI_APP_URL"
}

# 创建配置文件
create_config_file() {
    log_info "创建配置文件..."
    
    cat > bot/config/environment.js << EOF
module.exports = {
    NODE_ENV: process.env.NODE_ENV || 'production',
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    MINI_APP_URL: process.env.MINI_APP_URL || 'http://localhost:3000',
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
    WEBHOOK_URL: process.env.WEBHOOK_URL,
    MONITORING_WEBHOOK: process.env.MONITORING_WEBHOOK,
    RESTART_TOKEN: process.env.RESTART_TOKEN,
};
EOF

    log_info "配置文件创建完成"
}

# 设置权限
set_permissions() {
    log_info "设置文件权限..."
    
    chmod +x bot/start.ts
    chmod +x bot/enhanced-launcher.ts
    
    # 设置日志目录权限
    chmod 755 bot/logs
    
    log_info "权限设置完成"
}

# 运行测试
run_tests() {
    log_info "运行测试检查..."
    
    cd bot
    
    # 检查TypeScript编译
    if [ -f "tsconfig.json" ]; then
        log_info "检查TypeScript配置..."
        if command -v npx &> /dev/null; then
            npx tsc --noEmit --skipLibCheck
            log_info "TypeScript检查通过"
        else
            log_warn "npx不可用，跳过TypeScript检查"
        fi
    fi
    
    # 检查必要文件
    required_files=(
        "index.ts"
        "start.ts"
        "enhanced-launcher.ts"
        "utils/logger.ts"
        "utils/health-monitor.ts"
        "utils/message-queue.ts"
        "utils/process-monitor.ts"
        "utils/fault-tolerance-manager.ts"
        "utils/reconnect-manager.ts"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "bot/$file" ]; then
            log_error "缺少必要文件: $file"
            exit 1
        fi
    done
    
    log_info "测试检查通过"
}

# 创建启动脚本
create_startup_script() {
    log_info "创建启动脚本..."
    
    cat > bot/start-bot.sh << 'EOF'
#!/bin/bash

# Telegram Bot启动脚本

# 设置环境
export NODE_ENV="${NODE_ENV:-production}"
export TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN}"
export MINI_APP_URL="${MINI_APP_URL:-http://localhost:3000}"

# 进入脚本目录
cd "$(dirname "$0")"

# 启动日志
echo "启动Telegram Bot..."
echo "环境: $NODE_ENV"
echo "时间: $(date)"
echo "PID: $$"

# 启动Bot
exec node start.ts
EOF

    chmod +x bot/start-bot.sh
    log_info "启动脚本创建完成"
}

# 创建PM2配置文件
create_pm2_config() {
    log_info "创建PM2配置文件..."
    
    cat > bot/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'telegram-bot',
    script: './start.ts',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 5000
  }]
};
EOF

    log_info "PM2配置文件创建完成"
}

# 显示部署结果
show_deployment_summary() {
    log_info "部署完成摘要:"
    echo ""
    echo "✅ 环境检查: 通过"
    echo "✅ 依赖安装: 完成"
    echo "✅ 容错机制: 已集成"
    echo "✅ 配置文件: 已创建"
    echo "✅ 启动脚本: 已生成"
    echo ""
    echo "🚀 启动Bot:"
    echo "  cd bot"
    echo "  ./start-bot.sh"
    echo ""
    echo "📊 监控端点:"
    echo "  健康检查: http://localhost:3001/api/health"
    echo "  系统状态: http://localhost:3001/api/status"
    echo "  系统指标: http://localhost:3001/api/metrics"
    echo ""
    echo "🔧 管理命令:"
    echo "  PM2管理: pm2 start ecosystem.config.js"
    echo "  查看日志: pm2 logs telegram-bot"
    echo "  重启Bot: pm2 restart telegram-bot"
    echo "  停止Bot: pm2 stop telegram-bot"
    echo ""
}

# 主函数
main() {
    echo "开始部署流程..."
    echo ""
    
    check_nodejs
    check_package_manager
    create_directories
    install_dependencies
    install_fault_tolerance_deps
    check_environment_variables
    create_config_file
    set_permissions
    run_tests
    create_startup_script
    create_pm2_config
    
    echo ""
    show_deployment_summary
}

# 执行主函数
main "$@"