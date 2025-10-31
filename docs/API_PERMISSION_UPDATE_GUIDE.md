# API权限中间件更新指南

## 概述
本文档提供LuckyMart TJ管理后台API权限中间件的系统更新指南，确保所有50+个API端点统一使用AdminPermissionManager进行权限验证。

## 更新模式

### 标准更新流程

每个API文件需要完成以下4步修改：

#### 步骤1: 添加imports

在文件顶部添加AdminPermissionManager和AdminPermissions的导入：

```typescript
import { AdminPermissionManager } from '@/lib/admin/permissions/AdminPermissionManager';
import { AdminPermissions } from '@/lib/admin/permissions/AdminPermissions';
```

#### 步骤2: 创建权限中间件

在exports之前添加权限中间件声明（根据API需要选择read/write）：

```typescript
// 只读权限
const withPermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.{resource}.read()
});

// 或者 读写权限分别声明
const withReadPermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.{resource}.read()
});

const withWritePermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.{resource}.write()
});
```

资源类型映射：
- `users` - 用户管理
- `products` - 商品管理
- `orders` - 订单管理
- `lottery` - 抽奖管理
- `withdrawals` - 提现管理
- `stats` - 统计数据
- `settings` - 系统设置
- `system` - 系统管理

#### 步骤3: 包装HTTP方法函数

将每个export函数包装在权限中间件中：

**修改前：**
```typescript
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({
        success: false,
        error: '管理员权限验证失败'
      }, { status: 403 });
    }

    // 检查权限
    const hasPermission = admin.permissions.includes('users:read') || admin.role === 'super_admin';
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: '权限不足'
      }, { status: 403 });
    }

    // 业务逻辑
    const result = await someBusinessLogic();
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    return NextResponse.json({ error: '错误' }, { status: 500 });
  }
}
```

**修改后：**
```typescript
export async function GET(request: NextRequest) {
  return withReadPermission(async (request, admin) => {
    try {
      // 业务逻辑（直接使用admin参数，无需再次验证）
      const result = await someBusinessLogic();
      
      return NextResponse.json({
        success: true,
        data: result
      });
    } catch (error) {
      return NextResponse.json({ error: '错误' }, { status: 500 });
    }
  })(request);
}
```

#### 步骤4: 移除旧代码

删除以下代码：
1. `getAdminFromRequest(request)` 调用
2. admin权限验证的if语句
3. hasPermission检查逻辑

权限验证现在由AdminPermissionManager自动处理。

## 批次更新计划

### Batch 2: 财务相关APIs (stats:read/write)

| 文件路径 | HTTP方法 | 权限 | 状态 |
|---------|---------|------|------|
| app/api/admin/financial/costs/route.ts | GET, POST | stats:read, stats:write | ⚠️ 待更新 |
| app/api/admin/financial/reports/route.ts | GET | stats:read | ⚠️ 待更新 |
| app/api/admin/financial/withdrawals/route.ts | GET | stats:read | ⚠️ 待更新 |
| app/api/admin/financial/profits/route.ts | GET | stats:read | ⚠️ 待更新 |
| app/api/admin/financial/revenue/route.ts | GET | stats:read | ⚠️ 待更新 |

**注意**: financial/costs没有权限验证，需添加完整的权限中间件。

### Batch 3: 成本监控APIs (stats:read)

| 文件路径 | HTTP方法 | 权限 | 状态 |
|---------|---------|------|------|
| app/api/admin/costs/breakdown/route.ts | GET | stats:read | ⚠️ 待更新 |
| app/api/admin/costs/trends/route.ts | GET | stats:read | ⚠️ 待更新 |
| app/api/admin/costs/roi/route.ts | GET | stats:read | ⚠️ 待更新 |
| app/api/admin/costs/daily/route.ts | GET | stats:read | ⚠️ 待更新 |

### Batch 4: 用户管理APIs (users:read/write)

| 文件路径 | HTTP方法 | 权限 | 状态 |
|---------|---------|------|------|
| app/api/admin/users/route.ts | GET, POST | users:read, users:write | ⚠️ 部分完成 |
| app/api/admin/users/[id]/route.ts | GET, PUT, DELETE | users:read, users:write | ⚠️ 待更新 |
| app/api/admin/users/segments/route.ts | GET | users:read | ⚠️ 待更新 |
| app/api/admin/users/spending/route.ts | GET | users:read | ⚠️ 待更新 |
| app/api/admin/users/retention/route.ts | GET | users:read | ⚠️ 待更新 |
| app/api/admin/users/engagement/route.ts | GET | users:read | ⚠️ 待更新 |
| app/api/admin/users/behavior/route.ts | GET | users:read | ⚠️ 待更新 |

### Batch 5: 产品和订单APIs

| 文件路径 | HTTP方法 | 权限 | 状态 |
|---------|---------|------|------|
| app/api/admin/products/route.ts | GET, POST, PUT, DELETE | products:read, products:write | ⚠️ 待更新 |
| app/api/admin/products/[id]/route.ts | GET, PUT, DELETE | products:read, products:write | ⚠️ 待更新 |
| app/api/admin/products/trending/route.ts | GET | products:read | ⚠️ 待更新 |
| app/api/admin/products/profit/route.ts | GET | products:read | ⚠️ 待更新 |
| app/api/admin/products/conversion/route.ts | GET | products:read | ⚠️ 待更新 |
| app/api/admin/products/performance/route.ts | GET | products:read | ⚠️ 待更新 |
| app/api/admin/orders/route.ts | GET, POST, PUT | orders:read, orders:write | ⚠️ 待更新 |

### Batch 6: 抽奖管理APIs (lottery:read/write)

