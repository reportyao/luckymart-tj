# LuckyMart-TJ 预提交钩子系统使用指南

## 📋 概述

LuckyMart-TJ 预提交钩子系统是一个全面的代码质量保障工具，旨在防止结构性错误和不规范的代码提交到版本控制系统。系统会自动检测并阻止包含语法错误、代码质量问题、安全漏洞等的提交，确保代码库的高质量。

## ✨ 主要功能

### 🔍 核心检查功能

1. **TypeScript 语法错误检查**
   - 类型检查
   - 语法验证
   - 严格模式检查
   - 编译错误检测

2. **ESLint 代码质量检查**
   - 代码规范检查
   - 最佳实践验证
   - 代码复杂度检测
   - 重复代码检测

3. **常见语法错误模式检查**
   - 遗留的 `console.log`
   - `debugger` 语句检查
   - TODO/FIXME 注释检查
   - 未处理的 Promise 检查

4. **箭头函数格式检查**
   - 格式一致性验证
   - 不必要的圆括号检查
   - 返回类型检查

5. **重复导出检查**
   - 命名导出重复检查
   - 默认导出唯一性检查
   - 导出一致性验证

6. **安全检查**
   - 硬编码凭证检测
   - SQL 注入风险检查
   - XSS 漏洞检查
   - 危险的 API 使用检测

### 🛡️ 安全保障

- **自动阻止错误提交**: 发现严重问题时自动阻止提交
- **清晰错误报告**: 提供详细的错误信息和修复建议
- **跳过机制**: 支持紧急情况下的跳过选项
- **Git 工作流集成**: 无缝集成到 Git 提交流程

## 🚀 快速开始

### 1. 安装预提交钩子系统

```bash
# 进入项目根目录
cd luckymart-tj

# 运行安装脚本
bash scripts/install-pre-commit.sh
```

安装完成后，系统将自动配置 Git 预提交钩子。

### 2. 基本使用

#### 正常提交流程

```bash
# 1. 正常编写代码
git add .

# 2. 提交代码（自动触发检查）
git commit -m "feat: add new feature"

# 3. 如果检查通过，提交成功
# 如果检查失败，查看错误并修复后重试
```

#### 手动运行检查

```bash
# 运行所有检查
bash scripts/pre-commit-check.sh

# 检查特定文件
bash scripts/pre-commit-check.sh --files "src/components/*.tsx"

# 详细输出模式
bash scripts/pre-commit-check.sh --verbose

# 自动修复模式
bash scripts/pre-commit-check.sh --fix
```

### 3. 跳过检查（谨慎使用）

#### 方法一：创建跳过文件

```bash
# 创建跳过文件
touch .skip-pre-commit

# 完成提交后删除文件
rm .skip-pre-commit
```

#### 方法二：使用 --no-verify

```bash
git commit --no-verify -m "emergency fix"
```

#### 方法三：在提交信息中添加标记

```bash
git commit -m "fix: critical bug [skip-checks]"
```

#### 方法四：设置环境变量

```bash
SKIP_PRE_COMMIT=true git commit -m "fix: urgent patch"
```

## 📁 文件结构

```
luckymart-tj/
├── scripts/
│   ├── pre-commit-check.sh          # 主检查脚本
│   ├── install-pre-commit.sh        # 安装脚本
│   └── pre-commit-utils/            # 工具脚本
│       ├── quick-fix.sh             # 快速修复
│       └── stats.sh                 # 统计信息
├── .pre-commit-config.json          # 配置文件
├── .skip-pre-commit.template        # 跳过文件模板
└── .git/hooks/
    └── pre-commit                   # Git 钩子文件
```

## ⚙️ 配置说明

### 配置文件位置

主配置文件: `.pre-commit-config.json`

### 主要配置项

#### 检查开关

```json
{
  "checks": {
    "typescript": { "enabled": true, "strict": true },
    "eslint": { "enabled": true, "autoFix": false },
    "security": { "enabled": true },
    "format": { "enabled": true },
    "git": { "enabled": true },
    "dependencies": { "enabled": true }
  }
}
```

#### 文件模式

