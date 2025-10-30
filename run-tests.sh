#!/bin/bash

# LuckyMart TJ 快速测试执行脚本
# 提供简化的测试运行命令

set -e

echo "🚀 LuckyMart TJ 测试套件执行器"
echo "=================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查依赖
check_dependencies() {
    echo -e "${BLUE}🔍 检查测试依赖...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安装${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm 未安装${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 依赖检查通过${NC}"
}

# 安装测试依赖
install_dependencies() {
    echo -e "${BLUE}📦 安装测试依赖...${NC}"
    
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
        npm install
    fi
    
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
}

# 运行单元测试
run_unit_tests() {
    echo -e "${BLUE}🧪 运行单元测试...${NC}"
    
    # JWT认证测试
    echo "  测试 JWT 认证系统..."
    npm run test:auth --silent
    
    # VRF算法测试
    echo "  测试 VRF 开奖算法..."
    npm run test:lottery --silent
    
    # 业务流程测试
    echo "  测试核心业务流程..."
    npm run test:business --silent
    
    echo -e "${GREEN}✅ 单元测试完成${NC}"
}

# 运行集成测试
run_integration_tests() {
    echo -e "${BLUE}🔗 运行集成测试...${NC}"
    
    # 数据库锁测试
    echo "  测试数据库锁机制..."
    npm run test:unit -- --testNamePattern="数据库锁机制" --silent
    
    # API安全测试
    echo "  测试 API 安全..."
    npm run test:security --silent
    
    # 性能缓存测试
    echo "  测试性能优化缓存..."
    npm run test:performance-suite --silent
    
    echo -e "${GREEN}✅ 集成测试完成${NC}"
}

# 运行性能测试
run_performance_tests() {
    echo -e "${BLUE}⚡ 运行性能测试...${NC}"
    
    # 缓存系统测试
    echo "  测试缓存系统性能..."
    npm run test:cache --silent
    
    # N+1查询测试
    echo "  测试查询优化..."
    npm run test:performance --silent
    
    # Bot容错测试
    echo "  测试 Bot 容错机制..."
    npm run test:bot --silent
    
    echo -e "${GREEN}✅ 性能测试完成${NC}"
}

# 生成覆盖率报告
generate_coverage() {
    echo -e "${BLUE}📊 生成覆盖率报告...${NC}"
    
    npm run test:coverage
    
    if [ -d "coverage" ]; then
        echo -e "${GREEN}📋 覆盖率报告已生成到 coverage/ 目录${NC}"
    fi
    
    echo -e "${GREEN}✅ 覆盖率报告完成${NC}"
}

# 运行完整测试套件
run_full_test_suite() {
    echo -e "${YELLOW}🎯 运行完整测试套件...${NC}"
    
    start_time=$(date +%s)
    
    # 运行所有测试
    npm run test:all
    
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    echo -e "${GREEN}🎉 完整测试套件执行完成！${NC}"
    echo -e "${BLUE}⏱️  总耗时: ${duration} 秒${NC}"
    
    if [ -f "TEST_REPORT.md" ]; then
        echo -e "${GREEN}📄 详细测试报告: TEST_REPORT.md${NC}"
    fi
    
    if [ -f "test-report.json" ]; then
        echo -e "${GREEN}📊 JSON格式报告: test-report.json${NC}"
    fi
}

# 显示帮助信息
show_help() {
    echo -e "${BLUE}使用方法:${NC}"
    echo "  $0 [选项]"
    echo ""
    echo -e "${BLUE}选项:${NC}"
    echo "  -h, --help     显示此帮助信息"
    echo "  -u, --unit     运行单元测试"
    echo "  -i, --integration  运行集成测试"
    echo "  -p, --performance  运行性能测试"
    echo "  -c, --coverage     生成覆盖率报告"
    echo "  -a, --all          运行完整测试套件"
    echo "  --setup            安装测试依赖"
    echo ""
    echo -e "${BLUE}示例:${NC}"
    echo "  $0 --all           # 运行所有测试"
    echo "  $0 -u -i           # 运行单元和集成测试"
    echo "  $0 --setup         # 安装依赖后运行完整测试"
}

# 主函数
main() {
    case "${1:-}" in
        -h|--help)
            show_help
            exit 0
            ;;
        --setup)
            check_dependencies
            install_dependencies
            run_full_test_suite
            ;;
        -u|--unit)
            check_dependencies
            install_dependencies
            run_unit_tests
            ;;
        -i|--integration)
            check_dependencies
            install_dependencies
            run_integration_tests
            ;;
        -p|--performance)
            check_dependencies
            install_dependencies
            run_performance_tests
            ;;
        -c|--coverage)
            check_dependencies
            install_dependencies
            generate_coverage
            ;;
        -a|--all)
            check_dependencies
            install_dependencies
            run_full_test_suite
            ;;
        "")
            # 默认运行完整测试套件
            check_dependencies
            install_dependencies
            run_full_test_suite
            ;;
        *)
            echo -e "${RED}❌ 未知选项: $1${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"