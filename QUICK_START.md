# 🚀 LuckyMart TJ 快速启动指南

## 📦 项目信息

- **项目路径**: `/workspace/luckymart-tj/`
- **技术栈**: Next.js 14 + TypeScript + Tailwind CSS + Supabase
- **完成度**: 95%

---

## ⚡ 快速开始（5 分钟）

### 1. 安装依赖

```bash
cd /workspace/luckymart-tj
pnpm install
```

### 2. 配置环境变量（已完成）

`.env.local` 文件已配置好，包含：
- ✅ Supabase URL 和 Keys
- ✅ JWT Secret
- ✅ 数据库连接
- ⚠️ 需要配置: `TELEGRAM_BOT_TOKEN`

### 3. 启动开发服务器

```bash
pnpm dev
```

访问: http://localhost:3000

---

## 🗄️ 数据库设置

### Supabase 已配置
- ✅ 14 张数据表已创建
- ✅ 测试数据已插入
  - 5 个充值礼包（10-500 TJS）
  - 3 个测试商品

### 测试数据
- **充值礼包**: 10, 50, 100, 200, 500 TJS
- **商品**: iPhone 15 Pro, AirPods Pro, MacBook Pro

---

## 🔑 关键配置

### 必需配置（启动前）

#### 1. Telegram Bot Token
```bash
# 获取 Token: 访问 @BotFather
# 编辑 .env.local
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

#### 2. 管理员账号（已配置）
```
用户名: admin
密码: admin123456
```

⚠️ **生产环境请修改默认密码！**

---

## 📱 Telegram Bot 启动

### 启动 Bot
```bash
npx ts-node bot/index.ts
```

### 可用命令
- `/start` - 开始使用
- `/balance` - 查询余额
- `/orders` - 查看订单
- `/profile` - 个人资料
- `/language` - 切换语言
- `/help` - 帮助信息
- `/support` - 联系客服

---

## 🔧 Supabase Edge Functions 部署

### 自动开奖任务
```bash
supabase functions deploy auto-draw --project-ref ijcbozvagquzwgjvxtsu
```

配置 Cron（每 5 分钟）:
```sql
-- 在 Supabase Dashboard 的 Database > Cron Jobs 中添加
SELECT cron.schedule(
  'auto-draw-job',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://ijcbozvagquzwgjvxtsu.supabase.co/functions/v1/auto-draw',
    headers:='{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

### 免费次数重置
```bash
supabase functions deploy reset-free-count --project-ref ijcbozvagquzwgjvxtsu
```

配置 Cron（每天 0:00）:
```sql
SELECT cron.schedule(
  'reset-free-count-job',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url:='https://ijcbozvagquzwgjvxtsu.supabase.co/functions/v1/reset-free-count',
    headers:='{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

---

## 🌐 访问入口

### 用户端
- 首页: http://localhost:3000
- 商品详情: http://localhost:3000/product/1
- 个人中心: http://localhost:3000/profile
- 充值页: http://localhost:3000/recharge
- 提现页: http://localhost:3000/withdraw
- 地址管理: http://localhost:3000/addresses
- 转售市场: http://localhost:3000/resale
- 订单列表: http://localhost:3000/orders

### 管理后台
- 登录页: http://localhost:3000/admin
- 仪表盘: http://localhost:3000/admin/dashboard
- 订单管理: http://localhost:3000/admin/orders
- 提现审核: http://localhost:3000/admin/withdrawals

---

## 🧪 测试流程

### 1. 用户注册测试
```
1. 访问首页
2. 使用 Telegram 登录（需要配置 Bot）
3. 自动获得 50 夺宝币
```

### 2. 夺宝功能测试
```
1. 浏览商品列表
2. 点击商品进入详情页
3. 点击"参与夺宝"
4. 使用免费次数或夺宝币参与
5. 等待期次满员自动开奖
```

### 3. 充值功能测试
```
1. 进入充值页面
2. 选择充值礼包
3. 选择支付方式
4. 查看支付信息
5. （模拟）联系客服核销
```

### 4. 提现功能测试
```
1. 进入提现页面
2. 输入提现金额（≥50 TJS）
3. 选择支付方式
4. 输入收款账号
5. 提交申请
6. 管理后台审核
```

### 5. 地址管理测试
```
1. 进入地址管理
2. 添加新地址
3. 编辑地址
4. 设置默认地址
5. 删除地址
```

### 6. 转售功能测试
```
1. 中奖后在订单页创建转售
2. 设置转售价格
3. 在转售市场查看商品
4. 其他用户购买转售商品
5. 自动完成交易
```

### 7. 管理后台测试
```
1. 访问 /admin 登录
2. 查看仪表盘统计
3. 进入订单管理，处理发货
4. 进入提现审核，通过/拒绝申请
```

---

## 📊 API 测试

### 使用 cURL 测试

#### 1. 商品列表
```bash
curl http://localhost:3000/api/products/list
```

#### 2. 用户资料（需要 Token）
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/user/profile
```

#### 3. 创建地址
```bash
curl -X POST http://localhost:3000/api/user/addresses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "recipientName": "张三",
    "recipientPhone": "+992123456789",
    "province": "杜尚别",
    "city": "杜尚别市",
    "detailAddress": "测试街道123号",
    "isDefault": true
  }'
```

---

## 🔍 调试技巧

### 前端调试
- 打开浏览器开发者工具（F12）
- 查看 Console 标签页的日志
- 查看 Network 标签页的 API 请求

### 后端调试
- 查看终端的 Next.js 日志
- API 错误会在控制台输出详细信息

### Bot 调试
- Bot 日志会输出到运行终端
- 检查 Telegram Bot Token 是否正确

### Supabase 调试
- 访问 Supabase Dashboard
- 查看 Table Editor 验证数据
- 查看 Edge Functions 日志

---

## 📝 常见问题

### Q1: 启动报错 "Module not found"
```bash
# 删除 node_modules 和 lock 文件重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Q2: 数据库连接失败
- 检查 `.env.local` 中的数据库配置
- 确认 Supabase 项目状态正常
- 检查网络连接

### Q3: Telegram Bot 无响应
- 确认 `TELEGRAM_BOT_TOKEN` 已配置
- 检查 Bot 是否正在运行
- 访问 @BotFather 确认 Bot 状态

### Q4: 充值/提现功能不可用
- 目前是模拟支付
- 需要集成真实支付 API
- 管理员需要手动核销

### Q5: 开奖不自动触发
- 确认 Edge Functions 已部署
- 检查 Cron Jobs 配置
- 手动调用 `/api/lottery/draw` 测试

---

## 🚢 生产环境部署

### 1. Vercel 部署
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录并部署
vercel login
vercel --prod
```

### 2. 环境变量配置
在 Vercel Dashboard 中配置所有环境变量

### 3. Telegram Bot 部署
使用 PM2 或 systemd 保持运行:
```bash
pm2 start bot/index.ts --name luckymart-bot
pm2 save
pm2 startup
```

### 4. 域名配置
- 在 Vercel 绑定自定义域名
- 更新 `.env.local` 中的 `MINI_APP_URL`
- 在 @BotFather 设置 Mini App URL

---

## 📞 技术支持

### 文档
- `README.md` - 完整项目说明
- `FEATURE_CHECKLIST.md` - 功能清单
- `PROJECT_COMPLETION.md` - 完成总结

### 联系方式
- 开发者: MiniMax Agent
- 项目时间: 2025-10-28
- 完成度: 95%

---

## ✅ 启动检查清单

在启动项目前，确认以下项目：

- [ ] 依赖已安装（`pnpm install`）
- [ ] 环境变量已配置（`.env.local`）
- [ ] Supabase 数据库正常
- [ ] Telegram Bot Token 已配置（可选）
- [ ] 开发服务器已启动（`pnpm dev`）
- [ ] 可以访问 http://localhost:3000
- [ ] API 端点可以正常响应
- [ ] 管理后台可以登录

---

## 🎉 开始使用

所有准备就绪！现在可以：

1. 启动开发服务器: `pnpm dev`
2. 访问首页开始测试
3. 尝试各种功能
4. 查看管理后台

**祝你使用愉快！** 🚀

---

_最后更新: 2025-10-28_
