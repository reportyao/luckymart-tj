# LuckyMart TJ API端点错误报告

## 检查范围
- **检查时间**: 2025-10-30 02:12:41
- **检查目录**: `/luckymart-tj/app/api/`
- **检查端点**: 29个API端点
- **重点检查**: 字段映射、类型定义、异常处理、权限验证、业务逻辑

---

## 🔴 严重错误 (Critical)

### 1. TypeScript类型定义与数据库不匹配

**文件**: `types/index.ts`
**问题**: 
```typescript
// 第4行 - 错误定义
telegramId: number;  // ❌ 数据库中是String类型

// 第122-134行 - ResaleListing类型定义错误
export interface ResaleListing {
  id: string;
  userId: string;
  roundId: string;        // ❌ 实际数据库中是seller_user_id, buyer_user_id
  productId: string;
  numbers: number[];      // ❌ 数据库中不存在
  sharesCount: number;    // ❌ 数据库中不存在
  originalCost: number;   // ❌ 数据库中是listing_price, platform_fee
  salePrice: number;      // ❌ 数据库中是listing_price
  status: 'active' | 'sold' | 'cancelled'; // ❌ 实际数据库中是pending等
  buyerId?: string;       // ❌ 数据库中是buyer_user_id
  soldAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**影响**: 前端调用API时会出现类型错误，运行时数据不匹配

---

### 2. API混合使用不同数据库客户端

**文件**: `app/api/admin/orders/route.ts`
**问题**:
```typescript
// 第3-4行 - 同时导入Supabase和Prisma
import { supabaseAdmin } from '@/lib/supabase';  // 使用Supabase
import { prisma } from '@/lib/prisma';           // ❌ 实际代码未使用Prisma
```

**文件**: `app/api/withdraw/create/route.ts`
**问题**:
```typescript
// 使用Supabase但字段名使用snake_case
.eq('id', user.userId)              // ❌ 应为user_id
.select('platform_balance')         // ❌ 数据库中是platformBalance
.update({ 
  platform_balance: userData.platform_balance - totalRequired  // ❌ 字段名错误
})
```

**影响**: 数据查询失败，权限验证不一致

---

### 3. 数据库字段名映射错误

**问题详情**:

**文件**: `app/api/admin/orders/route.ts` 第28-33行
```typescript
// 查询中使用不存在的字段
.select(`
  *,
  users(username, firstName, telegramId),      // ❌ 应为username, first_name, telegram_id
  products(nameZh, nameEn, imageUrl)           // ❌ 应为name_zh, name_en, images
`, { count: 'exact' })
```

**文件**: `app/api/resale/create/route.ts` 第88-89行
```typescript
// 插入不存在的字段
.insert({
  orderId,                                     // ❌ 应为order_id
  sellerId: user.userId,                       // ❌ 应为seller_user_id
  productId: order.productId,                  // ❌ 应为product_id
  price,                                       // ❌ 应为listing_price
  status: 'active'                             // ❌ 应为pending
})
```

---

## 🟡 重要错误 (Major)

### 4. 权限验证不完整

**文件**: `app/api/admin/users/route.ts`
**问题**:
```typescript
// 第8-14行 - 缺少JWT验证
const token = request.headers.get('authorization')?.replace('Bearer ', '');
if (!token) {
  return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
}
// ❌ 未验证token有效性和管理员权限
```

**文件**: `app/api/admin/login/route.ts`
**问题**:
```typescript
// 第42行 - 生成管理员token时使用错误格式
const token = generateToken(admin.id, `admin_${admin.id}`);
// ❌ telegramId格式错误，应该验证管理员角色
```

---

### 5. 业务逻辑错误

**文件**: `app/api/lottery/participate/route.ts`
**问题**:
```typescript
// 第71-72行 - 夺宝号码生成逻辑错误
const startNumber = round.soldShares + 10000001;
const numbers = Array.from({ length: sharesCount }, (_, i) => startNumber + i);
// ❌ soldShares是已售数量，不是起始号码，应该使用连续编号
```

**文件**: `app/api/payment/recharge/route.ts`
**问题**:
```typescript
// 第116-117行 - JSON解析错误
const orderNotes = JSON.parse(order.notes || '{}');
const totalCoins = orderNotes.coins + orderNotes.bonusCoins;
// ❌ 如果notes字段不是JSON格式会报错
```

---

### 6. 异常处理不完整

**问题模式**:
```typescript
// 大多数API都有此问题
} catch (error: any) {
  console.error('Error:', error);
  return NextResponse.json(
    { error: '描述错误', message: error.message },  // ❌ 生产环境不应暴露error.message
    { status: 500 }
  );
}
```

**影响**: 可能泄露敏感信息，不够用户友好的错误提示

---

## 🟠 一般错误 (Minor)

### 7. 数据库查询性能问题

**文件**: `app/api/products/list/route.ts`
**问题**:
```typescript
// 第38-46行 - N+1查询问题
const productsWithRounds = await Promise.all(
  products.map(async (product) => {
    const currentRound = await prisma.lotteryRounds.findFirst({...});  // ❌ 每个商品单独查询
  })
);
```

**建议**: 使用批量查询优化性能

---

### 8. 状态枚举不一致

**文件**: `types/index.ts`
**问题**:
```typescript
// 第62行 - 状态值不一致
status: 'ongoing' | 'full' | 'drawing' | 'completed';  // ❌ 数据库中是active, full等

