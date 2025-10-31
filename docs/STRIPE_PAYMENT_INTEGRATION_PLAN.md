# Stripe支付集成实施计划

## 概述
为LuckyMart TJ项目集成Stripe支付网关，实现完整的支付功能闭环，包括充值、夺宝参与、商品购买等场景。

## 集成范围

### 1. 支付场景
- **用户充值**: 用户钱包充值（支持多种金额）
- **商品购买**: 直接购买商品
- **夺宝参与**: 参与幸运夺宝活动
- **VIP升级**: 购买VIP会员

### 2. 支付方式
- 信用卡支付（Visa、Mastercard）
- 借记卡支付
- 数字钱包（Apple Pay、Google Pay）

## 技术实施

### Phase 1: Stripe账户设置
1. 注册Stripe账户
2. 获取API密钥（Test模式）
   - Publishable Key (公开密钥)
   - Secret Key (私密密钥)
3. 配置Webhook端点
4. 设置货币和支付方式

### Phase 2: 后端API开发

#### 创建支付意图API
**文件**: `app/api/payment/create-intent/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase-server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency = 'usd', userId, type, metadata } = body;

    // 验证用户
    const supabase = createClient();
    const { data: user, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 创建支付意图
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // 转换为分
      currency,
      metadata: {
        userId: user.user.id,
        type, // 'recharge', 'product', 'lottery', 'vip'
        ...metadata,
      },
    });

    // 记录支付记录
    const { error: insertError } = await supabase
      .from('payments')
      .insert({
        userId: user.user.id,
        stripePaymentIntentId: paymentIntent.id,
        amount,
        currency,
        type,
        status: 'pending',
        metadata,
      });

    if (insertError) {
      console.error('保存支付记录失败:', insertError);
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('创建支付意图失败:', error);
    return NextResponse.json(
      { error: error.message || '支付创建失败' },
      { status: 500 }
    );
  }
}
```

#### Webhook处理API
**文件**: `app/api/payment/webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase-server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook签名验证失败:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createClient();

  // 处理不同类型的事件
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentSuccess(paymentIntent, supabase);
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      await handlePaymentFailed(failedPayment, supabase);
      break;

    default:
      console.log(`未处理的事件类型: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentSuccess(
  paymentIntent: Stripe.PaymentIntent,
  supabase: any
) {
  const { userId, type, ...metadata } = paymentIntent.metadata;

  // 更新支付记录
  await supabase
    .from('payments')
    .update({ status: 'succeeded', completedAt: new Date().toISOString() })
    .eq('stripePaymentIntentId', paymentIntent.id);

  // 根据支付类型处理业务逻辑
  switch (type) {
    case 'recharge':
      // 充值到用户钱包
      await supabase.rpc('add_wallet_balance', {
        p_user_id: userId,
        p_amount: paymentIntent.amount / 100,
        p_type: 'recharge',
        p_description: `Stripe充值: ${paymentIntent.id}`,
      });
      break;

    case 'product':
      // 创建商品订单
      await createProductOrder(userId, metadata, supabase);
      break;

    case 'lottery':
      // 参与夺宝
      await participateLottery(userId, metadata, supabase);
      break;

    case 'vip':
      // 升级VIP
      await upgradeVIP(userId, metadata, supabase);
      break;
  }

  // 发送支付成功通知
  await sendPaymentSuccessNotification(userId, paymentIntent);
}

