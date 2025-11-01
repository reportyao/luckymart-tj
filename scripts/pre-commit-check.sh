#!/bin/bash

# LuckyMart-TJ 预提交钩子检查脚本
# 版本: 2.0.0
# 描述: 全面的代码质量检查，防止结构性错误提交

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 全局变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/.pre-commit-config.json"
SKIP_FILE="$PROJECT_ROOT/.skip-pre-commit"
ERROR_COUNT=0
WARNING_COUNT=0
CHECK_RESULTS=()

# 输出函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    CHECK_RESULTS+=("✅ $1")
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    CHECK_RESULTS+=("⚠️  $1")
    ((WARNING_COUNT++))
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    CHECK_RESULTS+=("❌ $1")
    ((ERROR_COUNT++))
}

log_section() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN} $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# 帮助信息
show_help() {
    cat << EOF
LuckyMart-TJ 预提交钩子检查脚本

用法: $0 [选项]

选项:
    --skip-patterns <patterns>    跳过指定的检查模式 (逗号分隔)
    --files <files>              检查指定文件
    --verbose                    详细输出
    --silent                     静默模式
    --fix                        自动修复可修复的问题
    --help                       显示此帮助信息

示例:
    $0                          # 运行所有检查
    $0 --skip-patterns typescript,security  # 跳过类型检查和安全检查
    $0 --fix                    # 运行检查并自动修复
    $0 --files "src/*.ts"       # 检查特定文件

跳过检查的特殊情况:
    - 在提交信息中添加 [skip-checks] 标签
    - 设置 SKIP_CHECKS=true 环境变量
    - 创建 .skip-pre-commit 文件
EOF
}

# 解析命令行参数
SKIP_PATTERNS=""
FILES_PATTERN=""
VERBOSE=false
SILENT=false
AUTO_FIX=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-patterns)
            SKIP_PATTERNS="$2"
            shift 2
            ;;
        --files)
            FILES_PATTERN="$2"
            shift 2
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --silent)
            SILENT=true
            shift
            ;;
        --fix)
            AUTO_FIX=true
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

# 检查是否应该跳过
should_skip_checks() {
    # 检查环境变量
    if [[ "$SKIP_CHECKS" == "true" ]]; then
        return 0
    fi
    
    # 检查跳过文件
    if [[ -f "$SKIP_FILE" ]]; then
        return 0
    fi
    
    # 检查提交信息中的跳过标记
    if [[ "$1" == *"skip-checks"* ]] || [[ "$1" == *"SKIP_CHECKS"* ]]; then
        return 0
    fi
    
    return 1
}

# 检查必要工具
check_required_tools() {
    log_section "检查必要工具"
    
    local tools=("node" "npm" "npx")
    local missing_tools=()
    
    for tool in "${tools[@]}"; do
        if command -v "$tool" &> /dev/null; then
            log_success "$tool 已安装"
        else
            log_error "$tool 未安装"
            missing_tools+=("$tool")
        fi
    done
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "缺少必要工具: ${missing_tools[*]}"
        exit 1
    fi
}

# 检查项目配置
check_project_config() {
    log_section "检查项目配置"
    
    # 检查 package.json
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log_error "package.json 文件不存在"
        exit 1
    fi
    log_success "package.json 存在"
    
    # 检查 TypeScript 配置
    if [[ ! -f "$PROJECT_ROOT/tsconfig.json" ]]; then
        log_error "tsconfig.json 文件不存在"
        exit 1
    fi
    log_success "tsconfig.json 存在"
    
    # 检查是否启用了 strict 模式
    if grep -q '"strict":\s*true' "$PROJECT_ROOT/tsconfig.json"; then
        log_success "TypeScript 严格模式已启用"
    else
        log_warning "TypeScript 严格模式未启用，建议启用以提高代码质量"
    fi
    
    # 检查 ESLint 配置
    if [[ ! -f "$PROJECT_ROOT/.eslintrc.json" ]] && [[ ! -f "$PROJECT_ROOT/.eslintrc.js" ]]; then
        log_warning "未找到 ESLint 配置文件"
    else
        log_success "ESLint 配置文件存在"
    fi
}

