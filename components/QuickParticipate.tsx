'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiClient, handleApiError } from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface QuickParticipateProps {
  roundId: string;
  pricePerShare: number;
  availableShares: number;
  onSuccess?: (data: any) => void;
}

export default function QuickParticipate({ 
  roundId, 
  pricePerShare, 
  availableShares,
  onSuccess 
}: QuickParticipateProps) {
  const { t } = useLanguage();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [recommendedShares, setRecommendedShares] = useState<number>(0);
  const [userParticipation, setUserParticipation] = useState<{
    sharesCount: number;
    winProbability: number;
  } | null>(null);

  // 获取用户幸运币余额
  const fetchUserBalance = async () => {
    try {
      const response = await apiClient.get('/user/balance');
      if (response.success) {
        setCoinBalance(response.data.luckyCoins || 0);
        
        // 计算智能推荐份数
        if (response.data.luckyCoins) {
          const affordableShares = Math.floor(response.data.luckyCoins / pricePerShare);
          const maxAffordable = Math.min(affordableShares, availableShares);
          // 推荐不超过余额70%的份数，保留一些余额
          const recommended = Math.max(1, Math.min(maxAffordable, Math.floor(maxAffordable * 0.7)));
          setRecommendedShares(recommended);
        }
      }
    } catch (error) {
      console.error('获取用户余额失败:', error);
    }
  };

  // 获取用户参与信息
  const fetchUserParticipation = async () => {
    try {
      const response = await apiClient.get(`/lottery/user-participation?roundId=${roundId}`);
      if (response.success) {
        setUserParticipation({
          sharesCount: response.data.sharesCount || 0,
          winProbability: response.data.winProbability || 0
        });
      }
    } catch (error) {
      console.error('获取用户参与信息失败:', error);
    }
  };

  useEffect(() => {
    fetchUserBalance();
    fetchUserParticipation();
  }, [roundId, pricePerShare, availableShares]);

  // 快速参与处理
  const handleQuickParticipate = async () => {
    if (recommendedShares === 0) {
      toast.error('幸运币余额不足，无法参与');
      return;
    }

    if (recommendedShares > availableShares) {
      toast.error('可用份额不足');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/lottery/quick-participate', {
        roundId,
        quantity: recommendedShares
      });

      if (response.success) {
        const result = response.data;
        toast.success(
          `🎉 快速参与成功！\n购买了 ${recommendedShares} 份\n消耗 ${result.totalCost} 幸运币`,
          { duration: 3000 }
        );
        
        // 更新本地状态
        setUserParticipation(prev => prev ? {
          ...prev,
          sharesCount: prev.sharesCount + recommendedShares
        } : {
          sharesCount: recommendedShares,
          winProbability: 0
        });
        
        onSuccess?.(result);
      } else {
        throw new Error(response.error || '快速参与失败');
      }
    } catch (error) {
      const errorMessage = handleApiError(error as Error);
      toast.error(errorMessage);
      
      // 如果是余额不足，自动引导充值
      if (errorMessage.includes('余额不足')) {
        setTimeout(() => {
          router.push('/wallet/recharge');
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  // 一键全仓参与
  const handleMaxParticipate = async () => {
    const maxShares = Math.min(
      Math.floor(coinBalance / pricePerShare),
      availableShares
    );

    if (maxShares === 0) {
      toast.error('幸运币余额不足，无法参与');
      router.push('/wallet/recharge');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/lottery/quick-participate', {
        roundId,
        quantity: maxShares,
        mode: 'max' // 标记为最大参与模式
      });

      if (response.success) {
        const result = response.data;
        toast.success(
          `🚀 一键全仓成功！\n购买了 ${maxShares} 份\n消耗 ${result.totalCost} 幸运币`,
          { duration: 3000 }
        );
        
        // 更新本地状态
        setUserParticipation(prev => prev ? {
          ...prev,
          sharesCount: prev.sharesCount + maxShares
        } : {
          sharesCount: maxShares,
          winProbability: 0
        });
        
        onSuccess?.(result);
      } else {
        throw new Error(response.error || '一键全仓失败');
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

  // 余额不足处理
  if (coinBalance === 0 || coinBalance < pricePerShare) {
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

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
      <div className="flex items-center mb-3">
        <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="text-purple-800 font-medium">快速参与</span>
      </div>

      {/* 用户当前状态 */}
      <div className="bg-white rounded-lg p-3 mb-3">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">幸运币余额</span>
          <span className="font-medium">{coinBalance} 幸运币</span>
        </div>
        {userParticipation && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">已参与份数</span>
            <span className="font-medium">{userParticipation.sharesCount} 份</span>
          </div>
        )}
      </div>

      {/* 智能推荐 */}
      {recommendedShares > 0 && (
        <div className="bg-white rounded-lg p-3 mb-3">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-600">智能推荐</div>
              <div className="font-medium">购买 {recommendedShares} 份</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-purple-600">
                {recommendedShares * pricePerShare} 幸运币
              </div>
              <div className="text-xs text-gray-500">
                保留 {Math.floor(coinBalance * 0.3)} 幸运币
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleQuickParticipate}
          disabled={loading || recommendedShares === 0}
          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
        >
          {loading ? (
            <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
          快速参与
        </button>

        <button
          onClick={handleMaxParticipate}
          disabled={loading}
          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-4 rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all duration-300 flex items-center justify-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          一键全仓
        </button>
      </div>

      {/* 参与提示 */}
      {recommendedShares > 0 && (
        <div className="mt-3 text-xs text-gray-600 text-center">
          💡 智能推荐保留30%余额，避免过度消费
        </div>
      )}
    </div>
  );
}