// 第50行 - Product状态
status: 'active' | 'pending' | 'soldout' | 'inactive'; // ❌ 数据库只有active
```

---

## 🔵 代码质量问题 (Code Quality)

### 9. 重复代码

**问题**: 多个API文件重复实现相同的JWT验证逻辑
- `user/profile/route.ts`
- `orders/list/route.ts`
- `lottery/participate/route.ts`
- `payment/recharge/route.ts`

**建议**: 抽取公共中间件

---

### 10. 环境变量未验证

**文件**: `lib/utils.ts`
**问题**:
```typescript
// 第43-53行 - generateJWT函数中require导入
const jwt = require('jsonwebtoken');  // ❌ 应该使用ES6 import
```

---

## 📋 修复建议

### 立即修复 (Critical)
1. **修复TypeScript类型定义**
   - 将 `telegramId` 改为 `string` 类型
   - 修正 `ResaleListing` 接口定义
   - 添加缺失的类型定义

2. **统一数据库客户端**
   - 选择使用Prisma或Supabase
   - 统一字段名映射方式

3. **修复字段名映射**
   - 统一使用snake_case查询数据库
   - 使用Prisma的field映射功能

### 优先修复 (Major)
1. **完善权限验证**
   - 添加管理员角色检查
   - 实现JWT验证中间件

2. **完善异常处理**
   - 提供用户友好的错误信息
   - 避免在生产环境暴露敏感信息

3. **修复业务逻辑**
   - 修正夺宝号码生成逻辑
   - 添加JSON解析异常处理

### 后续优化 (Minor)
1. **性能优化**
   - 解决N+1查询问题
   - 添加数据库索引

2. **代码质量**
   - 抽取公共逻辑
   - 使用ES6模块语法
   - 添加环境变量验证

---

## 📊 错误统计

| 严重级别 | 数量 | 百分比 |
|---------|------|--------|
| Critical | 3 | 30% |
| Major    | 3 | 30% |
| Minor    | 4 | 40% |
| **总计** | **10** | **100%** |

## 检查清单

- [ ] 修复TypeScript类型定义与数据库不匹配
- [ ] 统一使用Prisma或Supabase
- [ ] 修复所有字段名映射错误
- [ ] 完善权限验证机制
- [ ] 优化异常处理
- [ ] 修复业务逻辑错误
- [ ] 解决性能问题
- [ ] 统一状态枚举
- [ ] 抽取公共代码
- [ ] 完善环境变量验证

---

**报告生成时间**: 2025-10-30 02:12:41
**检查工具**: 静态代码分析
**下次检查建议**: 修复Critical问题后重新检查