# Telegram Bot 部署和使用指南

## Bot 信息
- **Bot Token**: `8074258399:AAG1WdyCJe4vphx9YB3B6z60nTE3dhBBP-Q`
- **Bot Username**: @LuckyMartTJ_bot（需要在BotFather中查看确切用户名）

## 一、Bot 部署状态

### 检查Bot是否已部署

登录服务器查看PM2进程：
```bash
ssh root@47.243.83.253
pm2 list
```

如果看到`luckymart-bot`进程：
- **Status: online** - Bot正常运行
- **Status: stopped/errored** - Bot需要重启或修复

### 部署Bot到服务器

如果Bot未部署或需要重新部署：

```bash
# 1. 进入项目目录
cd /var/www/luckymart-tj

# 2. 编译TypeScript（Bot代码）
npx tsc bot/index.ts --outDir dist/bot --esModuleInterop --resolveJsonModule --module commonjs

# 3. 使用PM2启动Bot
pm2 start dist/bot/index.js --name luckymart-bot

# 4. 保存PM2配置（开机自启）
pm2 save

# 5. 查看Bot日志
pm2 logs luckymart-bot
```

### 常用Bot管理命令

```bash
# 重启Bot
pm2 restart luckymart-bot

# 停止Bot
pm2 stop luckymart-bot

# 查看Bot实时日志
pm2 logs luckymart-bot --lines 100

# 查看Bot状态
pm2 info luckymart-bot
```

## 二、如何在Telegram中创建用户

### 方法1：通过Bot的 /start 命令（推荐）

1. **打开Telegram应用**

2. **搜索Bot**
   - 在搜索框输入: `@你的bot用户名`（例如：`@LuckyMartTJ_bot`）
   - 或直接访问: `https://t.me/你的bot用户名`

3. **启动Bot**
   - 点击"START"按钮或输入 `/start`
   - Bot会自动：
     - 创建用户账户（关联Telegram ID）
     - 赠送50夺宝币（新用户奖励）
     - 设置每日3次免费参与
     - 显示欢迎消息和功能按钮

4. **验证用户创建成功**
   - 输入 `/balance` 查看账户余额
   - 应该显示：
     ```
     夺宝币：50 币
     平台余额：0 TJS
     VIP等级：0
     今日免费次数：3/3
     ```

### 方法2：通过Web端注册（如果实现了注册功能）

1. 访问网站: `http://47.243.83.253:3000`
2. 点击"注册"或"登录"
3. 使用Telegram登录（Telegram Login Widget）

## 三、Bot核心命令使用

### 用户命令

| 命令 | 功能 | 示例 |
|------|------|------|
| `/start` | 注册并启动Bot，显示主菜单 | `/start` |
| `/balance` | 查询账户余额和VIP等级 | `/balance` |
| `/orders` | 查看最近订单记录 | `/orders` |
| `/myproducts` | 查看我的夺宝记录 | `/myproducts` |
| `/help` | 查看帮助信息 | `/help` |
| `/settings` | 个人设置（语言、通知） | `/settings` |

### 管理员命令（需要配置）

| 命令 | 功能 | 限制 |
|------|------|------|
| `/admin` | 进入管理模式 | 仅管理员 |
| `/stats` | 查看平台统计数据 | 仅管理员 |
| `/broadcast` | 群发消息 | 仅管理员 |

## 四、Bot与Web端交互流程

### 完整用户旅程

1. **冷启动（Telegram Bot）**
   ```
   用户 -> Telegram Bot -> /start
   Bot -> 创建账户 -> 赠送50币 -> 显示主菜单
   Bot -> "进入幸运集市" 按钮 -> 打开Mini App (Web)
   ```

2. **浏览和参与（Web端）**
   ```
   用户 -> Web端 -> 浏览商品 -> 选择商品 -> 参与夺宝
   Web -> 调用API -> 扣除夺宝币 -> 分配号码 -> 返回结果
   ```

3. **开奖通知（Bot推送）**
   ```
   系统 -> 自动开奖 -> 确定中奖者
   Bot -> 推送通知 -> "@username 恭喜中奖！"
   Bot -> 提示填写收货地址 -> 打开地址填写页面
   ```

4. **订单履约（Bot+Web）**
   ```
   用户 -> 填写地址 -> 提交
   管理员 -> Web后台 -> 标记发货
   Bot -> 推送发货通知 -> 用户查看物流
   ```

## 五、Bot通知推送功能

Bot会在以下场景自动推送消息给用户：

### 1. 中奖通知
```
🎉 恭喜中奖！

商品：iPhone 15 Pro
中奖号码：10000042
您已成功中奖，请点击下方按钮填写收货地址。

[填写地址] [查看订单]
```

### 2. 发货通知
```
📦 您的订单已发货

订单编号：ORD20250129001
商品：iPhone 15 Pro
物流公司：顺丰速运
运单号：SF1234567890

[查看物流] [联系客服]
```

### 3. 提现审核通知
```
💰 提现审核结果

提现金额：100 TJS
审核状态：已通过 ✅
预计到账时间：24小时内

[查看记录]
```

