/**
 * RechargeForm 组件使用示例
 * components/RechargeForm/RechargeForm.examples.tsx
 */

'use client';

import { RechargeForm, RechargeRecord, PaymentMethod } from './RechargeForm';
import { useState } from 'react';

export function RechargeFormExamples() {
  // 充值成功回调
  const handleRechargeSuccess = (record: RechargeRecord) => {
    console.log('充值成功:', record);
    // 这里可以添加成功后的逻辑，比如：
    // - 更新用户余额
    // - 显示成功提示
    // - 跳转到其他页面
  };

  // 充值失败回调
  const handleRechargeFailure = (error: string) => {
    console.error('充值失败:', error);
    // 这里可以添加失败后的逻辑，比如：
    // - 显示错误提示
    // - 记录错误日志
  };

  return (
    <div className="space-y-8">
      {/* 基础用法示例 */}
      <section>
        <h2 className="text-xl font-bold mb-4">基础用法</h2>
        <RechargeForm
          userId="user123"
          onRechargeSuccess={handleRechargeSuccess}
          onRechargeFailure={handleRechargeFailure}
          showHistory={true}
          showPromotions={true}
        />
      </section>

      {/* 仅显示充值功能的简化版本 */}
      <section>
        <h2 className="text-xl font-bold mb-4">简化版本（仅充值功能）</h2>
        <RechargeForm
          userId="user123"
          onRechargeSuccess={handleRechargeSuccess}
          onRechargeFailure={handleRechargeFailure}
          showHistory={false}
          showPromotions={false}
        />
      </section>

      {/* 仅显示充值和优惠活动的版本 */}
      <section>
        <h2 className="text-xl font-bold mb-4">带优惠活动的版本</h2>
        <RechargeForm
          userId="user123"
          onRechargeSuccess={handleRechargeSuccess}
          onRechargeFailure={handleRechargeFailure}
          showHistory={false}
          showPromotions={true}
        />
      </section>
    </div>
  );
}

// 使用示例的代码展示
export const RechargeFormUsageCode = `
// 基础用法
import { RechargeForm } from '@/components/RechargeForm';

function MyPage() {
  const handleRechargeSuccess = (record) => {
    console.log('充值成功:', record);
    // 处理充值成功逻辑
  };

  const handleRechargeFailure = (error) => {
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

// 简化版本（仅充值功能）
<RechargeForm
  userId="user123"
  onRechargeSuccess={handleRechargeSuccess}
  onRechargeFailure={handleRechargeFailure}
  showHistory={false}
  showPromotions={false}
 />

// 带自定义样式
<RechargeForm
  userId="user123"
  onRechargeSuccess={handleRechargeSuccess}
  onRechargeFailure={handleRechargeFailure}
  className="max-w-2xl mx-auto"
/>
`;

// 支付方式枚举值
export const PaymentMethodExamples = {
  ALIF_MOBI: PaymentMethod.ALIF_MOBI,      // Alif Mobi
  DC_BANK: PaymentMethod.DC_BANK,          // DC Bank
  ALIPAY: PaymentMethod.ALIPAY,            // 支付宝
  WECHAT: PaymentMethod.WECHAT,            // 微信支付
  BANK_CARD: PaymentMethod.BANK_CARD,      // 银行卡
  CRYPTO: PaymentMethod.CRYPTO,            // 加密货币
};