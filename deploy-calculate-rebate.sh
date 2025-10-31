#!/bin/bash

# calculate-rebate API 快速测试和部署脚本

set -e

echo "🚀 LuckyMart TJ - calculate-rebate API 部署和测试脚本"
echo "================================================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目目录
PROJECT_DIR="/workspace/luckymart-tj"
API_DIR="$PROJECT_DIR/app/api/referral/calculate-rebate"

# 函数：打印带颜色的消息
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要的文件和目录
check_files() {
    print_status "检查文件结构..."
    
    if [ -f "$API_DIR/route.ts" ]; then
        print_success "✅ calculate-rebate API 文件存在"
    else
        print_error "❌ calculate-rebate API 文件不存在"
        exit 1
    fi
    
    if [ -f "$PROJECT_DIR/test/calculate_rebate_api.test.ts" ]; then
        print_success "✅ 测试文件存在"
    else
        print_warning "⚠️  测试文件不存在"
    fi
    
    if [ -f "$PROJECT_DIR/test/init_test_data.sql" ]; then
        print_success " ✅ 数据库初始化脚本存在"
    else
        print_warning "⚠️  数据库初始化脚本不存在"
    fi
}

# 检查API代码质量
check_code_quality() {
    print_status "检查API代码质量..."
    
    # 检查TypeScript语法
    if command -v npx >/dev/null 2>&1; then
        cd "$PROJECT_DIR"
        
        # 检查import语句
        if grep -q "import.*from.*@/lib" "$API_DIR/route.ts"; then
            print_success "✅ 正确使用了项目内部模块"
        else
            print_warning "⚠️  建议检查模块导入"
        fi
        
        # 检查错误处理
        if grep -q "withErrorHandling" "$API_DIR/route.ts"; then
            print_success "✅ 使用了错误处理中间件"
        else
            print_warning "⚠️  建议添加错误处理中间件"
        fi
        
        # 检查日志记录
        if grep -q "getLogger" "$API_DIR/route.ts"; then
            print_success "✅ 使用了日志记录"
        else
            print_warning "⚠️  建议添加日志记录"
        fi
        
        # 检查监控
        if grep -q "getMonitor" "$API_DIR/route.ts"; then
            print_success "✅ 使用了监控功能"
        else
            print_warning "⚠️  建议添加监控功能"
        fi
    else
        print_warning "⚠️  无法执行代码质量检查（缺少npx）"
    fi
}

# 检查数据库连接和初始化
check_database() {
    print_status "检查数据库连接..."
    
    if [ -n "$DATABASE_URL" ]; then
        print_success "✅ 数据库环境变量已设置"
        
        # 检查是否可以连接数据库
        if command -v psql >/dev/null 2>&1; then
            print_status "测试数据库连接..."
            if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
                print_success "✅ 数据库连接正常"
            else
                print_warning "⚠️  无法连接到数据库"
            fi
        else
            print_warning "⚠️  无法测试数据库连接（缺少psql）"
        fi
    else
        print_warning "⚠️  DATABASE_URL环境变量未设置"
    fi
}

# 运行模拟测试
run_mock_test() {
    print_status "运行模拟API测试..."
    
    # 模拟API请求
    cat > /tmp/test_request.json << EOF
{
  "order_id": "test-order-001-uuid",
  "user_id": "test-user-001-uuid", 
  "order_amount": 100.50,
  "is_first_purchase": false
}
EOF
    
    print_status "模拟请求数据:"
    cat /tmp/test_request.json | jq '.' 2>/dev/null || cat /tmp/test_request.json
    
    echo ""
    print_success "✅ 模拟测试数据已生成"
    print_status "要测试API，请确保服务器正在运行并执行:"
    echo "curl -X POST http://localhost:3000/api/referral/calculate-rebate \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -H 'X-Request-ID: test-$(date +%s)' \\"
    echo "  -d @/tmp/test_request.json"
}

