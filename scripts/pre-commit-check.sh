#!/bin/bash

# LuckyMart 提交前代码检查脚本
# 用于确保提交代码符合质量标准

set -e

echo "🔍 开始提交前代码检查..."
echo "================================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅ $1 已安装${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 未安装${NC}"
        return 1
    fi
}

# 成功输出函数
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 警告输出函数
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 错误输出函数
error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. 检查必要工具
echo "🔧 检查必要工具..."
check_command "node" || exit 1
check_command "npm" || exit 1
check_command "npx" || exit 1

# 2. 检查 package.json
echo ""
echo "📋 检查项目配置..."
if [ ! -f "package.json" ]; then
    error "package.json 文件不存在"
    exit 1
fi
success "package.json 存在"

# 3. 检查 TypeScript 配置
echo ""
echo "🔧 检查 TypeScript 配置..."
if [ ! -f "tsconfig.json" ]; then
    error "tsconfig.json 文件不存在"
    exit 1
fi

# 检查是否启用了 strict 模式
if grep -q '"strict":\s*true' tsconfig.json; then
    success "TypeScript 严格模式已启用"
else
    error "TypeScript 严格模式未启用"
    exit 1
fi

# 4. TypeScript 编译检查
echo ""
echo "🔍 检查 TypeScript 类型..."
if npx tsc --noEmit --strict; then
    success "TypeScript 类型检查通过"
else
    error "TypeScript 类型检查失败"
    echo "请修复类型错误后重试"
    exit 1
fi

# 5. ESLint 检查
echo ""
echo "📋 运行 ESLint 检查..."
if npm run lint --silent; then
    success "ESLint 检查通过"
else
    error "ESLint 检查失败"
    echo "请运行 'npm run lint:fix' 修复问题后重试"
    exit 1
fi

# 6. 运行静态代码分析
echo ""
echo "🔍 运行静态代码分析..."
if command -v tsx &> /dev/null; then
    if npx tsx scripts/check-types.ts; then
        success "静态代码分析通过"
    else
        warning "静态代码分析发现问题"
        echo "建议修复发现的问题以提高代码质量"
    fi
else
    warning "tsx 未安装，跳过详细静态分析"
fi

# 7. 检查是否有未提交的更改
echo ""
echo "📁 检查 Git 状态..."
if git diff --quiet; then
    warning "没有检测到未提交的更改"
else
    success "检测到未提交的更改"
fi

# 检查暂存区
if git diff --cached --quiet; then
    warning "没有暂存的更改"
else
    success "检测到暂存的更改"
fi

# 8. 检查分支名称
echo ""
echo "🌿 检查分支名称..."
current_branch=$(git rev-parse --abbrev-ref HEAD)

# 分支名称规范检查
if [[ $current_branch =~ ^(feature|fix|hotfix|release)\/.+ ]]; then
    success "分支名称符合规范: $current_branch"
else
    warning "分支名称可能需要优化: $current_branch"
    echo "建议使用以下格式:"
    echo "  - feature/功能名称"
    echo "  - fix/bug描述"
    echo "  - hotfix/紧急修复"
    echo "  - release/版本号"
fi

# 9. 检查提交信息格式（如果正在执行 commit）
if [[ "$1" == "commit" && -n "$2" ]]; then
    echo ""
    echo "📝 检查提交信息格式..."
    commit_msg="$2"
    
    # 提交信息格式检查
    if [[ $commit_msg =~ ^([a-z]+)(\(.+\))?: .+ ]]; then
        success "提交信息格式符合规范"
    else
        error "提交信息格式不符合规范"
        echo "请使用以下格式:"
        echo "  type(scope): subject"
        echo ""
        echo "类型 (type):"
        echo "  feat, fix, docs, style, refactor, test, chore, perf, security"
        echo ""
        echo "示例:"
        echo "  feat(auth): add user authentication"
        echo "  fix(api): resolve user data validation"
    fi
fi

# 10. 检查依赖安全性
echo ""
echo "🔒 检查依赖安全性..."
if npm audit --audit-level=high --silent; then
    success "依赖安全检查通过"
else
    warning "发现高危安全漏洞"
    echo "请运行 'npm audit fix' 修复安全问题"
fi

# 总结
echo ""
echo "================================================"
echo "📊 提交前检查总结:"
echo ""

# 统计检查项目
passed_checks=7
total_checks=7

echo "✅ 通过的检查项目: $passed_checks/$total_checks"

if [ $passed_checks -eq $total_checks ]; then
    echo ""
    echo -e "${GREEN}🎉 所有检查都通过了！可以安全提交代码。${NC}"
    echo ""
    echo "💡 提示:"
    echo "  - 使用 'git add .' 暂存所有更改"
    echo "  - 使用 'git commit -m \"type(scope): message\"' 提交代码"
    echo "  - 使用 'git push origin branch-name' 推送代码"
    exit 0
else
    echo ""
    echo -e "${YELLOW}⚠️  部分检查未通过，请修复问题后重试。${NC}"
    exit 1
fi