# LuckyMart TJ 测试框架

![测试状态](https://img.shields.io/badge/测试状态-已配置-brightgreen)
![覆盖率目标](https://img.shields.io/badge/覆盖率目标-90%25-blue)
![测试文件数](https://img.shields.io/badge/测试文件-26个-orange)

## 📋 项目概述

LuckyMart TJ 多层级裂变系统的完整测试框架，提供全面的单元测试、集成测试和覆盖率分析。

## 🏗️ 框架架构

```
luckymart-tj/
├── __tests__/                    # 测试文件目录
│   ├── referral-system-integration.test.ts      # 邀请系统集成测试
│   ├── referral-reward-trigger.test.ts          # 奖励触发机制测试
│   ├── referral-calc-rebate.test.ts             # 返利计算精度测试
│   ├── auth.test.ts                              # 认证测试
│   ├── business-flow.test.ts                     # 业务流程测试
│   ├── lottery-algorithm.test.ts                 # 抽奖算法测试
│   ├── api-security.test.ts                      # API安全测试
│   └── ... (共26个测试文件)
├── test/                       # 测试相关文件
│   └── init-test-data.sql      # 测试数据初始化脚本
├── test-results/               # 测试结果目录
│   ├── coverage/               # 覆盖率报告
│   ├── test-execution-*.log    # 测试执行日志
│   └── test-summary-*.md       # 测试总结报告
├── scripts/
│   └── run-tests.sh            # 自动化测试脚本
├── jest.config.js              # Jest配置
├── jest.setup.js               # 测试环境设置
├── TESTING_FRAMEWORK_COMPLETION_REPORT.md    # 完成报告
├── TESTING_ENVIRONMENT_SETUP_GUIDE.md        # 环境配置指南
└── README.md                   # 本文档
```

## 🚀 快速开始

### 1. 环境准备

```bash
# 安装依赖
npm install

# 生成Prisma客户端
npm run prisma:generate
```

### 2. 配置测试环境

创建 `.env.local` 文件：

```bash
NODE_ENV=test
DATABASE_URL="postgresql://postgres:[密码]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
JWT_SECRET="test-jwt-secret-for-testing-only"
TELEGRAM_BOT_TOKEN="test-bot-token-for-testing"
```

详细配置请参考：[TESTING_ENVIRONMENT_SETUP_GUIDE.md](./TESTING_ENVIRONMENT_SETUP_GUIDE.md)

### 3. 运行测试

```bash
# 使用自动化脚本（推荐）
./scripts/run-tests.sh

# 或直接使用npm命令
npm test                    # 运行所有测试
npm run test:coverage      # 运行测试并生成覆盖率报告
```

## 📊 测试覆盖范围

### 核心功能测试

| 模块 | 测试文件 | 测试数量 | 覆盖率目标 |
|------|----------|----------|------------|
| **邀请系统** | `referral-system-integration.test.ts` | 15+ | 90% |
| **奖励机制** | `referral-reward-trigger.test.ts` | 20+ | 90% |
| **返利计算** | `referral-calc-rebate.test.ts` | 25+ | 90% |
| **认证系统** | `auth.test.ts` | 10+ | 90% |
| **业务流程** | `business-flow.test.ts` | 12+ | 90% |
| **抽奖算法** | `lottery-algorithm.test.ts` | 8+ | 90% |
| **API安全** | `api-security.test.ts` | 15+ | 90% |

### 测试类型分布

- **单元测试**: 70% (测试单个函数/组件)
- **集成测试**: 25% (测试模块间交互)
- **端到端测试**: 5% (测试完整业务流程)

### 性能测试

| 测试类型 | 测试文件 | 基准指标 |
|----------|----------|----------|
| 缓存性能 | `performance-cache.test.ts` | < 100ms |
| 邀请性能 | `referral-performance.test.ts` | < 500ms |
| 并发处理 | `referral-load-testing.test.ts` | 1000 req/s |
| 数据库锁 | `database-lock.test.ts` | < 50ms |

## 🛠️ 测试工具和配置

### Jest配置特性

- **覆盖率阈值**: 90% (分支、函数、行、语句)
- **并行执行**: 50% 线程利用率
- **测试超时**: 30秒
- **覆盖率报告**: HTML、LCOV、JSON、Clover
- **源码收集**: 全面的TypeScript/TSX文件覆盖

### 测试工具类

#### `test-config.ts`
- `TestDataGenerator`: 测试数据生成器
- `PerformanceTester`: 性能测试工具
- `MockDataGenerator`: 模拟数据生成
- `TestCleanup`: 测试清理工具

#### `test-utils.ts`
- `MockRequest/Response`: API测试模拟对象
- `AssertionHelpers`: 断言辅助函数
- `PerformanceUtils`: 性能测试工具

## 📈 覆盖率报告

### 报告格式

1. **HTML报告** (`test-results/coverage/index.html`)
   - 可视化覆盖率界面
   - 详细文件级别覆盖情况
   - 未覆盖代码行高亮显示

2. **LCOV报告** (`test-results/coverage/lcov.info`)
   - 代码覆盖数据
   - CI/CD集成友好

3. **JSON报告** (`test-results/coverage/coverage-final.json`)
   - 机器可读格式
   - 程序化分析使用

### 覆盖率指标

```javascript
// jest.config.js 中的阈值配置
coverageThreshold: {
  global: {
    branches: 90,    // 分支覆盖率
    functions: 90,   // 函数覆盖率
    lines: 90,       // 行覆盖率
    statements: 90   // 语句覆盖率
  }
}
```

## 🔧 自动化测试脚本

### `scripts/run-tests.sh` 功能

- ✅ 环境检查和验证
- ✅ 数据库连接测试
- ✅ 测试数据初始化
- ✅ 测试执行和监控
- ✅ 覆盖率报告生成
- ✅ 错误日志记录

### 使用示例

```bash
# 完整测试套件
./scripts/run-tests.sh

# 特定测试类型
./scripts/run-tests.sh --unit          # 单元测试
./scripts/run-tests.sh --integration   # 集成测试
./scripts/run-tests.sh --performance   # 性能测试

# 辅助功能
./scripts/run-tests.sh --clean         # 清理测试环境
./scripts/run-tests.sh --help          # 显示帮助
```

## 📁 测试文件说明

### 邀请系统测试 (8个文件)

| 文件名 | 主要功能 | 测试场景 |
|--------|----------|----------|
| `referral-system-integration.test.ts` | 核心邀请业务流程 | 邀请码生成、用户绑定、奖励发放 |
| `referral-reward-trigger.test.ts` | 奖励触发机制 | 触发条件、计算逻辑、发放时机 |
| `referral-calc-rebate.test.ts` | 小数精度返利计算 | 精度处理、边界值、性能测试 |
| `referral-bot-integration.test.ts` | 机器人集成测试 | Telegram Bot交互、通知发送 |
| `referral-load-testing.test.ts` | 负载测试 | 高并发、大数据量处理 |
| `referral-anti-fraud.test.ts` | 反欺诈系统测试 | 欺诈检测、风险评估 |
| `referral-cache-performance.test.ts` | 缓存性能测试 | 缓存策略、命中率优化 |
| `referral-trigger-reward.test.ts` | 奖励触发逻辑 | 条件判断、奖励分配 |

### 核心业务测试 (6个文件)

| 文件名 | 主要功能 | 测试场景 |
|--------|----------|----------|
| `auth.test.ts` | 用户认证系统 | 登录、注册、JWT处理 |
| `business-flow.test.ts` | 业务流程测试 | 订单流程、支付流程 |
| `lottery-algorithm.test.ts` | 抽奖算法 | 随机数生成、开奖逻辑 |
| `lottery-referral-integration.test.ts` | 抽奖邀请集成 | 复合业务流程 |
| `behavior-monitor.test.ts` | 行为监控 | 用户行为分析 |
| `database-transactions.test.ts` | 数据库事务 | ACID特性、并发控制 |

### 性能和优化测试 (5个文件)

| 文件名 | 主要功能 | 测试场景 |
|--------|----------|----------|
| `performance-cache.test.ts` | 缓存系统性能 | 缓存策略、响应时间 |
| `referral-performance.test.ts` | 邀请系统性能 | 处理速度、资源占用 |
| `database-lock.test.ts` | 数据库锁机制 | 锁竞争、死锁检测 |
| `api-security.test.ts` | API安全测试 | 身份验证、授权检查 |
| `bot-fault-tolerance.test.ts` | 机器人容错测试 | 错误处理、恢复机制 |

### 配置和工具测试 (7个文件)

| 文件名 | 主要功能 | 测试场景 |
|--------|----------|----------|
| `reward-config-manager.test.ts` | 奖励配置管理 | 配置更新、版本控制 |
| `reward-config-batch-update.test.ts` | 批量配置更新 | 批量操作、事务一致性 |
| `reward-config-update-api.test.ts` | 配置更新API | REST接口、参数验证 |
| `qr-generator.test.ts` | 二维码生成 | 编码解码、容错性 |
| `referral-anti-fraud-accuracy.test.ts` | 反欺诈准确性 | 检测精度、误报率 |
| `referral-rebate-accuracy.test.ts` | 返利计算准确性 | 计算精度、四舍五入 |
| `referral-reward-compatibility.test.ts` | 奖励兼容性 | 版本兼容、迁移测试 |

## 📚 文档资源

- [测试框架完成报告](./TESTING_FRAMEWORK_COMPLETION_REPORT.md) - 详细的项目状态和实现情况
- [测试环境配置指南](./TESTING_ENVIRONMENT_SETUP_GUIDE.md) - 完整的配置步骤和故障排除
- [项目完成报告集合](../README.md#项目完成报告) - 整体项目状态

## 🔍 质量保证

### 测试原则

1. **独立性**: 每个测试用例独立执行
2. **可靠性**: 测试结果稳定可重现
3. **完整性**: 覆盖所有关键业务逻辑
4. **性能**: 满足性能基准要求
5. **可维护性**: 代码结构清晰，易于维护

### 代码质量标准

- **类型安全**: 100% TypeScript覆盖
- **ESLint合规**: 无警告和错误
- **测试覆盖率**: ≥90% 所有指标
- **文档完整性**: 所有公共API有文档

## 🚨 常见问题

### Q: 数据库连接失败怎么办？
A: 检查 `.env.local` 文件中的 `DATABASE_URL` 是否正确配置，确保数据库可访问。

### Q: 测试执行时间过长？
A: 使用并行测试：`npm test -- --maxWorkers=4`，或跳过覆盖率收集：`npm test -- --coverage=false`。

### Q: 如何添加新的测试文件？
A: 在 `__tests__/` 目录下创建 `.test.ts` 文件，Jest会自动发现并执行。

### Q: 覆盖率不达标怎么办？
A: 查看HTML覆盖率报告，补充缺失的测试用例，重点关注业务逻辑和边界条件。

## 📈 持续改进

### 定期维护任务

- [ ] 每周运行完整测试套件
- [ ] 每月审查覆盖率报告
- [ ] 每季度更新测试数据
- [ ] 持续优化测试性能

### 未来规划

- [ ] 添加视觉回归测试
- [ ] 集成端到端测试框架
- [ ] 增强性能监控
- [ ] 实现测试自动化CI/CD

---

**项目状态**: ✅ 测试框架已完成（待数据库环境配置）  
**最后更新**: 2025-10-31  
**版本**: v1.0

*如有问题，请参考 [TESTING_ENVIRONMENT_SETUP_GUIDE.md](./TESTING_ENVIRONMENT_SETUP_GUIDE.md) 进行故障排除。*