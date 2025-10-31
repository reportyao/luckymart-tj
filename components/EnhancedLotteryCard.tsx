'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiClient, handleApiError } from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface LotteryRound {
  id: string;
  productId: string;
  roundNumber: number;
  totalShares: number;
  soldShares: number;
  status: 'active' | 'ended' | 'completed';
  drawTime: string | null;
  pricePerShare: number;
  product: {
    id: string;
    name: string;
    marketPrice: number;
    images: string[];
    marketingBadge?: {
      type: string;
      text: string;
      color: string;
    } | null;
  };
  userParticipation?: {
    sharesCount: number;
    numbers: number[];
    isWinner: boolean;
  } | null;
  winProbability?: number;
}

interface EnhancedLotteryCardProps {
  round: LotteryRound;
  onUpdate?: () => void;
}

export default function EnhancedLotteryCard({ round, onUpdate }: EnhancedLotteryCardProps) {
  const { t } = useLanguage();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [userCoinBalance, setUserCoinBalance] = useState<number>(0);
  const [participationShares, setParticipationShares] = useState<number>(0);
  const [showQuickParticipate, setShowQuickParticipate] = useState(false);
  const [showMultiPurchase, setShowMultiPurchase] = useState(false);

  // 计算进度
  const progress = round.totalShares > 0 ? (round.soldShares / round.totalShares) * 100 : 0;
  const availableShares = round.totalShares - round.soldShares;

  // 智能推荐参与份数
  const getRecommendedShares = () => {
    if (userCoinBalance === 0) return 0;
    const affordableShares = Math.floor(userCoinBalance / round.pricePerShare);
    // 推荐不超过余额70%的份数，保留一些余额
    return Math.max(1, Math.min(affordableShares, Math.floor(affordableShares * 0.7)));
  };

  // 快速参与处理
  const handleQuickParticipate = async () => {
    const recommendedShares = getRecommendedShares();
    if (recommendedShares === 0) {
      toast.error('幸运币余额不足，无法参与');
      router.push('/wallet/recharge');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/lottery/quick-participate', {
        roundId: round.id,
        quantity: recommendedShares
      });

      if (response.success) {
        toast.success(`快速参与成功！购买了 ${recommendedShares} 份`);
        setParticipationShares(prev => prev + recommendedShares);
        onUpdate?.();
      } else {
        throw new Error(response.error || '快速参与失败');
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

  // 批量购买处理
  const handleBatchParticipate = async (shares: number) => {
    if (shares < 1 || shares > 10) {
      toast.error('批量购买份数必须在1-10份之间');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/lottery/bulk-participate', {
        roundId: round.id,
        quantity: shares
      });

      if (response.success) {
        const discount = shares >= 10 ? 0.9 : shares >= 5 ? 0.95 : 1;
        toast.success(`批量购买成功！购买了 ${shares} 份，获得 ${Math.round((1 - discount) * 100)}% 折扣`);
        setParticipationShares(prev => prev + shares);
        onUpdate?.();
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

  // 获取用户参与信息
  useEffect(() => {
    const fetchUserParticipation = async () => {
      try {
        const response = await apiClient.get(`/lottery/user-participation?roundId=${round.id}`);
        if (response.success && response.data) {
          setParticipationShares(response.data.sharesCount || 0);
          setUserCoinBalance(response.data.coinBalance || 0);
        }
      } catch (error) {
        console.error('获取用户参与信息失败:', error);
      }
    };

    fetchUserParticipation();
  }, [round.id]);

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* 商品图片 */}
      <div className="relative aspect-square bg-gray-100">
        {round.product.images && round.product.images[0] ? (
          <Image
            src={round.product.images[0]}
            alt={round.product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* 营销角标 */}
        {round.product.marketingBadge && (
          <div className="absolute top-2 left-2">
            <span 
              className={`inline-block px-2 py-1 text-xs font-bold text-white rounded-full ${
                round.product.marketingBadge.color === 'red' ? 'bg-red-500' :
                round.product.marketingBadge.color === 'blue' ? 'bg-blue-500' :
                round.product.marketingBadge.color === 'green' ? 'bg-green-500' :
                'bg-purple-500'
              }`}
            >
              {round.product.marketingBadge.text}
            </span>
          </div>
        )}

        {/* 期次号 */}
        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm font-bold">
          第 {round.roundNumber} 期
        </div>
      </div>

      {/* 商品信息 */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 line-clamp-2">{round.product.name}</h3>
        
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-600">市场价格</span>
          <span className="text-lg font-bold text-purple-600">
            {round.product.marketPrice} {t('common.tjs')}
          </span>
        </div>

        {/* 进度条 */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>进度</span>
            <span>{round.soldShares}/{round.totalShares} 份</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            剩余 {availableShares} 份
          </div>
        </div>

        {/* 参与历史 */}
        {participationShares > 0 && (
          <div className="bg-purple-50 rounded-lg p-3 mb-4">
            <div className="text-sm text-purple-800 font-medium mb-1">我的参与</div>
            <div className="text-xs text-purple-600">
              已参与 {participationShares} 份，预计中奖概率 {round.winProbability || 0}%
            </div>
          </div>
        )}

        {/* 价格信息 */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600">每份价格</span>
          <span className="text-lg font-bold text-purple-600">
            {round.pricePerShare} {t('common.coins')}
          </span>
        </div>

        {/* 操作按钮 */}
        <div className="grid grid-cols-2 gap-2">
          {/* 快速参与按钮 */}
          <button
            onClick={handleQuickParticipate}
            disabled={loading || availableShares === 0 || userCoinBalance === 0}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
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

          {/* 批量购买按钮 */}
          <button
            onClick={() => setShowMultiPurchase(true)}
            disabled={loading || availableShares === 0}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-2 px-4 rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            批量购买
          </button>
        </div>

        {/* 余额不足提示 */}
        {userCoinBalance > 0 && userCoinBalance < round.pricePerShare && (
          <div className="mt-2 text-center">
            <button
              onClick={() => router.push('/wallet/recharge')}
              className="text-orange-500 text-sm font-medium hover:text-orange-600 transition-colors"
            >
              幸运币不足，点击充值
            </button>
          </div>
        )}
      </div>

      {/* 批量购买模态框 */}
      {showMultiPurchase && (
        <MultiPurchaseModal
          round={round}
          onClose={() => setShowMultiPurchase(false)}
          onPurchase={handleBatchParticipate}
          loading={loading}
        />
      )}
    </div>
  );
}

// 批量购买模态框组件
interface MultiPurchaseModalProps {
  round: LotteryRound;
  onClose: () => void;
  onPurchase: (shares: number) => void;
  loading: boolean;
}

function MultiPurchaseModal({ round, onClose, onPurchase, loading }: MultiPurchaseModalProps) {
  const { t } = useLanguage();
  const [selectedShares, setSelectedShares] = useState(5);

  // 计算折扣
  const getDiscount = (shares: number) => {
    if (shares >= 10) return 0.9; // 9折
    if (shares >= 5) return 0.95; // 9.5折
    return 1; // 无折扣
  };

  // 计算总价
  const calculateTotal = (shares: number) => {
    const discount = getDiscount(shares);
    return round.pricePerShare * shares * discount;
  };

  const handleConfirm = () => {
    onPurchase(selectedShares);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-sm w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">批量购买</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">选择购买份数</div>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((shares) => (
              <button
                key={shares}
                onClick={() => setSelectedShares(shares)}
                className={`py-2 px-3 rounded-lg border-2 transition-all ${
                  selectedShares === shares
                    ? 'border-purple-600 bg-purple-50 text-purple-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {shares}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex justify-between text-sm">
            <span>购买份数</span>
            <span>{selectedShares} 份</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>单价</span>
            <span>{round.pricePerShare} {t('common.coins')}</span>
          </div>
          {getDiscount(selectedShares) < 1 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>折扣</span>
              <span>{Math.round((1 - getDiscount(selectedShares)) * 100)}% 优惠</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
            <span>总计</span>
            <span className="text-purple-600">{calculateTotal(selectedShares)} {t('common.coins')}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '处理中...' : '确认购买'}
          </button>
        </div>
      </div>
    </div>
  );
}