# TypeScript 语法错误检查
check_typescript_errors() {
    if [[ "$SKIP_PATTERNS" == *"typescript"* ]]; then
        log_warning "跳过 TypeScript 语法检查"
        return 0
    fi
    
    log_section "TypeScript 语法错误检查"
    
    # 获取要检查的文件
    local files_to_check=""
    if [[ -n "$FILES_PATTERN" ]]; then
        files_to_check="$FILES_PATTERN"
    else
        # 默认检查 TypeScript 和 TSX 文件
        files_to_check=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' || true)
        
        if [[ -z "$files_to_check" ]]; then
            log_info "没有暂存的 TypeScript 文件需要检查"
            return 0
        fi
    fi
    
    log_info "检查文件: $files_to_check"
    
    # TypeScript 编译检查
    if npx tsc --noEmit --strict --project "$PROJECT_ROOT/tsconfig.json" 2>&1 | tee /tmp/tsc_output.log; then
        log_success "TypeScript 语法检查通过"
    else
        log_error "TypeScript 语法检查失败"
        
        if [[ "$VERBOSE" == "true" ]]; then
            log_info "TypeScript 编译输出:"
            cat /tmp/tsc_output.log
        fi
        
        return 1
    fi
    
    # 检查常见语法错误模式
    check_common_syntax_patterns "$files_to_check"
}

# 检查常见语法错误模式
check_common_syntax_patterns() {
    local files="$1"
    
    log_info "检查常见语法错误模式..."
    
    # 检查 console.log 遗留
    if echo "$files" | xargs grep -l "console\.log" 2>/dev/null; then
        log_warning "发现遗留的 console.log 语句"
        if [[ "$AUTO_FIX" == "true" ]]; then
            log_info "尝试自动移除 console.log..."
            echo "$files" | xargs sed -i 's/console\.log.*$//g'
        fi
    fi
    
    # 检查 debugger 语句
    if echo "$files" | xargs grep -l "debugger" 2>/dev/null; then
        log_error "发现 debugger 语句，应在提交前移除"
        if [[ "$AUTO_FIX" == "true" ]]; then
            echo "$files" | xargs sed -i '/debugger/d'
        fi
    fi
    
    # 检查 TODO/FIXME 注释
    if echo "$files" | xargs grep -E "(TODO|FIXME|XXX)" 2>/dev/null; then
        log_warning "发现 TODO/FIXME 注释，建议处理后提交"
    fi
    
    # 检查未处理的 Promise
    if echo "$files" | xargs grep -E "^\s*\w+\.then\(" 2>/dev/null; then
        log_warning "发现未处理的 Promise，请确保正确处理"
    fi
    
    # 检查异步函数缺少 await
    if echo "$files" | xargs grep -E "async\s+\w+\s*\([^)]*\)\s*\{[^}]*return\s+[^;]*;" 2>/dev/null; then
        log_warning "异步函数中可能缺少 await 关键字"
    fi
}

# ESLint 代码质量检查
check_eslint_quality() {
    if [[ "$SKIP_PATTERNS" == *"eslint"* ]]; then
        log_warning "跳 ES ESLint 代码质量检查"
        return 0
    fi
    
    log_section "ESLint 代码质量检查"
    
    # 获取要检查的文件
    local files_to_check=""
    if [[ -n "$FILES_PATTERN" ]]; then
        files_to_check="$FILES_PATTERN"
    else
        files_to_check=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|jsx|ts|tsx)$' || true)
        
        if [[ -z "$files_to_check" ]]; then
            log_info "没有暂存的 JavaScript/TypeScript 文件需要检查"
            return 0
        fi
    fi
    
    log_info "检查文件: $files_to_check"
    
    # 运行 ESLint
    if npm run lint 2>&1 | tee /tmp/eslint_output.log; then
        log_success "ESLint 代码质量检查通过"
    else
        log_error "ESLint 代码质量检查失败"
        
        if [[ "$AUTO_FIX" == "true" ]]; then
            log_info "尝试自动修复 ESLint 问题..."
            if npm run lint:fix; then
                log_success "ESLint 问题已自动修复"
            else
                log_error "ESLint 自动修复失败"
            fi
        fi
        
        if [[ "$VERBOSE" == "true" ]]; then
            log_info "ESLint 输出:"
            cat /tmp/eslint_output.log
        fi
        
        return 1
    fi
}

