'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiClient, handleApiError } from '@/lib/api-client';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface WalletBalance {
  balance: number; // 余额
  luckyCoins: number; // 幸运币
  currency: string; // 货币符号
}

interface WalletBalanceProps {
  showActions?: boolean;
  onTransferClick?: () => void;
  className?: string;
}

export default function WalletBalance({ 
  showActions = true, 
  onTransferClick, 
  className = '' 
}: WalletBalanceProps) {
  const { t } = useLanguage();
  const [balance, setBalance] = useState<WalletBalance>({
    balance: 0,
    luckyCoins: 0,
    currency: 'TJS'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('用户未登录');
        return;
      }

      const response = await apiClient.get('/user/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.success && response.data) {
        setBalance({
          balance: response.data.balance || 0,
          luckyCoins: response.data.luckyCoins || 0,
          currency: response.data.currency || 'TJS'
        });
      } else {
        setError(response.error || '获取余额失败');
      }
    } catch (error) {
      console.error('获取余额失败:', error);
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `${amount.toFixed(2)} ${balance.currency}`;
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-2 gap-4 ${className}`}>
        {[1, 2].map((i) => (
          <Card key={i} className="luckymart-padding-lg">
            <div className="luckymart-animation-pulse">
              <div className="h-4 bg-gray-200 luckymart-rounded w-1/2 mb-3"></div>
              <div className="luckymart-size-lg bg-gray-200 luckymart-rounded w-3/4"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="luckymart-padding-lg">
        <div className="luckymart-text-center">
          <div className="luckymart-text-error mb-2">{error}</div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchBalance}
          >
            {t('common.retry')}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      {/* 余额卡片 */}
      <Card className="luckymart-padding-lg bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <div className="luckymart-layout-flex luckymart-layout-center justify-between luckymart-spacing-md">
          <h3 className="luckymart-text-sm luckymart-font-medium text-blue-700">{t('wallet.balance')}</h3>
          <svg className="luckymart-size-sm luckymart-size-sm luckymart-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
        <div className="text-2xl luckymart-font-bold text-blue-900 mb-3">
          {formatCurrency(balance.balance)}
        </div>
        {showActions && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-blue-600 border-blue-300 hover:bg-blue-50"
            onClick={onTransferClick}
          >
            {t('wallet.transferToLuckyCoins')}
          </Button>
        )}
      </Card>

      {/* 幸运币卡片 */}
      <Card className="luckymart-padding-lg bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
        <div className="luckymart-layout-flex luckymart-layout-center justify-between luckymart-spacing-md">
          <h3 className="luckymart-text-sm luckymart-font-medium text-yellow-700">{t('wallet.luckyCoins')}</h3>
          <svg className="luckymart-size-sm luckymart-size-sm luckymart-text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>
        <div className="text-2xl luckymart-font-bold text-yellow-900 mb-3">
          {balance.luckyCoins.toLocaleString()}
        </div>
        <div className="text-xs text-yellow-600">
          {t('wallet.forPurchasing')}
        </div>
      </Card>
    </div>
  );
}