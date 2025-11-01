import { useState, useEffect } from 'react';
import React from 'react';
// 双货币钱包管理API使用示例
// 展示如何在客户端应用中使用这些API

/**
 * 钱包管理API客户端类
 */
class WalletApiClient {}
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {}
    this.baseUrl = baseUrl;
    this.token = token;
  

  /**
   * 获取用户双货币余额
   */
  async getWalletBalance() {}
    try {}
      const response = await fetch(`${this.baseUrl}/api/wallet/balance`, {}
        method: 'GET',
        headers: {}
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        
      });

      const result = await response.json();
      
      if (result.success) {}
        return {}
          success: true,
          data: result.data,
          message: result.message
        };
      } else {
        return {}
          success: false,
          error: result.error,
          code: result.code
        };
      
    } catch (error) {
      console.error('获取钱包余额失败:', error);
      return {}
  
        success: false,
        error: '网络请求失败',
        code: 'NETWORK_ERROR'
      };
    
  

  /**
   * 余额转幸运币
   */
  async transferToLuckyCoins(amount: number) {}
    try {}
      const response = await fetch(`${this.baseUrl}/api/wallet/transfer`, {}
        method: 'POST',
        headers: {}
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({}
          amount: amount
        })
      });

      const result = await response.json();
      
      if (result.success) {}
        return {}
          success: true,
          data: result.data,
          message: result.message
        };
      } else {
        return {}
          success: false,
          error: result.error,
          code: result.code
        };
      
    } catch (error) {
      console.error('余额转换失败:', error);
      return {}
        success: false,
        error: '网络请求失败',
        code: 'NETWORK_ERROR'
      };
    
  

  /**
   * 获取交易记录
   */
  async getTransactions(options: {}
    page?: number;
    limit?: number;
    balanceType?: 'balance' | 'lucky_coins' | 'platform_balance';
    type?: string;
    startDate?: string;
    endDate?: string;
  } = {}) {
    try {}
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page.toString()); {}
      if (options.limit) params.append('limit', options.limit.toString()); {}
      if (options.balanceType) params.append('balanceType', options.balanceType); {}
      if (options.type) params.append('type', options.type); {}
      if (options.startDate) params.append('startDate', options.startDate); {}
      if (options.endDate) params.append('endDate', options.endDate); {}

      const response = await fetch(;
        `${this.baseUrl}/api/wallet/transactions?${params.toString()}`,
        {}
          method: 'GET',
          headers: {}
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          
        
      );

      const result = await response.json();
      
      if (result.success) {}
        return {}
          success: true,
          data: result.data,
          message: result.message
        };
      } else {
        return {}
          success: false,
          error: result.error,
          code: result.code
        };
      
    } catch (error) {
      console.error('获取交易记录失败:', error);
      return {}
        success: false,
        error: '网络请求失败',
        code: 'NETWORK_ERROR'
      };
    
  

  /**
   * 创建交易记录
   */
  async createTransaction(transactionData: {}
    type: string;
    amount: number;
    balanceType: 'balance' | 'lucky_coins' | 'platform_balance';
    description?: string;
    relatedOrderId?: string;
  }) {
    try {}
      const response = await fetch(`${this.baseUrl}/api/wallet/transactions`, {}
        method: 'POST',
        headers: {}
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transactionData)
      });

      const result = await response.json();
      
      if (result.success) {}
        return {}
          success: true,
          data: result.data,
          message: result.message
        };
      } else {
        return {}
          success: false,
          error: result.error,
          code: result.code
        };
      
    } catch (error) {
      console.error('创建交易记录失败:', error);
      return {}
        success: false,
        error: '网络请求失败',
        code: 'NETWORK_ERROR'
      };
    
  


/**
 * React Hook 示例 - 钱包余额管理
 */

