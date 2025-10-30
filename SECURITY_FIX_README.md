# 用户地址权限和安全验证修复 - 使用说明

## 📋 修复概述

本次修复解决了用户地址操作权限问题，完善了提现验证机制，并建立了全面的安全防护体系。

## 🚀 快速部署

### 方法一：使用自动部署脚本（推荐）

1. **设置脚本权限**：
   ```bash
   chmod +x deploy-security-fixes.sh
   ```

2. **运行部署脚本**：
   ```bash
   ./deploy-security-fixes.sh
   ```

3. **跟随提示操作**：
   - 输入数据库连接信息
   - 脚本会自动处理所有步骤

### 方法二：手动部署

#### 1. 数据库迁移
```bash
# 运行安全权限修复迁移
psql -d your_database -f supabase/migrations/1763100200_security_permissions_fix.sql
```

#### 2. 安装依赖
```bash
npm install zod isomorphic-dompurify
```

#### 3. 备份现有文件
```bash
# 创建备份目录
mkdir -p backups/$(date +%Y%m%d_%H%M%S)

# 备份API文件
cp app/api/user/addresses/route.ts backups/$(date +%Y%m%d_%H%M%S)/user_addresses_route.backup
cp app/api/user/addresses/[id]/route.ts backups/$(date +%Y%m%d_%H%M%S)/user_addresses_id_route.backup
cp app/api/withdraw/create/route.ts backups/$(date +%Y%m%d_%H%M%S)/withdraw_create_route.backup
```

#### 4. 替换API文件
```bash
# 用户地址API
cp app/api/user/addresses-fixed/route.ts app/api/user/addresses/route.ts
cp app/api/user/addresses-fixed/[id]/route.ts app/api/user/addresses/[id]/route.ts

# 提现API
cp app/api/withdraw/create-fixed/route.ts app/api/withdraw/create/route.ts
```

#### 5. 清理临时文件
```bash
rm -rf app/api/user/addresses-fixed
rm -rf app/api/withdraw/create-fixed
```

## 📁 文件结构

修复后的文件结构：

```
├── app/api/
│   ├── user/addresses/route.ts          # 增强的用户地址列表/创建API
│   ├── user/addresses/[id]/route.ts     # 增强的用户地址更新/删除API
│   └── withdraw/create/route.ts         # 增强的提现API
├── lib/
│   ├── security-validation.ts           # 安全验证和清洗工具
│   ├── security-middleware.ts           # 全局安全中间件
│   └── [其他现有文件]
├── supabase/migrations/
│   └── 1763100200_security_permissions_fix.sql  # 数据库迁移脚本
└── docs/
    └── user_address_security_fix_report.md      # 详细修复报告
```

## 🔧 配置说明

### 环境变量配置

确保 `.env.local` 文件中包含以下配置：

```env
# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/database

# JWT配置
JWT_SECRET=your-secure-jwt-secret-key
JWT_REFRESH_SECRET=your-secure-refresh-secret-key
JWT_ADMIN_SECRET=your-secure-admin-secret-key

# Telegram配置
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# 安全配置
NODE_ENV=development
```

### 频率限制配置

可以在代码中调整频率限制参数：

```typescript
// 地址操作限制
const ADDRESS_RATE_LIMITS = {
  CREATE: { limit: 10, windowMs: 60 * 60 * 1000 }, // 每小时最多10次
  UPDATE: { limit: 20, windowMs: 60 * 60 * 1000 }, // 每小时最多20次
  DELETE: { limit: 10, windowMs: 60 * 60 * 1000 }, // 每小时最多10次
};

// 提现操作限制
const WITHDRAW_RATE_LIMITS = {
  CREATE: { limit: 5, windowMs: 24 * 60 * 60 * 1000 }, // 每天最多5次
};
```

### 提现业务限制配置

```typescript
const WITHDRAW_CONFIG = {
  MIN_AMOUNT: 50,        // 最低提现金额
  MAX_AMOUNT: 10000,     // 最高提现金额
  DAILY_LIMIT: 50000,    // 每日提现总限制
  MONTHLY_LIMIT: 500000, // 每月提现总限制
};
```

## 🧪 测试验证

### 1. API功能测试

