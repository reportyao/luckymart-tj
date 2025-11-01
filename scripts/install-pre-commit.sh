#!/bin/bash

# LuckyMart-TJ 预提交钩子安装脚本
# 版本: 1.0.0
# 描述: 自动安装和配置 Git 预提交钩子

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 脚本目录和项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
GIT_HOOKS_DIR="$PROJECT_ROOT/.git/hooks"
PRE_COMMIT_HOOK="$GIT_HOOKS_DIR/pre-commit"
BACKUP_HOOK="$GIT_HOOKS_DIR/pre-commit.backup.$(date +%Y%m%d-%H%M%S)"

echo -e "${BLUE}🔧 LuckyMart-TJ 预提交钩子安装程序${NC}"
echo "================================================"

# 检查是否在 Git 仓库中
if [[ ! -d "$PROJECT_ROOT/.git" ]]; then
    echo -e "${RED}❌ 错误: 当前目录不是 Git 仓库${NC}"
    echo "请在项目根目录运行此脚本"
    exit 1
fi

# 检查预提交检查脚本是否存在
if [[ ! -f "$SCRIPT_DIR/pre-commit-check.sh" ]]; then
    echo -e "${RED}❌ 错误: 预提交检查脚本不存在${NC}"
    echo "请确保 scripts/pre-commit-check.sh 文件存在"
    exit 1
fi

# 备份现有的 pre-commit 钩子
if [[ -f "$PRE_COMMIT_HOOK" ]]; then
    echo -e "${YELLOW}⚠️  发现现有的 pre-commit 钩子，正在备份...${NC}"
    cp "$PRE_COMMIT_HOOK" "$BACKUP_HOOK"
    echo -e "${GREEN}✅ 已备份至: $BACKUP_HOOK${NC}"
fi

# 创建 hooks 目录（如果不存在）
mkdir -p "$GIT_HOOKS_DIR"

# 创建 pre-commit 钩子脚本
cat > "$PRE_COMMIT_HOOK" << 'EOF'
#!/bin/bash

# LuckyMart-TJ Git Pre-commit Hook
# 自动调用预提交检查脚本

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"

# 设置工作目录为项目根目录
cd "$SCRIPT_DIR"

# 检查是否应该跳过检查
SKIP_ENV="${SKIP_PRE_COMMIT:-false}"
SKIP_FILE=".skip-pre-commit"

if [[ "$SKIP_ENV" == "true" ]] || [[ -f "$SKIP_FILE" ]]; then
    echo "⏭️  跳过预提交检查 (检测到跳过标记)"
    exit 0
fi

# 获取提交信息
COMMIT_MSG_FILE="${1:-}"
COMMIT_MSG=""

if [[ -n "$COMMIT_MSG_FILE" ]] && [[ -f "$COMMIT_MSG_FILE" ]]; then
    COMMIT_MSG=$(head -n 1 "$COMMIT_MSG_FILE")
fi

# 运行预提交检查
if bash "scripts/pre-commit-check.sh" "$COMMIT_MSG"; then
    echo "✅ 预提交检查通过，允许提交"
    exit 0
else
    echo "❌ 预提交检查失败，阻止提交"
    echo ""
    echo "💡 解决方式:"
    echo "  1. 修复所有错误后重新提交"
    echo "  2. 使用 'git commit --no-verify' 强制跳过检查"
    echo "  3. 在提交信息中添加 [skip-checks] 标记"
    exit 1
fi
EOF

# 设置执行权限
chmod +x "$PRE_COMMIT_HOOK"
chmod +x "$SCRIPT_DIR/pre-commit-check.sh"

echo -e "${GREEN}✅ 预提交钩子安装完成${NC}"

# 创建配置文件
create_config_file() {
    local config_file="$PROJECT_ROOT/.pre-commit-config.json"
    
    if [[ ! -f "$config_file" ]]; then
        cat > "$config_file" << 'EOF'
{
  "version": "2.0.0",
  "description": "LuckyMart-TJ 预提交钩子配置文件",
  "checks": {
    "typescript": {
      "enabled": true,
      "strict": true,
      "autoFix": false
    },
    "eslint": {
      "enabled": true,
      "autoFix": false,
      "rules": {
        "maxComplexity": 10,
        "maxLineLength": 120
      }
    },
    "security": {
      "enabled": true,
      "checkHardcodedSecrets": true,
      "checkSQLInjection": true,
      "checkXSS": true
    },
    "format": {
      "enabled": true,
      "checkArrowFunctions": true,
      "checkDuplicateExports": true,
      "checkConsoleLogs": "warning"
    },
    "git": {
      "enabled": true,
      "checkBranchNaming": true,
      "checkRemoteSync": true
    }
  },
  "skipPatterns": [],
  "filePatterns": {
    "include": ["**/*.{ts,tsx,js,jsx}"],
    "exclude": [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "coverage/**",
      "build/**",
      "*.min.js",
      "*.min.css"
    ]
  },
  "autoFix": {
    "enabled": false,
    "commands": [
      "npm run lint:fix",
      "npm run format:fix"
    ]
  },
  "notifications": {
    "enabled": true,
    "onSuccess": true,
    "onFailure": true
  }
}
EOF
        echo -e "${GREEN}✅ 创建配置文件: $config_file${NC}"
    else
        echo -e "${YELLOW}⚠️  配置文件已存在: $config_file${NC}"
    fi
}