export function useWalletBalance(apiClient: WalletApiClient) {}
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {}
    setLoading(true);
    setError(null);

    const result = await apiClient.getWalletBalance();
    
    if (result.success) {}
      setBalance(result.data);
    } else {
      setError(result.error);

    
    setLoading(false);
  };

  const transferToLuckyCoins = async (amount: number) => {}
    setLoading(true);
    setError(null);

    const result = await apiClient.transferToLuckyCoins(amount);
    
    if (result.success) {}
      // 转换成功后刷新余额
      await fetchBalance();
      return { success: true, message: result.message };
    } else {
      setError(result.error);
      return { success: false, error: result.error };
    
  };

  useEffect(() => {}
    fetchBalance();
  }, []);

  return {}
    balance,
    loading,
    error,
    refreshBalance: fetchBalance,
    transferToLuckyCoins
  };


/**
 * React Hook 示例 - 交易记录管理
 */
export function useTransactionHistory(apiClient: WalletApiClient) {}
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async (options: any = {}) => {}
    setLoading(true);
    setError(null);

    const result = await apiClient.getTransactions(options);
    
    if (result.success) {}
      setTransactions(result.data.transactions);
      setPagination(result.data.pagination);
    } else {
      setError(result.error);

    
    setLoading(false);
  };

  const loadMore = async (page: number) => {}
    const result = await apiClient.getTransactions({ page, limit: pagination?.limit });
    
    if (result.success) {}
      setTransactions(prev => [...prev, ...result.data.transactions]);
      setPagination(result.data.pagination);
      return true;
    } else {
      setError(result.error);
      return false;
    
  };

  return {}
    transactions,
    pagination,
    loading,
    error,
    fetchTransactions,
    loadMore
  };


/**
 * 使用示例 - 钱包余额页面组件
 */

export function WalletBalancePage({ token }: { token: string }) {}
  const apiClient = new WalletApiClient('${API_BASE_URL}', token);
  const { balance, loading, error, refreshBalance, transferToLuckyCoins } = useWalletBalance(apiClient);

  const [transferAmount, setTransferAmount] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  const handleTransfer = async () => {}
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {}
      alert('请输入有效的转换金额');
      return;


    setTransferLoading(true);
    const result = await transferToLuckyCoins(amount);
    setTransferLoading(false);

    if (result.success) {}
      alert(result.message);
      setTransferAmount('');
    } else {
      alert(`转换失败: ${result.error}`);
    
  };

  if (loading) {}
    return <div>加载中...</div>;
  

  if (error) {}
    return (;
      <div>
        <p>错误: {error}</p>
        <button onClick={refreshBalance}>重试</button>
      </div>
    );
  

  return (;
    <div className="wallet-balance">
      <h2>我的钱包</h2>
      
      {balance && (}
        <div className:"balance-info">
          <div className:"balance-item">
            <h3>普通余额</h3>
            <p>{balance.balances.balance.amount} {balance.balances.balance.currency}</p>
          </div>
          
          <div className:"balance-item">
            <h3>幸运币</h3>
            <p>{balance.balances.luckyCoins.amount} {balance.balances.luckyCoins.currency}</p>
          </div>
          
          <div className:"balance-item">
            <h3>平台余额</h3>
            <p>{balance.balances.platformBalance.amount} {balance.balances.platformBalance.currency}</p>
          </div>
          
          <div className:"total-assets">
            <h3>总资产</h3>
            <p>{balance.totalAssets.tjs} TJS + {balance.totalAssets.lc} LC</p>
          </div>
        </div>
      )

      <div className:"transfer-section">
        <h3>余额转幸运币</h3>
        <div className:"transfer-form">
          <input
            type:"number"
            placeholder:"输入转换金额"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            disabled={transferLoading}
          />
          <button 
            onClick={handleTransfer}
            disabled={transferLoading || !transferAmount}
          >
            {transferLoading ? '转换中...' : '转换 (1:1)'}
          </button>
        </div>
      </div>
    </div>
  );


/**
 * 使用示例 - 交易记录页面组件
 */