测试用户地址API：
```bash
# 获取地址列表
curl -X GET "http://localhost:3000/api/user/addresses" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 创建地址
curl -X POST "http://localhost:3000/api/user/addresses" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientName": "张三",
    "recipientPhone": "13800138000",
    "province": "北京市",
    "city": "北京市",
    "detailAddress": "朝阳区某某街道123号",
    "isDefault": true
  }'
```

测试提现API：
```bash
curl -X POST "http://localhost:3000/api/withdraw/create" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "paymentMethod": "alif_mobi",
    "paymentAccount": "account@example.com",
    "verificationCode": "123456"
  }'
```

### 2. 安全功能测试

测试频率限制：
```bash
# 快速连续请求，测试频率限制
for i in {1..15}; do
  curl -X GET "http://localhost:3000/api/user/addresses" \
    -H "Authorization: Bearer YOUR_TOKEN" &
done
```

测试SQL注入防护：
```bash
curl -X GET "http://localhost:3000/api/user/addresses?id=1'; DROP TABLE users; --" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. 数据库验证

检查安全日志：
```sql
SELECT * FROM security_logs ORDER BY created_at DESC LIMIT 10;
```

检查用户活动：
```sql
SELECT * FROM user_activities ORDER BY created_at DESC LIMIT 10;
```

检查提现申请表：
```sql
SELECT id, amount, status, risk_score, requires_manual_review 
FROM withdraw_requests 
ORDER BY created_at DESC LIMIT 5;
```

## 📊 监控和维护

### 1. 定期检查

每周检查：
- 安全日志中的异常事件
- 频率限制命中率
- 风险评分分布

每月检查：
- 清理过期数据
- 性能指标分析
- 安全策略优化

### 2. 关键监控指标

- **频率限制命中率**：应保持在合理范围（< 5%）
- **安全事件频率**：异常活动应立即处理
- **API响应时间**：安全检查不应显著影响性能
- **风险评分分布**：大部分操作应为低风险

### 3. 日志清理

定期执行数据清理：
```sql
-- 清理过期的SMS验证码
DELETE FROM sms_verifications WHERE expires_at < NOW() - INTERVAL '1 hour';

-- 清理过期的频率限制记录
DELETE FROM rate_limit_logs WHERE window_end < NOW() - INTERVAL '1 day';

-- 清理30天前的安全日志（可选）
DELETE FROM security_logs WHERE created_at < NOW() - INTERVAL '30 days';
```

## 🚨 故障排除

### 常见问题

1. **提现API返回500错误**
   - 检查数据库连接配置
   - 确认 `atomic_balance_deduction` 函数是否存在
   - 查看安全日志表中的错误信息

2. **频率限制过于严格**
   - 调整 `GLOBAL_RATE_LIMITS` 中的限制值
   - 考虑为特定IP或用户添加白名单

3. **安全日志记录失败**
   - 检查 `security_logs` 表是否存在
   - 确认数据库权限配置

4. **输入验证过于严格**
   - 检查 `security-validation.ts` 中的验证规则
   - 根据业务需要调整验证模式

### 恢复操作

如果需要回滚到修复前状态：

1. **恢复API文件**：
   ```bash
   # 从备份恢复
   cp backups/YYYYMMDD_HHMMSS/user_addresses_route.backup app/api/user/addresses/route.ts
   cp backups/YYYYMMDD_HHMMSS/user_addresses_id_route.backup app/api/user/addresses/[id]/route.ts
   cp backups/YYYYMMDD_HHMMSS/withdraw_create_route.backup app/api/withdraw/create/route.ts
   ```

2. **恢复数据库**：
   ```bash
   # 如果需要回滚数据库更改，请从备份恢复
   psql -d your_database -f your_backup.sql
   ```

## 📞 支持联系

如果在部署过程中遇到问题：

1. 查看详细的修复报告：`docs/user_address_security_fix_report.md`
2. 检查安全日志获取错误详情
3. 参考故障排除部分
4. 联系技术支持团队

## 📝 更新日志

- **v1.0.0** (2025-10-31): 初始安全修复版本
  - 用户地址权限修复
  - 提现验证增强
  - 频率限制机制
  - 输入验证和清洗
  - SQL注入和XSS防护

---

**重要提醒**：请在生产环境部署前，先在测试环境中充分验证所有功能。