# 箭头函数格式检查
check_arrow_function_format() {
    if [[ "$SKIP_PATTERNS" == *"arrow"* ]]; then
        log_warning "跳过箭头函数格式检查"
        return 0
    fi
    
    log_section "箭头函数格式检查"
    
    # 获取要检查的文件
    local files_to_check=""
    if [[ -n "$FILES_PATTERN" ]]; then
        files_to_check="$FILES_PATTERN"
    else
        files_to_check=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$' || true)
        
        if [[ -z "$files_to_check" ]]; then
            log_info "没有暂存的文件需要检查箭头函数格式"
            return 0
        fi
    fi
    
    log_info "检查箭头函数格式..."
    
    # 检查箭头函数的一致性格式
    local arrow_issues=$(echo "$files_to_check" | xargs grep -n "=>" 2>/dev/null | grep -v "=>\s*{" | grep -v "=>\s*\(" | wc -l || echo "0")
    
    if [[ "$arrow_issues" -gt 0 ]]; then
        log_warning "发现 $arrow_issues 个箭头函数格式不一致的情况"
        log_info "建议使用一致的箭头函数格式: () => {} 或 (param) => {}"
        
        if [[ "$AUTO_FIX" == "true" ]]; then
            log_info "可以运行 npm run format:fix 自动格式化代码"
        fi
    else
        log_success "箭头函数格式检查通过"
    fi
    
    # 检查不必要的圆括号
    local unnecessary_parens=$(echo "$files_to_check" | xargs grep -nE "=>\s*\(\s*\w+\s*\)\s*=>" 2>/dev/null | wc -l || echo "0")
    
    if [[ "$unnecessary_parens" -gt 0 ]]; then
        log_warning "发现 $unnecessary_parens 个不必要的箭头函数圆括号"
        log_info "建议简化: (param) => expr 改为 param => expr"
    fi
}

# 重复导出检查
check_duplicate_exports() {
    if [[ "$SKIP_PATTERNS" == *"exports"* ]]; then
        log_warning "跳过重复导出检查"
        return 0
    fi
    
    log_section "重复导出检查"
    
    # 获取要检查的文件
    local files_to_check=""
    if [[ -n "$FILES_PATTERN" ]]; then
        files_to_check="$FILES_PATTERN"
    else
        files_to_check=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' || true)
        
        if [[ -z "$files_to_check" ]]; then
            log_info "没有暂存的 TypeScript 文件需要检查重复导出"
            return 0
        fi
    fi
    
    log_info "检查重复导出..."
    
    # 检查重复的命名导出
    local temp_file="/tmp/export_check.txt"
    > "$temp_file"
    
    for file in $files_to_check; do
        if [[ -f "$file" ]]; then
            # 检查命名导出
            grep -oE "export\s+(const|function|class|interface|type)\s+\w+" "$file" 2>/dev/null | \
            sed 's/export //' >> "$temp_file" || true
        fi
    done
    
    # 检查重复项
    local duplicates=$(sort "$temp_file" | uniq -d | wc -l)
    
    if [[ "$duplicates" -gt 0 ]]; then
        log_error "发现 $duplicates 个重复的导出项"
        log_info "重复的导出:"
        sort "$temp_file" | uniq -d | head -10
        
        return 1
    else
        log_success "重复导出检查通过"
    fi
    
    # 检查默认导出的唯一性
    local default_exports=$(echo "$files_to_check" | xargs grep -c "export\s+default" 2>/dev/null | \
                           awk -F: '{sum += $2} END {print sum}' || echo "0")
    
    if [[ "$default_exports" -gt 1 ]]; then
        log_error "发现 $default_exports 个默认导出，每个文件只能有一个默认导出"
        return 1
    elif [[ "$default_exports" -eq 1 ]]; then
        log_success "默认导出检查通过"
    fi
    
    # 清理临时文件
    rm -f "$temp_file"
}