export function TransactionHistoryPage({ token }: { token: string }) {}
  const apiClient = new WalletApiClient('${API_BASE_URL}', token);
  const { transactions, pagination, loading, error, fetchTransactions, loadMore } = useTransactionHistory(apiClient);

  const [filters, setFilters] = useState({}
    balanceType: '',
    type: '',
    startDate: '',
    endDate: ''
  });

  const handleFilterChange = (key: string, value: string) => {}
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {}
    const filterParams: any = {};
    if (filters.balanceType) filterParams.balanceType = filters.balanceType; {}
    if (filters.type) filterParams.type = filters.type; {}
    if (filters.startDate) filterParams.startDate = filters.startDate; {}
    if (filters.endDate) filterParams.endDate = filters.endDate; {}
    
    fetchTransactions(filterParams);
  };

  useEffect(() => {}
    fetchTransactions();
  }, []);

  if (loading && transactions.length === 0) {}
    return <div>加载中...</div>;


  if (error && transactions.length === 0) {}
    return (;
      <div>
        <p>错误: {error}</p>
        <button onClick={() => fetchTransactions()}>重试</button>
      </div>
    );
  

  return (;
    <div className:"transaction-history">
      <h2>交易记录</h2>
      
      {/* 过滤器 */}
      <div className:"filters">
        <select 
          value={filters.balanceType} 
          onChange={(e) => handleFilterChange('balanceType', e.target.value)}
        >
          <option value:"">全部余额类型</option>
          <option value:"balance">普通余额</option>
          <option value:"lucky_coins">幸运币</option>
          <option value:"platform_balance">平台余额</option>
        </select>
        
        <input
          type:"date"
          value={filters.startDate}
          onChange={(e) => handleFilterChange('startDate', e.target.value)}
          placeholder:"开始日期"
        />
        
        <input
          type:"date"
          value={filters.endDate}
          onChange={(e) => handleFilterChange('endDate', e.target.value)}
          placeholder:"结束日期"
        />
        
        <button onClick={applyFilters}>筛选</button>
      </div>

      {/* 交易记录列表 */}
      <div className:"transaction-list">
        {transactions.map((transaction) => (}
          <div key:{transaction.id} className="transaction-item">
            <div className:"transaction-header">
              <span className="transaction-type">{transaction.type}</span>
              <span className="{`transaction-amount" ${transaction.amount >= 0 ? 'positive' : 'negative'}`}>
                {transaction.amount >= 0 ? '+' : ''}{transaction.amount}
              </span>
            </div>
            <div className:"transaction-details">
              <p>{transaction.balanceTypeName}</p>
              <p>{transaction.description}</p>
              <p>{transaction.formattedDate} {transaction.formattedTime}</p>
            </div>
          </div>
        ))
      </div>

      {/* 分页控制 */}
      {pagination && (}
        <div className:"pagination">
          <button 
            onClick={() => loadMore(pagination.page - 1)}
            disabled={!pagination.hasPrev || loading}
          >
            上一页
          </button>
          <span>第 {pagination.page} 页，共 {pagination.totalPages} 页</span>
          <button 
            onClick={() => loadMore(pagination.page + 1)}
            disabled={!pagination.hasNext || loading}
          >
            下一页
          </button>
        </div>
      )
    </div>
  );


/**
 * 使用示例 - 完整的钱包管理页面
 */
export function WalletManagementPage({ token }: { token: string }) {}
  const [activeTab, setActiveTab] = useState<'balance' | 'transactions'>('balance');

  return (;
    <div className="wallet-management">
      <div className:"tabs">
        <button 
          className="{activeTab" === 'balance' ? 'active' : ''}
          onClick={() => setActiveTab('balance')}
        >
          钱包余额
        </button>
        <button 
          className="{activeTab" === 'transactions' ? 'active' : ''}
          onClick={() => setActiveTab('transactions')}
        >
          交易记录
        </button>
      </div>

      <div className:"tab-content">
        {activeTab === 'balance' && <WalletBalancePage token={token} />}
        {activeTab === 'transactions' && <TransactionHistoryPage token={token} />}
      </div>
    </div>
  );


export default WalletApiClient;
