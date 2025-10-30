# LuckyMart 静态代码分析和 TypeScript 严格模式配置

## 📋 概述

本文档描述了项目的静态代码分析配置、TypeScript 严格模式设置以及代码规范要求。

## 🔧 TypeScript 严格模式配置

### 已启用的严格模式选项

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false,
    "exactOptionalPropertyTypes": true,
    "noErrorTruncation": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 严格模式说明

- **strict**: 启用所有严格类型检查选项
- **noImplicitAny**: 禁止隐式 any 类型
- **strictNullChecks**: 严格的 null 检查
- **strictFunctionTypes**: 严格的函数类型检查
- **strictBindCallApply**: 严格的 bind/call/apply 检查
- **strictPropertyInitialization**: 严格的属性初始化检查
- **noImplicitThis**: 禁止隐式 this
- **noImplicitReturns**: 函数必须显式返回
- **noFallthroughCasesInSwitch**: switch 语句必须包含 break
- **noUncheckedIndexedAccess**: 未检查的索引访问
- **noImplicitOverride**: 禁止隐式覆盖
- **allowUnusedLabels**: 不允许未使用的标签
- **allowUnreachableCode**: 不允许不可达代码
- **exactOptionalPropertyTypes**: 精确的可选属性类型
- **noErrorTruncation**: 不截断错误信息
- **forceConsistentCasingInFileNames**: 文件名大小写一致

## 📋 ESLint 规则配置

### TypeScript 特定规则

```javascript
{
  rules: {
    // TypeScript 严格规则
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/prefer-const': 'error',
    '@typescript-eslint/no-inferrable-types': 'error',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'warn'
  }
}
```

### 通用代码质量规则

```javascript
{
  rules: {
    'no-console': 'warn',
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    'template-curly-spacing': 'error',
    'arrow-spacing': 'error',
    'comma-dangle': 'error',
    'comma-spacing': 'error',
    'comma-style': 'error',
    'computed-property-spacing': 'error',
    'func-call-spacing': 'error',
    'indent': ['error', 2],
    'key-spacing': 'error',
    'keyword-spacing': 'error',
    'max-len': ['warn', { 'code': 120 }],
    'no-multiple-empty-lines': 'error',
    'no-trailing-spaces': 'error',
    'object-curly-spacing': 'error',
    'quotes': ['error', 'single'],
    'semi': 'error',
    'space-before-blocks': 'error',
    'space-in-parens': 'error',
    'space-infix-ops': 'error'
  }
}
```

## 🔒 安全检查规则

### 自动检测的安全问题

1. **Console 语句检查**
   - 生产代码中禁止使用 console.log
   - 建议使用适当的日志记录器

2. **XSS 风险检查**
   - 检测 innerHTML 赋值
   - 建议使用安全的 DOM 操作方法

3. **代码注入风险**
   - 检测 eval() 使用
   - 警告动态代码执行风险

4. **环境变量安全**
   - 检查 process.env 直接访问
   - 建议使用环境变量管理工具

5. **硬编码敏感信息**
   - 检测密码、密钥硬编码
   - 建议使用环境变量或密钥管理服务

6. **SQL 注入风险**
   - 检测动态 SQL 构建
   - 建议使用参数化查询

## 📊 代码质量标准

### 文件和组织标准

- **文件长度**: 单个文件不超过 500 行
- **函数长度**: 单个函数不超过 50 行
- **函数复杂度**: 嵌套层级不超过 4 层
- **参数数量**: 函数参数不超过 5 个

### 代码注释要求

- **TODO/FIXME**: 必须及时处理，不得积压
- **公共API**: 必须有 JSDoc 注释
- **复杂逻辑**: 必须有注释说明

### 类型安全要求

- **禁止使用**: any 类型（除非绝对必要）
- **类型推断**: 优先使用类型推断
- **接口定义**: 优先使用接口而非类型别名
- **null 检查**: 始终进行 null/undefined 检查

## 🚀 运行静态分析

### 检查所有内容

```bash
# 运行完整的静态分析
npm run static-analysis

# 或直接运行脚本
npx tsx scripts/check-types.ts
```

### 分类检查