# 安全检查
check_security_issues() {
    if [[ "$SKIP_PATTERNS" == *"security"* ]]; then
        log_warning "跳过安全检查"
        return 0
    fi
    
    log_section "安全检查"
    
    # 获取要检查的文件
    local files_to_check=""
    if [[ -n "$FILES_PATTERN" ]]; then
        files_to_check="$FILES_PATTERN"
    else
        files_to_check=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$' || true)
        
        if [[ -z "$files_to_check" ]]; then
            log_info "没有暂存的文件需要安全检查"
            return 0
        fi
    fi
    
    log_info "检查安全漏洞..."
    
    # 检查硬编码凭证
    if echo "$files_to_check" | xargs grep -iE "(password|secret|token|api[_-]?key|private[_-]?key)" 2>/dev/null | \
       grep -v "example\|test\|demo\|placeholder" | head -5; then
        log_error "发现可能的硬编码凭证"
        log_warning "请确保没有提交敏感信息"
    fi
    
    # 检查 SQL 注入风险
    if echo "$files_to_check" | xargs grep -iE "query.*\$\{" 2>/dev/null | head -3; then
        log_warning "发现可能的 SQL 注入风险，请使用参数化查询"
    fi
    
    # 检查 eval 使用
    if echo "$files_to_check" | xargs grep -E "\beval\s*\(" 2>/dev/null; then
        log_error "发现 eval 使用，存在安全风险"
    fi
    
    # 检查 innerHTML 使用
    if echo "$files_to_check" | xargs grep -E "\.innerHTML\s*=" 2>/dev/null; then
        log_warning "发现 innerHTML 使用，注意 XSS 风险"
    fi
    
    log_success "安全检查完成"
}

# Git 状态检查
check_git_status() {
    log_section "Git 状态检查"
    
    # 检查是否有未提交的更改
    if git diff --quiet; then
        log_warning "没有检测到未提交的更改"
    else
        log_success "检测到未提交的更改"
    fi
    
    # 检查暂存区
    if git diff --cached --quiet; then
        log_warning "没有暂存的更改"
        return 1
    else
        log_success "检测到暂存的更改"
    fi
    
    # 检查分支名称
    local current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    
    if [[ "$current_branch" =~ ^(feature|fix|hotfix|release)\/.+ ]]; then
        log_success "分支名称符合规范: $current_branch"
    else
        log_warning "分支名称可能需要优化: $current_branch"
        log_info "建议使用以下格式:"
        echo "  - feature/功能名称"
        echo "  - fix/bug描述"
        echo "  - hotfix/紧急修复"
        echo "  - release/版本号"
    fi
    
    # 检查远程同步
    if git fetch --dry-run &> /dev/null; then
        local local_commit=$(git rev-parse HEAD)
        local remote_commit=$(git rev-parse @{u} 2>/dev/null || echo "")
        
        if [[ -n "$remote_commit" && "$local_commit" != "$remote_commit" ]]; then
            log_warning "本地分支落后于远程分支，建议先拉取最新代码"
        fi
    fi
}

# 依赖检查
check_dependencies() {
    if [[ "$SKIP_PATTERNS" == *"dependencies"* ]]; then
        log_warning "跳过依赖检查"
        return 0
    fi
    
    log_section "依赖检查"
    
    # 检查 package-lock.json 或 yarn.lock 存在
    if [[ -f "$PROJECT_ROOT/package-lock.json" ]] || [[ -f "$PROJECT_ROOT/yarn.lock" ]]; then
        log_success "锁文件存在"
    else
        log_warning "未找到锁文件，建议使用 npm ci 或 yarn install"
    fi
    
    # 检查未使用的依赖
    if command -v npm-check &> /dev/null; then
        if npm-check --skip-unused --update-none 2>/dev/null | grep -q "unused"; then
            log_warning "发现未使用的依赖"
        else
            log_success "依赖使用检查通过"
        fi
    else
        log_info "npm-check 未安装，跳过未使用依赖检查"
    fi
    
    # 安全审计
    if npm audit --audit-level=high --silent 2>/dev/null; then
        log_success "依赖安全检查通过"
    else
        log_warning "发现高危安全漏洞"
        log_info "建议运行 'npm audit fix' 修复安全问题"
    fi
}