```json
{
  "filePatterns": {
    "include": ["**/*.{ts,tsx,js,jsx}"],
    "exclude": ["node_modules/**", ".next/**", "dist/**"]
  }
}
```

#### 自动修复

```json
{
  "autoFix": {
    "enabled": true,
    "commands": [
      "npm run lint:fix",
      "npm run format:fix"
    ]
  }
}
```

## 🔧 工具和命令

### 快速修复工具

```bash
# 运行快速修复
bash scripts/pre-commit-utils/quick-fix.sh

# 修复内容：
# - ESLint 问题自动修复
# - 代码格式自动修复
# - TypeScript 类型检查
```

### 统计信息工具

```bash
# 查看代码质量统计
bash scripts/pre-commit-utils/stats.sh

# 统计内容：
# - 文件数量统计
# - 代码行数统计
# - 依赖统计
# - 规则统计
```

### 手动检查命令

```bash
# TypeScript 类型检查
npm run type-check

# ESLint 检查
npm run lint

# 格式化检查
npm run format:check

# 安全审计
npm audit

# 综合质量检查
npm run quality:full
```

## 📊 检查类型详解

### 1. TypeScript 语法错误

**检查内容:**
- 语法错误
- 类型错误
- 未使用的变量
- 缺少返回类型

**错误示例:**
```typescript
// ❌ 错误
const user = { name: 'John' };
console.log(user.age); // 类型错误

// ✅ 正确
const user: User = { name: 'John' };
```

### 2. ESLint 代码质量

**检查内容:**
- 代码规范
- 最佳实践
- 代码复杂度
- 重复代码

**错误示例:**
```typescript
// ❌ 错误
var name = 'John'; // 使用了 var
function getData() { return fetch('/api'); } // 缺少错误处理

// ✅ 正确
const name = 'John'; // 使用 const
async function getData() {
  try {
    return await fetch('/api');
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

### 3. 箭头函数格式

**检查内容:**
- 格式一致性
- 不必要的圆括号
- 返回类型

**错误示例:**
```typescript
// ❌ 错误
const add = (a, b) => { return a + b; }; // 不必要的花括号
const greet = (name) => { console.log(name); }; // 可以简化

// ✅ 正确
const add = (a, b) => a + b; // 简洁格式
const greet = name => console.log(name); // 单参数可省略圆括号
```

### 4. 重复导出检查

**检查内容:**
- 命名导出重复
- 默认导出数量
- 导出一致性

**错误示例:**
```typescript
// ❌ 错误
export const name = 'John';
export const name = 'Jane'; // 重复导出

// ✅ 正确
export const firstName = 'John';
export const lastName = 'Jane';
```

### 5. 安全检查

**检查内容:**
- 硬编码凭证
- SQL 注入
- XSS 漏洞
- 危险 API

**错误示例:**
```typescript
// ❌ 错误
const apiKey = 'sk-1234567890abcdef'; // 硬编码密钥
const query = `SELECT * FROM users WHERE id = ${userId}`; // SQL 注入风险
element.innerHTML = userInput; // XSS 风险

// ✅ 正确
const apiKey = process.env.API_KEY; // 使用环境变量
const query = 'SELECT * FROM users WHERE id = ?'; // 参数化查询
element.textContent = userInput; // 安全设置文本
```

## 🚨 错误处理

### 常见错误及解决方案

#### TypeScript 类型错误

```bash
❌ TypeScript 类型检查失败

解决步骤:
1. 查看具体错误信息
2. 修复类型定义
3. 运行 npm run type-check 验证
4. 重新提交
```

#### ESLint 错误

```bash
❌ ESLint 代码质量检查失败

解决步骤:
1. 运行 npm run lint:fix 自动修复
2. 手动修复剩余问题
3. 运行 npm run lint 验证
4. 重新提交
```

#### 安全错误

```bash
❌ 发现安全漏洞

解决步骤:
1. 检查硬编码的敏感信息
2. 使用环境变量替代
3. 修复 SQL 注入风险
4. 使用安全的 API
5. 重新提交
```

#### 格式化错误

```bash
⚠️ 代码格式不符合规范

解决步骤:
1. 运行 npm run format:fix 自动格式化
2. 检查 Arrow 函数格式
3. 运行 npm run format:check 验证
4. 重新提交
```

## 🎯 最佳实践

### 1. 开发流程

```bash
# 1. 开始开发前
git pull origin main