```bash
# 仅检查 TypeScript 类型
npm run type-check

# 仅运行 ESLint
npm run lint

# 仅检查代码安全
npm run security-check

# 仅检查代码质量
npm run quality-check
```

### 持续集成检查

在 CI/CD 流水线中运行：

```bash
npm run type-check && npm run security-check
```

## 📝 提交规范

### Git 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 提交类型 (type)

- **feat**: 新功能
- **fix**: 修复 bug
- **docs**: 文档更新
- **style**: 代码格式调整
- **refactor**: 代码重构
- **test**: 测试相关
- **chore**: 构建工具或辅助工具
- **perf**: 性能优化
- **security**: 安全相关修复

### 提交示例

```bash
# 新功能
feat(auth): add JWT token validation

# 修复 bug
fix(api): resolve user authentication issue

# 安全修复
security(api): fix SQL injection vulnerability

# 性能优化
perf(cache): optimize Redis connection pooling

# 重构
refactor(types): improve TypeScript strict mode compliance
```

### 提交前检查

```bash
#!/bin/bash
# pre-commit-check.sh

echo "🔍 运行提交前检查..."

# TypeScript 编译检查
echo "检查 TypeScript 类型..."
npx tsc --noEmit --strict

if [ $? -ne 0 ]; then
    echo "❌ TypeScript 类型检查失败"
    exit 1
fi

# ESLint 检查
echo "运行 ESLint..."
npm run lint

if [ $? -ne 0 ]; then
    echo "❌ ESLint 检查失败"
    exit 1
fi

# 运行静态分析
echo "运行静态代码分析..."
npx tsx scripts/check-types.ts

if [ $? -ne 0 ]; then
    echo "❌ 静态分析发现问题"
    exit 1
fi

echo "✅ 所有检查通过，可以提交代码"
```

## 🛠️ 工具配置

### package.json 脚本

```json
{
  "scripts": {
    "type-check": "tsc --noEmit --strict",
    "lint": "eslint --ext .ts,.tsx,.js,.jsx .",
    "lint:fix": "eslint --ext .ts,.tsx,.js,.jsx . --fix",
    "security-check": "tsx scripts/check-types.ts security",
    "quality-check": "tsx scripts/check-types.ts quality",
    "static-analysis": "tsx scripts/check-types.ts static",
    "pre-commit": "bash scripts/pre-commit-check.sh"
  }
}
```

### Git Hooks 配置

使用 Husky 设置 Git hooks：

```bash
# 安装 Husky
npm install --save-dev husky

# 初始化 Husky
npx husky install

# 添加 pre-commit hook
npx husky add .husky/pre-commit "npm run pre-commit"
```

## 📈 分析报告

### 报告内容

静态分析报告会包含：

1. **TypeScript 类型检查结果**
2. **ESLint 规则违规**
3. **安全问题清单**
4. **代码质量指标**
5. **性能建议**

### 报告示例

```
📊 静态代码分析报告
==================================================

🔧 TypeScript 类型检查:
✅ 所有 TypeScript 类型检查通过

📁 分析了 45 个文件:
⚠️  lib/auth.ts: 函数参数过多 (6 个)，建议重构
🔒 app/api/auth.ts: 发现 console.log 语句

📈 总结:
- TypeScript 类型错误: 0
- 代码质量警告: 3
- 安全问题: 1
- 分析文件总数: 45

🎉 恭喜！代码通过了所有静态检查！
```

## 🔄 持续改进

### 定期审查

- **每月**: 审查和更新静态分析规则
- **每季度**: 评估工具性能和准确性
- **每年**: 升级 TypeScript 和 ESLint 版本

### 规则调整

根据项目需求，可以调整：

1. **严格程度**: 放宽或收紧某些规则
2. **新增规则**: 添加项目特定的安全或质量规则
3. **工具集成**: 集成额外的静态分析工具

## 📚 参考资源

- [TypeScript 严格模式文档](https://www.typescriptlang.org/tsconfig#strict)
- [ESLint 规则参考](https://eslint.org/docs/rules/)
- [静态代码分析最佳实践](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)

---

**维护者**: LuckyMart 开发团队  
**更新日期**: 2024-10-31  
**版本**: v1.0.0