# 生成报告
generate_report() {
    log_section "检查报告"
    
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN} 检查结果汇总${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    if [[ ${#CHECK_RESULTS[@]} -gt 0 ]]; then
        printf "%s\n" "${CHECK_RESULTS[@]}"
    fi
    
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN} 统计信息${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "错误:   ${RED}$ERROR_COUNT${NC}"
    echo -e "警告:   ${YELLOW}$WARNING_COUNT${NC}"
    echo -e "检查项: $(($ERROR_COUNT + $WARNING_COUNT))"
    echo ""
    
    # 保存详细报告
    local report_file="$PROJECT_ROOT/pre-commit-report-$(date +%Y%m%d-%H%M%S).log"
    {
        echo "LuckyMart-TJ 预提交检查报告"
        echo "生成时间: $(date)"
        echo "Git 分支: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
        echo "Git 提交: $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
        echo ""
        echo "检查结果:"
        printf "%s\n" "${CHECK_RESULTS[@]}"
        echo ""
        echo "统计: $ERROR_COUNT 错误, $WARNING_COUNT 警告"
    } > "$report_file"
    
    log_info "详细报告已保存至: $report_file"
}

# 主函数
main() {
    local commit_msg="${1:-}"
    
    echo -e "${PURPLE}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║              LuckyMart-TJ 预提交钩子检查系统 v2.0               ║"
    echo "║                    全面的代码质量保障系统                       ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # 检查是否应该跳过
    if should_skip_checks "$commit_msg"; then
        log_warning "检测到跳过标记，跳过所有检查"
        log_info "如需强制执行，请移除跳过标记或删除 $SKIP_FILE 文件"
        exit 0
    fi
    
    # 执行所有检查
    check_required_tools
    check_project_config
    
    # 只有在有暂存文件时才执行详细检查
    if ! git diff --cached --quiet; then
        check_typescript_errors || ((ERROR_COUNT++))
        check_eslint_quality || ((ERROR_COUNT++))
        check_arrow_function_format
        check_duplicate_exports || ((ERROR_COUNT++))
        check_security_issues
    else
        log_info "没有暂存的文件，跳过详细检查"
    fi
    
    check_git_status
    check_dependencies
    
    # 生成报告
    generate_report
    
    # 返回结果
    echo ""
    if [[ $ERROR_COUNT -eq 0 ]]; then
        if [[ $WARNING_COUNT -eq 0 ]]; then
            echo -e "${GREEN}🎉 所有检查都通过了！可以安全提交代码。${NC}"
        else
            echo -e "${YELLOW}⚠️  检查通过，但有 $WARNING_COUNT 个警告，建议关注。${NC}"
        fi
        
        echo ""
        echo -e "${CYAN}💡 提示:${NC}"
        echo "  - 使用 'git add .' 暂存所有更改"
        echo "  - 使用 'git commit -m \"type(scope): message\"' 提交代码"
        echo "  - 使用 'git push origin branch-name' 推送代码"
        echo ""
        echo -e "${CYAN}🔧 常用命令:${NC}"
        echo "  - npm run lint:fix        # 自动修复 ESLint 问题"
        echo "  - npm run format:fix      # 自动格式化代码"
        echo "  - npm run type-check      # 检查 TypeScript 类型"
        echo ""
        
        exit 0
    else
        echo -e "${RED}❌ 检查失败！发现 $ERROR_COUNT 个错误。${NC}"
        echo ""
        echo -e "${RED}请修复以下问题后重试:${NC}"
        echo "  1. 修复所有 TypeScript 类型错误"
        echo "  2. 解决所有 ESLint 代码质量问题"
        echo "  3. 修复重复导出和安全问题"
        echo ""
        echo -e "${YELLOW}🔧 快速修复命令:${NC}"
        echo "  - npm run lint:fix        # 自动修复大部分 ESLint 问题"
        echo "  - npm run format:fix      # 自动格式化代码"
        echo "  - npm audit fix          # 修复安全漏洞"
        echo ""
        echo -e "${YELLOW}⚡ 强制跳过检查 (不推荐):${NC}"
        echo "  - git commit --no-verify  # 跳过钩子检查"
        echo "  - git commit -m '...' [skip-checks]  # 在提交信息中添加跳过标记"
        echo ""
        
        exit 1
    fi
}

# 执行主函数
main "$@"