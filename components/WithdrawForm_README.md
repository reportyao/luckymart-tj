# WithdrawForm 组件

提现表单组件，支持多种提现方式、实时手续费计算、完整的表单验证等功能。

## 功能特性

- ✅ 支持多种提现方式：银行卡、支付宝、微信、Alif Mobi、DC Bank
- ✅ 实时手续费计算和到账金额预览
- ✅ 余额检查和提现限额验证
- ✅ 支付密码验证
- ✅ 响应式设计，支持移动端和桌面端
- ✅ 国际化支持
- ✅ 完整的表单验证和错误处理
- ✅ 提现协议确认

## 安装和依赖

确保项目中已安装以下依赖：

```bash
npm install react react-dom
npm install @radix-ui/react-tabs @radix-ui/react-label
npm install class-variance-authority clsx tailwind-merge
npm install react-i18next
```

## 使用方法

### 基本使用

```tsx
import WithdrawForm from '@/components/WithdrawForm';
import type { User } from '@/types';

// 在组件中使用
function WithdrawPage() {
  const [balance] = useState(1250.75);
  const [user] = useState<User>({
    // 用户数据
    id: '1',
    telegramId: '123456789',
    firstName: '张三',
    coinBalance: 1250.75,
    // ... 其他字段
  });

  const [loading, setLoading] = useState(false);

  const handleWithdraw = async (data: WithdrawFormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/withdraw/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: parseFloat(data.amount),
          withdrawMethod: data.method,
          accountInfo: data.accountInfo,
          password: data.password
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('提现申请提交成功！');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('提现失败:', error);
      alert('提现失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <WithdrawForm
      balance={balance}
      user={user}
      onSubmit={handleWithdraw}
      loading={loading}
    />
  );
}
```

### 高级配置

```tsx
<WithdrawForm
  balance={2500}
  user={user}
  onSubmit={handleWithdraw}
  loading={loading}
  className="max-w-lg" // 自定义样式
  minWithdrawAmount={100} // 自定义最低提现金额
  feeRate={0.03} // 自定义手续费率（3%）
  minFee={3} // 自定义最低手续费
  defaultValues={{
    method: 'alif_mobi',
    accountInfo: {
      accountName: user?.firstName
    }
  }}
/>
```

## Props 说明

### WithdrawFormProps

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `balance` | `number` | - | **必需** - 当前用户余额 |
| `user` | `User \| null` | - | **必需** - 用户信息 |
| `onSubmit` | `(data: WithdrawFormData) => Promise<void>` | - | **必需** - 表单提交回调 |
| `defaultValues` | `Partial<WithdrawFormData>` | - | 表单默认值 |
| `loading` | `boolean` | `false` | 加载状态 |
| `className` | `string` | - | 自定义CSS类名 |
| `minWithdrawAmount` | `number` | `50` | 最低提现金额 |
| `feeRate` | `number` | `0.05` | 手续费率 |
| `minFee` | `number` | `2` | 最低手续费 |

### WithdrawFormData

```tsx
interface WithdrawFormData {
  amount: string; // 提现金额
  method: WithdrawMethod; // 提现方式
  accountInfo: {
    accountNumber: string; // 账户号码
    accountName: string; // 账户名称
    bankName?: string; // 银行名称（仅银行卡）
    phoneNumber?: string; // 手机号（仅支付宝、微信）
  };
  password: string; // 支付密码
}
```

### WithdrawMethod

```tsx
type WithdrawMethod = 'bank_card' | 'alipay' | 'wechat' | 'alif_mobi' | 'dc_bank';
```

## 支持的提现方式

| 方式 | 图标 | 说明 | 专用字段 |
|------|------|------|----------|
| `bank_card` | 🏦 | 银行卡提现 | `bankName` |
| `alipay` | 💙 | 支付宝提现 | `phoneNumber` |
| `wechat` | 💚 | 微信提现 | `phoneNumber` |
| `alif_mobi` | 💜 | Alif Mobi移动支付 | - |
| `dc_bank` | 💙 | DC银行储蓄卡 | - |

