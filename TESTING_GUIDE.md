# LuckyMart TJ 测试套件使用指南

## 📋 概述

LuckyMart TJ 项目实现了完整的单元测试和集成测试覆盖，确保系统的稳定性、安全性和性能。本指南将详细介绍如何使用测试套件。

## 🏗️ 测试架构

### 测试类型
- **单元测试** - 测试单个函数和模块
- **集成测试** - 测试模块间的交互
- **性能测试** - 验证系统性能指标
- **安全测试** - 验证安全防护机制
- **容错测试** - 验证错误处理能力

### 测试文件结构
```
luckymart-tj/
├── __tests__/                    # Jest测试文件
│   ├── auth.test.ts             # JWT认证系统测试
│   ├── lottery-algorithm.test.ts # VRF开奖算法测试
│   ├── database-lock.test.ts    # 数据库锁机制测试
│   ├── api-security.test.ts     # API安全验证测试
│   ├── performance-cache.test.ts # 性能优化缓存测试
│   ├── bot-fault-tolerance.test.ts # Bot容错机制测试
│   ├── business-flow.test.ts    # 核心业务流程测试
│   └── database-transactions.test.ts # 数据库事务测试
├── test/                        # 其他测试文件
│   ├── cache-system.test.ts     # 缓存系统测试
│   └── [performance tests]
├── jest.config.js              # Jest配置
├── jest.setup.js               # 测试环境设置
└── run-all-tests.ts            # 测试运行器
```

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
# 或使用快速安装
./run-tests.sh --setup
```

### 2. 运行所有测试
```bash
# 使用便捷脚本（推荐）
./run-tests.sh

# 或使用npm命令
npm run test:all

# 或使用tsx直接运行
npx tsx run-all-tests.ts
```

### 3. 查看测试报告
测试完成后会生成：
- `TEST_REPORT.md` - Markdown格式详细报告
- `test-report.json` - JSON格式数据报告
- `coverage/` - 代码覆盖率报告目录

## 📊 测试命令详解

### 单个测试套件
```bash
# 认证系统测试
npm run test:auth

# VRF算法测试
npm run test:lottery

# 业务流程测试
npm run test:business

# API安全测试
npm run test:security

# 性能测试
npm run test:performance-suite

# Bot容错测试
npm run test:bot
```

### 测试类型分类
```bash
# 单元测试
npm run test:unit

# 集成测试
npm run test:integration

# 性能测试
npm run test:performance
```

### 覆盖率测试
```bash
# 生成覆盖率报告
npm run test:coverage

# 查看实时覆盖率
npm run test:watch
```

## 🔧 测试配置

### Jest配置 (jest.config.js)
- 测试环境：Node.js
- 覆盖率阈值：70%
- 模块别名：@/ 指向根目录
- 超时时间：30秒

### 环境变量
测试会自动加载 `.env.local` 文件，需要配置：
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-jwt-secret"
TELEGRAM_BOT_TOKEN="your-bot-token"
REDIS_URL="redis://..."
```

### 测试数据
测试使用独立的测试数据，运行前会自动清理和重建。

## 📈 覆盖范围

### 认证系统
- ✅ JWT Token生成和验证
- ✅ 密码加密和安全处理
- ✅ Telegram WebApp验证
- ✅ 权限边界控制

### VRF开奖算法
- ✅ 密码学随机数生成
- ✅ 开奖结果公平性验证
- ✅ 防篡改和安全防护
- ✅ 算法性能测试

### 数据库操作
- ✅ 事务原子性保证
- ✅ 并发操作安全性
- ✅ 锁机制测试
- ✅ 死锁检测和处理

### API安全
- ✅ 认证和授权
- ✅ 输入验证
- ✅ 安全头设置
- ✅ 权限控制

### 性能优化
- ✅ N+1查询检测
- ✅ 缓存系统测试
- ✅ 查询优化验证
- ✅ 内存使用优化

### Bot容错
- ✅ 错误处理机制
- ✅ 重连机制
- ✅ 消息队列
- ✅ 健康监控

### 业务流程
- ✅ 用户注册流程
- ✅ 夺宝参与流程
- ✅ 开奖处理流程
- ✅ 订单管理流程

## 🛠️ 故障排除

### 常见问题

1. **测试超时**
   ```bash
   # 增加超时时间或优化测试
   export JEST_TIMEOUT=60000
   ```

2. **数据库连接失败**
   ```bash
   # 检查DATABASE_URL配置
   # 确保数据库服务运行
   npm run prisma:migrate
   ```

3. **依赖缺失**
   ```bash
   # 重新安装依赖
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **覆盖率不达标**
   ```bash
   # 查看详细覆盖率报告
   npm run test:coverage
   open coverage/lcov-report/index.html
   ```

### 调试模式
```bash
# 详细输出
npm test -- --verbose

# 监听模式
npm run test:watch

# 调试特定测试
npm test -- --testNamePattern="特定测试名称"
```

## 📊 测试指标

### 覆盖率要求
- **代码行**: ≥70%
- **函数**: ≥70%
- **分支**: ≥70%
- **语句**: ≥70%

### 性能基准
- **JWT Token生成**: <1ms
- **VRF开奖计算**: <5s
- **缓存命中率**: >90%
- **并发处理**: >100 TPS

### 质量标准
- **测试通过率**: ≥95%
- **安全功能**: 100%验证
- **关键路径**: 100%覆盖

## 🔍 持续集成

### CI/CD集成
将测试集成到持续集成流水线：
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:all
      - run: npm run test:coverage
```

### 预提交钩子
```bash
# 安装husky
npm install --save-dev husky

# 设置预提交检查
npx husky install
npx husky add .husky/pre-commit "npm run test:unit"
```

## 📚 参考文档

### 测试框架文档
- [Jest官方文档](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Prisma测试指南](https://www.prisma.io/docs/guides/testing)

### 项目文档
- [COMPLETE_TEST_REPORT.md](./COMPLETE_TEST_REPORT.md) - 完整测试报告
- [README.md](./README.md) - 项目总体说明
- [API文档](./docs/api/) - API接口文档

## 🎯 最佳实践

1. **测试驱动开发** - 先写测试再写代码
2. **定期运行测试** - 每次提交前运行完整测试套件
3. **覆盖率监控** - 保持测试覆盖率在标准之上
4. **性能基准** - 定期检查性能指标
5. **安全审计** - 定期进行安全测试

## 📞 支持

如有测试相关问题，请：
1. 查看本指南和项目文档
2. 运行详细测试获取错误信息
3. 检查环境配置和依赖
4. 提交Issue并附上测试报告

---

*本指南涵盖了LuckyMart TJ项目测试套件的完整使用说明。如有任何疑问或建议，欢迎反馈。*