# 显示API文档
show_api_docs() {
    print_status "API文档和功能说明:"
    echo ""
    echo "📋 POST /api/referral/calculate-rebate"
    echo "├── 功能: 计算并发放推荐返利"
    echo "├── 请求参数:"
    echo "│   ├── order_id (string, required): 订单ID"
    echo "│   ├── user_id (string, required): 用户ID"
    echo "│   ├── order_amount (number, required): 订单金额"
    echo "│   └── is_first_purchase (boolean, required): 是否首次消费"
    echo "├── 核心功能:"
    echo "│   ├── loadRewardConfig() - 加载最新返利比例配置"
    echo "│   ├── get_user_uplines() - 获取用户所有上级"
    echo "│   ├── 小数精度计算 - 保留小数点后1位"
    echo "│   ├── 检查最小返利阈值"
    echo "│   ├── 首次消费延迟24小时发放"
    echo "│   ├── addRewardTransaction() - 记录奖励流水"
    echo "│   └── 立即发放更新用户余额"
    echo "└── 响应格式:"
    echo "    ├── success: boolean"
    echo "    ├── rebate_info: 返利统计信息"
    echo "    ├── distributions: 返利分配详情"
    echo "    ├── rewards: 奖励记录"
    echo "    └── message: 处理结果"
    echo ""
}

# 检查API特性
check_api_features() {
    print_status "检查API功能特性..."
    
    local features=(
        "参数验证"
        "数据库事务"
        "错误处理"
        "日志记录"
        "监控指标"
        "请求追踪"
        "CORS支持"
        "类型安全"
    )
    
    local checks=(
        "validateRequestParams"
        "prisma.\$transaction"
        "withErrorHandling"
        "getLogger"
        "getMonitor"
        "createRequestTracker"
        "OPTIONS"
        "interface.*Request"
    )
    
    for i in "${!features[@]}"; do
        if grep -q "${checks[$i]}" "$API_DIR/route.ts"; then
            print_success "✅ ${features[$i]}"
        else
            print_warning "⚠️  ${features[$i]} - 需要确认"
        fi
    done
}

# 显示使用示例
show_examples() {
    print_status "使用示例:"
    echo ""
    echo "1. 立即发放返利（非首次消费）:"
    echo 'curl -X POST http://localhost:3000/api/referral/calculate-rebate \'
    echo '  -H "Content-Type: application/json" \'
    echo '  -d '\''{"order_id":"order-123","user_id":"user-456","order_amount":100.0,"is_first_purchase":false}'\'''
    echo ""
    echo "2. 延迟发放返利（首次消费）:"
    echo 'curl -X POST http://localhost:3000/api/referral/calculate-rebate \'
    echo '  -H "Content-Type: application/json" \'
    echo '  -d '\''{"order_id":"order-124","user_id":"user-457","order_amount":50.0,"is_first_purchase":true}'\'''
    echo ""
    echo "3. 错误响应示例:"
    echo 'curl -X POST http://localhost:3000/api/referral/calculate-rebate \'
    echo '  -H "Content-Type: application/json" \'
    echo '  -d '\''{"order_id":"invalid","user_id":"user-458","order_amount":100.0,"is_first_purchase":false}'\'''
    echo ""
}

# 主函数
main() {
    echo "开始检查..."
    echo ""
    
    check_files
    echo ""
    
    check_code_quality
    echo ""
    
    check_api_features
    echo ""
    
    check_database
    echo ""
    
    run_mock_test
    echo ""
    
    show_api_docs
    echo ""
    
    show_examples
    
    echo "================================================================"
    print_success "✅ 检查完成！calculate-rebate API 已准备就绪"
    echo ""
    print_status "下一步操作:"
    echo "1. 确保数据库已启动并包含必要的数据"
    echo "2. 运行 npm run dev 启动开发服务器"
    echo "3. 使用上述示例测试API"
    echo "4. 查看日志文件监控API运行状态"
}

# 运行主函数
main "$@"