## 提现限制配置

组件内置了以下提现限制：

```tsx
const WITHDRAW_LIMITS = {
  MIN_AMOUNT: 50,       // 最低提现金额
  MAX_AMOUNT: 10000,    // 最高提现金额
  DAILY_LIMIT: 5000,    // 每日限额
  MONTHLY_LIMIT: 50000, // 每月限额
  MIN_PASSWORD_LENGTH: 6, // 密码最小长度
};
```

## API 集成

### 提现申请接口

```bash
POST /api/withdraw/create
```

**请求体：**
```json
{
  "amount": 100,
  "withdrawMethod": "alif_mobi",
  "accountInfo": {
    "accountNumber": "+992900000000",
    "accountName": "张三",
    "bankName": "Alif Bank",
    "phoneNumber": "+992900000000"
  },
  "password": "encrypted_password"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": "withdraw_123",
    "status": "pending"
  },
  "message": "提现申请提交成功"
}
```

### 提现记录接口

```bash
GET /api/withdraw/list
```

**响应：**
```json
{
  "success": true,
  "data": {
    "withdrawals": [
      {
        "id": "withdraw_123",
        "amount": 100,
        "fee": 5,
        "actualAmount": 95,
        "withdrawMethod": "alif_mobi",
        "status": "pending",
        "createdAt": "2023-01-01T00:00:00Z"
      }
    ]
  }
}
```

## 手续费计算

手续费计算规则：
- 手续费 = max(提现金额 × 手续费率, 最低手续费)
- 实际到账 = 提现金额 - 手续费

示例：
- 提现 100 TJS，手续率 5%，最低手续费 2 TJS
- 手续费 = max(100 × 0.05, 2) = max(5, 2) = 5 TJS
- 实际到账 = 100 - 5 = 95 TJS

## 国际化

组件支持国际化，需要在项目中配置 `react-i18next`。组件内部使用以下命名空间：

- `wallet` - 钱包相关文案
- `common` - 通用文案

## 样式自定义

组件使用 Tailwind CSS 构建，可以通过以下方式自定义样式：

1. **通过 className 属性：**
```tsx
<WithdrawForm className="max-w-lg mx-auto" />
```

2. **通过 Tailwind 配置：**
```css
/* 在 globals.css 中覆盖样式 */
.withdraw-form-custom {
  /* 自定义样式 */
}
```

3. **通过 CSS 变量：**
```css
:root {
  --withdraw-form-primary: #3b82f6;
}
```

## 最佳实践

1. **密码安全：**
   - 不要在前端存储明文密码
   - 使用 HTTPS 传输敏感信息
   - 考虑在前端加密密码

2. **错误处理：**
   - 总是处理 API 请求失败的情况
   - 提供清晰的错误信息给用户
   - 记录错误日志用于调试

3. **用户体验：**
   - 显示加载状态
   - 提供实时的手续费预览
   - 确认关键操作

4. **安全性：**
   - 验证所有输入
   - 实现防重复提交
   - 限制提现频率和金额

## 示例文件

- `WithdrawForm.examples.tsx` - 包含详细的使用示例
- 查看示例了解高级配置和自定义用法

## 常见问题

### Q: 如何处理提现失败？
A: 在 `onSubmit` 回调中捕获错误并显示给用户。组件会在表单验证失败时阻止提交。

### Q: 如何自定义提现方式？
A: 修改 `WITHDRAW_METHODS` 配置对象，添加新的提现方式和对应的UI。

### Q: 如何修改手续费计算规则？
A: 通过 `feeRate` 和 `minFee` props 自定义手续费计算参数。

### Q: 如何禁用某些提现方式？
A: 修改 `getAvailableMethods()` 函数，返回筛选后的提现方式数组。

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个组件！

## 许可证

MIT License