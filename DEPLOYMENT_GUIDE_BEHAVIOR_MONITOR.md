# 行为异常检测监控系统 - 部署指南

## 系统概述

本系统是一套完整的行为异常检测功能，用于识别和防范各种欺诈行为，包括邀请刷量、可疑设备、批量注册、对冲刷量、僵尸号等。

## 核心功能

✅ **检测24小时内邀请速度异常** - >20人触发人工审核  
✅ **检测可疑设备** - 第4个账号绑定同一设备需上传身份验证  
✅ **检测批量注册** - 同一IP 24小时内注册>10个账号  
✅ **检测对冲刷量** - A推B且B推A，两人同时充值相似金额  
✅ **僵尸号过滤** - 被推荐人可信度评分<20分  
✅ **定时任务检测** - 使用cron自动执行检测  
✅ **黑名单自动清理** - 定期清理过期黑名单  
✅ **完整日志记录** - 所有操作都有详细的日志和监控  

## 部署步骤

### 1. 数据库迁移

#### 应用迁移文件
```bash
# 连接到Supabase项目
supabase link --project-ref your-project-ref

# 应用数据库迁移
supabase db push

# 或者手动执行SQL文件
# 1. 在Supabase Dashboard中打开SQL编辑器
# 2. 依次执行以下文件：
#    - supabase/migrations/1846500000_create_behavior_monitoring_tables.sql
#    - supabase/migrations/1846500001_create_behavior_detection_functions.sql
```

#### 验证表创建
```sql
-- 检查表是否创建成功
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'fraud_detection_logs', 
  'device_blacklist', 
  'device_fingerprints', 
  'referral_relationships', 
  'user_suspicious_flags'
);
```

### 2. 部署Edge Functions

#### 部署所有相关函数
```bash
# 部署行为监控相关函数
supabase functions deploy behavior-monitor-cron
supabase functions deploy behavior-monitor-api  
supabase functions deploy blacklist-manager

# 设置环境变量
supabase secrets set SUPABASE_URL=your-supabase-url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### 验证函数部署
```bash
# 列出已部署的函数
supabase functions list

# 测试函数是否可访问
curl "https://your-project.supabase.co/functions/v1/behavior-monitor-api?action=get_stats" \
  -H "Authorization: Bearer your-anon-key"
```

### 3. 配置定时任务

#### 创建后台Cron Jobs
```bash
# 创建行为监控主任务（每6小时执行一次）
supabase db sql --file supabase/cron_jobs/behavior_monitor_6h.json

# 创建实时监控任务（每2小时执行一次）
supabase db sql --file supabase/cron_jobs/realtime_monitor_2h.json

# 创建黑名单清理任务（每天凌晨2点执行）
supabase db sql --file supabase/cron_jobs/blacklist_cleanup_daily.json
```

#### 验证定时任务
```bash
# 查看后台任务列表
supabase jobs list

# 检查任务执行日志
supabase logs functions behavior-monitor-cron
```

### 4. 测试验证

#### 运行综合测试
```bash
cd luckymart-tj

# 运行完整测试套件
chmod +x test/comprehensive_behavior_monitor_test.sh
./test/comprehensive_behavior_monitor_test.sh

# 运行单元测试
npm test -- --testPathPattern=behavior-monitor.test.ts
```

#### 手动测试API
```bash
# 测试所有检测功能
curl "https://your-project.supabase.co/functions/v1/behavior-monitor-api?action=run_all_detections" \
  -H "Authorization: Bearer your-anon-key" \
  -H "apikey: your-anon-key"

# 获取检测统计
curl "https://your-project.supabase.co/functions/v1/behavior-monitor-api?action=get_stats" \
  -H "Authorization: Bearer your-anon-key" \
  -H "apikey: your-anon-key"

# 清理黑名单
curl -X POST "https://your-project.supabase.co/functions/v1/behavior-monitor-api" \
  -H "Authorization: Bearer your-anon-key" \
  -H "apikey: your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"action": "cleanup_blacklist"}'
```

### 5. 初始化测试数据（可选）

#### 创建测试数据
```sql
-- 运行测试数据初始化脚本
-- 在Supabase SQL编辑器中执行 test/init_behavior_monitor_test_data.sql
```

#### 验证检测功能
```bash
# 运行检测验证测试
curl "https://your-project.supabase.co/functions/v1/behavior-monitor-api?action=run_all_detections"
```

### 6. 监控配置

#### 查看检测日志
```sql
-- 查看最近的检测记录
SELECT 
  detection_type,
  risk_score,
  action_taken,
  created_at,
  details
