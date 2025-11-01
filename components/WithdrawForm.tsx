'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { WithdrawRequest, User } from '@/types';
import { cn, calculateWithdrawFee } from '@/lib/utils';

// 提现方式类型
export type WithdrawMethod = 'bank_card' | 'alipay' | 'wechat' | 'alif_mobi' | 'dc_bank';

// 提现表单数据类型
export interface WithdrawFormData {
  amount: string;
  method: WithdrawMethod;
  accountInfo: {
    accountNumber: string;
    accountName: string;
    bankName?: string; // 银行卡专用
    phoneNumber?: string; // 支付宝、微信专用
  };
  password: string;
}

// 提现表单Props
export interface WithdrawFormProps {
  /** 当前用户余额 */
  balance: number;
  /** 用户信息 */
  user: User | null;
  /** 表单默认值 */
  defaultValues?: Partial<WithdrawFormData>;
  /** 提交回调函数 */
  onSubmit: (data: WithdrawFormData) => Promise<void>;
  /** 加载状态 */
  loading?: boolean;
  /** 自定义CSS类名 */
  className?: string;
  /** 最小提现金额（默认50） */
  minWithdrawAmount?: number;
  /** 手续费率（默认0.05即5%） */
  feeRate?: number;
  /** 最低手续费（默认2） */
  minFee?: number;
}

// 提现方式配置
const WITHDRAW_METHODS: Record<WithdrawMethod, { name: string; icon: string; description: string; accountLabel: string; accountPlaceholder: string }> = {
  bank_card: {
    name: '银行卡',
    icon: '🏦',
    description: '支持各大银行储蓄卡',
    accountLabel: '银行卡号',
    accountPlaceholder: '请输入银行卡号'
  },
  alipay: {
    name: '支付宝',
    icon: '💙',
    description: '快速到账，方便快捷',
    accountLabel: '支付宝账号',
    accountPlaceholder: '请输入支付宝账号或手机号'
  },
  wechat: {
    name: '微信',
    icon: '💚',
    description: '微信零钱快速提现',
    accountLabel: '微信号',
    accountPlaceholder: '请输入微信号或手机号'
  },
  alif_mobi: {
    name: 'Alif Mobi',
    icon: '💜',
    description: '塔吉克斯坦移动支付',
    accountLabel: '手机号',
    accountPlaceholder: '+992XXXXXXXXX'
  },
  dc_bank: {
    name: 'DC Bank',
    icon: '💙',
    description: 'DC银行储蓄卡',
    accountLabel: '银行账号',
    accountPlaceholder: '请输入银行账号'
  }
};

// 提现限制配置
const WITHDRAW_LIMITS = {
  MIN_AMOUNT: 50, // 最低提现金额
  MAX_AMOUNT: 10000, // 最高提现金额
  DAILY_LIMIT: 5000, // 每日限额
  MONTHLY_LIMIT: 50000, // 每月限额
  MIN_PASSWORD_LENGTH: 6, // 密码最小长度
};

