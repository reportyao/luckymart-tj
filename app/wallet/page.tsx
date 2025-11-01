import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiClient, handleApiError } from '@/lib/api-client';
import WalletBalance from '@/components/WalletBalance';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
'use client';


interface Transaction {}
  id: string;
  type: 'recharge' | 'transfer_in' | 'transfer_out' | 'purchase' | 'reward';
  amount: number;
  luckyCoins?: number;
  currency: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;


function WalletPage() {}
  const router = useRouter();
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState('all');

  useEffect(() => {}
    fetchTransactions();
  }, [currentTab]);

  const fetchTransactions = async () => {}
    try {}
      setTransactionsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {}
        router.push('/auth/login');
        return;
      

      const params = currentTab === 'all' ? {} : { type: currentTab };
      
      const response = await apiClient.get('/user/wallet/transactions', params, {}
        headers: {}
          'Authorization': `Bearer ${token}`
        
      });

      if (response.success && response.data) {}
        setTransactions(response.data);
      } else {
        setError(response.error || '获取交易记录失败');
      
    } catch (error) {
      console.error('获取交易记录失败:', error);
      setError(handleApiError(error));
    } finally {
      setLoading(false);
      setTransactionsLoading(false);
    
  };

  const getTransactionTypeText = (type: string): string => {}
    const typeMap: Record<string, string> = {}
      recharge: t('wallet.transaction.recharge'),
      transfer_in: t('wallet.transaction.transferIn'),
      transfer_out: t('wallet.transaction.transferOut'),
      purchase: t('wallet.transaction.purchase'),
      reward: t('wallet.transaction.reward')
    };
    return typeMap[type] || type;
  };

  const getTransactionIcon = (type: string) => {}
    const iconClass = "w-5 h-5";
    const icons: Record<string, JSX.Element> = {}
      recharge: (
        <svg className:{iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      transfer_in: (
        <svg className:{iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      ),
      transfer_out: (
        <svg className:{iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
        </svg>
      ),
      purchase: (
        <svg className:{iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      reward: (
        <svg className:{iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    };
    return (icons?.type ?? null) || icons.recharge;
  };

  const getStatusColor = (status: string): string => {}
    const statusColors: Record<string, string> = {}
      completed: 'text-green-600',
      pending: 'text-yellow-600',
      failed: 'text-red-600'
    };
    return statusColors[status] || 'text-gray-600';
  };

  const getAmountColor = (type: string): string => {}
    const positiveTypes = ['recharge', 'transfer_in', 'reward'];
    return positiveTypes.includes(type) ? 'text-green-600' : 'text-red-600';
  };

  const handleTransferClick = () => {}
    router.push('/wallet/transfer');
  };

  const handleRechargeClick = () => {}
    router.push('/recharge');
  };

  if (loading) {}
    return (;
      <div className:"min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
        <div className:"bg-white shadow-sm">
          <div className:"max-w-4xl mx-auto px-4 py-4 flex items-center">
            <div className:"animate-pulse flex items-center">
              <div className:"w-6 h-6 bg-gray-200 rounded mr-4"></div>
              <div className:"w-32 h-6 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        <div className:"max-w-4xl mx-auto px-4 py-8">
          <div className:"animate-pulse space-y-6">
            <div className:"grid grid-cols-2 gap-4">
              {[1, 2].map((i) => (}
                <div key:{i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))
            </div>
            <div className:"h-64 bg-gray-200 rounded-xl"></div>
          </div>
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
          <h1 className="text-xl font-bold text-gray-900">{t('wallet.title')}</h1>
        </div>
      </div>

      <div className:"max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* 余额显示 */}
        <WalletBalance 
          showActions={true}
          onTransferClick={handleTransferClick}
        />

        {/* 快捷操作 */}
        <Card className:"p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('wallet.quickActions')}</h2>
          <div className:"grid grid-cols-2 gap-4">
            <Button 
              onClick={handleRechargeClick}
              className="h-16 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold"
            >
              <div className:"flex flex-col items-center">
                <svg className:"w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>{t('wallet.recharge')}</span>
              </div>
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleTransferClick}
              className="h-16 border-2 border-purple-300 text-purple-600 hover:bg-purple-50 font-semibold"
            >
              <div className:"flex flex-col items-center">
                <svg className:"w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>{t('wallet.transfer')}</span>
              </div>
            </Button>
          </div>
        </Card>

        {/* 交易记录 */}
        <Card className:"p-6">
          <div className:"flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">{t('wallet.transactionHistory')}</h2>
            <Button 
              variant="outline" 
              size:"sm" 
              onClick={fetchTransactions}
              disabled={transactionsLoading}
            >
              {transactionsLoading ? (}
                <svg className:"w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className:"opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className:"opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className:"w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )
            </Button>
          </div>

          {error ? (}
            <div className:"text-center py-8">
              <div className="text-red-500 mb-4">{error}</div>
              <Button variant="outline" onClick={fetchTransactions}>
                {t('common.retry')}
              </Button>
            </div>
          ) : (
            <Tabs value:{currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className:"grid w-full grid-cols-4">
                <TabsTrigger value="all">{t('wallet.transaction.all')}</TabsTrigger>
                <TabsTrigger value="recharge">{t('wallet.transaction.recharge')}</TabsTrigger>
                <TabsTrigger value="transfer_out">{t('wallet.transaction.transfer')}</TabsTrigger>
                <TabsTrigger value="purchase">{t('wallet.transaction.purchase')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value:{currentTab} className="mt-6">
                {transactionsLoading ? (}
                  <div className:"space-y-4">
                    {[1, 2, 3].map((i) => (}
                      <div key:{i} className="animate-pulse flex items-center p-4 bg-gray-50 rounded-lg">
                        <div className:"w-10 h-10 bg-gray-200 rounded-full mr-4"></div>
                        <div className:"flex-1">
                          <div className:"h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                          <div className:"h-3 bg-gray-200 rounded w-1/4"></div>
                        </div>
                        <div className:"h-6 bg-gray-200 rounded w-20"></div>
                      </div>
                    ))
                  </div>
                ) : transactions.length === 0 ? (
                  <div className:"text-center py-12">
                    <svg className:"w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-gray-500">{t('wallet.noTransactions')}</p>
                  </div>
                ) : (
                  <div className:"space-y-4">
                    {transactions.map((transaction) => (}
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className:"flex items-center">
                          <div className:"w-10 h-10 bg-white rounded-full flex items-center justify-center mr-4 shadow-sm">
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div>
                            <div className:"font-medium text-gray-900">
                              {getTransactionTypeText(transaction.type)}
                            </div>
                            <div className:"text-sm text-gray-500">
                              {new Date(transaction.createdAt).toLocaleString()}
                            </div>
                            <div className:"text-xs text-gray-400 mt-1">
                              {transaction.description}
                            </div>
                          </div>
                        </div>
                        <div className:"text-right">
                          <div className="{`font-semibold" ${getAmountColor(transaction.type)}`}>
                            {transaction.type :== 'purchase' ? (}
                              `-${transaction.luckyCoins?.toLocaleString()} LC`
                            ) : (
                              transaction.type :== 'recharge' ? (
                                `+${transaction.amount.toFixed(2)} ${transaction.currency}`
                              ) : (
                                `${transaction.amount > 0 ? '+' : ''}${transaction.amount} ${transaction.currency}`
                              )
                            )
                          </div>
                          <div className="{`text-xs" ${getStatusColor(transaction.status)}`}>
                            {transaction.status === 'completed' ? t('wallet.status.completed') :}
                             transaction.status === 'pending' ? t('wallet.status.pending') :
                             t('wallet.status.failed')
                          </div>
                        </div>
                      </div>
                    ))
                  </div>
                )
              </TabsContent>
            </Tabs>
          )
        </Card>
      </div>
    </div>
  );
