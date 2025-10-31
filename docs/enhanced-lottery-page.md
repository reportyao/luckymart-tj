# 抽奖页面功能增强文档

## 项目概述

本文档详细描述了抽奖页面的功能增强，包括快速参与、多份购买、用户参与历史查看等新功能，旨在提升用户体验和参与效率。

## 功能特性

### 1. 增强版抽奖卡片 (EnhancedLotteryCard)

#### 主要功能
- 完整的抽奖期次信息展示
- 实时进度条显示
- 营销角标支持
- 用户参与历史快速查看
- 智能推荐参与份数
- 一键快速参与和批量购买按钮

#### 组件结构
```typescript
interface LotteryRound {
  id: string;
  productId: string;
  roundNumber: number;
  totalShares: number;
  soldShares: number;
  status: 'active' | 'ended' | 'completed';
  drawTime: string | null;
  pricePerShare: number;
  product: {
    id: string;
    name: string;
    marketPrice: number;
    images: string[];
    marketingBadge?: MarketingBadge;
  };
  userParticipation?: {
    sharesCount: number;
    numbers: number[];
    isWinner: boolean;
  };
  winProbability?: number;
}
```

### 2. 快速参与组件 (QuickParticipate)

#### 核心特性
- **智能推荐算法**：根据用户余额推荐不超过70%的参与份数
- **一键全仓功能**：使用所有可用余额参与
- **余额保护机制**：保留30%余额，避免过度消费
- **自动引导充值**：余额不足时自动引导用户充值

#### 参与模式
1. **智能模式**：推荐70%余额参与，保留30%安全余额
2. **全仓模式**：使用所有可用余额参与

### 3. 多份购买组件 (MultiPurchase)

#### 批量折扣策略
- **1-4份**：无折扣
- **5-9份**：9.5折优惠
- **10份**：9折优惠

#### 交互特性
- 预设份数快速选择（1-10份）
- 自定义份数输入（1-10份）
- 实时价格计算和折扣显示
- 余额验证和不足提醒

### 4. 用户参与历史

#### 展示信息
- 已参与份数统计
- 预计中奖概率计算
- 个人号码查看
- 参与记录详情

## API 接口设计

### 1. 快速参与接口

**POST** `/api/lottery/quick-participate`

#### 请求参数
```typescript
{
  roundId: string;     // 抽奖期次ID
  quantity: number;    // 参与份数
  mode?: 'smart' | 'max'; // 参与模式
}
```

#### 响应数据
```typescript
{
  success: boolean;
  data: {
    participationId: string;
    roundId: string;
    quantity: number;
    totalCost: number;
    remainingShares: number;
    currentTotalShares: number;
    winProbability: number;
  };
  message: string;
}
```

### 2. 批量参与接口

**POST** `/api/lottery/bulk-participate`

#### 请求参数
```typescript
{
  roundId: string;     // 抽奖期次ID
  quantity: number;    // 参与份数（1-10）
}
```

#### 响应数据
```typescript
{
  success: boolean;
  data: {
    participationId: string;
    roundId: string;
    quantity: number;
    totalCost: number;
    originalCost: number;
    discount: number;
    discountAmount: number;
    remainingShares: number;
    currentTotalShares: number;
    winProbability: number;
  };
  message: string;
}
```

### 3. 用户参与信息接口

**GET** `/api/lottery/user-participation?roundId={roundId}`

#### 响应数据（特定期次）
```typescript
{
  success: boolean;
  data: {
    roundId: string;
    roundNumber: number;
    productId: string;
    productName: string;
    totalShares: number;
    soldShares: number;
    pricePerShare: number;
    status: string;
    userParticipation: {
      sharesCount: number;
      totalCost: number;
      participations: ParticipationRecord[];
      winProbability: number;
      availableNumbers: number[];
    };
    coinBalance: number;
  };
}
```

### 4. 活跃期次接口

**GET** `/api/lottery/active-rounds`

#### 查询参数
- `language`: 语言设置（默认zh）
- `limit`: 返回数量限制（默认20）
- `page`: 页码（默认1）

#### 响应数据
```typescript
{
  success: boolean;
  data: {
    rounds: LotteryRound[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}
```

## 用户体验优化

### 1. 加载状态优化
- 骨架屏加载动画
- 按钮加载状态指示
- 分页加载优化

### 2. 错误处理
- 友好的错误提示信息
- 自动重试机制
- 网络异常降级处理

### 3. 成功反馈
- 动画效果提示
- 详细成功信息展示
- 实时数据更新

### 4. 余额管理
- 智能余额推荐
- 余额不足自动引导
- 保留安全余额机制

## 移动端优化

### 1. 响应式设计
- 适配各种屏幕尺寸
- 触摸友好的交互元素
- 优化的按钮大小和间距

### 2. 性能优化
- 图片懒加载
- 组件按需渲染
- API响应缓存

### 3. 无障碍访问
- 键盘导航支持
- 屏幕阅读器兼容
- 高对比度模式

## 数据库设计

### 参与记录增强

在 `participations` 表中增加以下字段：
```sql
ALTER TABLE participations ADD COLUMN metadata JSONB;
```

`metadata` 字段存储：
- 折扣信息
- 原始价格
- 购买类型（bulk/normal）
- 参与模式（smart/max）

### 交易记录优化

增强 `transactions` 表记录：
- 记录原价和折扣金额
- 区分正常参与和批量参与交易
- 支持详细的折扣记录

## 安全考虑

### 1. 速率限制
- 快速参与：每5分钟最多20次
- 批量参与：每5分钟最多10次
- 用户参与信息查询：每分钟最多60次

### 2. 数据验证
- 参数范围验证
- 用户余额验证
- 期次状态验证
- 并发控制

### 3. 事务安全
- 数据库事务确保一致性
- 乐观锁防止超卖
- 原子性操作保证

## 监控和日志

### 1. 性能监控
- API响应时间监控
- 错误率统计
- 用户参与转化率

### 2. 业务监控
- 快速参与使用率
- 批量购买折扣效果
- 用户留存分析

### 3. 日志记录
- 详细的操作日志
- 错误堆栈追踪
- 用户行为分析

## 部署说明

### 1. 环境要求
- Node.js 18+
- Next.js 14+
- Prisma ORM
- PostgreSQL 14+

### 2. 数据库迁移
```bash
# 执行数据库迁移
npx prisma migrate deploy

# 生成客户端
npx prisma generate
```

### 3. 环境变量
```env
# 抽奖相关配置
LOTTERY_QUICK_PARTICIPATE_RATE_LIMIT=20
LOTTERY_BULK_PARTICIPATE_RATE_LIMIT=10
LOTTERY_USER_INFO_RATE_LIMIT=60
```

## 测试策略

### 1. 单元测试
- 组件功能测试
- API接口测试
- 业务逻辑测试

### 2. 集成测试
- 端到端流程测试
- 数据库操作测试
- 并发场景测试

### 3. 性能测试
- 负载测试
- 压力测试
- 响应时间测试

## 未来扩展

### 1. 智能推荐算法
- 基于历史数据的推荐
- 个性化参与策略
- 风险评估机制

### 2. 社交功能
- 好友参与邀请
- 团队购买功能
- 分享奖励机制

### 3. 数据分析
- 用户行为分析
- 参与模式洞察
- 收益优化建议

## 总结

本次抽奖页面增强显著提升了用户体验，通过智能推荐、批量优惠、实时反馈等功能，有效提高了用户参与度和平台收益。系统具备了良好的扩展性和维护性，为未来功能迭代奠定了坚实基础。