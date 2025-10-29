# LuckyMart TJ - 一元夺宝平台

基于 Telegram 的塔吉克斯坦一元夺宝电商平台，采用 Next.js 全栈架构 + Supabase 后端。

## 📋 项目概述

- **项目名称**: LuckyMart TJ
- **技术栈**: Next.js 14 + TypeScript + Tailwind CSS + Supabase + Telegram Bot
- **目标市场**: 塔吉克斯坦
- **支持语言**: 中文、英文、俄文

## 🎯 核心功能

### 用户端功能
- ✅ Telegram 登录认证（新用户赠送 50 夺宝币）
- ✅ 商品浏览（支持分类、分页、多语言）
- ✅ 参与夺宝（每日免费 1 次）
- ✅ 账户充值（支持 Alif Mobi、DC Bank）
- ✅ 提现申请（最低 50 TJS，5% 手续费）
- ✅ 收货地址管理（增删改查、设置默认）
- ✅ 订单管理（查看订单、物流跟踪）
- ✅ 转售市场（一键转售、购买转售商品）
- ✅ 交易记录查询

### 管理后台
- ✅ 管理员登录
- ✅ 数据统计仪表盘
- ✅ 订单管理（发货处理）
- ✅ 提现审核（通过/拒绝）
- ✅ 商品管理（待完善）

### Telegram Bot
- ✅ 7 个核心命令（/start, /balance, /orders, /help, /language, /profile, /support）
- ✅ 多语言切换
- ✅ 通知推送（中奖、发货、提现审核等）

### 定时任务
- ✅ 自动开奖（每 5 分钟检查已满期次）
- ✅ 免费次数重置（每日凌晨）

## 🗄️ 数据库设计

### 核心数据表（14 张）
- `users` - 用户表
- `user_addresses` - 用户地址表
- `products` - 商品表
- `lottery_rounds` - 夺宝期次表
- `participations` - 参与记录表
- `orders` - 订单表
- `transactions` - 交易记录表
- `resale_listings` - 转售商品表
- `withdraw_requests` - 提现申请表
- `recharge_packages` - 充值礼包表
- `notifications` - 通知表
- `admins` - 管理员表

## 🚀 快速开始

### 1. 安装依赖

```bash
cd /workspace/luckymart-tj
pnpm install
```

### 2. 配置环境变量

项目已配置好 `.env.local` 文件，包含：
- Supabase 连接信息
- JWT 密钥
- 数据库连接（需要配置）
- Telegram Bot Token（需要配置）

**重要**: 需要配置 `TELEGRAM_BOT_TOKEN`

### 3. 生成 Prisma Client

```bash
npx prisma generate
```

### 4. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

### 5. 启动 Telegram Bot（可选）

```bash
npx ts-node bot/index.ts
```

## 📁 项目结构

```
luckymart-tj/
├── app/                      # Next.js App Router
│   ├── api/                  # API 路由
│   │   ├── auth/            # 认证 API
│   │   ├── products/        # 商品 API
│   │   ├── lottery/         # 夺宝 API
│   │   ├── user/            # 用户 API
│   │   ├── orders/          # 订单 API
│   │   ├── payment/         # 支付 API
│   │   ├── withdraw/        # 提现 API
│   │   ├── resale/          # 转售 API
│   │   └── admin/           # 管理员 API
│   ├── admin/               # 管理后台页面
│   ├── recharge/            # 充值页面
│   ├── withdraw/            # 提现页面
│   ├── addresses/           # 地址管理页面
│   ├── resale/              # 转售市场页面
│   ├── profile/             # 个人中心
│   └── orders/              # 订单列表
├── lib/                     # 核心工具库
│   ├── supabase.ts         # Supabase 客户端
│   ├── auth.ts             # 认证工具
│   ├── utils.ts            # 通用工具函数
│   └── lottery.ts          # 开奖算法（VRF）
├── types/                   # TypeScript 类型定义
├── bot/                     # Telegram Bot
│   └── index.ts            # Bot 主文件
├── supabase/               # Supabase 配置
│   └── functions/          # Edge Functions
│       ├── auto-draw/      # 自动开奖任务
│       └── reset-free-count/ # 重置免费次数
└── prisma/                 # Prisma 配置
    └── schema.prisma       # 数据库 Schema
```

## 🔑 核心 API 端点

### 认证
- `POST /api/auth/telegram` - Telegram 登录/注册

### 商品
- `GET /api/products/list` - 商品列表
- `GET /api/products/[id]` - 商品详情

### 夺宝
- `POST /api/lottery/participate` - 参与夺宝
- `POST /api/lottery/draw` - 开奖（自动触发）

### 用户
- `GET /api/user/profile` - 用户资料
- `GET /api/user/addresses` - 地址列表
- `POST /api/user/addresses` - 创建地址
- `PUT /api/user/addresses/[id]` - 更新地址
- `DELETE /api/user/addresses/[id]` - 删除地址

