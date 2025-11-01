# RechargeForm 组件

一个功能完整的充值表单组件，支持多种支付方式、优惠码、充值记录等功能。

## 功能特性

### 💳 多种支付方式
- **Alif Mobi** - 塔吉克斯坦移动支付
- **DC Bank** - 塔吉克斯坦银行卡
- **支付宝** - 中国支付宝
- **微信支付** - 中国微信支付
- **银行卡** - 国际银行卡
- **加密货币** - USDT/BTC/ETH

### 🎁 充值套餐系统
- 预设充值套餐（50、100、200、500、1000 TJS）
- 自动计算奖励金币
- 推荐套餐标识
- 折扣标签显示

### 🎟️ 优惠码系统
- 优惠码输入和应用
- 百分比优惠和固定金额优惠
- 最低充值金额限制
- 最大优惠金额限制
- 优惠活动展示

### 📊 充值记录
- 充值历史记录展示
- 支付状态跟踪（待处理/已完成/失败）
- 交易详情查看
- 状态图标标识

### 🎨 用户体验
- 响应式设计，支持移动端
- 直观的标签页切换
- 实时奖励计算
- 加载状态指示
- 表单验证

## 安装和导入

```typescript
import { RechargeForm, PaymentMethod } from '@/components/RechargeForm';
```

## 基本用法

```tsx
import { RechargeForm, RechargeRecord } from '@/components/RechargeForm';

function MyPage() {
  const handleRechargeSuccess = (record: RechargeRecord) => {
    console.log('充值成功:', record);
    // 处理充值成功逻辑
  };

  const handleRechargeFailure = (error: string) => {
    console.error('充值失败:', error);
    // 处理充值失败逻辑
  };

  return (
    <RechargeForm
      userId="user123"
      onRechargeSuccess={handleRechargeSuccess}
      onRechargeFailure={handleRechargeFailure}
      showHistory={true}
      showPromotions={true}
    />
  );
}
```

## 组件属性

### RechargeFormProps

| 属性名 | 类型 | 必需 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `userId` | string | 否 | - | 用户ID |
| `onRechargeSuccess` | (record: RechargeRecord) => void | 否 | - | 充值成功回调 |
| `onRechargeFailure` | (error: string) => void | 否 | - | 充值失败回调 |
| `showHistory` | boolean | 否 | `true` | 是否显示充值记录 |
| `showPromotions` | boolean | 否 | `true` | 是否显示优惠活动 |
| `className` | string | 否 | `''` | 自定义CSS类名 |

### 数据类型

#### RechargeRecord
```typescript
interface RechargeRecord {
  id: string;                    // 记录ID
  amount: number;                // 充值金额
  bonus: number;                 // 奖励金币
  totalCoins: number;            // 总金币数
  paymentMethod: PaymentMethod;  // 支付方式
  status: 'pending' | 'completed' | 'failed';  // 状态
  createdAt: Date;               // 创建时间
  completedAt?: Date;            // 完成时间
  transactionId?: string;        // 交易ID
}
```

#### PaymentMethod 枚举
```typescript
enum PaymentMethod {
  ALIF_MOBI = 'alif_mobi',    // Alif Mobi
  DC_BANK = 'dc_bank',        // DC Bank
  ALIPAY = 'alipay',          // 支付宝
  WECHAT = 'wechat',          // 微信支付
  BANK_CARD = 'bank_card',    // 银行卡
  CRYPTO = 'crypto'           // 加密货币
}
```

## 使用示例

### 1. 基础充值功能
```tsx
<RechargeForm
  userId="user123"
  onRechargeSuccess={(record) => {
    // 跳转到成功页面或显示成功提示
    router.push('/recharge/success');
  }}
  onRechargeFailure={(error) => {
    // 显示错误信息
    toast.error(error);
  }}
/>
```

### 2. 仅显示充值套餐（简化模式）
```tsx
<RechargeForm
  userId="user123"
  onRechargeSuccess={handleSuccess}
  onRechargeFailure={handleFailure}
  showHistory={false}
  showPromotions={false}
/>
```

### 3. 带自定义样式
```tsx
<RechargeForm
  userId="user123"
  onRechargeSuccess={handleSuccess}
  onRechargeFailure={handleFailure}
  className="max-w-2xl mx-auto shadow-xl"
/>
```

