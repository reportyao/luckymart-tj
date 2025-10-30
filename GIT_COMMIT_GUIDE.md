# Git 提交规范指南

## 📋 概述

本指南定义了 LuckyMart 项目的 Git 提交规范，确保提交历史清晰、可读，并便于自动化工具处理。

## 🎯 提交信息格式

### 标准格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 格式说明

- **type** (必需): 提交类型
- **scope** (可选): 影响范围
- **subject** (必需): 简短描述
- **body** (可选): 详细说明
- **footer** (可选): 破坏性变更或关闭 Issue

## 📝 提交类型 (Type)

| 类型 | 描述 | 示例 |
|------|------|------|
| **feat** | 新功能 | `feat(auth): add JWT token validation` |
| **fix** | 修复 bug | `fix(api): resolve user authentication issue` |
| **docs** | 文档更新 | `docs(api): update authentication guide` |
| **style** | 代码格式调整 | `style(components): format button component` |
| **refactor** | 代码重构 | `refactor(auth): simplify token validation logic` |
| **test** | 测试相关 | `test(auth): add unit tests for login API` |
| **chore** | 构建工具或辅助工具 | `chore(deps): update React to v18` |
| **perf** | 性能优化 | `perf(cache): optimize Redis connection pooling` |
| **security** | 安全相关修复 | `security(api): fix SQL injection vulnerability` |
| **build** | 构建系统或外部依赖 | `build(config): update Webpack configuration` |
| **ci** | CI 配置和脚本 | `ci(github): add automated testing workflow` |
| **revert** | 撤销之前的提交 | `revert: feat(auth): add JWT token validation` |

## 🎯 影响范围 (Scope)

影响范围应该是提交修改的主要模块：

### 前端相关
- **ui**: 用户界面组件
- **components**: React 组件
- **pages**: 页面文件
- **styles**: CSS/样式文件
- **routing**: 路由配置

### 后端相关
- **api**: API 路由
- **auth**: 认证系统
- **db**: 数据库相关
- **cache**: 缓存系统
- **middleware**: 中间件

### 通用相关
- **config**: 配置文件
- **deps**: 依赖包
- **docs**: 文档
- **tests**: 测试文件
- **scripts**: 构建脚本

## 📖 提交信息示例

### 新功能

```
feat(auth): add user registration API endpoint

- Implement user registration with email validation
- Add password strength requirements  
- Include rate limiting for registration attempts
- Add comprehensive error handling

Closes #123
```

### Bug 修复

```
fix(api): resolve user authentication timeout issue

The authentication middleware was not properly handling
token expiration, causing intermittent 401 errors.

This fix:
- Adds proper token refresh logic
- Implements graceful token renewal
- Updates error handling for timeout scenarios

Fixes #456
```

### 安全修复

```
security(api): fix SQL injection vulnerability in user search

- Parameterize all database queries in the user search endpoint
- Add input sanitization for search parameters
- Implement parameterized queries for all user-related operations

CVE-2024-xxxx
```

### 性能优化

```
perf(cache): optimize Redis connection pooling

- Implement connection pooling with 10 connections
- Add connection health monitoring
- Reduce connection establishment overhead by 40%

Benchmark results:
- Response time: 120ms -> 72ms (-40%)
- Memory usage: 45MB -> 38MB (-15%)
```

### 重构

```
refactor(auth): simplify token validation logic

Extract token validation into a separate utility function
to improve code reusability and testability.

Breaking Changes:
- Remove deprecated `validateTokenSync()` method
- Update `validateToken()` to be async only
```

### 文档更新

```
docs(api): update authentication endpoint documentation

- Add request/response examples
- Include error code reference
- Update rate limiting information
- Add security best practices

Related to #789
```

### 测试相关

```
test(auth): add comprehensive unit tests for login API

Test coverage includes:
- Valid user login
- Invalid credentials
- Rate limiting
- Account lockout
- Token generation

Coverage: 95% (was 78%)
```

### 构建工具

