# 贡献指南

感谢您对LuckyMart-TJ项目的兴趣！我们欢迎各种形式的贡献，包括但不限于代码贡献、文档改进、问题报告、功能建议等。

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发环境设置](#开发环境设置)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [Pull Request流程](#pull-request流程)
- [问题报告](#问题报告)
- [功能请求](#功能请求)
- [代码审查](#代码审查)
- [测试指南](#测试指南)
- [文档贡献](#文档贡献)

## 🤝 行为准则

### 我们的承诺

我们承诺为每个人创造一个开放、友好、包容的贡献环境，不论年龄、性别、性别认同和表达、性取向、残疾、个人外观、体型、民族、种族、年龄、宗教信仰、国籍或经验水平。

### 我们的标准

促进积极环境的行为包括：
- ✅ 使用欢迎和包容的语言
- ✅ 尊重不同的观点和经历
- ✅ 优雅地接受建设性批评
- ✅ 关注对社区最有利的事情
- ✅ 对其他社区成员表示同理心

不可接受的行为包括：
- ❌ 使用性化的语言或图像
- ❌ 恶意评论、人身攻击或政治攻击
- ❌ 公开或私人骚扰
- ❌ 未经明确许可发布他人的私人信息
- ❌ 在专业环境中可能被视为不当的其他行为

## 🛠️ 如何贡献

### 贡献方式

我们欢迎以下类型的贡献：

1. **🐛 Bug修复** - 修复现有功能的问题
2. **✨ 新功能** - 添加新功能或改进
3. **📝 文档改进** - 改进文档、注释或示例
4. **🎨 代码重构** - 改进代码结构但不改变行为
5. **🧪 测试** - 添加或改进测试
6. **⚡ 性能优化** - 提升性能
7. **🔒 安全改进** - 修复安全漏洞

### 快速开始

1. **Fork仓库**
   ```bash
   git clone https://github.com/your-username/luckymart-tj.git
   cd luckymart-tj
   ```

2. **创建开发分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **设置开发环境**
   ```bash
   npm install
   cp .env.example .env.local
   # 编辑.env.local配置
   ```

4. **开始开发**
   ```bash
   npm run dev
   ```

5. **提交更改**
   ```bash
   git add .
   git commit -m "feat: 添加新功能描述"
   ```

6. **推送到Fork仓库**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **创建Pull Request**

## ⚙️ 开发环境设置

### 环境要求

确保您的开发环境满足以下要求：

- **Node.js**: >= 20.14.15
- **npm**: >= 9.0.0
- **PostgreSQL**: >= 13.0
- **Redis**: >= 6.0
- **Git**: >= 2.25

### 克隆和设置

```bash
# 克隆仓库
git clone https://github.com/luckymart/luckymart-tj.git
cd luckymart-tj

# 安装依赖
npm install

# 复制环境配置
cp .env.example .env.local

# 启动开发服务
npm run dev
```

### 数据库设置

```bash
# 创建数据库（PostgreSQL）
createdb luckymart_dev

# 运行迁移
npm run prisma:migrate

# 填充测试数据（可选）
npm run db:seed
```

### 开发工具配置

我们推荐使用VS Code进行开发，并安装以下插件：

- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- TypeScript Importer
- Prettier - Code formatter
- ESLint
- GitLens

## 📝 代码规范

### TypeScript规范

#### 类型定义
```typescript
// 好的做法
interface User {
  id: string;
  name: string;
  email: string;
}

// 避免使用any
// 错误示例: any类型定义
interface BadExample {
  data: any; // ❌ 避免
}

// 好的做法
interface GoodExample {
  data: Record<string, unknown>; // ✅ 推荐
}
```

#### 函数定义
```typescript
// 好的做法
async function fetchUserData(userId: string): Promise<User> {
  const user = await api.getUser(userId);
  return user;
}

// 使用函数式编程原则
const processUsers = (users: User[]): ProcessedUser[] => {
  return users.map(user => ({
    ...user,
    processed: true,
  }));
};
```

### React组件规范

#### 组件结构
```tsx
'use client';

import React from 'react';
import { ComponentProps } from '@/types';

interface UserCardProps extends ComponentProps {
  user: User;
  onUpdate?: (user: User) => void;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onUpdate,
  className,
}) => {
  const handleUpdate = React.useCallback(() => {
    onUpdate?.(user);
  }, [user, onUpdate]);

  return (
    <div className={cn('user-card', className)}>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <button onClick={handleUpdate}>Update</button>
    </div>
  );
};
```

#### Hook使用
```tsx
// 自定义Hook示例
export const useUserData = (userId: string) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await api.getUser(userId);
        setUser(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  return { user, loading, error };
};
```

### 数据库查询规范

#### Prisma使用
```typescript
// 好的做法：使用select优化查询
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    name: true,
    email: true,
    createdAt: true,
  },
});

// 避免：查询所有字段
// const user = await prisma.user.findUnique({
//   where: { id: userId },
// });

// 批量查询优化
const users = await prisma.user.findMany({
  where: { isActive: true },
  select: {
    id: true,
    name: true,
    referralRelationships: {
      select: {
        level: true,
      },
    },
  },
});
```

### 错误处理

```typescript
// 好的错误处理
try {
  const result = await someAsyncOperation();
  return { success: true, data: result };
} catch (error) {
  logger.error('Operation failed', { error, context });
  
  return {
    success: false,
    error: {
      code: 'OPERATION_FAILED',
      message: error instanceof Error ? error.message : 'Unknown error',
    },
  };
}
```

## 📋 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 提交格式

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 类型 (type)

- **feat**: 新功能
- **fix**: bug修复
- **docs**: 文档更改
- **style**: 代码格式化
- **refactor**: 代码重构
- **test**: 添加或修改测试
- **chore**: 构建流程、辅助工具
- **perf**: 性能优化
- **ci**: CI/CD配置更改

### 示例

```bash
# 新功能
feat(referral): 添加推荐统计功能

# Bug修复
fix(api): 修复用户注册接口验证错误

# 文档更新
docs(readme): 更新安装说明

# 重构
refactor(cache): 重构缓存管理器接口

# 测试
test(user): 添加用户认证单元测试

# 性能优化
perf(query): 优化数据库查询性能
```

### 作用域 (scope)

推荐的scope包括：
- `api`: API相关
- `ui`: 用户界面
- `auth`: 认证系统
- `db`: 数据库
- `cache`: 缓存
- `bot`: 机器人
- `referral`: 推荐系统
- `docs`: 文档

## 🔄 Pull Request流程

### 创建PR前检查

在创建Pull Request之前，请确保：

- [ ] 代码符合项目规范
- [ ] 添加了必要的测试
- [ ] 运行了linting检查
- [ ] 通过了所有测试
- [ ] 更新了相关文档
- [ ] 创建了清晰的PR描述

### PR模板

创建PR时请使用以下模板：

```markdown
## 📝 更改描述

简要描述这个PR的主要更改。

## 🔍 更改类型

- [ ] Bug修复
- [ ] 新功能
- [ ] 重大更改
- [ ] 文档更新
- [ ] 性能改进
- [ ] 重构

## 🧪 测试

- [ ] 单元测试
- [ ] 集成测试
- [ ] 手动测试

## 📱 兼容性

- [ ] 向后兼容
- [ ] 需要数据库迁移
- [ ] 需要环境变量更新

## 📸 截图

如果适用，添加截图展示更改。

## 🏷️ 相关Issue

Closes #(issue_number)
```

### 代码审查要求

所有PR都需要通过以下检查：

1. **自动检查**
   - CI/CD流程通过
   - ESLint检查通过
   - TypeScript类型检查通过
   - 测试覆盖率达标

2. **人工审查**
   - 代码质量审查
   - 安全漏洞检查
   - 性能影响评估
   - 文档完整性检查

## 🐛 问题报告

### Bug报告模板

使用以下模板创建问题报告：

```markdown
**问题描述**
简要描述问题是什么。

**复现步骤**
1. 前往 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

**预期行为**
描述你预期会发生什么。

**实际行为**
描述实际发生了什么。

**截图**
如果适用，添加截图。

**环境信息**
- 操作系统: [e.g. iOS]
- 浏览器: [e.g. chrome, safari]
- 版本: [e.g. 22]
- Node.js版本: [e.g. 20.14.15]

**其他信息**
添加任何其他关于问题的信息。
```

### 严重性等级

- **P0 (紧急)**: 系统崩溃、数据丢失
- **P1 (高)**: 核心功能不可用
- **P2 (中)**: 功能异常但有替代方案
- **P3 (低)**: 轻微问题，不影响使用

## ✨ 功能请求

### 功能请求模板

```markdown
**功能描述**
简要描述你希望的功能。

**问题背景**
这个功能解决了什么问题？

**建议的解决方案**
描述你期望的解决方案。

**替代方案**
描述你考虑过的其他解决方案。

**额外信息**
添加任何其他信息、截图等。
```

### 功能评估

新功能需要通过以下评估：

1. **需求评估**: 是否符合项目目标
2. **技术可行性**: 技术实现难度评估
3. **资源评估**: 开发资源需求
4. **影响评估**: 对现有功能的影响
5. **维护评估**: 长期维护成本

## 🔍 代码审查

### 审查者指南

#### 审查重点
1. **功能性**: 代码是否实现了预期的功能
2. **可读性**: 代码是否易于理解和维护
3. **安全性**: 是否存在安全漏洞
4. **性能**: 是否可能影响性能
5. **测试**: 是否包含适当的测试

#### 审查反馈格式
```markdown
## ✅ 优点
- 列出代码的优点

## ⚠️ 建议
- 提出改进建议
- 使用建设性的语言

## ❓ 问题
- 标记需要澄清的问题

## 🎯 行动项
- 明确需要修复的问题
```

### 被审查者指南

#### 响应审查反馈
1. **保持开放**: 欢迎建设性的反馈
2. **及时响应**: 在合理时间内回应评论
3. **讨论澄清**: 如果不同意，给出合理的解释
4. **及时修复**: 按要求修复问题

## 🧪 测试指南

### 测试类型

#### 单元测试
```typescript
// __tests__/utils/calculation.test.ts
import { calculateReferralReward } from '@/lib/referral';

describe('calculateReferralReward', () => {
  it('should calculate correct level 1 reward', () => {
    const result = calculateReferralReward(100, 1);
    expect(result).toBe(10);
  });

  it('should handle invalid level', () => {
    expect(() => calculateReferralReward(100, 0)).toThrow();
  });
});
```

#### 集成测试
```typescript
// __tests__/api/user.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/user/profile/route';

describe('/api/user/profile', () => {
  it('should return user profile', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
  });
});
```

#### E2E测试
```typescript
// __tests__/e2e/user-registration.spec.ts
import { test, expect } from '@playwright/test';

test('user can register successfully', async ({ page }) => {
  await page.goto('/register');
  
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.fill('[data-testid="name"]', 'Test User');
  
  await page.click('[data-testid="register-button"]');
  
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
});
```

### 测试覆盖率要求

- **总体覆盖率**: ≥ 80%
- **核心功能覆盖率**: ≥ 90%
- **API覆盖率**: ≥ 95%
- **工具函数覆盖率**: ≥ 95%

## 📚 文档贡献

### 文档类型

1. **API文档**: API接口说明
2. **用户指南**: 用户使用指南
3. **开发者文档**: 开发相关文档
4. **部署文档**: 部署和运维指南

### 文档规范

#### Markdown格式
```markdown
# 标题
## 二级标题
### 三级标题

- 列表项1
- 列表项2

1. 有序列表项1
2. 有序列表项2

```javascript
// 代码示例
const example = 'code';
```

| 列1 | 列2 |
|-----|-----|
| 内容1 | 内容2 |
```

#### 代码示例
```typescript
// 为API端点提供完整的请求/响应示例
import { apiClient } from '@/lib/api-client';

// 示例：获取用户信息
const user = await apiClient.getUser('user-id');
```

## 🏷️ 版本管理

### 版本号规则

我们遵循 [语义化版本](https://semver.org/)：

- **主版本号 (MAJOR)**: 不兼容的API修改
- **次版本号 (MINOR)**: 向下兼容的功能性新增
- **修订号 (PATCH)**: 向下兼容的问题修正

### 发布流程

1. **功能开发**: 在feature分支开发
2. **测试验证**: 完整的测试流程
3. **代码审查**: 团队审查
4. **合并主干**: 合并到main分支
5. **版本标记**: 创建版本标签
6. **发布部署**: 部署到生产环境

## 📞 获取帮助

### 联系方式

- **GitHub Discussions**: [项目讨论区](https://github.com/luckymart/luckymart-tj/discussions)
- **开发团队邮箱**: dev-team@luckymart.com
- **技术文档**: [项目Wiki](https://github.com/luckymart/luckymart-tj/wiki)

### 社区资源

- **贡献者指南**: 本文档
- **代码规范**: `/docs/developer-guide.md`
- **API文档**: `/docs/api/README.md`
- **部署指南**: `/docs/deployment-guide.md`

## 🎉 致谢

感谢所有为LuckyMart-TJ项目做出贡献的开发者和用户！你们的贡献让这个项目变得更加出色。

### 贡献者名单

我们使用 [All Contributors](https://allcontributors.org/) 规范来识别所有类型的贡献者。

## 📜 许可证

通过贡献代码，您同意您的贡献将在MIT许可证下授权。

---

再次感谢您的贡献！如果您有任何问题或需要帮助，请随时联系我们。