### 4. 管理后台使用
```tsx
import { RechargeForm, RechargeRecord } from '@/components/RechargeForm';

function AdminRechargePage() {
  const [rechargeRecords, setRechargeRecords] = useState<RechargeRecord[]>([]);

  const handleRechargeSuccess = async (record: RechargeRecord) => {
    // 添加到记录列表
    setRechargeRecords(prev => [record, ...prev]);
    
    // 更新用户余额（如果有API的话）
    await updateUserBalance(record.userId, record.totalCoins);
  };

  return (
    <div className="admin-container">
      <RechargeForm
        userId={currentAdmin.id}
        onRechargeSuccess={handleRechargeSuccess}
        onRechargeFailure={(error) => console.error(error)}
        showHistory={true}
        showPromotions={true}
      />
    </div>
  );
}
```

## API 集成

组件目前使用模拟数据进行演示。在实际项目中，你需要替换以下 API 调用：

### 获取充值套餐
```typescript
// 替换 fetchPackages 函数中的模拟数据
const fetchPackages = async () => {
  const response = await fetch('/api/payment/packages');
  const data = await response.json();
  setPackages(data.packages);
};
```

### 应用优惠码
```typescript
// 替换 handleApplyPromoCode 函数中的模拟逻辑
const handleApplyPromoCode = async () => {
  const response = await fetch('/api/promotions/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ promoCode, userId })
  });
  const result = await response.json();
  if (result.valid) {
    setAppliedPromo(result.promotion);
  }
};
```

### 创建充值订单
```typescript
// 替换 handleRecharge 函数中的模拟逻辑
const handleRecharge = async () => {
  const response = await fetch('/api/payment/recharge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      amount: selectedAmount,
      paymentMethod: selectedPaymentMethod,
      promoCode: appliedPromo?.promoCode
    })
  });
  const result = await response.json();
  // 处理响应结果
};
```

## 样式定制

组件使用 Tailwind CSS 进行样式设计，你可以通过以下方式定制：

### 1. 使用 className 属性
```tsx
<RechargeForm
  className="my-custom-styles"
  // 其他属性...
/>
```

### 2. 覆盖 Tailwind 类
```css
/* 在你的 CSS 文件中 */
.recharge-form-custom {
  @apply max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg;
}
```

### 3. 修改颜色主题
```tsx
// 在组件中修改支付方式的颜色配置
const paymentMethods = [
  {
    id: PaymentMethod.ALIF_MOBI,
    name: 'Alif Mobi',
    icon: Smartphone,
    color: 'text-purple-600',    // 修改颜色
    bgColor: 'bg-purple-50',     // 修改背景色
    // 其他配置...
  }
];
```

## 响应式设计

组件完全支持响应式设计：

- **手机端**: 1列布局，堆叠显示
- **平板端**: 2列布局，适中间距
- **桌面端**: 3-4列布局，最佳体验

## 无障碍访问

组件包含以下无障碍特性：

- 语义化 HTML 标签
- 适当的 ARIA 标签
- 键盘导航支持
- 屏幕阅读器兼容
- 颜色对比度优化

## 性能优化

- 组件懒加载支持
- 防抖处理用户输入
- 虚拟化长列表（充值记录）
- 图片懒加载
- CSS 优化

## 浏览器兼容性

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 开发和调试

### 本地开发
```bash
# 启动开发服务器
npm run dev

# 运行类型检查
npm run type-check

# 运行测试
npm run test
```

### 调试技巧
1. 使用 React DevTools 检查组件状态
2. 查看浏览器控制台的日志输出
3. 使用 Network 面板监控 API 请求
4. 使用 Performance 面板分析性能

## 故障排除

### 常见问题

#### 1. 样式不显示
确保已正确安装和配置 Tailwind CSS：
```bash
npm install tailwindcss @tailwindcss/typography
```

#### 2. 图标不显示
确保已安装 lucide-react：
```bash
npm install lucide-react
```

#### 3. 类型错误
确保安装了必要的类型定义：
```bash
npm install @types/react @types/react-dom
```

## 更新日志

### v1.0.0 (2025-11-01)
- ✨ 初始版本发布
- ✨ 支持 6 种支付方式
- ✨ 充值套餐系统
- ✨ 优惠码功能
- ✨ 充值记录查看
- ✨ 完全响应式设计

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 联系方式

如有问题或建议，请通过以下方式联系：

- 📧 邮箱: support@luckymart.tj
- 💬 Telegram: @LuckyMartSupport
- 🐛 问题反馈: [GitHub Issues](https://github.com/luckymart/tj/issues)