# 2. 开发过程中
git add .
bash scripts/pre-commit-check.sh --files "修改的文件"

# 3. 提交前最终检查
git commit -m "feat: description"

# 4. 推送前检查
git push origin feature-branch
```

### 2. 团队协作

```bash
# 团队成员都应安装预提交钩子
bash scripts/install-pre-commit.sh

# 设置统一的代码规范
# 在 .eslintrc.json 和 tsconfig.json 中配置

# 使用分支策略
git checkout -b feature/new-feature
# 开发完成后通过检查才能合并
```

### 3. 配置管理

```bash
# 团队统一配置文件
# 将 .pre-commit-config.json 加入版本控制

# 个人自定义
# 可在本地创建 .pre-commit-config.local.json
```

### 4. 性能优化

```bash
# 只检查修改的文件
bash scripts/pre-commit-check.sh --files "src/components/*.tsx"

# 使用并行检查
# 在配置文件中启用 parallel: true

# 设置超时时间
# 在配置文件中设置合理的 timeout 值
```

## 📈 报告和统计

### 自动生成报告

每次检查后会生成详细报告，包含：
- 检查项目统计
- 错误和警告数量
- 检查耗时
- 建议的修复方案

### 报告文件位置

```bash
pre-commit-report-YYYYMMDD-HHMMSS.log
```

### 统计信息

使用统计工具查看项目代码质量：

```bash
bash scripts/pre-commit-utils/stats.sh
```

## 🔄 升级和维护

### 更新预提交钩子系统

```bash
# 重新运行安装脚本（会覆盖现有配置）
bash scripts/install-pre-commit.sh

# 或手动更新脚本
git pull origin main
chmod +x scripts/pre-commit-check.sh
chmod +x scripts/install-pre-commit.sh
```

### 清理临时文件

```bash
# 清理预提交报告文件
rm -f pre-commit-report-*.log

# 清理检查缓存
rm -rf .pre-commit-cache/

# 重新安装（如需要）
bash scripts/install-pre-commit.sh --force
```

## 🆘 故障排除

### 常见问题

#### 1. 钩子不执行

```bash
# 检查钩子文件是否存在
ls -la .git/hooks/pre-commit

# 检查文件权限
chmod +x .git/hooks/pre-commit

# 重新安装
bash scripts/install-pre-commit.sh
```

#### 2. 脚本执行失败

```bash
# 检查脚本权限
ls -la scripts/pre-commit-check.sh

# 手动运行查看错误
bash -x scripts/pre-commit-check.sh
```

#### 3. 配置问题

```bash
# 验证配置文件格式
jq . .pre-commit-config.json

# 恢复默认配置
cp .pre-commit-config.json.example .pre-commit-config.json
```

#### 4. 性能问题

```bash
# 限制检查文件数量
# 在配置文件中设置 maxFilesPerCheck

# 跳过某些检查
bash scripts/pre-commit-check.sh --skip-patterns typescript,security
```

## 📞 支持和反馈

### 获取帮助

```bash
# 查看帮助信息
bash scripts/pre-commit-check.sh --help

# 查看工具脚本帮助
bash scripts/pre-commit-utils/quick-fix.sh --help
```

### 问题反馈

如果遇到问题或有改进建议，请：
1. 检查配置文件是否正确
2. 查看详细日志输出
3. 参考故障排除部分
4. 联系开发团队

---

## 📝 更新日志

### v2.0.0 (当前版本)
- ✅ 全新的预提交钩子系统
- ✅ 支持多种检查模式
- ✅ 智能跳过机制
- ✅ 自动修复功能
- ✅ 详细错误报告
- ✅ 工具脚本支持
- ✅ 配置化管理

### v1.0.0 (基础版本)
- 基础的 TypeScript 和 ESLint 检查
- 简单的 Git 钩子集成
- 基础的错误报告

---

🎉 **恭喜！您现在可以在 LuckyMart-TJ 项目中使用完整的预提交钩子系统了！**

系统将帮助您维护高质量的代码标准，防止错误和不规范的代码进入版本控制系统。