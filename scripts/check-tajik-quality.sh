#!/bin/bash

# 塔吉克语翻译质量快速检查脚本
# 用于在提交前快速验证翻译质量

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
PROJECT_ROOT=$(pwd)
LOCALE_PATH="src/locales/tg-TJ"
MINIMUM_SCORE=70
MAX_MISSING_KEYS=0

# 工具路径
EVALUATOR="npx tsx utils/tajik-localization-evaluator.ts"
OPTIMIZER="npx tsx utils/tajik-translation-optimizer.ts"
MONITOR="npx tsx utils/tajik-translation-monitor.ts"

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

# 显示横幅
show_banner() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║            塔吉克语翻译质量快速检查工具                     ║"
    echo "║          Tajik Translation Quality Checker                 ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 检查前置条件
check_prerequisites() {
    log_info "检查前置条件..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    # 检查 TypeScript
    if ! command -v npx &> /dev/null; then
        log_error "npx 未安装"
        exit 1
    fi
    
    # 检查翻译文件
    if [ ! -d "$LOCALE_PATH" ]; then
        log_error "翻译目录不存在: $LOCALE_PATH"
        exit 1
    fi
    
    # 检查工具文件
    for tool in "$EVALUATOR" "$OPTIMIZER" "$MONITOR"; do
        if [ ! -f "${tool%% *}" ] && [ ! -f "${tool#* }" ]; then
            log_warning "工具文件不存在: $tool"
        fi
    done
    
    log_success "前置条件检查通过"
}

# 运行本土化评估
run_localization_evaluation() {
    log_info "运行塔吉克语本土化评估..."
    
    # 临时文件
    local temp_report="/tmp/tajik-evaluation-$(date +%s).json"
    
    # 运行评估（如果工具存在）
    if [ -f "utils/tajik-localization-evaluator.ts" ]; then
        if npx tsx utils/tajik-localization-evaluator.ts > /dev/null 2>&1; then
            log_success "本土化评估完成"
            return 0
        else
            log_warning "本土化评估工具运行失败，使用备用检查"
            return 1
        fi
    else
        log_warning "本土化评估工具不存在，使用备用检查"
        return 1
    fi
}