```
chore(deps): update TypeScript to v5.6

Benefits:
- Improved type inference
- Better error messages
- Enhanced IDE support

Migration notes:
- Remove deprecated `--skipLibCheck` option
- Update strict mode configurations
```

## 🚫 不好的提交信息示例

### ❌ 避免的格式

```
# 太简短
fix bug

# 没有类型标识
user authentication not working

# 使用过去时
fixed user authentication

# 太详细
fix the issue where the user authentication middleware wasn't working properly because the token validation logic was incorrect and the error handling was not implemented correctly

# 包含无关信息
fix auth issue (also fixed printer, updated docs, bought coffee)
```

### ✅ 推荐的格式

```
fix(auth): resolve token validation timeout

feat(api): add user profile endpoint

docs(readme): add installation instructions

perf(cache): optimize query performance
```

## 🔍 提交前检查清单

在提交代码前，请检查：

- [ ] 提交信息符合规范格式
- [ ] TypeScript 编译检查通过 (`npm run type-check`)
- [ ] ESLint 检查通过 (`npm run lint`)
- [ ] 静态代码分析通过 (`npm run static-analysis`)
- [ ] 所有测试通过 (`npm test`)
- [ ] 代码审查通过
- [ ] 分支已更新到最新 (`git pull origin main`)
- [ ] 没有合并冲突

## 🛠️ 工具配置

### ESLint 提交信息检查

在 `.eslintrc.js` 中配置：

```javascript
module.exports = {
  rules: {
    'commit-msg/commit-msg': [2, 'always', /^(feat|fix|docs|style|refactor|test|chore|perf|security)(\(.+\))?: .{1,50}/],
  },
};
```

### Husky Git Hooks

使用 Husky 设置提交前检查：

```bash
# 安装 Husky
npm install --save-dev husky

# 初始化
npx husky install

# 添加 pre-commit hook
npx husky add .husky/pre-commit "npm run pre-commit"

# 添加 commit-msg hook
npx husky add .husky/commit-msg 'npx commitlint --edit $1'
```

### commitlint 配置

创建 `.commitlintrc.js`：

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf', 'security']
    ],
    'scope-enum': [
      2,
      'always',
      ['ui', 'api', 'auth', 'db', 'cache', 'docs', 'config', 'deps', 'tests']
    ],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'subject-max-length': [2, 'always', 50],
    'body-max-line-length': [2, 'always', 100]
  }
};
```

## 📊 自动化集成

### 语义化版本控制

使用提交类型自动生成版本号：

```javascript
// semantic-release 配置 (.releaserc)
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/git"
  ]
}
```

### 变更日志生成

提交规范使自动化生成变更日志成为可能：

```bash
# 生成变更日志
npx conventional-changelog -p conventionalcommits -i CHANGELOG.md -s
```

### 自动发布

根据提交类型自动决定版本发布：

- **feat**: minor 版本更新
- **fix**: patch 版本更新  
- **perf**: patch 版本更新
- **security**: patch 版本更新
- **BREAKING CHANGE**: major 版本更新

## 🎯 最佳实践

### 1. 原子性提交
每次提交应该只包含一个逻辑变更。如果需要修改多个模块，创建多个提交。

### 2. 清晰的主题行
- 使用现在时 ("add feature" 而不是 "added feature")
- 避免无关信息
- 保持简短但描述性强

### 3. 详细的正文
- 解释 **为什么** 而不仅仅是 **什么**
- 包含变更的影响
- 提供使用示例（如适用）

### 4. 适当的提交频率
- 不要过于频繁（每行代码一个提交）
- 不要过于稀少（一个月一个提交）
- 保持逻辑完整性

### 5. 代码审查配合
- 提交信息应该支持代码审查
- 提供足够的上下文信息
- 引用相关的 Issue 或 PR

## 📚 相关资源

- [Conventional Commits 规范](https://www.conventionalcommits.org/)
- [Gitmoji](https://gitmoji.dev/) - 表情符号参考
- [语义化版本控制](https://semver.org/)
- [Angular 提交规范](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)

---

**维护者**: LuckyMart 开发团队  
**更新日期**: 2024-10-31  
**版本**: v1.0.0