FROM fraud_detection_logs 
ORDER BY created_at DESC 
LIMIT 50;
```

#### 查看黑名单
```sql
-- 查看当前黑名单
SELECT 
  device_id,
  device_type,
  reason,
  blocked_at,
  expires_at
FROM device_blacklist 
ORDER BY blocked_at DESC;
```

## 系统配置

### 阈值调整

在 `lib/anti-fraud/behavior-monitor.ts` 中可以调整检测阈值：

```typescript
export const MONITORING_CONFIG = {
  // 邀请速度阈值（24小时内）
  INVITE_SPEED_THRESHOLD: 20,
  
  // 设备绑定阈值
  DEVICE_BINDING_THRESHOLD: 4,
  
  // 批量注册阈值（24小时内）
  BATCH_REGISTRATION_THRESHOLD: 10,
  
  // 金额相似度阈值（10%）
  AMOUNT_SIMILARITY_THRESHOLD: 0.1,
  
  // 僵尸号可信度阈值
  ZOMBIE_TRUST_SCORE_THRESHOLD: 20,
  
  // 黑名单过期时间（天）
  IP_BLACKLIST_EXPIRY_DAYS: 7,
  DEVICE_BLACKLIST_EXPIRY_DAYS: 30
};
```

### 定时任务频率

可以在 `supabase/cron_jobs/` 目录中调整cron表达式：

```json
{
  "cron_expression": "0 */6 * * *",  // 每6小时
  "edge_function_name": "behavior-monitor-cron",
  "description": "行为监控定时检测任务",
  "enabled": true,
  "parameters": {
    "action": "run_all_detections"
  }
}
```

## 常见问题解决

### 1. 数据库连接问题

**问题**: `relation "users" does not exist`

**解决**: 
```bash
# 检查用户表是否存在
SELECT table_name FROM information_schema.tables WHERE table_name = 'users';

# 如果不存在，需要先运行基础迁移
supabase db push
```

### 2. Edge Function部署失败

**问题**: 函数部署超时或权限错误

**解决**:
```bash
# 重新部署单个函数
supabase functions deploy behavior-monitor-cron --no-verify-jwt

# 检查项目权限
supabase projects list
supabase link --project-ref your-project-ref
```

### 3. 定时任务不执行

**问题**: Cron任务没有运行

**解决**:
```bash
# 检查后台任务状态
supabase jobs list

# 重新创建任务
supabase db sql --file supabase/cron_jobs/behavior_monitor_6h.json

# 查看执行日志
supabase logs functions behavior-monitor-cron
```

### 4. 检测结果为空

**问题**: 没有检测到任何异常行为

**解决**:
```sql
-- 检查数据是否存在
SELECT COUNT(*) FROM referral_relationships WHERE created_at >= NOW() - INTERVAL '24 hours';
SELECT COUNT(*) FROM device_fingerprints;

-- 如果数据不足，可以创建测试数据
-- 运行 test/init_behavior_monitor_test_data.sql
```

## 监控和维护

### 定期检查任务

```bash
# 每日检查任务执行情况
curl "https://your-project.supabase.co/functions/v1/behavior-monitor-api?action=get_stats"

# 每周清理过期黑名单
curl -X POST "https://your-project.supabase.co/functions/v1/behavior-monitor-api" \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"action": "cleanup_blacklist"}'
```

### 性能优化

1. **定期清理历史日志**
```sql
-- 清理30天前的检测日志
DELETE FROM fraud_detection_logs 
WHERE created_at < NOW() - INTERVAL '30 days';
```

2. **优化查询索引**
```sql
-- 确保重要字段有索引
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_created_at 
ON device_fingerprints(created_at);
```

3. **调整检测频率**
   - 在业务高峰期增加检测频率
   - 在低峰期减少检测频率以节省资源

## 安全注意事项

1. **访问控制**
   - 确保只有授权用户可以访问API
   - 定期更新API密钥

2. **数据保护**
   - 检测日志中不包含敏感信息
   - 定期备份重要的检测数据

3. **监控告警**
   - 设置高风险检测的告警通知
   - 监控系统性能和可用性

## 联系支持

如果在部署过程中遇到问题：

1. 查看系统日志: `supabase logs functions behavior-monitor-cron`
2. 检查数据库状态: 在Supabase Dashboard中查看表和数据
3. 运行测试脚本验证功能
4. 查阅本文档的故障排除部分

---

**部署完成后，系统将自动进行行为异常检测，保护您的平台免受欺诈行为影响。**