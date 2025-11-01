'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Smartphone, 
  Building, 
  Bitcoin,
  Gift,
  History,
  Star,
  CheckCircle,
  AlertCircle,
  Wallet
} from 'lucide-react';

// 支付方式枚举
export enum PaymentMethod {
  ALIPAY = 'alipay',
  WECHAT = 'wechat',
  BANK_CARD = 'bank_card',
  CRYPTO = 'crypto',
  ALIF_MOBI = 'alif_mobi',
  DC_BANK = 'dc_bank'
}

// 支付方式信息
interface PaymentMethodInfo {
  id: PaymentMethod;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  description: string;
  fee: number; // 手续费百分比
  minAmount: number;
  maxAmount: number;
}

// 充值礼包接口
interface RechargePackage {
  id: number;
  amount: number;
  bonus: number;
  totalCoins: number;
  isActive: boolean;
  sortOrder: number;
  popular?: boolean;
  discount?: number;
}

// 优惠活动接口
interface Promotion {
  id: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minAmount: number;
  maxDiscount: number;
  validUntil: Date;
  promoCode: string;
}

// 充值记录接口
interface RechargeRecord {
  id: string;
  amount: number;
  bonus: number;
  totalCoins: number;
  paymentMethod: PaymentMethod;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  transactionId?: string;
}

// 组件属性接口
interface RechargeFormProps {
  userId?: string;
  onRechargeSuccess?: (record: RechargeRecord) => void;
  onRechargeFailure?: (error: string) => void;
  showHistory?: boolean;
  showPromotions?: boolean;
  className?: string;
}

