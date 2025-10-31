# 抽奖记录与通知系统文档

## 概述

本文档描述了LuckyMart TJ抽奖记录页面和中奖通知系统的开发实现。该系统为用户提供了完整的抽奖记录查看、统计分析和实时中奖通知功能。

## 系统架构

### 前端组件结构

```
app/lottery/records/
├── page.tsx                    # 抽奖记录主页面
└── records/
    └── page.tsx                # 个人抽奖记录页面

components/
├── LotteryRecordCard.tsx       # 抽奖记录卡片组件
└── LotteryHistory.tsx          # 抽奖历史组件
```

### 后端API结构

```
app/api/lottery/
├── records/                    # 抽奖记录API
│   └── route.ts               # GET /api/lottery/records
├── wins/                       # 中奖记录API
│   └── route.ts               # GET /api/lottery/wins
└── statistics/                 # 抽奖统计API
    └── route.ts               # GET /api/lottery/statistics

app/api/notifications/
└── win/                        # 中奖通知API
    └── route.ts               # POST /api/notifications/win
```

### 数据库表结构

#### 核心表

1. **participations** - 抽奖参与记录
2. **lottery_rounds** - 抽奖轮次
3. **notifications** - 通知记录
4. **products** - 商品信息

## 功能特性

### 1. 抽奖记录页面

#### 主要功能
- **记录展示**: 显示用户的全部抽奖参与记录
- **筛选功能**: 按状态（全部/进行中/已结束/中奖记录）和类型（全部/付费/免费）筛选
- **分页加载**: 支持分页和无限滚动加载
- **离线支持**: 缓存数据支持离线查看

#### 页面特性
- 响应式设计，适配移动端
- 清晰的卡片布局
- 中奖记录特殊高亮显示
- 加载状态和空状态处理
- 多语言支持

#### 统计数据展示
- 总参与次数
- 总中奖次数
- 总奖金金额
- 中奖率统计

### 2. 抽奖记录卡片组件

#### 组件功能
- **基本信息展示**: 商品名称、期号、参与状态
- **号码显示**: 用户选择的号码，中奖号码特殊标记
- **状态指示**: 进行中/已结束/中奖等状态标识
- **类型标识**: 付费/免费参与标识
- **时间信息**: 参与时间、开奖时间
- **操作按钮**: 查看详情、继续观看等

#### 设计亮点
- 中奖记录使用绿色边框和特殊图标
- 免费参与使用金色星星标识
- 响应式布局适配不同屏幕尺寸

### 3. 抽奖历史组件

#### 核心功能
- **记录列表**: 展示抽奖记录列表
- **无限滚动**: 自动加载更多记录
- **滚动控制**: 回到顶部按钮
- **下拉刷新**: 支持手动刷新数据
- **离线指示**: 显示离线状态

#### 用户体验优化
- 骨架屏加载效果
- 平滑的滚动动画
- 智能的加载时机
- 缓存数据回退

### 4. 中奖通知系统

#### Telegram Bot集成
- **实时通知**: 开奖后立即发送通知
- **多语言支持**: 支持中文/英文/俄文/塔吉克语
- **防重复机制**: 避免重复发送通知
- **富文本格式**: 支持HTML格式和内联键盘

#### 通知内容
- **基本信息**: 商品名称、期号、中奖号码
- **奖金详情**: 奖金金额、奖金类型
- **操作按钮**: 立即领奖、查看记录
- **个性化内容**: 根据用户语言生成对应内容

#### 通知模板示例

**中文模板**:
```
🎉🎉🎉 恭喜中奖！🎉🎉🎉

🏆 特大喜讯！您中奖了！

📦 商品名称：iPhone 15 Pro
🎯 期号：2024-001
🔢 中奖号码：12345
💰 奖金金额：299.99 TJS
🏅 奖金类型：大奖

🎊 恭喜恭喜！幸运降临在您身上！
📞 我们将尽快联系您安排领奖事宜
💝 感谢您的参与，继续支持我们吧～
```

## API接口文档

### 1. 获取抽奖记录

**请求**:
```
GET /api/lottery/records
```

**参数**:
- `status`: 状态筛选 (all/active/completed/won)
- `type`: 类型筛选 (all/paid/free)
- `page`: 页码 (默认1)
- `limit`: 每页数量 (默认20，最大100)

