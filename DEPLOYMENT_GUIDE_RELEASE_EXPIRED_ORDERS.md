# Release Expired Orders 部署指南

## 函数概述
`release-expired-orders` 是一个 Supabase Edge Function，用于处理支付超时的订单，自动释放占用的库存和期次份额。

## 部署步骤

### 1. 部署 Edge Function

#### 使用 Supabase CLI
```bash
# 进入项目目录
cd /path/to/luckymart-tj

# 部署 release-expired-orders 函数
supabase functions deploy release-expired-orders
```

#### 使用 Supabase Dashboard
1. 登录 Supabase Dashboard
2. 进入 Edge Functions 页面
3. 点击 "New Function"
4. 上传 `supabase/functions/release-expired-orders/index.ts` 文件
5. 设置函数名称为 `release-expired-orders`
6. 点击部署

### 2. 设置环境变量
确保以下环境变量已正确设置：
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. 设置定时任务

#### 使用 Supabase Dashboard
1. 进入 Database > Extensions > pg_cron
2. 确保 pg_cron 扩展已启用
3. 执行以下 SQL 创建定时任务：

```sql
-- 创建调用函数的过程
CREATE OR REPLACE PROCEDURE release_expired_orders_ccbc18dc()
LANGUAGE plpgsql
AS $$
BEGIN
PERFORM net.http_post(
    url:='https://YOUR_PROJECT_ID.supabase.co/functions/v1/release-expired-orders',
    headers:=jsonb_build_object('Content-Type', 'application/json'),
    body:='{"edge_function_name":"release-expired-orders"}',
    timeout_milliseconds:=30000
);
COMMIT;
END;
$$;

-- 设置每10分钟执行一次
SELECT cron.schedule('release-expired-orders_invoke', '*/10 * * * *', 'CALL release_expired_orders_ccbc18dc()');
```

#### 使用 pg_cron 扩展
```sql
-- 直接创建定时任务
SELECT cron.schedule(
    'release-expired-orders_invoke',
    '*/10 * * * *', -- 每10分钟执行一次
    $$
    SELECT net.http_post(
        url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/release-expired-orders',
        headers := '{"Content-Type": "application/json"}',
        body := '{"edge_function_name": "release-expired-orders"}'::jsonb
    );
    $$
);
```

### 4. 配置监控

#### 检查定时任务状态
```sql
-- 查看所有定时任务
SELECT * FROM cron.job;

-- 查看定时任务执行历史
SELECT * FROM cron.job_run_details 
WHERE jobname = 'release-expired-orders_invoke'
ORDER BY run_time DESC 
LIMIT 10;
```

#### 手动测试函数
```bash
# 使用 curl 测试
curl -X POST "https://YOUR_PROJECT_ID.supabase.co/functions/v1/release-expired-orders" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 5. 监控和维护

#### 检查日志
```bash
# 查看 Edge Function 日志
supabase functions logs release-expired-orders
```

#### 监控指标
- 成功释放的订单数量
- 失败的订单数量
- 平均处理时间
- 定时任务执行频率

#### 告警设置
建议设置以下告警：
- 连续执行失败超过3次
- 处理时间超过阈值
- 定时任务未按预期执行

## 配置参数

### ORDER_TIMEOUT_MINUTES
订单超时时间（分钟），默认30分钟。可根据业务需求调整：

```typescript
// 在 index.ts 文件中修改
const ORDER_TIMEOUT_MINUTES = 30; // 30分钟
```

### 批量处理限制
默认每次处理最多100个订单，避免系统负载过高：

```typescript
.limit(100); // 限制每次处理数量
```

## 故障排除

### 常见问题

#### 1. 函数调用失败
- 检查环境变量是否正确设置
- 验证数据库连接权限
- 查看 Edge Function 日志

#### 2. 定时任务未执行
- 确认 pg_cron 扩展已启用
- 检查定时任务配置是否正确
- 验证数据库权限

#### 3. 数据不一致
- 查看审计日志表 (notifications)
- 检查回滚日志
- 分析失败原因

#### 4. 性能问题
- 监控函数执行时间
- 检查并发执行情况
- 调整批量处理大小

### 回滚操作
如果发现数据不一致，可以手动回滚：

```sql
-- 回滚特定订单状态
UPDATE orders 
SET status = 'pending',
    payment_status = 'pending', 
    fulfillment_status = 'pending',
    updated_at = NOW()
WHERE id = 'ORDER_ID' 
AND status = 'expired';

-- 回滚库存
UPDATE products 
SET stock = stock + QUANTITY
WHERE id = 'PRODUCT_ID';

-- 回滚期次份额
UPDATE lottery_rounds 
SET sold_shares = sold_shares - QUANTITY
WHERE id = 'ROUND_ID';
```

## 安全注意事项

1. **权限控制**：确保只有系统可以调用此函数
2. **输入验证**：函数已包含输入验证逻辑
3. **审计日志**：所有操作都会记录到审计日志
4. **错误处理**：包含完整的错误处理和回滚机制

## 维护建议

1. **定期监控**：每日检查函数执行状态和结果
2. **日志清理**：定期清理过期的审计日志
3. **性能优化**：根据监控数据调整参数
4. **备份策略**：确保有数据回滚方案

## 总结

部署完成后，系统将自动每10分钟检查并处理超时的订单，确保：
- 订单状态的原子性更新
- 库存的及时释放
- 期次份额的准确统计
- 完整的操作审计和错误处理