export function RechargeForm({
  userId,
  onRechargeSuccess,
  onRechargeFailure,
  showHistory = true,
  showPromotions = true,
  className = ''
}: RechargeFormProps) {
  // 状态管理
  const [activeTab, setActiveTab] = useState('packages');
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  
  // 数据状态
  const [packages, setPackages] = useState<RechargePackage[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [rechargeHistory, setRechargeHistory] = useState<RechargeRecord[]>([]);
  
  // 加载状态
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 支付方式配置
  const paymentMethods: PaymentMethodInfo[] = [
    {
      id: PaymentMethod.ALIF_MOBI,
      name: 'Alif Mobi',
      icon: Smartphone,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: '塔吉克斯坦移动支付',
      fee: 0,
      minAmount: 10,
      maxAmount: 1000
    },
    {
      id: PaymentMethod.DC_BANK,
      name: 'DC Bank',
      icon: Building,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: '塔吉克斯坦银行卡',
      fee: 0,
      minAmount: 10,
      maxAmount: 5000
    },
    {
      id: PaymentMethod.ALIPAY,
      name: '支付宝',
      icon: Smartphone,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: '中国支付宝',
      fee: 2,
      minAmount: 20,
      maxAmount: 2000
    },
    {
      id: PaymentMethod.WECHAT,
      name: '微信支付',
      icon: Smartphone,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: '中国微信支付',
      fee: 2,
      minAmount: 20,
      maxAmount: 2000
    },
    {
      id: PaymentMethod.BANK_CARD,
      name: '银行卡',
      icon: CreditCard,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      description: '国际银行卡',
      fee: 3,
      minAmount: 50,
      maxAmount: 10000
    },
    {
      id: PaymentMethod.CRYPTO,
      name: '加密货币',
      icon: Bitcoin,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'USDT/BTC/ETH',
      fee: 1,
      minAmount: 100,
      maxAmount: 50000
    }
  ];

  // 模拟数据
  const mockPackages: RechargePackage[] = [
    { id: 1, amount: 50, bonus: 5, totalCoins: 55, isActive: true, sortOrder: 1 },
    { id: 2, amount: 100, bonus: 15, totalCoins: 115, isActive: true, sortOrder: 2, popular: true },
    { id: 3, amount: 200, bonus: 40, totalCoins: 240, isActive: true, sortOrder: 3 },
    { id: 4, amount: 500, bonus: 125, totalCoins: 625, isActive: true, sortOrder: 4 },
    { id: 5, amount: 1000, bonus: 300, totalCoins: 1300, isActive: true, sortOrder: 5, discount: 10 }
  ];

  const mockPromotions: Promotion[] = [
    {
      id: '1',
      title: '新用户首充奖励',
      description: '首次充值享受额外20%奖励',
      discountType: 'percentage',
      discountValue: 20,
      minAmount: 100,
      maxDiscount: 100,
      validUntil: new Date('2025-12-31'),
      promoCode: 'FIRST20'
    },
    {
      id: '2',
      title: '充值满减',
      description: '单次充值满500送50币',
      discountType: 'fixed',
      discountValue: 50,
      minAmount: 500,
      maxDiscount: 50,
      validUntil: new Date('2025-12-31'),
      promoCode: 'SAVE50'
    }
  ];

  const mockHistory: RechargeRecord[] = [
    {
      id: '1',
      amount: 100,
      bonus: 15,
      totalCoins: 115,
      paymentMethod: PaymentMethod.ALIF_MOBI,
      status: 'completed',
      createdAt: new Date('2025-10-15'),
      completedAt: new Date('2025-10-15'),
      transactionId: 'TXN001'
    },
    {
      id: '2',
      amount: 200,
      bonus: 40,
      totalCoins: 240,
      paymentMethod: PaymentMethod.DC_BANK,
      status: 'pending',
      createdAt: new Date('2025-10-20')
    }
  ];

  // 初始化数据
  useEffect(() => {
    fetchPackages();
    if (showPromotions) {
      fetchPromotions();
    }
    if (showHistory) {
      fetchRechargeHistory();
    }
  }, [showPromotions, showHistory]);

  // 获取充值礼包
  const fetchPackages = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      setPackages(mockPackages);
    } catch (error) {
      console.error('获取充值礼包失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取优惠活动
  const fetchPromotions = async () => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      setPromotions(mockPromotions);
    } catch (error) {
      console.error('获取优惠活动失败:', error);
    }
  };

  // 获取充值记录
  const fetchRechargeHistory = async () => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 400));
      setRechargeHistory(mockHistory);
    } catch (error) {
      console.error('获取充值记录失败:', error);
    }
  };

  // 应用优惠码
  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) return;
    
    setIsApplyingPromo(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const promotion = promotions.find(p => p.promoCode.toLowerCase() === promoCode.toLowerCase());
      if (promotion) {
        setAppliedPromo(promotion);
        alert('优惠码应用成功！');
      } else {
        alert('优惠码无效或已过期');
      }
    } catch (error) {
      alert('优惠码验证失败');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  // 处理充值
  const handleRecharge = async () => {
    if (!selectedPaymentMethod) {
      alert('请选择支付方式');
      return;
    }

    const amount = selectedPackage 
      ? packages.find(p => p.id === selectedPackage)?.amount || 0
      : customAmount;

    if (amount < 10) {
      alert('充值金额不能少于10 TJS');
      return;
    }

    setSubmitting(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const record: RechargeRecord = {
        id: Date.now().toString(),
        amount,
        bonus: calculateBonus(amount),
        totalCoins: amount + calculateBonus(amount),
        paymentMethod: selectedPaymentMethod,
        status: 'pending',
        createdAt: new Date(),
        transactionId: `TXN${Date.now()}`
      };

      onRechargeSuccess?.(record);
      alert(`充值订单创建成功！\n\n请使用所选支付方式完成支付。\n交易号：${record.transactionId}\n支付完成后请联系客服核销。`);
      
      // 重置表单
      resetForm();
      fetchRechargeHistory(); // 刷新记录
    } catch (error) {
      onRechargeFailure?.('充值失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 计算奖励
  const calculateBonus = (amount: number): number => {
    const pkg = packages.find(p => p.amount === amount);
    if (pkg) return pkg.bonus;
    
    // 自定义金额奖励计算
    if (amount >= 1000) return Math.floor(amount * 0.3);
    if (amount >= 500) return Math.floor(amount * 0.25);
    if (amount >= 200) return Math.floor(amount * 0.2);
    if (amount >= 100) return Math.floor(amount * 0.15);
    if (amount >= 50) return Math.floor(amount * 0.1);
    return 0;
  };

  // 重置表单
  const resetForm = () => {
    setSelectedPackage(null);
    setCustomAmount(0);
    setSelectedPaymentMethod(null);
    setPromoCode('');
    setAppliedPromo(null);
  };

  // 获取选中金额的详细信息
  const getSelectedAmount = () => {
    if (selectedPackage) {
      const pkg = packages.find(p => p.id === selectedPackage);
      return pkg?.amount || 0;
    }
    return customAmount;
  };

  const getTotalCoins = () => {
    const amount = getSelectedAmount();
    let bonus = calculateBonus(amount);
    
    // 应用优惠活动
    if (appliedPromo && amount >= appliedPromo.minAmount) {
      if (appliedPromo.discountType === 'percentage') {
        const discount = Math.min((amount * appliedPromo.discountValue) / 100, appliedPromo.maxDiscount);
        bonus += Math.floor(discount / 10); // 转换为币
      } else {
        bonus += Math.floor(appliedPromo.discountValue / 10);
      }
    }
    
    return amount + bonus;
  };

  const selectedAmount = getSelectedAmount();
  const totalCoins = getTotalCoins();
  const fee = selectedPaymentMethod ? (selectedAmount * paymentMethods.find(m => m.id === selectedPaymentMethod)?.fee || 0) / 100 : 0;

  return (
    <div className={`max-w-4xl mx-auto p-4 space-y-6 ${className}`}>
      {/* 标题区域 */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Wallet className="w-6 h-6" />
            账户充值
          </CardTitle>
          <CardDescription>
            选择充值金额，享受平台福利，畅享夺宝乐趣
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 主要功能区域 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="packages" className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            充值套餐
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            自定义金额
          </TabsTrigger>
          {showPromotions && (
            <TabsTrigger value="promotions" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              优惠活动
            </TabsTrigger>
          )}
          {showHistory && (
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              充值记录
            </TabsTrigger>
          )}
        </TabsList>

        {/* 充值套餐 */}
        <TabsContent value="packages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>选择充值套餐</CardTitle>
              <CardDescription>
                推荐充值套餐，充值越多送得越多
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={`relative p-6 rounded-lg border-2 transition-all hover:scale-105 ${
                      selectedPackage === pkg.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {pkg.popular && (
                      <Badge className="absolute -top-2 -right-2 bg-orange-500">
                        <Star className="w-3 h-3 mr-1" />
                        推荐
                      </Badge>
                    )}
                    {pkg.discount && (
                      <Badge variant="destructive" className="absolute -top-2 -left-2">
                        {pkg.discount}% OFF
                      </Badge>
                    )}
                    
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold text-gray-900">
                        {pkg.amount} TJS
                      </div>
                      {pkg.bonus > 0 && (
                        <div className="inline-block bg-green-100 text-green-600 text-sm font-semibold px-3 py-1 rounded-full">
                          送 {pkg.bonus} 币
                        </div>
                      )}
                      <div className="text-sm text-gray-600">
                        共获得 <span className="font-bold text-blue-600">{pkg.totalCoins}</span> 币
                      </div>
                      <div className="text-xs text-gray-500">
                        奖励率 {Math.round((pkg.bonus / pkg.amount) * 100)}%
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 自定义金额 */}
        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>自定义充值金额</CardTitle>
              <CardDescription>
                输入任意金额，系统自动计算奖励
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">充值金额 (TJS)</label>
                <Input
                  type="number"
                  placeholder="请输入充值金额"
                  value={customAmount || ''}
                  onChange={(e) => setCustomAmount(Number(e.target.value))}
                  min="10"
                  max="50000"
                />
              </div>
              
              {customAmount >= 10 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>充值金额：</span>
                      <span className="font-medium">{customAmount} TJS</span>
                    </div>
                    <div className="flex justify-between">
                      <span>奖励金币：</span>
                      <span className="font-medium text-green-600">+{calculateBonus(customAmount)} 币</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>总计金币：</span>
                      <span className="text-blue-600">{customAmount + calculateBonus(customAmount)} 币</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 优惠活动 */}
        {showPromotions && (
          <TabsContent value="promotions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>优惠活动</CardTitle>
                <CardDescription>
                  使用优惠码享受额外奖励
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 优惠码输入 */}
                <div className="flex gap-2">
                  <Input
                    placeholder="请输入优惠码"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  />
                  <Button
                    onClick={handleApplyPromoCode}
                    disabled={!promoCode.trim() || isApplyingPromo}
                    variant="outline"
                  >
                    {isApplyingPromo ? '验证中...' : '应用'}
                  </Button>
                </div>

                {/* 已应用的优惠 */}
                {appliedPromo && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">优惠已应用</span>
                    </div>
                    <div className="mt-2 text-sm text-green-700">
                      <div>{appliedPromo.title}</div>
                      <div>{appliedPromo.description}</div>
                    </div>
                  </div>
                )}

                {/* 可用优惠活动 */}
                <div className="space-y-3">
                  <h4 className="font-medium">可用优惠活动</h4>
                  {promotions.map((promo) => (
                    <div
                      key={promo.id}
                      className="border p-4 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => setPromoCode(promo.promoCode)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium">{promo.title}</h5>
                          <p className="text-sm text-gray-600 mt-1">{promo.description}</p>
                          <div className="text-xs text-gray-500 mt-2">
                            最低充值: {promo.minAmount} TJS | 优惠码: {promo.promoCode}
                          </div>
                        </div>
                        <Badge variant="secondary">限时</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* 充值记录 */}
        {showHistory && (
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>充值记录</CardTitle>
                <CardDescription>
                  查看您的充值历史记录
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rechargeHistory.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          {React.createElement(
                            paymentMethods.find(m => m.id === record.paymentMethod)?.icon || CreditCard,
                            { className: 'w-5 h-5' }
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{record.amount} TJS</div>
                          <div className="text-sm text-gray-500">
                            {record.createdAt.toLocaleDateString()} · {record.paymentMethod}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{record.totalCoins} 币</div>
                        <div className="flex items-center gap-1">
                          {record.status === 'completed' && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          {record.status === 'pending' && (
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                          )}
                          {record.status === 'failed' && (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className={`text-xs ${
                            record.status === 'completed' ? 'text-green-600' :
                            record.status === 'pending' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {record.status === 'completed' ? '已完成' :
                             record.status === 'pending' ? '处理中' : '失败'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* 支付方式选择 */}
      {(selectedPackage || customAmount >= 10) && (
        <Card>
          <CardHeader>
            <CardTitle>选择支付方式</CardTitle>
            <CardDescription>
              选择您偏好的支付方式进行充值
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedPaymentMethod === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${method.bgColor}`}>
                      <method.icon className={`w-5 h-5 ${method.color}`} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{method.name}</div>
                      <div className="text-xs text-gray-500">{method.description}</div>
                      <div className="text-xs text-gray-400">
                        手续费: {method.fee}%
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 充值确认 */}
      {selectedPaymentMethod && (selectedPackage || customAmount >= 10) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>充值确认</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">充值金额：</span>
                <span className="font-medium">{selectedAmount} TJS</span>
              </div>
              <div>
                <span className="text-gray-600">支付方式：</span>
                <span className="font-medium">
                  {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name}
                </span>
              </div>
              <div>
                <span className="text-gray-600">奖励金币：</span>
                <span className="font-medium text-green-600">
                  +{calculateBonus(selectedAmount)} 币
                </span>
              </div>
              <div>
                <span className="text-gray-600">手续费：</span>
                <span className="font-medium">{fee.toFixed(2)} TJS</span>
              </div>
              <div className="col-span-2 border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">总计获得：</span>
                  <span className="text-2xl font-bold text-blue-600">{totalCoins} 币</span>
                </div>
              </div>
            </div>
            
            <Button
              onClick={handleRecharge}
              disabled={submitting}
              className="w-full"
              size="lg"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  处理中...
                </div>
              ) : (
                `确认充值 ${selectedAmount} TJS`
              )}
            </Button>
            
            <div className="text-xs text-gray-500 text-center">
              * 充值后需联系客服核销，1-5分钟到账
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}