### 4. 充值成功通知
```
💳 充值成功

充值金额：50 TJS
获得夺宝币：50 币
当前余额：120 币

[开始夺宝]
```

## 六、测试Bot功能

### 测试步骤

1. **测试用户注册**
   ```bash
   # 在Telegram中
   -> 搜索 @你的bot用户名
   -> 点击 START
   -> 检查是否收到欢迎消息
   ```

2. **测试余额查询**
   ```bash
   -> 输入 /balance
   -> 检查是否显示：50夺宝币、0平台余额
   ```

3. **测试Web端跳转**
   ```bash
   -> 点击 "进入幸运集市" 按钮
   -> 检查是否打开 http://47.243.83.253:3000
   ```

4. **测试管理后台**
   ```bash
   # 在Web端
   -> 访问 http://47.243.83.253:3000/admin
   -> 登录: admin / admin123456
   -> 查看用户管理 -> 应该看到新注册的用户
   ```

5. **测试商品参与**
   ```bash
   # 在Web端
   -> 选择一个商品 -> 点击详情
   -> 选择份数 -> 点击"立即参与"
   -> 检查是否扣除夺宝币、分配号码
   ```

6. **检查数据库**
   ```bash
   # 登录服务器
   ssh root@47.243.83.253
   cd /var/www/luckymart-tj
   
   # 运行Prisma Studio（图形化查看数据）
   npx prisma studio
   # 或使用SQL查询
   # 连接到Supabase PostgreSQL并查询users表
   ```

## 七、常见问题排查

### 问题1：Bot无响应

**症状**：发送 `/start` 没有回复

**排查步骤**：
```bash
# 1. 检查Bot进程状态
pm2 list
pm2 logs luckymart-bot --lines 50

# 2. 检查环境变量
cat /var/www/luckymart-tj/.env.local | grep TELEGRAM

# 3. 测试Bot Token是否有效
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe
```

**解决方案**：
- 如果进程stopped：`pm2 restart luckymart-bot`
- 如果Token无效：在BotFather重新生成Token，更新.env.local
- 如果网络错误：检查服务器防火墙

### 问题2：用户创建失败

**症状**：Bot响应但数据库没有用户记录

**排查步骤**：
```bash
# 1. 查看Bot日志中的错误
pm2 logs luckymart-bot --lines 100 | grep "error"

# 2. 检查数据库连接
cd /var/www/luckymart-tj
npx ts-node -e "
import { prisma } from './lib/prisma';
prisma.users.count().then(count => console.log('用户数:', count));
"
```

**解决方案**：
- 检查DATABASE_URL配置
- 确认Prisma client已生成：`npx prisma generate`
- 检查数据库Schema：`npx prisma db push`

### 问题3：Web端和Bot用户不同步

**症状**：Bot创建了用户，但Web端登录失败

**原因**：Bot创建用户时没有生成JWT token

**解决方案**：
- Web端需要使用Telegram ID登录
- 或在用户表添加password字段，Bot创建用户时生成默认密码

## 八、Bot代码结构

### 文件位置
```
luckymart-tj/
├── bot/
│   └── index.ts           # Bot主文件
├── lib/
│   ├── prisma.ts          # 数据库客户端
│   └── auth.ts            # 认证工具
└── .env.local             # 环境变量
```

### 关键代码

**用户注册逻辑** (bot/index.ts)：
```typescript
bot.command('start', async (ctx) => {
  const telegramId = ctx.from.id;
  const username = ctx.from.username;
  const firstName = ctx.from.first_name;

  // 检查用户是否已存在
  let user = await prisma.users.findUnique({
    where: { telegramId: BigInt(telegramId) }
  });

  // 如果不存在，创建新用户
  if (!user) {
    user = await prisma.users.create({
      data: {
        telegramId: BigInt(telegramId),
        username: username || `user_${telegramId}`,
        firstName: firstName || '',
        balance: 50,  // 新用户赠送50币
        freeDailyCount: 3,
        language: 'zh'
      }
    });
  }

  // 发送欢迎消息
  await ctx.reply('欢迎来到LuckyMart TJ！', ...);
});
```

## 九、下一步

1. **配置Bot Webhook（可选）**
   - 当前使用Long Polling
   - 生产环境建议使用Webhook提高性能

2. **添加更多Bot命令**
   - `/lottery` - 快速参与夺宝
   - `/winners` - 查看最近中奖记录
   - `/invite` - 邀请好友赚奖励

3. **完善通知推送**
   - 确保Edge Function正确调用Bot API推送消息
   - 测试所有通知场景

4. **监控和日志**
   - 设置PM2监控告警
   - 集成日志分析工具

## 十、联系方式

- **技术文档**: `/workspace/docs/complete_technical_document.md`
- **API文档**: `/workspace/luckymart-tj/README.md`
- **部署文档**: `/workspace/ALIYUN_DEPLOYMENT_GUIDE.md`

---

**最后更新时间**: 2025-10-29
**版本**: v1.0