const WithdrawForm: React.FC<WithdrawFormProps> = ({
  balance,
  user,
  defaultValues,
  onSubmit,
  loading = false,
  className,
  minWithdrawAmount = WITHDRAW_LIMITS.MIN_AMOUNT,
  feeRate = 0.05,
  minFee = 2
}) => {
  const { t } = useTranslation(['wallet', 'common']);
  const [formData, setFormData] = useState<WithdrawFormData>({
    amount: defaultValues?.amount || '',
    method: defaultValues?.method || 'alif_mobi',
    accountInfo: {
      accountNumber: defaultValues?.accountInfo?.accountNumber || '',
      accountName: defaultValues?.accountInfo?.accountName || user?.firstName || '',
      bankName: defaultValues?.accountInfo?.bankName || '',
      phoneNumber: defaultValues?.accountInfo?.phoneNumber || ''
    },
    password: defaultValues?.password || ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof WithdrawFormData, string>>>({});
  const [passwordError, setPasswordError] = useState('');
  const [accountError, setAccountError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // 计算手续费
  const withdrawAmount = parseFloat(formData.amount) || 0;
  const fee = withdrawAmount > 0 ? Math.max(calculateWithdrawFee(withdrawAmount), minFee) : 0;
  const actualAmount = withdrawAmount > 0 ? withdrawAmount - fee : 0;

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof WithdrawFormData, string>> = {};
    let isValid = true;

    // 金额验证
    if (!formData.amount || withdrawAmount <= 0) {
      newErrors.amount = '请输入有效的提现金额';
      isValid = false;
    } else if (withdrawAmount < minWithdrawAmount) {
      newErrors.amount = `最低提现金额为 ${minWithdrawAmount} TJS`;
      isValid = false;
    } else if (withdrawAmount > balance) {
      newErrors.amount = '余额不足';
      isValid = false;
    } else if (withdrawAmount > WITHDRAW_LIMITS.MAX_AMOUNT) {
      newErrors.amount = `单次最高提现金额为 ${WITHDRAW_LIMITS.MAX_AMOUNT} TJS`;
      isValid = false;
    }

    // 账户信息验证
    if (!formData.accountInfo.accountNumber.trim()) {
      setAccountError('请输入收款账号');
      isValid = false;
    } else {
      setAccountError('');
    }

    if (!formData.accountInfo.accountName.trim()) {
      newErrors.accountInfo = '请输入收款人姓名';
      isValid = false;
    }

    // 密码验证
    if (!formData.password.trim()) {
      setPasswordError('请输入支付密码');
      isValid = false;
    } else if (formData.password.length < WITHDRAW_LIMITS.MIN_PASSWORD_LENGTH) {
      setPasswordError(`支付密码至少需要 ${WITHDRAW_LIMITS.MIN_PASSWORD_LENGTH} 位`);
      isValid = false;
    } else {
      setPasswordError('');
    }

    // 协议确认
    if (!agreed) {
      newErrors.amount = '请阅读并同意提现协议';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      // 重置表单
      setFormData({
        amount: '',
        method: formData.method, // 保持选择的提现方式
        accountInfo: {
          ...formData.accountInfo,
          accountNumber: '',
          bankName: '',
          phoneNumber: ''
        },
        password: ''
      });
      setAgreed(false);
    } catch (error) {
      console.error('提现失败:', error);
    }
  };

  // 处理输入变化
  const handleInputChange = (field: keyof WithdrawFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // 处理账户信息变化
  const handleAccountInfoChange = (field: keyof typeof formData.accountInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      accountInfo: { ...prev.accountInfo, [field]: value }
    }));
    setAccountError('');
  };

  // 获取提现方式列表
  const getAvailableMethods = (): WithdrawMethod[] => {
    // 根据用户地区和偏好显示可用的提现方式
    return ['alif_mobi', 'dc_bank', 'bank_card', 'alipay', 'wechat'];
  };

  return (
    <div className={cn('w-full max-w-2xl mx-auto', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            {t('wallet:title')} - {t('wallet:withdraw')}
          </CardTitle>
          <CardDescription>
            提现金额将从您的余额中扣除，手续费为 {(feeRate * 100).toFixed(0)}% 或最低 {minFee} TJS
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* 余额显示 */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">可用余额</span>
              <span className="text-2xl font-bold text-blue-600">{balance.toFixed(2)} TJS</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 提现金额 */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                提现金额 <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder={`最低 ${minWithdrawAmount} TJS`}
                  min={minWithdrawAmount}
                  max={balance}
                  step="0.01"
                  className={cn('pr-16', errors.amount && 'border-red-500')}
                  disabled={loading}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  TJS
                </span>
              </div>
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount}</p>
              )}
              
              {/* 费用预览 */}
              {withdrawAmount > 0 && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>提现金额:</span>
                    <span>{withdrawAmount.toFixed(2)} TJS</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>手续费:</span>
                    <span className="text-orange-600">{fee.toFixed(2)} TJS</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t pt-1">
                    <span>实际到账:</span>
                    <span className="text-green-600">{actualAmount.toFixed(2)} TJS</span>
                  </div>
                </div>
              )}
            </div>

            {/* 提现方式选择 */}
            <div className="space-y-2">
              <Label>提现方式 <span className="text-red-500">*</span></Label>
              <Tabs 
                value={formData.method} 
                onValueChange={(value) => handleInputChange('method', value as WithdrawMethod)}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 lg:grid-cols-3 gap-1 h-auto p-1">
                  {getAvailableMethods().map((method) => (
                    <TabsTrigger
                      key={method}
                      value={method}
                      className="flex flex-col items-center gap-1 p-3 h-auto text-xs"
                      disabled={loading}
                    >
                      <span className="text-lg">{WITHDRAW_METHODS[method].icon}</span>
                      <span>{WITHDRAW_METHODS[method].name}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {getAvailableMethods().map((method) => (
                  <TabsContent key={method} value={method} className="mt-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">
                        {WITHDRAW_METHODS[method].description}
                      </p>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            {/* 账户信息 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accountName">
                  收款人姓名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="accountName"
                  value={formData.accountInfo.accountName}
                  onChange={(e) => handleAccountInfoChange('accountName', e.target.value)}
                  placeholder="请输入收款人真实姓名"
                  className={cn(errors.accountInfo && 'border-red-500')}
                  disabled={loading}
                />
                {errors.accountInfo && (
                  <p className="text-sm text-red-500">{errors.accountInfo}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">
                  {WITHDRAW_METHODS[formData.method].accountLabel} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="accountNumber"
                  value={formData.accountInfo.accountNumber}
                  onChange={(e) => handleAccountInfoChange('accountNumber', e.target.value)}
                  placeholder={WITHDRAW_METHODS[formData.method].accountPlaceholder}
                  className={accountError && 'border-red-500'}
                  disabled={loading}
                />
                {accountError && (
                  <p className="text-sm text-red-500">{accountError}</p>
                )}
              </div>

              {/* 银行名称（仅银行卡需要） */}
              {formData.method === 'bank_card' && (
                <div className="space-y-2">
                  <Label htmlFor="bankName">
                    开户银行 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bankName"
                    value={formData.accountInfo.bankName || ''}
                    onChange={(e) => handleAccountInfoChange('bankName', e.target.value)}
                    placeholder="如：中国银行"
                    disabled={loading}
                  />
                </div>
              )}

              {/* 手机号（支付宝、微信需要） */}
              {(formData.method === 'alipay' || formData.method === 'wechat') && (
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">
                    预留手机号
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.accountInfo.phoneNumber || ''}
                    onChange={(e) => handleAccountInfoChange('phoneNumber', e.target.value)}
                    placeholder="+992XXXXXXXXX"
                    disabled={loading}
                  />
                </div>
              )}
            </div>

            {/* 支付密码 */}
            <div className="space-y-2">
              <Label htmlFor="password">
                支付密码 <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => {
                    handleInputChange('password', e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="请输入6位支付密码"
                  className={cn('pr-20', passwordError && 'border-red-500')}
                  disabled={loading}
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
                  disabled={loading}
                >
                  {showPassword ? '隐藏' : '显示'}
                </button>
              </div>
              {passwordError && (
                <p className="text-sm text-red-500">{passwordError}</p>
              )}
            </div>

            {/* 协议确认 */}
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1"
                  disabled={loading}
                />
                <span className="text-sm text-gray-600 leading-relaxed">
                  我已阅读并同意
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-700 underline mx-1"
                    onClick={() => {
                      // 这里可以打开提现协议弹窗
                      alert('提现协议功能待实现');
                    }}
                  >
                    《提现服务协议》
                  </button>
                  ，确认提现信息无误。
                </span>
              </label>
            </div>

            {/* 提现说明 */}
            <Alert>
              <AlertDescription>
                <div className="space-y-1 text-sm">
                  <div className="font-medium">提现说明：</div>
                  <ul className="space-y-1 text-xs text-gray-600">
                    <li>• 最低提现金额: {minWithdrawAmount} TJS</li>
                    <li>• 手续费: {(feeRate * 100).toFixed(0)}% 或最低 {minFee} TJS</li>
                    <li>• 审核时间: 1-3个工作日</li>
                    <li>• 单日限额: {WITHDRAW_LIMITS.DAILY_LIMIT} TJS</li>
                    <li>• 单月限额: {WITHDRAW_LIMITS.MONTHLY_LIMIT} TJS</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            {/* 提交按钮 */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !agreed}
            >
              {loading ? '提交中...' : '提交提现申请'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default WithdrawForm;
export type { WithdrawFormData, WithdrawMethod };