### 订单
- `GET /api/orders/list` - 订单列表
- `GET /api/orders/[id]` - 订单详情

### 支付
- `GET /api/payment/packages` - 充值礼包列表
- `POST /api/payment/recharge` - 创建充值订单

### 提现
- `POST /api/withdraw/create` - 创建提现申请
- `GET /api/withdraw/list` - 提现记录

### 转售
- `POST /api/resale/create` - 创建转售
- `GET /api/resale/list` - 转售商品列表
- `POST /api/resale/purchase/[id]` - 购买转售商品

### 管理员
- `POST /api/admin/login` - 管理员登录
- `GET /api/admin/orders` - 订单列表
- `POST /api/admin/orders` - 发货处理
- `GET /api/admin/withdrawals` - 提现列表
- `POST /api/admin/withdrawals` - 提现审核

## 🎨 前端页面

### 用户端
- `/` - 首页（商品列表）
- `/product/[id]` - 商品详情
- `/profile` - 个人中心
- `/recharge` - 充值页面
- `/withdraw` - 提现页面
- `/addresses` - 地址管理
- `/resale` - 转售市场
- `/orders` - 订单列表

### 管理后台
- `/admin` - 登录页
- `/admin/dashboard` - 仪表盘
- `/admin/orders` - 订单管理
- `/admin/withdrawals` - 提现审核
- `/admin/products` - 商品管理（待完善）

## 🤖 Telegram Bot 命令

- `/start` - 开始使用，打开 Mini App
- `/balance` - 查询余额
- `/orders` - 查看订单
- `/profile` - 个人资料
- `/language` - 切换语言（中英俄）
- `/help` - 帮助信息
- `/support` - 联系客服

## ⏰ 定时任务

### 自动开奖
- **频率**: 每 5 分钟
- **功能**: 检查已满的夺宝期次并自动开奖
- **文件**: `supabase/functions/auto-draw/index.ts`

### 免费次数重置
- **频率**: 每天凌晨 0:00
- **功能**: 重置所有用户的免费夺宝次数为 1
- **文件**: `supabase/functions/reset-free-count/index.ts`

## 🔐 安全特性

- JWT Token 认证
- Telegram WebApp 数据验证（HMAC-SHA256）
- VRF 可验证随机开奖算法
- 管理员权限验证
- SQL 注入防护（Prisma ORM）

## 💳 支付集成

目前支持模拟支付，预留真实支付接口：
- **Alif Mobi**: 塔吉克斯坦主流移动支付
- **DC Bank**: 银行转账

## 📊 业务流程

### 夺宝流程
1. 用户浏览商品
2. 选择商品参与夺宝（消耗夺宝币或使用免费次数）
3. 系统分配参与号码
4. 期次售罄后自动开奖
5. 中奖用户收到通知
6. 填写收货地址
7. 管理员发货
8. 用户收货或选择转售

### 充值流程
1. 用户选择充值礼包
2. 选择支付方式（Alif Mobi / DC Bank）
3. 完成支付
4. 联系客服核销
5. 系统到账

### 提现流程
1. 用户提交提现申请
2. 系统扣除金额和手续费
3. 管理员审核
4. 审核通过后 1-3 个工作日到账
5. 审核拒绝则退回金额

### 转售流程
1. 中奖用户创建转售（设置转售价格）
2. 商品上架转售市场
3. 其他用户购买
4. 系统自动处理交易
5. 卖家获得转售收入
6. 买家获得商品

## 🐛 调试与日志

- 前端：浏览器控制台
- 后端 API：Next.js 控制台
- Telegram Bot：Bot 运行日志
- Supabase Functions：Supabase Dashboard 日志

## 📝 待完善功能

- [ ] 商品管理页面（上传图片、编辑商品）
- [ ] 数据统计页面（更详细的运营数据）
- [ ] 真实支付集成（Alif Mobi、DC Bank API）
- [ ] 多语言文件完善
- [ ] 单元测试
- [ ] E2E 测试
- [ ] 生产环境部署

## 🚢 部署说明

### Vercel 部署（推荐）
1. 连接 GitHub 仓库
2. 配置环境变量
3. 自动部署

### Supabase Edge Functions 部署
```bash
# 自动开奖
supabase functions deploy auto-draw

# 免费次数重置
supabase functions deploy reset-free-count
```

### Telegram Bot 部署
建议使用 PM2 或 systemd 保持 Bot 运行：
```bash
pm2 start bot/index.ts --name luckymart-bot
pm2 save
pm2 startup
```

## 📞 技术支持

- **开发者**: MiniMax Agent
- **问题反馈**: 请在 GitHub 提交 Issue
- **Telegram 支持**: @LuckyMartSupport

## 📄 许可证

MIT License

---

**开发时间**: 2025-10-28  
**版本**: v2.0  
**状态**: 开发完成，待测试部署
