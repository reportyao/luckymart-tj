# 用户行为分析系统 - 示例数据和测试指南

## 概述

本指南提供了用户行为分析系统的示例数据生成脚本和API测试脚本，帮助开发者快速搭建测试环境并验证系统功能。

## 📋 功能说明

### 1. 示例数据生成脚本 (`scripts/seed-user-analytics-data.ts`)

生成完整的用户行为分析测试数据，包括：

- **100个测试用户**：具有完整的用户资料和随机生成的行为数据
- **用户行为日志**：涵盖30天内的各种行为类型（登录、充值、抽奖等）
- **参与度统计**：30天的用户活跃度和参与度数据
- **留存分析**：用户在不同时间点的留存状态
- **消费分析**：用户的消费行为和价值分析
- **用户分群**：5个预设的用户分群（高价值用户、潜力新用户、流失风险用户、VIP用户、活跃抽奖用户）

### 2. API测试脚本 (`test/user-analytics-api.test.ts`)

全面测试所有5个用户行为分析API端点：

- **用户行为统计API** (`/api/admin/users/behavior`)
- **用户参与度统计API** (`/api/admin/users/engagement`)
- **用户留存分析API** (`/api/admin/users/retention`)
- **用户消费分析API** (`/api/admin/users/spending`)
- **用户分群API** (`/api/admin/users/segments`)

## 🚀 快速开始

### 前置条件

1. 确保项目依赖已安装：
```bash
npm install
```

2. 确保数据库已配置并运行
3. 确保环境变量已设置：
```bash
DATABASE_URL=your_database_url
ADMIN_TOKEN=your_admin_token
API_BASE_URL=http://localhost:3000
```

### 执行示例数据生成

```bash
# 生成用户行为分析示例数据
npm run seed:user-analytics
```

**输出示例：**
```
🚀 开始生成用户行为分析示例数据...

清理现有测试数据...
✅ 清理完成

生成测试用户...
已创建 10/100 个测试用户
...
✅ 成功创建 100 个测试用户

✅ 成功生成 3000+ 条用户行为日志
✅ 成功生成 3000+ 条用户参与度统计
✅ 成功生成 100 条用户留存分析记录
✅ 成功生成 100 条用户消费分析记录
✅ 成功生成 75 条用户分群记录，共 5 个分群

🎉 示例数据生成完成！
📊 生成统计：
   - 测试用户：100 个
   - 数据时间范围：30 天
   - 行为日志：约 5000 条
   - 参与度统计：3000 条
   - 留存分析：100 条
   - 消费分析：100 条
   - 用户分群：75 条
```

### 执行API测试

```bash
# 运行完整的API测试套件
npm run test:user-analytics-api

# 或者使用Jest运行特定测试
npx jest test/user-analytics-api.test.ts

# 只运行特定API的测试
npm run test:user-analytics-api -- --testNamePattern="用户行为统计API"
```

**测试输出示例：**
```
🚀 开始用户行为分析API测试...

📡 测试地址: http://localhost:3000
🔑 测试令牌: test_admin...

📊 测试用户行为统计 API - GET
✅ 获取用户行为数据（分页） (125ms)
✅ 按用户ID过滤行为数据 (89ms)
✅ 按日期范围过滤 (156ms)
✅ 按行为类型过滤 (98ms)
❌ 无效权限令牌测试: 期望状态码 403，实际 200

📝 测试用户行为统计 API - POST
✅ 记录新用户行为 (245ms)
✅ 记录充值行为 (189ms)
❌ 无效数据测试: 期望状态码 400，实际 200

...

============================================================
📋 测试报告
============================================================
📊 测试统计:
   总测试数: 25
   ✅ 通过: 23
   ❌ 失败: 2
   成功率: 92.0%
   总耗时: 3245ms

⚠️  有 2 个测试失败，请检查API实现
============================================================
```

## 📖 详细使用说明

### 示例数据生成脚本

#### 命令行选项

脚本支持以下环境变量配置：

```bash
# 可选：自定义测试用户数量（默认100）
TEST_USER_COUNT=50 npm run seed:user-analytics

# 可选：自定义生成天数（默认30）
DAYS_TO_GENERATE=60 npm run seed:user-analytics
```

#### 数据结构

生成的数据包含以下主要表：

1. **user_behavior_logs** - 用户行为日志
   - 行为类型：login, logout, registration, recharge, lottery_participation, product_purchase, withdrawal, invitation
   - 时间跨度：30天
   - 设备信息：iOS, Android, Web, Telegram

2. **user_engagement_stats** - 用户参与度统计
   - 登录次数：0-8次/天
   - 会话时长：0-3600秒
   - 页面浏览：0-50页/天
   - 参与度评分：0-100分

3. **retention_analysis** - 用户留存分析
   - 留存时间点：day_0, day_1, day_3, day_7, day_14, day_30, day_60, day_90
   - 留存率递减：day_1(60%), day_3(40%), day_7(30%), day_30(15%)