| 文件路径 | HTTP方法 | 权限 | 状态 |
|---------|---------|------|------|
| app/api/admin/lottery/draw/route.ts | GET, POST | lottery:read, lottery:write | ⚠️ 待更新 |
| app/api/admin/lottery/rounds/route.ts | GET, POST | lottery:read, lottery:write | ⚠️ 待更新 |
| app/api/admin/lottery/data-fix/route.ts | POST | lottery:write | ⚠️ 待更新 |

### Batch 7: 提现管理APIs (withdrawals:read/write)

| 文件路径 | HTTP方法 | 权限 | 状态 |
|---------|---------|------|------|
| app/api/admin/withdrawals/route.ts | GET, POST | withdrawals:read, withdrawals:write | ⚠️ 待更新 |

### Batch 8: 晒单管理APIs (users:write)

| 文件路径 | HTTP方法 | 权限 | 状态 |
|---------|---------|------|------|
| app/api/admin/show-off/posts/route.ts | GET, POST, PUT, DELETE | users:read, users:write | ⚠️ 待更新 |

### Batch 9: 风险控制APIs (system:manage)

| 文件路径 | HTTP方法 | 权限 | 状态 |
|---------|---------|------|------|
| app/api/admin/risk-stats/route.ts | GET | system:read | ⚠️ 待更新 |
| app/api/admin/risk-rules/route.ts | GET, POST, PUT, DELETE | system:manage | ⚠️ 待更新 |
| app/api/admin/risk-users/route.ts | GET, POST | system:manage | ⚠️ 待更新 |
| app/api/admin/risk-events/route.ts | GET | system:read | ⚠️ 待更新 |

### Batch 10: 其他APIs

| 文件路径 | HTTP方法 | 权限 | 状态 |
|---------|---------|------|------|
| app/api/admin/stats/route.ts | GET | stats:read | ⚠️ 待更新 |
| app/api/admin/rate-limit/route.ts | GET, POST | system:manage | ⚠️ 待更新 |

### 系统设置APIs统一化

这些API已有getAdminFromRequest验证，需统一使用AdminPermissionManager：

| 文件路径 | HTTP方法 | 权限 | 状态 |
|---------|---------|------|------|
| app/api/admin/settings/route.ts | GET, POST | settings:read, settings:write | ⚠️ 待统一 |
| app/api/admin/settings/operation/route.ts | GET, POST, PUT, DELETE | settings:write | ⚠️ 待统一 |
| app/api/admin/settings/features/route.ts | GET, POST, PUT, DELETE | settings:write | ⚠️ 待统一 |
| app/api/admin/settings/risk/route.ts | GET, POST, PUT, DELETE | settings:write | ⚠️ 待统一 |
| app/api/admin/settings/rewards/route.ts | GET, POST, PUT, DELETE | settings:write | ⚠️ 待统一 |
| app/api/admin/settings/system/route.ts | GET, POST, PUT, DELETE | settings:write | ⚠️ 待统一 |

## 特殊情况处理

### 1. 无权限验证的API (如financial/costs)

这些API完全没有权限验证，需要：
1. 添加imports
2. 添加权限中间件
3. 包装所有HTTP方法
4. 无需删除旧代码

### 2. 使用Supabase客户端的API

某些API使用Supabase客户端而非Prisma，更新时注意保持业务逻辑不变。

### 3. 复杂业务逻辑的API

对于业务逻辑复杂的API（如users/route.ts），确保：
- 保留所有业务逻辑
- 只替换权限验证部分
- 测试所有功能正常工作

## 验证清单

完成每个API更新后，检查：

- [ ] imports已添加
- [ ] 权限中间件已声明
- [ ] 所有HTTP方法已包装
- [ ] 旧的getAdminFromRequest代码已删除
- [ ] 业务逻辑完全保留
- [ ] 代码可以编译通过
- [ ] 权限类型正确（read/write）

## 测试要求

完成所有更新后，必须进行：

1. **单元测试**: 每个API端点的权限验证
2. **集成测试**: 端到端功能测试
3. **权限测试**: 
   - 有权限用户可以正常访问
   - 无权限用户被正确拒绝
   - 超级管理员可以访问所有端点

## 进度追踪

- ✅ Batch 1: 系统管理模块 (7个API) - 已完成
- ⚠️ Batch 2: 财务相关 (5个API) - 待完成
- ⚠️ Batch 3: 成本监控 (4个API) - 待完成
- ⚠️ Batch 4: 用户管理 (7个API) - 进行中 (1/7)
- ⚠️ Batch 5: 产品和订单 (7个API) - 待完成
- ⚠️ Batch 6: 抽奖管理 (3个API) - 待完成
- ⚠️ Batch 7: 提现管理 (1个API) - 待完成
- ⚠️ Batch 8: 晒单管理 (1个API) - 待完成
- ⚠️ Batch 9: 风险控制 (4个API) - 待完成
- ⚠️ Batch 10: 其他 (2个API) - 待完成
- ⚠️ 系统设置统一化 (6个API) - 待完成

**总计**: 7/47 完成 (15%)

## 注意事项

1. **保持一致性**: 所有API使用相同的权限验证模式
2. **业务逻辑不变**: 只修改权限验证部分
3. **测试覆盖**: 完成后必须全面测试
4. **文档更新**: 更新API文档说明权限要求
5. **代码审查**: 建议进行peer review确保质量

## 问题排查

### 权限验证失败
- 检查权限类型是否正确（read/write）
- 确认AdminPermissions资源名称正确
- 验证数据库中管理员权限配置

### 编译错误
- 确认imports路径正确
- 检查语法错误（括号匹配等）
- 验证TypeScript类型

### 运行时错误
- 检查admin参数使用是否正确
- 确认业务逻辑未被破坏
- 查看错误日志获取详细信息
