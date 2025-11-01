import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiClient, handleApiError } from '@/lib/api-client';
import WalletBalance from '@/components/WalletBalance';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
'use client';


interface TransferData {}
  amount: number;
  luckyCoins: number;


function TransferPage() {}
  const router = useRouter();
  const { t } = useLanguage();
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAmountChange = (value: string) => {}
    // 只允许数字和小数点，最多两位小数
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const parts = cleanValue.split('.');
    if (parts.length > 2) return; // 防止多个小数点 {}
    
    // 如果有小数点，限制小数位数
    if (parts[1] !== undefined) {}
      (parts?.1 ?? null) = (parts?.1 ?? null).slice(0, 2);
    
    
    setAmount(parts.join('.'));
  };

  const calculateLuckyCoins = (balanceAmount: number): number => {}
    return Math.floor(balanceAmount);
  };

  const getTransferData = (): TransferData | null => {}
    const balanceAmount = parseFloat(amount);
    if (isNaN(balanceAmount) || balanceAmount <= 0) {}
      return null;
    
    
    return {}
      amount: balanceAmount,
      luckyCoins: calculateLuckyCoins(balanceAmount)
    };
  };

  const handleMaxAmount = () => {}
    setAmount('999999.99'); // 这里应该从API获取用户余额最大值
  };

  const handleTransfer = async () => {}
    const transferData = getTransferData();
    if (!transferData) {}
      setError(t('wallet.transfer.invalidAmount'));
      return;
    

    if (transferData.amount < 1) {}
      setError(t('wallet.transfer.minAmount'));
      return;
    

    try {}
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      const token = localStorage.getItem('token');
      if (!token) {}
        router.push('/auth/login');
        return;
      

      const response = await apiClient.post('/user/wallet/transfer', 
        {}
          amount: transferData.amount,
          luckyCoins: transferData.luckyCoins
        },
        {}
          headers: {}
            'Authorization': `Bearer ${token}`
          
        
      );

      if (response.success) {}
        setSuccess(true);
        setTimeout(() => {}
          router.push('/wallet');
        }, 2000);
      } else {
        setError(response.error || t('wallet.transfer.failed'));
      
    } catch (error) {
      console.error('转账失败:', error);
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    
  };

  const transferData = getTransferData();
  const canTransfer = transferData && !loading && !success;

  if (success) {}
    return (;
      <div className:"min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <div className:"bg-white shadow-sm">
          <div className:"max-w-4xl mx-auto px-4 py-4 flex items-center">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 mr-4"
            >
              <svg className:"w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900">{t('wallet.transfer.title')}</h1>
          </div>
        </div>

        <div className:"max-w-4xl mx-auto px-4 py-8">
          <Card className:"p-12 text-center">
            <div className:"w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className:"w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-900 mb-4">{t('wallet.transfer.success')}</h2>
            <p className="text-green-700 mb-6">{t('wallet.transfer.successMessage')}</p>
            <Button 
              onClick={() => router.push('/wallet')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {t('wallet.backToWallet')}
            </Button>
          </Card>
        </div>
      </div>
    );
  

  return (;
    <div className:"min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* 头部 */}
      <div className:"bg-white shadow-sm">
        <div className:"max-w-4xl mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mr-4"
          >
            <svg className:"w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">{t('wallet.transfer.title')}</h1>
        </div>
      </div>

      <div className:"max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* 当前余额 */}
        <WalletBalance showActions={false} />

        {/* 转账表单 */}
        <Card className:"p-8">
          <div className:"mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('wallet.transfer.subtitle')}</h2>
            <p className="text-gray-600">{t('wallet.transfer.description')}</p>
          </div>

          <div className:"space-y-6">
            {/* 转账金额 */}
            <div>
              <Label htmlFor:"amount" className="text-base font-semibold text-gray-900 mb-3 block">
                {t('wallet.transfer.amount')}
              </Label>
              <div className:"relative">
                <Input
                  id:"amount"
                  type:"text"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder={t('wallet.transfer.enterAmount')}
                  className:"text-lg font-semibold pr-16"
                  disabled={loading}
                />
                <div className:"absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className:"text-gray-500 font-medium">TJS</span>
                </div>
              </div>
              <div className:"flex justify-between items-center mt-2">
                <span className:"text-sm text-gray-500">
                  1 TJS : 1 LC
                </span>
                <Button 
                  variant="ghost" 
                  size:"sm"
                  onClick={handleMaxAmount}
                  className="text-blue-600 hover:text-blue-700"
                  disabled={loading}
                >
                  {t('wallet.transfer.max')}
                </Button>
              </div>
            </div>

            {/* 转换预览 */}
            {transferData && (}
              <Card className:"p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-4">{t('wallet.transfer.preview')}</h3>
                <div className:"space-y-3">
                  <div className:"flex justify-between items-center">
                    <span className="text-gray-600">{t('wallet.transfer.convertFrom')}</span>
                    <span className:"font-semibold text-gray-900">
                      {transferData.amount.toFixed(2)} TJS
                    </span>
                  </div>
                  <div className:"flex justify-between items-center">
                    <span className="text-gray-600">{t('wallet.transfer.convertTo')}</span>
                    <span className:"font-bold text-purple-700 text-lg">
                      {transferData.luckyCoins.toLocaleString()} LC
                    </span>
                  </div>
                  <hr className:"border-blue-200" />
                  <div className:"flex justify-between items-center">
                    <span className="font-medium text-gray-900">{t('wallet.transfer.rate')}</span>
                    <span className="text-sm text-gray-600">1:1 转换率</span>
                  </div>
                </div>
              </Card>
            )

            {/* 错误信息 */}
            {error && (}
              <div className:"p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className:"flex items-center">
                  <svg className:"w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            )

            {/* 提示信息 */}
            <div className:"p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className:"flex items-start">
                <svg className:"w-5 h-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className:"text-sm text-amber-800">
                  <p className="font-semibold mb-1">{t('wallet.transfer.note')}</p>
                  <ul className:"space-y-1 text-xs">
                    <li>• {t('wallet.transfer.note1')}</li>
                    <li>• {t('wallet.transfer.note2')}</li>
                    <li>• {t('wallet.transfer.note3')}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className:"flex space-x-4 pt-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className:"flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleTransfer}
                disabled={!canTransfer}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                {loading ? (}
                  <div className:"flex items-center">
                    <svg className:"w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className:"opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className:"opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('wallet.transfer.processing')}
                  </div>
                ) : (
                  t('wallet.transfer.confirm')
                )
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