# 创建跳过文件模板
create_skip_file_template() {
    local skip_file="$PROJECT_ROOT/.skip-pre-commit.template"
    
    if [[ ! -f "$skip_file" ]]; then
        cat > "$skip_file" << 'EOF'
# 预提交钩子跳过标记文件
# 
# 此文件用于临时跳过预提交检查
# 
# 使用方法:
# 1. 复制此文件为 .skip-pre-commit
# 2. 提交代码
# 3. 提交完成后删除 .skip-pre-commit 文件
#
# 或者在提交信息中添加 [skip-checks] 标记
# 或者设置环境变量 SKIP_PRE_COMMIT=true
#
# 警告: 跳过检查可能导致低质量代码提交到仓库
# 请谨慎使用此功能
EOF
        echo -e "${GREEN}✅ 创建跳过文件模板: $skip_file${NC}"
    fi
}

# 创建工具脚本
create_utility_scripts() {
    local utils_dir="$PROJECT_ROOT/scripts/pre-commit-utils"
    mkdir -p "$utils_dir"
    
    # 快速修复脚本
    cat > "$utils_dir/quick-fix.sh" << 'EOF'
#!/bin/bash
# 快速修复常见问题

echo "🔧 运行快速修复..."

# 修复 ESLint 问题
echo "📋 修复 ESLint 问题..."
npm run lint:fix

# 修复格式化问题
echo "🎨 修复代码格式..."
npm run format:fix

# 修复 TypeScript 类型问题
echo "📝 检查 TypeScript 类型..."
npm run type-check

echo "✅ 快速修复完成！"
echo "请重新运行预提交检查确认修复结果"
EOF
    chmod +x "$utils_dir/quick-fix.sh"
    
    # 检查统计脚本
    cat > "$utils_dir/stats.sh" << 'EOF'
#!/bin/bash
# 代码质量统计

echo "📊 代码质量统计报告"
echo "===================="

echo ""
echo "📁 文件统计:"
echo "TypeScript 文件: $(find . -name "*.ts" -o -name "*.tsx" | wc -l) 个"
echo "JavaScript 文件: $(find . -name "*.js" -o -name "*.jsx" | wc -l) 个"

echo ""
echo "📏 代码行数:"
echo "TypeScript 总行数: $(find . -name "*.ts" -o -name "*.tsx" | xargs wc -l | tail -1 | awk '{print $1}') 行"

echo ""
echo "🔧 依赖统计:"
echo "生产依赖: $(grep -c '"[^"]*":' package.json | head -1) 个"
echo "开发依赖: $(grep -c '"[^"]*":' package.json | tail -1) 个"

echo ""
echo "🎯 ESLint 规则:"
echo "当前规则数: $(grep -c '"[^"]*":' .eslintrc.json) 个"

echo ""
echo "✅ 统计完成！"
EOF
    chmod +x "$utils_dir/stats.sh"
    
    echo -e "${GREEN}✅ 创建工具脚本: $utils_dir/${NC}"
}

# 执行配置创建
echo ""
echo -e "${BLUE}📝 创建配置文件...${NC}"
create_config_file
create_skip_file_template
create_utility_scripts

# 显示安装结果
echo ""
echo -e "${GREEN}🎉 预提交钩子安装完成！${NC}"
echo "================================================"
echo ""
echo -e "${BLUE}📋 安装摘要:${NC}"
echo "✅ Git 预提交钩子已配置"
echo "✅ 脚本权限已设置"
echo "✅ 配置文件已创建"
echo "✅ 工具脚本已创建"
echo ""
echo -e "${BLUE}🚀 使用方法:${NC}"
echo "1. 正常提交时自动运行检查"
echo "2. 手动运行: ./scripts/pre-commit-check.sh"
echo "3. 快速修复: ./scripts/pre-commit-utils/quick-fix.sh"
echo "4. 查看统计: ./scripts/pre-commit-utils/stats.sh"
echo ""
echo -e "${BLUE}⚡ 跳过检查 (谨慎使用):${NC}"
echo "1. 创建 .skip-pre-commit 文件"
echo "2. 使用 git commit --no-verify"
echo "3. 提交信息中添加 [skip-checks]"
echo "4. 设置环境变量 SKIP_PRE_COMMIT=true"
echo ""
echo -e "${YELLOW}🔍 配置文件位置:${NC}"
echo "主配置: $PROJECT_ROOT/.pre-commit-config.json"
echo "跳过文件: $PROJECT_ROOT/.skip-pre-commit.template"
echo "工具目录: $PROJECT_ROOT/scripts/pre-commit-utils/"
echo ""
if [[ -f "$BACKUP_HOOK" ]]; then
    echo -e "${YELLOW}📁 原钩子备份:${NC}"
    echo "备份位置: $BACKUP_HOOK"
    echo ""
fi

echo -e "${GREEN}✨ 安装成功！开始享受自动代码质量检查吧！${NC}"