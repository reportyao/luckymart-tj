# LuckyMart TJ 数据库迁移指南

## 概述

本文档说明如何应用 `migration_002_admin_system.sql` 数据库迁移脚本，为LuckyMart TJ管理后台添加完整的权限管理、组织架构和系统监控功能。

## 新增数据表

### 1. 管理员权限管理系统
- **admin_permissions** - 管理员权限表，实现细粒度权限控制

### 2. 组织架构管理系统
- **org_departments** - 部门表，支持多级部门结构
- **org_roles** - 角色表，定义不同岗位角色
- **role_permissions** - 角色权限关联表

### 3. Telegram Bot管理系统
- **bot_push_templates** - Bot推送模板表，支持多语言
- **bot_push_history** - Bot推送历史表，记录所有推送
- **bot_status** - Bot状态监控表，实时监控Bot运行状态

### 4. 系统设置和运营管理
- **system_settings** - 系统设置表，存储各类配置项
- **operation_logs** - 操作日志表，记录所有管理员操作
- **growth_metrics** - 增长指标统计表，按日统计用户增长数据

## 迁移步骤

### 方式一：使用 psql 命令行工具

```bash
# 1. 连接到数据库
psql -h your-database-host -U your-username -d luckymart_tj

# 2. 执行迁移脚本
\i db/migration_002_admin_system.sql

# 3. 验证表是否创建成功
\dt admin_permissions
\dt org_departments
\dt org_roles
\dt bot_push_templates
\dt system_settings

# 4. 检查初始化数据
SELECT COUNT(*) FROM bot_push_templates;
SELECT COUNT(*) FROM system_settings;
SELECT COUNT(*) FROM org_departments;
```

### 方式二：使用数据库管理工具

1. 打开您的数据库管理工具（如 pgAdmin、DBeaver）
2. 连接到 LuckyMart TJ 数据库
3. 打开 `db/migration_002_admin_system.sql` 文件
4. 执行整个脚本
5. 验证表和数据是否正确创建

### 方式三：使用Supabase Edge Function

如果您的数据库部署在Supabase上，可以通过Edge Function执行迁移：

```typescript
// 在Supabase Dashboard的SQL Editor中执行
// 或者通过Edge Function调用
```

## 初始化数据

迁移脚本会自动初始化以下数据：

### Bot推送模板
- 订单确认模板（中文、英文、俄语）
- 支付成功模板（中文、英文、俄语）
- 中奖通知模板（中文、英文、俄语）
- 提现处理模板（中文、英文、俄语）

### 系统设置
- 用户增长相关：签到奖励、邀请奖励、首充奖励比例
- 业务相关：提现最小金额、手续费率、平台佣金率
- 安全相关：登录尝试次数、会话超时时间
- 内容相关：晒单审核开关、晒单奖励

### 组织架构
- 5个基础部门：技术部、运营部、财务部、客服部、市场部
- 4个基础角色：超级管理员、运营经理、财务专员、客服专员

## 验证迁移

执行以下SQL语句验证迁移是否成功：

```sql
-- 检查表是否创建
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'admin_permissions',
    'org_departments',
    'org_roles',
    'role_permissions',
    'bot_push_templates',
    'bot_push_history',
    'bot_status',
    'system_settings',
    'operation_logs',
    'growth_metrics'
);

-- 检查索引是否创建
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE 'admin_%' 
OR tablename LIKE 'org_%' 
OR tablename LIKE 'bot_%'
OR tablename = 'system_settings'
OR tablename = 'operation_logs'
OR tablename = 'growth_metrics';

-- 检查初始化数据
SELECT 
    'bot_push_templates' as table_name, COUNT(*) as count 
FROM bot_push_templates
UNION ALL
SELECT 'system_settings', COUNT(*) FROM system_settings
UNION ALL
SELECT 'org_departments', COUNT(*) FROM org_departments
UNION ALL
SELECT 'org_roles', COUNT(*) FROM org_roles;
```

## 回滚方案

如果需要回滚此次迁移，请执行以下SQL：

```sql
-- 删除触发器
DROP TRIGGER IF EXISTS update_org_departments_updated_at ON org_departments;
DROP TRIGGER IF EXISTS update_org_roles_updated_at ON org_roles;
DROP TRIGGER IF EXISTS update_bot_push_templates_updated_at ON bot_push_templates;
DROP TRIGGER IF EXISTS update_bot_status_updated_at ON bot_status;
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
DROP TRIGGER IF EXISTS update_growth_metrics_updated_at ON growth_metrics;

-- 删除表（注意顺序，先删除有外键依赖的表）
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS admin_permissions CASCADE;
DROP TABLE IF EXISTS org_roles CASCADE;
DROP TABLE IF EXISTS org_departments CASCADE;
DROP TABLE IF EXISTS bot_push_history CASCADE;
DROP TABLE IF EXISTS bot_push_templates CASCADE;
DROP TABLE IF EXISTS bot_status CASCADE;
DROP TABLE IF EXISTS operation_logs CASCADE;
DROP TABLE IF EXISTS growth_metrics CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;

-- 删除触发器函数（如果不再需要）
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

## 注意事项

1. **备份数据库**：在执行迁移前，请务必备份数据库
2. **生产环境**：建议先在测试环境执行并验证
3. **权限要求**：执行迁移需要CREATE TABLE和CREATE INDEX权限
4. **数据一致性**：迁移脚本使用`IF NOT EXISTS`和`ON CONFLICT`确保可重复执行
5. **性能影响**：迁移过程中会创建多个索引，可能需要几秒钟时间

## 后续配置

迁移完成后，建议进行以下配置：

1. **管理员权限**：为现有管理员分配适当的权限
2. **Bot配置**：配置Telegram Bot的用户名和Token
3. **系统设置**：根据实际业务需求调整系统设置
4. **角色权限**：根据组织架构完善角色权限配置

## 技术支持

如有问题，请联系技术团队或查看：
- Prisma Schema: `prisma/schema.prisma`
- 迁移脚本: `db/migration_002_admin_system.sql`

## 更新日志

- **2025-10-31**: 创建初始迁移脚本 (migration_002_admin_system)
  - 添加管理员权限管理系统
  - 添加组织架构管理系统
  - 添加Telegram Bot管理系统
  - 添加系统设置和运营管理系统