async function handlePaymentFailed(
  paymentIntent: Stripe.PaymentIntent,
  supabase: any
) {
  await supabase
    .from('payments')
    .update({ status: 'failed', failedAt: new Date().toISOString() })
    .eq('stripePaymentIntentId', paymentIntent.id);
}
```

### Phase 3: 前端组件开发

#### 充值页面组件
**文件**: `app/components/StripeCheckout.tsx`

```typescript
'use client';

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutFormProps {
  amount: number;
  type: 'recharge' | 'product' | 'lottery' | 'vip';
  metadata?: Record<string, any>;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

function CheckoutForm({ amount, type, metadata, onSuccess, onError }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage('');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success`,
      },
    });

    if (error) {
      setMessage(error.message || '支付失败');
      onError?.(error.message || '支付失败');
    } else {
      onSuccess?.();
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      <button
        type="submit"
        disabled={isProcessing || !stripe || !elements}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? '处理中...' : `支付 $${amount}`}
      </button>

      {message && (
        <div className="text-red-600 text-sm text-center">{message}</div>
      )}
    </form>
  );
}

export default function StripeCheckout(props: CheckoutFormProps) {
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);

  const createPaymentIntent = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: props.amount,
          type: props.type,
          metadata: props.metadata,
        }),
      });

      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error('创建支付意图失败:', error);
      props.onError?.('创建支付失败');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    createPaymentIntent();
  }, []);

  if (loading || !clientSecret) {
    return <div className="text-center py-8">加载支付表单...</div>;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm {...props} />
    </Elements>
  );
}
```

### Phase 4: 数据库表设计

#### payments表
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES users(id),
  "stripePaymentIntentId" VARCHAR(255) NOT NULL UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  type VARCHAR(20) NOT NULL, -- 'recharge', 'product', 'lottery', 'vip'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'succeeded', 'failed', 'canceled'
  metadata JSONB,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP,
  "failedAt" TIMESTAMP,
  CONSTRAINT payments_type_check CHECK (type IN ('recharge', 'product', 'lottery', 'vip')),
  CONSTRAINT payments_status_check CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled'))
);

CREATE INDEX idx_payments_user ON payments("userId");
CREATE INDEX idx_payments_stripe_id ON payments("stripePaymentIntentId");
CREATE INDEX idx_payments_status ON payments(status, "createdAt");
```

## 测试计划

### 1. 测试环境设置
- 使用Stripe Test模式
- 配置Webhook测试端点（使用Stripe CLI）
- 准备测试信用卡号

### 2. 测试用例

#### 2.1 充值功能测试
```
测试卡号: 4242 4242 4242 4242
过期日期: 任意未来日期
CVC: 任意3位数字
邮政编码: 任意5位数字

测试步骤:
1. 用户登录
2. 进入充值页面
3. 选择充值金额（$10, $50, $100）
4. 输入测试卡号信息
5. 确认支付
6. 验证钱包余额增加
7. 验证支付记录创建
8. 验证Webhook接收成功
```

#### 2.2 失败场景测试
```
测试卡号（余额不足）: 4000 0000 0000 9995

测试步骤:
1. 使用失败卡号进行支付
2. 验证错误提示正确显示
3. 验证钱包余额未变化
4. 验证支付记录状态为failed
```

#### 2.3 商品购买测试
```
测试步骤:
1. 选择商品
2. 使用Stripe支付
3. 验证订单创建
4. 验证库存扣减
5. 验证支付记录
```

### 3. Webhook测试
使用Stripe CLI进行本地Webhook测试：
```bash
# 安装Stripe CLI
brew install stripe/stripe-cli/stripe

# 登录Stripe
stripe login

# 转发Webhook到本地
stripe listen --forward-to localhost:3000/api/payment/webhook

# 触发测试事件
stripe trigger payment_intent.succeeded
```

## 环境变量配置

```env
# Stripe配置
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

## 部署前检查清单

- [ ] Stripe账户已设置并验证
- [ ] 获取生产环境API密钥
- [ ] 配置生产Webhook端点
- [ ] 所有支付API已测试
- [ ] Webhook事件处理已测试
- [ ] 支付失败场景已测试
- [ ] 数据库表已创建
- [ ] 环境变量已配置
- [ ] 前端组件已集成
- [ ] 支付流程端到端测试完成

## 安全注意事项

1. **密钥安全**
   - 私密密钥仅在服务器端使用
   - 不要在前端代码中暴露私密密钥
   - 使用环境变量存储所有密钥

2. **金额验证**
   - 在服务器端验证所有金额
   - 防止客户端篡改支付金额

3. **幂等性**
   - 使用Stripe的幂等性密钥防止重复支付
   - 在数据库中记录所有支付交易

4. **Webhook验证**
   - 始终验证Webhook签名
   - 使用HTTPS接收Webhook

## 监控和日志

1. **支付监控**
   - 实时监控支付成功率
   - 跟踪支付失败原因
   - 设置异常告警

2. **日志记录**
   - 记录所有支付请求
   - 记录Webhook事件
   - 记录错误和异常

## 成本估算

Stripe费率（测试环境免费）：
- 国际卡: 2.9% + $0.30/笔
- 本地卡: 可能有优惠费率

## 实施时间表

| 阶段 | 任务 | 预计时间 |
|------|------|----------|
| Phase 1 | Stripe账户设置 | 1小时 |
| Phase 2 | 后端API开发 | 4小时 |
| Phase 3 | 前端组件开发 | 3小时 |
| Phase 4 | 数据库设置 | 1小时 |
| 测试 | 完整测试 | 3小时 |
| 部署 | 生产部署 | 2小时 |
| **总计** | | **14小时** |

## 下一步行动

1. 获取Stripe测试API密钥
2. 安装Stripe SDK: `npm install stripe @stripe/stripe-js @stripe/react-stripe-js`
3. 创建支付API端点
4. 开发前端支付组件
5. 配置Webhook
6. 执行完整测试

---

**文档创建时间**: 2025年10月31日 23:22  
**状态**: 待实施  
**优先级**: 高