4. **spending_analysis** - 用户消费分析
   - 消费分群：low, medium, high, vip
   - CLV计算：基于消费金额和频率
   - 流失风险：0-100分

5. **user_segments** - 用户分群
   - 5个预设分群，每个分群15-25个用户
   - 分群标准基于参与度、消费、活跃度

### API测试脚本

#### 测试覆盖范围

1. **权限验证测试**
   - 有效管理员令牌验证
   - 无效令牌拒绝访问
   - 权限不足错误处理

2. **数据查询测试**
   - 分页查询
   - 条件过滤（用户ID、日期、类型）
   - 排序和限制

3. **数据操作测试**
   - POST创建新记录
   - PUT更新现有记录
   - DELETE删除记录

4. **错误处理测试**
   - 无效参数处理
   - 不存在资源处理
   - 格式错误处理

#### 自定义测试配置

```typescript
// 在 test/user-analytics-api.test.ts 中修改配置
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your_test_token';
```

#### 运行特定测试

```bash
# 只测试特定API
npm run test:user-analytics-api -- --testNamePattern="用户行为统计API"

# 测试特定方法
npm run test:user-analytics-api -- --testNamePattern="GET请求"

# 详细输出模式
npm run test:user-analytics-api -- --verbose
```

## 🔧 开发指南

### 添加新的测试用例

在 `test/user-analytics-api.test.ts` 中添加新的测试方法：

```typescript
async testCustomApi(): Promise<void> {
  console.log('\n🔧 测试自定义API');
  
  await this.testRequest(
    '自定义API测试',
    () => axios.get(`${this.baseURL}/api/custom/endpoint`, { headers: this.adminHeaders })
  );
}
```

### 修改示例数据

在 `scripts/seed-user-analytics-data.ts` 中调整生成参数：

```typescript
// 修改用户数量
const TEST_USER_COUNT = 200;

// 修改行为类型
const BEHAVIOR_TYPES = ['custom_action', 'another_action'];

// 修改分群定义
const segments = [
  {
    segment_name: '自定义分群',
    criteria: {
      custom_field: 'value'
    }
  }
];
```

## 📊 性能考虑

### 批量插入优化

示例数据生成脚本使用批量插入来提高性能：

```typescript
// 批量大小控制
const batchSize = 1000;
for (let i = 0; i < dataToCreate.length; i += batchSize) {
  const batch = dataToCreate.slice(i, i + batchSize);
  await prisma.tableName.createMany({ data: batch });
}
```

### 内存管理

对于大数据集生成，建议分批处理：

```typescript
// 避免一次性加载所有数据到内存
for (const batch of dataBatches) {
  await processBatch(batch);
  // 清理内存
  if (global.gc) global.gc();
}
```

## 🐛 故障排除

### 常见问题

1. **数据库连接失败**
   ```
   Error: Can't connect to database
   ```
   - 检查 DATABASE_URL 环境变量
   - 确保数据库服务正在运行
   - 验证数据库权限

2. **权限验证失败**
   ```
   Error: 管理员权限验证失败
   ```
   - 检查 ADMIN_TOKEN 环境变量
   - 确认令牌在数据库中存在且有效

3. **API响应格式错误**
   ```
   Error: Expected API response format
   ```
   - 确认API端点正确返回 `{ success, data, error }` 格式
   - 检查API是否正确处理请求参数

### 调试模式

启用详细日志输出：

```bash
# 启用Jest详细模式
npm run test:user-analytics-api -- --verbose

# 启用Jest调试模式
npm run test:user-analytics-api -- --detectOpenHandles

# 启用TypeScript严格检查
npx tsx --inspect-brk test/user-analytics-api.test.ts
```

## 📝 测试数据清理

### 清理测试数据

```bash
# 手动清理用户行为分析相关数据
npm run seed:user-analytics  # 重新生成会自动清理旧数据
```

### 选择性清理

```sql
-- 只清理特定表
DELETE FROM user_segments;
DELETE FROM spending_analysis;
DELETE FROM retention_analysis;
DELETE FROM user_engagement_stats;
DELETE FROM user_behavior_logs;
DELETE FROM users WHERE telegram_id LIKE 'test_user_%';
```

## 📈 扩展功能

### 添加新的用户分群标准

```typescript
const customSegments = [
  {
    segment_name: '高活跃抽奖用户',
    criteria: {
      min_lottery_participation: 20,
      min_engagement_score: 70,
      max_days_since_last_activity: 3
    }
  }
];
```

### 添加新的参与度指标

```typescript
const engagementMetrics = {
  social_shares: getRandomInt(0, 10),
  referrals_sent: getRandomInt(0, 5),
  social_engagement_score: getRandomInt(0, 100)
};
```

## 📞 支持

如果在使用过程中遇到问题，请检查：

1. 确保所有依赖包已正确安装
2. 环境变量配置正确
3. 数据库连接正常
4. API端点可访问

更多详细信息请参考项目文档或联系开发团队。