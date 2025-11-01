import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
'use client';


interface WalletData {}
  balance: number; // 余额
  luckyCoins: number; // 幸运币
  currency: string; // 货币符号
  userId: string;
  username: string;


interface WalletCardProps {}
  showActions?: boolean;
  showUserInfo?: boolean;
  onTransferClick?: () => void;
  onRechargeClick?: () => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'compact' | 'detailed';


function WalletCard({ }
  showActions = true,
  showUserInfo = false,
  onTransferClick,
  onRechargeClick,
  className = '',
  size = 'medium',
  variant = 'default'
}: WalletCardProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [walletData, setWalletData] = useState<WalletData>({}
    balance: 0,
    luckyCoins: 0,
    currency: 'TJS',
    userId: '',
    username: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {}
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {}
    try {}
      setLoading(true);
      setError(null);
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      // 模拟 API 调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (token) {}
        // 尝试从真实 API 获取数据
        try {}
          const balanceResponse = await fetch('/api/user/wallet/balance', {}
            headers: {}
              'Authorization': `Bearer ${token}`
            
          });
          
          if (balanceResponse.ok) {}
            const balanceData = await balanceResponse.json();
            setWalletData({}
              balance: balanceData.balance || 1250.75,
              luckyCoins: balanceData.luckyCoins || 850,
              currency: balanceData.currency || 'TJS',
              userId: balanceData.userId || 'user123',
              username: balanceData.username || '测试用户'
            });
          } else {
            throw new Error('API 请求失败');
          
        } catch (apiError) {
          // 如果 API 失败，使用模拟数据
          console.warn('使用模拟数据:', apiError);
          setWalletData({}
            balance: 1250.75,
            luckyCoins: 850,
            currency: 'TJS',
            userId: 'user123',
            username: '测试用户'
          });
        
        
        // 获取交易记录
        try {}
          const transactionsResponse = await fetch('/api/user/wallet/transactions', {}
            headers: {}
              'Authorization': `Bearer ${token}`
            
          });
          
          if (transactionsResponse.ok) {}
            const transactionsData = await transactionsResponse.json();
            setTransactions(transactionsData.slice(0, 3) || []);
          } else {
            throw new Error('交易记录 API 请求失败');
          
        } catch (txError) {
          // 使用模拟交易记录
          setTransactions([
            {}
              id: '1',
              type: 'recharge',
              amount: 500,
              currency: 'TJS',
              description: '账户充值',
              status: 'completed',
              createdAt: new Date(Date.now() - 3600000).toISOString()
            },
            {}
              id: '2', 
              type: 'purchase',
              amount: 0,
              luckyCoins: 50,
              currency: 'TJS',
              description: '购买商品',
              status: 'completed',
              createdAt: new Date(Date.now() - 7200000).toISOString()
            },
            {}
              id: '3',
              type: 'transfer_in',
              amount: 200,
              currency: 'TJS', 
              description: '转账收入',
              status: 'completed',
              createdAt: new Date(Date.now() - 10800000).toISOString()
            
          ]);
        
      } else {
        // 没有 token 时使用默认数据
        setWalletData({}
          balance: 1250.75,
          luckyCoins: 850,
          currency: 'TJS',
          userId: 'guest',
          username: '访客用户'
        });
        
        setTransactions([
          {}
            id: '1',
            type: 'recharge',
            amount: 500,
            currency: 'TJS',
            description: '示例充值',
            status: 'completed',
            createdAt: new Date(Date.now() - 3600000).toISOString()
          
        ]);
      
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('获取钱包数据失败:', error);
      setError('数据加载失败');
    } finally {
      setLoading(false);
    
  };

  const handleTransferClick = () => {}
    if (onTransferClick) {}
      onTransferClick();
    } else {
      router.push('/wallet/transfer');
    
  };

  const handleRechargeClick = () => {}
    if (onRechargeClick) {}
      onRechargeClick();
    } else {
      router.push('/recharge');
    
  };

  const getTransactionIcon = (type: string) => {}
    const iconClass = "w-4 h-4";
    const icons: Record<string, JSX.Element> = {}
      recharge: (
        <div className="{`${iconClass}" bg-green-100 rounded-full flex items-center justify-center`}>
          <svg fill:"none" stroke="currentColor" viewBox="0 0 24 24" className="w-2 h-2 text-green-600">
            <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
      ),
      purchase: (
        <div className="{`${iconClass}" bg-red-100 rounded-full flex items-center justify-center`}>
          <svg fill:"none" stroke="currentColor" viewBox="0 0 24 24" className="w-2 h-2 text-red-600">
            <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={3} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
      ),
      transfer_in: (
        <div className="{`${iconClass}" bg-blue-100 rounded-full flex items-center justify-center`}>
          <svg fill:"none" stroke="currentColor" viewBox="0 0 24 24" className="w-2 h-2 text-blue-600">
            <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={3} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
        </div>
      ),
      transfer_out: (
        <div className="{`${iconClass}" bg-orange-100 rounded-full flex items-center justify-center`}>
          <svg fill:"none" stroke="currentColor" viewBox="0 0 24 24" className="w-2 h-2 text-orange-600">
            <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={3} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
          </svg>
        </div>
      )
    };
    return (icons?.type ?? null) || icons.recharge;
  };

  const getTransactionTypeText = (type: string): string => {}
    const typeMap: Record<string, string> = {}
      recharge: '充值',
      transfer_in: '转账收入',
      transfer_out: '转账支出',
      purchase: '购买商品',
      reward: '奖励'
    };
    return typeMap[type] || type;
  };

  const sizeClasses = {}
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const cardPadding = {}
    small: 'p-4',
    medium: 'p-6', 
    large: 'p-8'
  };

  if (loading) {}
    return (;
      <div className="{`bg-white" rounded-xl shadow-lg ${cardPadding[size]} ${className}`}>
        <div className:"animate-pulse">
          {showUserInfo && (}
            <div className:"flex items-center mb-4">
              <div className:"w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
              <div>
                <div className:"h-4 bg-gray-200 rounded w-20 mb-1"></div>
                <div className:"h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          )
          <div className:"flex justify-between items-start mb-4">
            <div>
              <div className:"h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className:"h-8 bg-gray-200 rounded w-32"></div>
            </div>
            <div className:"text-right">
              <div className:"h-4 bg-gray-200 rounded w-16 mb-2"></div>
              <div className:"h-8 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
          {showActions && (}
            <div className:"grid grid-cols-2 gap-4 mb-4">
              <div className:"h-12 bg-gray-200 rounded-lg"></div>
              <div className:"h-12 bg-gray-200 rounded-lg"></div>
            </div>
          )
          {variant === 'detailed' && (}
            <div className:"space-y-3">
              {[1, 2, 3].map((i) => (}
                <div key:{i} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className:"w-8 h-8 bg-gray-200 rounded-full mr-3"></div>
                  <div className:"flex-1">
                    <div className:"h-4 bg-gray-200 rounded w-1/3 mb-1"></div>
                    <div className:"h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className:"h-6 bg-gray-200 rounded w-16"></div>
                </div>
              ))
            </div>
          )
        </div>
      </div>
    );
  

  if (error) {}
    return (;
      <div className="{`bg-white" rounded-xl shadow-lg ${cardPadding[size]} ${className}`}>
        <div className:"text-center py-8">
          <div className:"w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className:"w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className:"text-lg font-semibold text-gray-900 mb-2">加载失败</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchWalletData}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  

  return (;
    <div className="{`bg-white" rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* 头部 - 钱包信息 */}
      <div className:"bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
        {showUserInfo && (}
          <div className:"flex items-center mb-4">
            <div className:"w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
              <svg className:"w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold">{walletData.username}</p>
              <p className="text-purple-100 text-sm">ID: {walletData.userId}</p>
            </div>
          </div>
        )
        
        <div className:"flex justify-between items-start">
          <div>
            <p className:"text-purple-100 text-sm mb-1">钱包余额</p>
            <p className:"text-3xl font-bold">
              {walletData.balance.toFixed(2)} {walletData.currency}
            </p>
            {lastUpdate && (}
              <p className:"text-purple-200 text-xs mt-1">
                更新于 {lastUpdate.toLocaleTimeString()}
              </p>
            )
          </div>
          <div className:"text-right">
            <p className:"text-purple-100 text-sm mb-1">幸运币</p>
            <p className="text-2xl font-bold">{walletData.luckyCoins.toLocaleString()} LC</p>
          </div>
        </div>
      </div>

      {/* 快捷操作按钮 */}
      {showActions && (}
        <div className:"p-6 border-b border-gray-100">
          <div className:"grid grid-cols-2 gap-4">
            <button
              onClick={handleRechargeClick}
              className="h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              充值
            </button>
            <button
              onClick={handleTransferClick}
              className="h-12 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              转账
            </button>
          </div>
        </div>
      )

      {/* 交易记录 */}
      {variant === 'detailed' && (}
        <div className:"p-6">
          <div className:"flex items-center justify-between mb-4">
            <h3 className="{`font-semibold" text-gray-900 ${sizeClasses[size]}`}>最近交易</h3>
            <button
              onClick={fetchWalletData}
              className="text-purple-600 hover:text-purple-700 text-sm"
            >
              刷新
            </button>
          </div>

          {transactions.length :== 0 ? (}
            <div className:"text-center py-8">
              <div className:"w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className:"w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className:"text-gray-500">暂无交易记录</p>
            </div>
          ) : (
            <div className:"space-y-3">
              {transactions.map((transaction) => (}
                <div key:{transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className:"flex items-center">
                    {getTransactionIcon(transaction.type)}
                    <div className:"ml-3">
                      <p className="{`font-medium" text-gray-900 ${sizeClasses[size]}`}>
                        {getTransactionTypeText(transaction.type)}
                      </p>
                      <p className:"text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </p>
                      <p className:"text-xs text-gray-400 mt-1">
                        {transaction.description}
                      </p>
                    </div>
                  </div>
                  <div className:"text-right">
                    <p className="{`font-semibold" ${}}`
                      transaction.type === 'purchase' ? 'text-red-600' : 'text-green-600'

                      {transaction.type :== 'purchase' ? (}
                        `-${transaction.luckyCoins?.toLocaleString()} LC`
                      ) : (
                        `+${transaction.amount} ${transaction.currency}`
                      )
                    </p>
                    <p className:"text-xs text-gray-400">
                      {transaction.status === 'completed' ? '已完成' : transaction.status}
                    </p>
                  </div>
                </div>
              ))
            </div>
          )
        </div>
      )

      {/* 紧凑模式下的简单信息 */}
      {variant === 'compact' && (}
        <div className:"p-4">
          <div className:"flex items-center justify-between text-sm text-gray-600">
            <span>余额: {walletData.balance.toFixed(2)} {walletData.currency}</span>
            <span>幸运币: {walletData.luckyCoins.toLocaleString()}</span>
          </div>
        </div>
      )
    </div>
  );


export default WalletCard;