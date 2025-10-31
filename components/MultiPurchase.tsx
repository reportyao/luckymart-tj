'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiClient, handleApiError } from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface MultiPurchaseProps {
  roundId: string;
  pricePerShare: number;
  availableShares: number;
  onSuccess?: (data: any) => void;
}

export default function MultiPurchase({ 
  roundId, 
  pricePerShare, 
  availableShares,
  onSuccess 
}: MultiPurchaseProps) {
  const { t } = useLanguage();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [selectedShares, setSelectedShares] = useState<number>(5);
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [customShares, setCustomShares] = useState<string>('5');

  // 预设份数选项
  const shareOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // 计算折扣
  const getDiscount = (shares: number) => {
    if (shares >= 10) return 0.9; // 10份9折
    if (shares >= 5) return 0.95; // 5份9.5折
    return 1; // 无折扣
  };

  // 计算总价
  const calculateTotal = (shares: number) => {
    const discount = getDiscount(shares);
    return pricePerShare * shares * discount;
  };

  // 获取用户幸运币余额
  const fetchUserBalance = async () => {
    try {
      const response = await apiClient.get('/user/balance');
      if (response.success) {
        setCoinBalance(response.data.luckyCoins || 0);
      }
    } catch (error) {
      console.error('获取用户余额失败:', error);
    }
  };

  useEffect(() => {
    fetchUserBalance();
  }, []);

  // 处理自定义份数输入
  const handleCustomSharesChange = (value: string) => {
    setCustomShares(value);
    const numValue = parseInt(value);
    if (numValue >= 1 && numValue <= 10) {
      setSelectedShares(numValue);
    }
  };

  // 检查是否可以购买
  const canPurchase = (shares: number) => {
    return shares >= 1 && shares <= availableShares && calculateTotal(shares) <= coinBalance;
  };

  // 处理购买
  const handlePurchase = async () => {
    const shares = selectedShares;
    
    if (shares < 1 || shares > 10) {
      toast.error('批量购买份数必须在1-10份之间');
      return;
    }

    if (shares > availableShares) {
      toast.error(`可用份额不足，仅剩 ${availableShares} 份`);
      return;
    }

    const totalCost = calculateTotal(shares);
    if (totalCost > coinBalance) {
      toast.error('幸运币余额不足');
      router.push('/wallet/recharge');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/lottery/bulk-participate', {
        roundId,
        quantity: shares
      });

      if (response.success) {
        const discount = Math.round((1 - getDiscount(shares)) * 100);
        const discountAmount = pricePerShare * shares * (1 - getDiscount(shares));
        
        toast.success(
          `🎉 批量购买成功！\n购买 ${shares} 份\n获得 ${discount}% 折扣\n节省 ${discountAmount} 幸运币`,
          { duration: 4000 }
        );
        
        onSuccess?.(response.data);
      } else {
        throw new Error(response.error || '批量购买失败');
      }
    } catch (error) {
      const errorMessage = handleApiError(error as Error);
      toast.error(errorMessage);
      
      if (errorMessage.includes('余额不足')) {
        router.push('/wallet/recharge');
      }
    } finally {
      setLoading(false);
    }
  };

  // 余额不足的处理
  if (coinBalance < pricePerShare) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <svg className="w-5 h-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-orange-800 font-medium">幸运币不足</span>
        </div>
        <p className="text-orange-700 text-sm mb-3">
          当前余额：{coinBalance} 幸运币，最低需要 {pricePerShare} 幸运币参与
        </p>
        <button
          onClick={() => router.push('/wallet/recharge')}
          className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium"
        >
          立即充值幸运币
        </button>
      </div>
    );
  }

  const discount = getDiscount(selectedShares);
  const totalCost = calculateTotal(selectedShares);
  const discountAmount = pricePerShare * selectedShares * (1 - discount);

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center mb-3">
        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span className="text-green-800 font-medium">多份购买</span>
        <span className="ml-auto text-xs text-green-600">批量优惠</span>
      </div>

      {/* 份数选择 */}
      <div className="mb-4">
        <div className="text-sm text-gray-700 mb-2">选择购买份数</div>
        
        {/* 预设选项 */}
        <div className="grid grid-cols-5 gap-2 mb-3">
          {shareOptions.map((shares) => (
            <button
              key={shares}
              onClick={() => setSelectedShares(shares)}
              className={`py-2 px-3 rounded-lg border-2 transition-all text-sm font-medium ${
                selectedShares === shares
                  ? 'border-green-600 bg-green-50 text-green-600'
                  : canPurchase(shares)
                    ? 'border-gray-200 hover:border-gray-300 text-gray-700'
                    : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
              disabled={!canPurchase(shares)}
            >
              {shares}份
            </button>
          ))}
        </div>

        {/* 自定义输入 */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">或输入：</span>
          <input
            type="number"
            min="1"
            max="10"
            value={customShares}
            onChange={(e) => handleCustomSharesChange(e.target.value)}
            className={`flex-1 px-3 py-2 border rounded-lg text-sm ${
              selectedShares >= 1 && selectedShares <= 10
                ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                : 'border-gray-300'
            }`}
            placeholder="1-10"
          />
          <span className="text-sm text-gray-600">份</span>
        </div>
      </div>

      {/* 价格计算 */}
      <div className="bg-white rounded-lg p-3 mb-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">购买份数</span>
            <span className="font-medium">{selectedShares} 份</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">单价</span>
            <span>{pricePerShare} 幸运币</span>
          </div>

          {discount < 1 && (
            <>
              <div className="flex justify-between text-sm text-green-600">
                <span>批量折扣</span>
                <span className="font-medium">{Math.round((1 - discount) * 100)}% 优惠</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>节省金额</span>
                <span className="font-medium">{discountAmount} 幸运币</span>
              </div>
            </>
          )}
          
          <div className="border-t pt-2">
            <div className="flex justify-between text-lg font-bold">
              <span className="text-gray-700">总价</span>
              <span className="text-green-600">{totalCost} 幸运币</span>
            </div>
          </div>
        </div>
      </div>

      {/* 折扣提示 */}
      {discount < 1 && (
        <div className="bg-green-100 rounded-lg p-3 mb-4">
          <div className="flex items-center text-green-800">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <span className="text-sm font-medium">
              购买 {selectedShares} 份可享受 {Math.round((1 - discount) * 100)}% 折扣
            </span>
          </div>
        </div>
      )}

      {/* 购买按钮 */}
      <button
        onClick={handlePurchase}
        disabled={loading || !canPurchase(selectedShares)}
        className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center ${
          canPurchase(selectedShares)
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            处理中...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            确认购买 {selectedShares} 份
          </>
        )}
      </button>

      {/* 余额提示 */}
      <div className="mt-2 text-center">
        <span className="text-xs text-gray-600">
          余额：{coinBalance} 幸运币
        </span>
        {coinBalance - totalCost > 0 && (
          <span className="text-xs text-green-600 ml-2">
            剩余：{coinBalance - totalCost} 幸运币
          </span>
        )}
      </div>
    </div>
  );
}