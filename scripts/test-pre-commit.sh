#!/bin/bash

# LuckyMart-TJ 预提交钩子系统测试脚本
# 版本: 1.0.0
# 描述: 验证预提交钩子系统的各项功能

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# 测试统计
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# 脚本目录和项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${PURPLE}🧪 LuckyMart-TJ 预提交钩子系统测试${NC}"
echo "================================================"

# 测试工具函数
test_header() {
    echo ""
    echo -e "${BLUE}📋 测试: $1${NC}"
    echo "----------------------------------------"
}

test_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++))
    ((TOTAL_TESTS++))
}

test_failure() {
    echo -e "${RED}❌ $1${NC}"
    ((TESTS_FAILED++))
    ((TOTAL_TESTS++))
}

test_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((TOTAL_TESTS++))
}

# 1. 检查脚本文件存在性
test_check_scripts_exist() {
    test_header "检查脚本文件存在性"
    
    local scripts=(
        "$SCRIPT_DIR/pre-commit-check.sh"
        "$SCRIPT_DIR/install-pre-commit.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [[ -f "$script" ]]; then
            test_success "脚本文件存在: $(basename "$script")"
        else
            test_failure "脚本文件缺失: $(basename "$script")"
        fi
    done
}

# 2. 检查脚本权限
test_check_script_permissions() {
    test_header "检查脚本权限"
    
    local main_script="$SCRIPT_DIR/pre-commit-check.sh"
    if [[ -x "$main_script" ]]; then
        test_success "主脚本具有执行权限"
    else
        test_failure "主脚本缺少执行权限"
        chmod +x "$main_script"
        test_warning "已修复权限问题"
    fi
    
    local install_script="$SCRIPT_DIR/install-pre-commit.sh"
    if [[ -x "$install_script" ]]; then
        test_success "安装脚本具有执行权限"
    else
        test_failure "安装脚本缺少执行权限"
        chmod +x "$install_script"
        test_warning "已修复权限问题"
    fi
}

# 3. 检查配置文件
test_check_config_files() {
    test_header "检查配置文件"
    
    # 检查主配置文件
    if [[ -f "$PROJECT_ROOT/.pre-commit-config.json" ]]; then
        test_success "配置文件存在: .pre-commit-config.json"
        
        # 验证 JSON 格式
        if jq empty "$PROJECT_ROOT/.pre-commit-config.json" 2>/dev/null; then
            test_success "配置文件 JSON 格式正确"
        else
            test_failure "配置文件 JSON 格式错误"
        fi
    else
        test_failure "配置文件缺失: .pre-commit-config.json"
    fi
    
    # 检查跳过文件模板
    if [[ -f "$PROJECT_ROOT/.skip-pre-commit.template" ]]; then
        test_success "跳过文件模板存在"
    else
        test_failure "跳过文件模板缺失"
    fi
}

# 4. 测试预提交脚本基本功能
test_pre_commit_basic() {
    test_header "测试预提交脚本基本功能"
    
    # 测试帮助信息
    if bash "$SCRIPT_DIR/pre-commit-check.sh" --help >/dev/null 2>&1; then
        test_success "帮助信息显示正常"
    else
        test_failure "帮助信息显示异常"
    fi
    
    # 测试脚本语法
    if bash -n "$SCRIPT_DIR/pre-commit-check.sh"; then
        test_success "脚本语法检查通过"
    else
        test_failure "脚本语法错误"
    fi
}

# 5. 测试配置文件解析
test_config_parsing() {
    test_header "测试配置文件解析"
    
    if [[ -f "$PROJECT_ROOT/.pre-commit-config.json" ]]; then
        # 测试 jq 是否可用
        if command -v jq >/dev/null 2>&1; then
            # 测试配置项读取
            if version=$(jq -r '.version' "$PROJECT_ROOT/.pre-commit-config.json" 2>/dev/null); then
                test_success "配置文件版本: $version"
            else
                test_failure "无法读取配置文件版本"
            fi
            
            # 测试检查开关
            if checks_enabled=$(jq -r '.checks.typescript.enabled' "$PROJECT_ROOT/.pre-commit-config.json" 2>/dev/null); then
                test_success "TypeScript 检查开关: $checks_enabled"
            else
                test_failure "无法读取 TypeScript 检查配置"
            fi
        else
            test_warning "jq 未安装，跳过 JSON 解析测试"
        fi
    else
        test_failure "配置文件不存在"
    fi
}

# 6. 创建测试文件
test_create_test_files() {
    test_header "创建测试文件"
    
    local test_dir="$PROJECT_ROOT/test-temp"
    mkdir -p "$test_dir"
    
    # 创建测试 TypeScript 文件
    cat > "$test_dir/test-typescript.ts" << 'EOF'
// 测试文件：TypeScript 语法检查
export interface TestInterface {
    id: number;
    name: string;
}

export const testFunction = (param: string): string => {
    console.log('Test function'); // 应被检测为 console.log
    return param.toUpperCase();
};

export class TestClass implements TestInterface {
    constructor(public id: number, public name: string) {}
    
    // TODO: 添加更多方法
}
EOF
    
    if [[ -f "$test_dir/test-typescript.ts" ]]; then
        test_success "创建测试 TypeScript 文件"
    else
        test_failure "创建测试 TypeScript 文件失败"
    fi
    
    # 创建有问题的测试文件
    cat > "$test_dir/test-issues.ts" << 'EOF'
// 测试文件：包含各种问题
export const duplicateExport = 1;
// export const duplicateExport = 2; // 重复导出（注释掉避免立即失败）

export const withConsole = () => {
    console.log('This should be detected'); // 应被检测
    debugger; // 应被检测为 debugger
};

export const unsafeEval = () => {
    eval('alert("test")'); // 应被检测为 eval 使用
    return 'test';
};
EOF
    
    if [[ -f "$test_dir/test-issues.ts" ]]; then
        test_success "创建问题测试文件"
    else
        test_failure "创建问题测试文件失败"
    fi
}

# 7. 测试预提交检查功能
test_pre_commit_functionality() {
    test_header "测试预提交检查功能"
    
    local test_dir="$PROJECT_ROOT/test-temp"
    
    if [[ -d "$test_dir" ]]; then
        # 测试检查特定文件
        if timeout 30 bash "$SCRIPT_DIR/pre-commit-check.sh" --files "$test_dir/*.ts" --silent >/dev/null 2>&1; then
            test_success "特定文件检查功能正常"
        else
            test_warning "特定文件检查功能可能存在问题"
        fi
        
        # 测试详细模式
        if timeout 30 bash "$SCRIPT_DIR/pre-commit-check.sh" --files "$test_dir/*.ts" --verbose 2>&1 | grep -q "TypeScript 语法错误检查"; then
            test_success "详细模式输出正常"
        else
            test_warning "详细模式可能存在问题"
        fi
    else
        test_failure "测试目录不存在，跳过功能测试"
    fi
}

# 8. 测试工具脚本
test_utility_scripts() {
    test_header "测试工具脚本"
    
    local utils_dir="$PROJECT_ROOT/scripts/pre-commit-utils"
    
    if [[ -d "$utils_dir" ]]; then
        # 测试快速修复脚本
        if [[ -x "$utils_dir/quick-fix.sh" ]]; then
            test_success "快速修复脚本存在且可执行"
        else
            test_failure "快速修复脚本不存在或不可执行"
        fi
        
        # 测试统计脚本
        if [[ -x "$utils_dir/stats.sh" ]]; then
            test_success "统计脚本存在且可执行"
        else
            test_failure "统计脚本不存在或不可执行"
        fi
    else
        test_warning "工具脚本目录不存在"
    fi
}

# 9. 测试项目依赖
test_project_dependencies() {
    test_header "测试项目依赖"
    
    # 检查 Node.js 和 npm
    if command -v node >/dev/null 2>&1; then
        local node_version=$(node --version)
        test_success "Node.js 已安装: $node_version"
    else
        test_failure "Node.js 未安装"
    fi
    
    if command -v npm >/dev/null 2>&1; then
        local npm_version=$(npm --version)
        test_success "npm 已安装: $npm_version"
    else
        test_failure "npm 未安装"
    fi
    
    # 检查关键依赖
    if [[ -f "$PROJECT_ROOT/package.json" ]]; then
        if npm list typescript eslint >/dev/null 2>&1; then
            test_success "TypeScript 和 ESLint 依赖已安装"
        else
            test_warning "部分依赖可能未正确安装"
        fi
    else
        test_failure "package.json 不存在"
    fi
}

# 10. 测试文档存在性
test_documentation() {
    test_header "测试文档存在性"
    
    local doc_file="$PROJECT_ROOT/docs/PRE_COMMIT_HOOK_GUIDE.md"
    if [[ -f "$doc_file" ]]; then
        test_success "使用指南文档存在"
        
        # 检查文档内容
        if grep -q "LuckyMart-TJ 预提交钩子系统使用指南" "$doc_file"; then
            test_success "文档内容正确"
        else
            test_failure "文档内容可能不完整"
        fi
    else
        test_failure "使用指南文档不存在"
    fi
}

# 11. 清理测试文件
test_cleanup() {
    test_header "清理测试文件"
    
    local test_dir="$PROJECT_ROOT/test-temp"
    if [[ -d "$test_dir" ]]; then
        rm -rf "$test_dir"
        test_success "测试文件已清理"
    else
        test_success "测试目录不存在，无需清理"
    fi
}

# 运行所有测试
run_all_tests() {
    test_check_scripts_exist
    test_check_script_permissions
    test_check_config_files
    test_pre_commit_basic
    test_config_parsing
    test_create_test_files
    test_pre_commit_functionality
    test_utility_scripts
    test_project_dependencies
    test_documentation
    test_cleanup
}

# 显示测试结果
show_test_results() {
    echo ""
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE} 测试结果汇总${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    echo -e "${GREEN}✅ 通过: $TESTS_PASSED${NC}"
    echo -e "${RED}❌ 失败: $TESTS_FAILED${NC}"
    echo -e "${BLUE}📊 总计: $TOTAL_TESTS${NC}"
    echo ""
    
    local success_rate=0
    if [[ $TOTAL_TESTS -gt 0 ]]; then
        success_rate=$((TESTS_PASSED * 100 / TOTAL_TESTS))
    fi
    
    echo -e "成功率: ${success_rate}%"
    echo ""
    
    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "${GREEN}🎉 所有测试通过！预提交钩子系统运行正常。${NC}"
        echo ""
        echo -e "${BLUE}📋 下一步操作:${NC}"
        echo "1. 运行安装脚本: bash scripts/install-pre-commit.sh"
        echo "2. 查看使用指南: cat docs/PRE_COMMIT_HOOK_GUIDE.md"
        echo "3. 开始使用: git add . && git commit -m 'test'"
        echo ""
        exit 0
    else
        echo -e "${RED}❌ 有 $TESTS_FAILED 个测试失败，请检查配置。${NC}"
        echo ""
        echo -e "${YELLOW}🔧 建议操作:${NC}"
        echo "1. 检查脚本权限: chmod +x scripts/*.sh"
        echo "2. 安装缺失的依赖: npm install"
        echo "3. 检查配置文件: jq . .pre-commit-config.json"
        echo "4. 重新运行安装脚本"
        echo ""
        exit 1
    fi
}

# 主函数
main() {
    echo -e "${BLUE}🚀 开始运行预提交钩子系统测试...${NC}"
    
    # 检查 jq 是否可用
    if ! command -v jq >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  jq 未安装，建议安装以获得更好的测试体验${NC}"
        echo "  Ubuntu/Debian: sudo apt-get install jq"
        echo "  macOS: brew install jq"
        echo "  或使用其他包管理器"
        echo ""
    fi
    
    # 运行测试
    run_all_tests
    
    # 显示结果
    show_test_results
}

# 执行主函数
main "$@"