**响应**:
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "uuid",
        "roundId": "uuid",
        "productId": "uuid",
        "productName": "iPhone 15 Pro",
        "productImage": "url",
        "roundNumber": 1,
        "numbers": [1, 2, 3, 4, 5],
        "sharesCount": 5,
        "cost": 25.00,
        "type": "paid",
        "status": "completed",
        "isWinner": false,
        "winningNumber": 12345,
        "winnerPrize": 0,
        "drawTime": "2024-01-01T12:00:00Z",
        "participationTime": "2024-01-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "hasMore": true,
      "totalPages": 5
    }
  }
}
```

### 2. 获取中奖记录

**请求**:
```
GET /api/lottery/wins
```

**参数**:
- `page`: 页码 (默认1)
- `limit`: 每页数量 (默认20)
- `period`: 时间段 (week/month/year/all)

**响应**:
```json
{
  "success": true,
  "data": {
    "wins": [...],
    "statistics": {
      "totalWins": 5,
      "totalPrize": 299.99,
      "averagePrize": 59.99,
      "maxPrize": 299.99,
      "prizeDistribution": {
        "jackpot": 1,
        "major": 0,
        "medium": 2,
        "minor": 2
      }
    }
  }
}
```

### 3. 获取抽奖统计

**请求**:
```
GET /api/lottery/statistics
```

**参数**:
- `period`: 时间段 (week/month/year/all)
- `type`: 类型筛选 (paid/free/all)

**响应**:
```json
{
  "success": true,
  "data": {
    "totalParticipations": 100,
    "totalWins": 5,
    "totalWinnings": 299.99,
    "totalAmountSpent": 500.00,
    "winRate": 0.05,
    "monthlyStats": [...],
    "categoryStats": [...],
    "typeStats": {...},
    "participationPatterns": {...},
    "recentTrends": {...}
  }
}
```

### 4. 发送中奖通知

**请求**:
```
POST /api/notifications/win
```

**请求体**:
```json
{
  "participationId": "uuid",
  "notificationType": "telegram"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "notificationId": "uuid",
    "telegramSent": true,
    "prize": 299.99,
    "message": "中奖通知已发送"
  }
}
```

## 技术实现

### 前端技术栈

- **Next.js 14**: React框架和SSR支持
- **TypeScript**: 类型安全
- **Tailwind CSS**: 响应式设计
- **React i18next**: 多语言国际化
- **date-fns**: 日期处理
- **Service Worker**: 离线缓存支持

### 后端技术栈

- **Next.js API Routes**: 后端API
- **Prisma**: 数据库ORM
- **PostgreSQL**: 数据库
- **Telegraf**: Telegram Bot框架

### 性能优化

1. **前端优化**
   - 组件懒加载
   - 图片优化
   - 缓存策略
   - 无限滚动

2. **后端优化**
   - 数据库索引优化
   - 查询优化
   - 分页加载
   - 缓存机制

3. **用户体验优化**
   - 骨架屏加载
   - 平滑动画
   - 离线支持
   - 错误边界

## 部署指南

### 环境要求

- Node.js 18+
- PostgreSQL 12+
- Redis (可选，用于缓存)

### 配置环境变量

```env
# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/luckymart

# Telegram Bot配置
TELEGRAM_BOT_TOKEN=your_bot_token
MINI_APP_URL=https://your-domain.com

# 应用配置
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 数据库迁移

```bash
# 安装依赖
npm install

# 数据库迁移
npx prisma migrate dev

# 生成Prisma客户端
npx prisma generate
```

### 启动应用

```bash
# 开发环境
npm run dev

# 生产环境
npm run build
npm start
```

## 测试策略

### 单元测试

- 组件测试
- API测试
- 工具函数测试

### 集成测试

- 端到端测试
- API集成测试
- 数据库测试

### 性能测试

- 页面加载性能
- API响应时间
- 数据库查询性能

## 监控与日志

### 应用监控

- 错误监控
- 性能监控
- 用户行为分析

### 日志记录

- 访问日志
- 错误日志
- 业务日志
- 通知发送日志

## 安全考虑

### 数据安全

- 用户认证
- 数据加密
- SQL注入防护
- XSS防护

### 通知安全

- 频率限制
- 防重复发送
- 权限验证
- 数据验证

## 扩展计划

### 功能扩展

1. **高级筛选**
   - 按日期范围筛选
   - 按金额范围筛选
   - 按商品分类筛选

2. **数据导出**
   - Excel导出
   - PDF报告
   - CSV格式

3. **通知增强**
   - 邮件通知
   - 短信通知
   - 推送通知

4. **分析功能**
   - 趋势分析
   - 对比分析
   - 预测分析

### 技术优化

1. **性能优化**
   - CDN加速
   - 数据库优化
   - 缓存优化

2. **监控增强**
   - 实时监控
   - 告警机制
   - 自动化运维

## 常见问题

### Q: 如何处理离线状态？
A: 系统使用Service Worker缓存数据，在离线时显示缓存的记录。

### Q: 如何避免重复通知？
A: 系统在notifications表中记录已发送的通知，检查重复性。

### Q: 如何优化大数据量加载？
A: 使用分页加载和虚拟滚动，同时优化数据库查询。

### Q: 如何处理多语言显示？
A: 使用react-i18next进行国际化，根据用户语言设置显示对应内容。

## 联系信息

- **开发团队**: LuckyMart TJ开发组
- **技术支持**: support@luckymart.tj
- **项目地址**: https://github.com/luckymart/luckymart-tj

---

*文档版本: v1.0*  
*最后更新: 2024-01-01*  
*下次审查: 2024-02-01*