# 备用质量检查
fallback_quality_check() {
    log_info "运行备用质量检查..."
    
    local issues=0
    local warnings=0
    
    # 检查翻译文件完整性
    for file in "$LOCALE_PATH"/*.json; do
        if [ -f "$file" ]; then
            local filename=$(basename "$file")
            log_info "检查文件: $filename"
            
            # 检查文件是否为有效JSON
            if ! jq empty "$file" 2>/dev/null; then
                log_error "文件 $filename 不是有效的JSON"
                ((issues++))
                continue
            fi
            
            # 检查是否包含中文（未翻译的内容）
            if grep -q "[一-龯]" "$file" 2>/dev/null; then
                log_error "文件 $filename 包含未翻译的中文内容"
                ((issues++))
            fi
            
            # 检查空值
            local empty_count=$(jq 'paths | select(.[-1] | type == "string" and . == "") | length' "$file" 2>/dev/null || echo "0")
            if [ "$empty_count" -gt 0 ]; then
                log_warning "文件 $filename 包含 $empty_count 个空值"
                ((warnings++))
            fi
        fi
    done
    
    # 检查术语一致性
    log_info "检查术语一致性..."
    
    # 检查货币术语
    if grep -r "TJS" "$LOCALE_PATH" > /dev/null 2>&1; then
        local tjs_count=$(grep -r "TJS" "$LOCALE_PATH" | wc -l)
        log_warning "发现 $tjs_count 处使用 'TJS'，建议使用 'сомонӣ'"
        ((warnings++))
    fi
    
    if [ $issues -eq 0 ] && [ $warnings -eq 0 ]; then
        log_success "备用质量检查通过"
        return 0
    else
        log_warning "备用质量检查发现问题: $issues 个错误, $warnings 个警告"
        return 1
    fi
}

# 生成快速报告
generate_quick_report() {
    log_info "生成快速质量报告..."
    
    local report_file="reports/tajik-quick-check-$(date +%Y%m%d-%H%M%S).md"
    mkdir -p "$(dirname "$report_file")"
    
    cat > "$report_file" << EOF
# 塔吉克语翻译快速质量检查报告

**检查时间**: $(date)
**检查类型**: 快速质量检查
**阈值设置**: 
- 最低评分: $MINIMUM_SCORE
- 最大缺失键数: $MAX_MISSING_KEYS

## 检查结果

### 文件完整性
EOF

    # 添加文件检查结果
    for file in "$LOCALE_PATH"/*.json; do
        if [ -f "$file" ]; then
            local filename=$(basename "$file")
            local size=$(du -h "$file" | cut -f1)
            local keys=$(jq 'paths | length' "$file" 2>/dev/null || echo "N/A")
            
            echo "- **$filename** (${size}) - ${keys} 个键" >> "$report_file"
        fi
    done
    
    cat >> "$report_file" << EOF

### 质量指标

- **翻译完整性**: $(calculate_completion_rate)%
- **术语一致性**: $(check_terminology_consistency)
- **格式规范性**: $(check_format_standards)

## 建议

1. **优先级1**: 完成所有缺失翻译
2. **优先级2**: 统一术语使用
3. **优先级3**: 优化长句表达

## 详细信息

查看完整评估报告请运行:
\`\`\`bash
npx tsx utils/tajik-localization-evaluator.ts
\`\`\`

---
*此报告由快速检查工具自动生成*
EOF

    log_success "报告已生成: $report_file"
    echo "$report_file"
}

# 计算完成率
calculate_completion_rate() {
    local total_keys=0
    local translated_keys=0
    
    for file in "$LOCALE_PATH"/*.json; do
        if [ -f "$file" ]; then
            local file_keys=$(jq 'paths | length' "$file" 2>/dev/null || echo "0")
            total_keys=$((total_keys + file_keys))
            
            # 估算已翻译的键数（非空且非中文）
            local file_translated=$(jq '[paths | select(.[-1] | type == "string" and . != "" and test("[一-龯]") | not)] | length' "$file" 2>/dev/null || echo "0")
            translated_keys=$((translated_keys + file_translated))
        fi
    done
    
    if [ $total_keys -gt 0 ]; then
        echo $((translated_keys * 100 / total_keys))
    else
        echo "0"
    fi
}

# 检查术语一致性
check_terminology_consistency() {
    local issues=0
    
    # 检查TJS术语
    if grep -r "\"TJS\"" "$LOCALE_PATH" > /dev/null 2>&1; then
        ((issues++))
    fi
    
    # 检查reward术语
    if grep -r "\"reward\"" "$LOCALE_PATH" > /dev/null 2>&1; then
        ((issues++))
    fi
    
    if [ $issues -eq 0 ]; then
        echo "良好"
    else
        echo "需要改进 ($issues 个问题)"
    fi
}

# 检查格式标准
check_format_standards() {
    local issues=0
    
    # 检查日期格式
    if grep -rE '"[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}"' "$LOCALE_PATH" > /dev/null 2>&1; then
        log_warning "发现非标准日期格式，建议使用 dd.mm.yyyy"
        ((issues++))
    fi
    
    if [ $issues -eq 0 ]; then
        echo "符合标准"
    else
        echo "需要调整 ($issues 个问题)"
    fi
}

# 显示结果摘要
show_summary() {
    local completion_rate=$(calculate_completion_rate)
    local status="通过"
    local color="$GREEN"
    
    if [ $completion_rate -lt 90 ]; then
        status="警告"
        color="$YELLOW"
    fi
    
    if [ $completion_rate -lt 70 ]; then
        status="失败"
        color="$RED"
    fi
    
    echo -e "\n${BLUE}════════════════════════════════════════${NC}"
    echo -e "${BLUE}           检查结果摘要                   ${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "翻译完成率: ${completion_rate}%"
    echo -e "质量状态: ${color}${status}${NC}"
    echo -e "检查时间: $(date '+%Y-%m-%d %H:%M:%S')"
    
    if [ "$status" = "通过" ]; then
        log_success "翻译质量检查通过！"
    elif [ "$status" = "警告" ]; then
        log_warning "翻译质量需要改进"
    else
        log_error "翻译质量检查失败！"
    fi
}

# 显示帮助信息
show_help() {
    echo "塔吉克语翻译质量快速检查工具"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help          显示此帮助信息"
    echo "  -v, --verbose       详细输出"
    echo "  -r, --report        生成详细报告"
    echo "  -f, --fix           自动修复可修复的问题"
    echo "  -t, --threshold     设置最低评分阈值 (默认: $MINIMUM_SCORE)"
    echo ""
    echo "示例:"
    echo "  $0                  运行快速检查"
    echo "  $0 --verbose        详细模式"
    echo "  $0 --report         生成报告"
    echo "  $0 --threshold 75   设置阈值为75"
}

# 主函数
main() {
    local verbose=false
    local generate_report=false
    local auto_fix=false
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            -r|--report)
                generate_report=true
                shift
                ;;
            -f|--fix)
                auto_fix=true
                shift
                ;;
            -t|--threshold)
                MINIMUM_SCORE="$2"
                shift 2
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 显示横幅
    show_banner
    
    log_info "开始塔吉克语翻译质量检查..."
    
    # 检查前置条件
    check_prerequisites
    
    # 运行检查
    local evaluation_success=false
    if run_localization_evaluation; then
        evaluation_success=true
    else
        if fallback_quality_check; then
            log_success "备用检查通过"
        else
            log_error "质量检查失败"
            exit 1
        fi
    fi
    
    # 生成报告
    if [ "$generate_report" = true ]; then
        local report_file=$(generate_quick_report)
        log_info "详细报告: $report_file"
    fi
    
    # 显示摘要
    show_summary
    
    # 如果启用自动修复
    if [ "$auto_fix" = true ] && [ -f "utils/tajik-translation-optimizer.ts" ]; then
        log_info "开始自动修复..."
        if npx tsx utils/tajik-translation-optimizer.ts > /dev/null 2>&1; then
            log_success "自动修复完成"
        else
            log_warning "自动修复失败"
        fi
    fi
    
    log_info "检查完成！"
}

# 错误处理
set -e
trap 'log_error "脚本执行失败，行号: $LINENO"' ERR

# 运行主函数
main "$@"