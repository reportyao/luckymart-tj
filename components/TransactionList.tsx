'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/src/i18n/useLanguageCompat';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Download, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  CheckCircle, 
  Clock, 
  XCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CreditCard,
  ArrowUpCircle,
  ArrowDownCircle,
  Gift
} from 'lucide-react';

// Props接口定义
export interface TransactionListProps {
  /** 自定义CSS类名 */
  className?: string;
  /** 每页显示数量 */
  pageSize?: number;
  /** 是否显示导出功能 */
  showExport?: boolean;
  /** 是否显示统计概览 */
  showStats?: boolean;
  /** 默认筛选的交易类型 */
  defaultTypeFilter?: string;
  /** 自定义数据获取函数 */
  fetchData?: (params: any) => Promise<any>;
  /** 导出回调函数 */
  onExport?: (data: any[]) => void;
  /** 分页回调函数 */
  onPageChange?: (page: number) => void;
  /** 筛选回调函数 */
  onFilter?: (filters: any) => void;
  /** 错误回调函数 */
  onError?: (error: Error) => void;
}

interface TransactionRecord {
  id: string;
  transactionId: string;
  type: 'recharge' | 'withdraw' | 'consume' | 'reward';
  amount: number;
  balanceAfter: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  category: string;
  createDate: string;
  completeDate?: string;
  referenceId?: string; // 关联的订单ID或其他引用ID
}

interface TransactionStats {
  totalInflow: number;
  totalOutflow: number;
  totalBalance: number;
  todayTransactions: number;
  monthTransactions: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const TransactionList: React.FC<TransactionListProps> = ({
  className = '',
  pageSize = 10,
  showExport = true,
  showStats = true,
  defaultTypeFilter = 'all',
  fetchData,
  onExport,
  onPageChange,
  onFilter,
  onError
}) => {
  const { t } = useTranslation('transactions');
  const { currentLanguage } = useLanguage();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [stats, setStats] = useState<TransactionStats>({
    totalInflow: 0,
    totalOutflow: 0,
    totalBalance: 0,
    todayTransactions: 0,
    monthTransactions: 0
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>(defaultTypeFilter);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 模拟获取交易记录数据
  useEffect(() => {
    const fetchTransactionHistory = async () => {
      setLoading(true);
      
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 模拟交易记录数据
      const mockTransactions: TransactionRecord[] = [
        {
          id: '1',
          transactionId: 'TXN-2025-11-01-001',
          type: 'recharge',
          amount: 100.00,
          balanceAfter: 150.00,
          status: 'completed',
          description: '充值',
          category: 'balance',
          createDate: '2025-11-01T10:30:00Z',
          completeDate: '2025-11-01T10:31:00Z',
          referenceId: 'PMT-2025-11-01-001'
        },
        {
          id: '2',
          transactionId: 'TXN-2025-10-31-002',
          type: 'consume',
          amount: -25.50,
          balanceAfter: 50.00,
          status: 'completed',
          description: '购买彩票',
          category: 'lottery',
          createDate: '2025-10-31T15:20:00Z',
          completeDate: '2025-10-31T15:20:30Z',
          referenceId: 'ORD-2025-10-31-001'
        },
        {
          id: '3',
          transactionId: 'TXN-2025-10-31-003',
          type: 'reward',
          amount: 5.00,
          balanceAfter: 75.50,
          status: 'completed',
          description: '邀请奖励',
          category: 'referral',
          createDate: '2025-10-31T14:45:00Z',
          completeDate: '2025-10-31T14:45:15Z',
          referenceId: 'REF-2025-10-31-001'
        },
        {
          id: '4',
          transactionId: 'TXN-2025-10-30-004',
          type: 'withdraw',
          amount: -30.00,
          balanceAfter: 70.50,
          status: 'pending',
          description: '提现申请',
          category: 'withdrawal',
          createDate: '2025-10-30T09:15:00Z',
          referenceId: 'WTH-2025-10-30-001'
        },
        {
          id: '5',
          transactionId: 'TXN-2025-10-29-005',
          type: 'recharge',
          amount: 50.00,
          balanceAfter: 100.50,
          status: 'completed',
          description: '充值',
          category: 'balance',
          createDate: '2025-10-29T16:30:00Z',
          completeDate: '2025-10-29T16:30:45Z',
          referenceId: 'PMT-2025-10-29-001'
        },
        {
          id: '6',
          transactionId: 'TXN-2025-10-29-006',
          type: 'consume',
          amount: -20.50,
          balanceAfter: 50.50,
          status: 'failed',
          description: '购买失败退款',
          category: 'lottery',
          createDate: '2025-10-29T12:10:00Z',
          completeDate: '2025-10-29T12:10:30Z',
          referenceId: 'ORD-2025-10-29-002'
        },
        {
          id: '7',
          transactionId: 'TXN-2025-10-28-007',
          type: 'reward',
          amount: 8.50,
          balanceAfter: 71.00,
          status: 'completed',
          description: '签到奖励',
          category: 'checkin',
          createDate: '2025-10-28T08:00:00Z',
          completeDate: '2025-10-28T08:00:05Z',
          referenceId: 'CHK-2025-10-28-001'
        }
      ];

      // 计算统计数据
      const totalInflow = mockTransactions
        .filter(t => t.amount > 0 && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalOutflow = mockTransactions
        .filter(t => t.amount < 0 && t.status === 'completed')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const totalBalance = mockTransactions[0]?.balanceAfter || 0;
      
      const todayTransactions = mockTransactions
        .filter(t => new Date(t.createDate).toDateString() === new Date().toDateString())
        .length;

      const monthTransactions = mockTransactions
        .filter(t => {
          const transactionDate = new Date(t.createDate);
          const now = new Date();
          return transactionDate.getMonth() === now.getMonth() && 
                 transactionDate.getFullYear() === now.getFullYear();
        }).length;
      
      setTransactions(mockTransactions);
      setStats({
        totalInflow,
        totalOutflow,
        totalBalance,
        todayTransactions,
        monthTransactions
      });
      setPagination({
        page: 1,
        limit: pageSize,
        total: mockTransactions.length,
        totalPages: Math.ceil(mockTransactions.length / pageSize)
      });
      setLoading(false);
    };

    fetchTransactionHistory();
  }, [currentLanguage, pageSize]);

  const getTransactionIcon = (type: TransactionRecord['type']) => {
    switch (type) {
      case 'recharge':
        return <ArrowUpCircle className="w-5 h-5 text-green-600" />;
      case 'withdraw':
        return <ArrowDownCircle className="w-5 h-5 text-red-600" />;
      case 'consume':
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      case 'reward':
        return <Gift className="w-5 h-5 text-purple-600" />;
    }
  };

  const getTypeBadge = (type: TransactionRecord['type']) => {
    const typeConfig = {
      recharge: { 
        bg: 'bg-green-100 text-green-800 border-green-200', 
        text: t('recharge', '充值'),
        icon: <ArrowUpCircle className="w-3 h-3 mr-1" />
      },
      withdraw: { 
        bg: 'bg-red-100 text-red-800 border-red-200', 
        text: t('withdraw', '提现'),
        icon: <ArrowDownCircle className="w-3 h-3 mr-1" />
      },
      consume: { 
        bg: 'bg-blue-100 text-blue-800 border-blue-200', 
        text: t('consume', '消费'),
        icon: <CreditCard className="w-3 h-3 mr-1" />
      },
      reward: { 
        bg: 'bg-purple-100 text-purple-800 border-purple-200', 
        text: t('reward', '收益'),
        icon: <Gift className="w-3 h-3 mr-1" />
      }
    };

    const config = typeConfig[type];
    return (
      <Badge className={config.bg}>
        {config.icon}
        {config.text}
      </Badge>
    );
  };

  const getStatusBadge = (status: TransactionRecord['status']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t('completed', '已完成')}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            {t('pending', '处理中')}
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            {t('failed', '失败')}
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <XCircle className="w-3 h-3 mr-1" />
            {t('cancelled', '已取消')}
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(currentLanguage, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    
    return (
      <span className={isNegative ? 'text-red-600' : 'text-green-600'}>
        {isNegative ? '-' : '+'}
        {new Intl.NumberFormat(currentLanguage, {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2
        }).format(absAmount)}
      </span>
    );
  };

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport(filteredAndSortedTransactions);
    } else {
      // 实现导出功能
      console.log('导出交易记录');
    }
  }, [onExport, filteredAndSortedTransactions]);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    onPageChange?.(newPage);
  }, [onPageChange]);

  const handleSort = (field: 'date' | 'amount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // 过滤和排序数据
  const filteredAndSortedTransactions = transactions
    .filter(transaction => {
      const matchesSearch = transaction.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (transaction.referenceId && transaction.referenceId.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'date') {
        comparison = new Date(b.createDate).getTime() - new Date(a.createDate).getTime();
      } else if (sortBy === 'amount') {
        comparison = Math.abs(b.amount) - Math.abs(a.amount);
      }
      
      return sortOrder === 'asc' ? -comparison : comparison;
    });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 统计概览 */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="luckymart-padding-lg bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="luckymart-layout-flex luckymart-layout-center justify-between">
              <div>
                <p className="luckymart-text-sm luckymart-font-medium text-blue-600">{t('current_balance', '当前余额')}</p>
                <p className="text-2xl luckymart-font-bold text-blue-700">
                  {new Intl.NumberFormat(currentLanguage, {
                    style: 'currency',
                    currency: 'USD'
                  }).format(stats.totalBalance)}
                </p>
              </div>
              <DollarSign className="w-10 h-10 luckymart-text-primary" />
            </div>
          </Card>

          <Card className="luckymart-padding-lg bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="luckymart-layout-flex luckymart-layout-center justify-between">
              <div>
                <p className="luckymart-text-sm luckymart-font-medium text-green-600">{t('total_inflow', '总收入')}</p>
                <p className="text-2xl luckymart-font-bold text-green-700">
                  {new Intl.NumberFormat(currentLanguage, {
                    style: 'currency',
                    currency: 'USD'
                  }).format(stats.totalInflow)}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 luckymart-text-success" />
            </div>
          </Card>

          <Card className="luckymart-padding-lg bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <div className="luckymart-layout-flex luckymart-layout-center justify-between">
              <div>
                <p className="luckymart-text-sm luckymart-font-medium text-red-600">{t('total_outflow', '总支出')}</p>
                <p className="text-2xl luckymart-font-bold text-red-700">
                  {new Intl.NumberFormat(currentLanguage, {
                    style: 'currency',
                    currency: 'USD'
                  }).format(stats.totalOutflow)}
                </p>
              </div>
              <TrendingDown className="w-10 h-10 luckymart-text-warning" />
            </div>
          </Card>

          <Card className="luckymart-padding-lg bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="luckymart-layout-flex luckymart-layout-center justify-between">
              <div>
                <p className="luckymart-text-sm luckymart-font-medium text-purple-600">{t('today_transactions', '今日交易')}</p>
                <p className="text-2xl luckymart-font-bold text-purple-700">{stats.todayTransactions}</p>
              </div>
              <Calendar className="w-10 h-10 text-purple-500" />
            </div>
          </Card>

          <Card className="luckymart-padding-lg bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <div className="luckymart-layout-flex luckymart-layout-center justify-between">
              <div>
                <p className="luckymart-text-sm luckymart-font-medium text-yellow-600">{t('month_transactions', '本月交易')}</p>
                <p className="text-2xl luckymart-font-bold text-yellow-700">{stats.monthTransactions}</p>
              </div>
              <Filter className="w-10 h-10 text-yellow-500" />
            </div>
          </Card>
        </div>
      )}

      {/* 筛选和搜索 */}
      <Card className="luckymart-padding-md">
        <div className="luckymart-layout-flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={t('search_transactions', '搜索交易ID、描述或关联ID...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="luckymart-layout-flex gap-3 flex-wrap">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 luckymart-border border-gray-300 luckymart-rounded-md luckymart-text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('all_types', '所有类型')}</option>
              <option value="recharge">{t('recharge', '充值')}</option>
              <option value="withdraw">{t('withdraw', '提现')}</option>
              <option value="consume">{t('consume', '消费')}</option>
              <option value="reward">{t('reward', '收益')}</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 luckymart-border border-gray-300 luckymart-rounded-md luckymart-text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('all_status', '所有状态')}</option>
              <option value="pending">{t('pending', '处理中')}</option>
              <option value="completed">{t('completed', '已完成')}</option>
              <option value="failed">{t('failed', '失败')}</option>
              <option value="cancelled">{t('cancelled', '已取消')}</option>
            </select>

            <div className="luckymart-layout-flex luckymart-spacing-xs">
              <Button
                variant={sortBy === 'date' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSort('date')}
                className="luckymart-spacing-xs"
              >
                {t('date', '日期')}
                {sortBy === 'date' && (
                  sortOrder === 'desc' ? <ArrowDown className="w-3 h-3 ml-1" /> : <ArrowUp className="w-3 h-3 ml-1" />
                )}
              </Button>
              <Button
                variant={sortBy === 'amount' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSort('amount')}
                className="luckymart-spacing-xs"
              >
                {t('amount', '金额')}
                {sortBy === 'amount' && (
                  sortOrder === 'desc' ? <ArrowDown className="w-3 h-3 ml-1" /> : <ArrowUp className="w-3 h-3 ml-1" />
                )}
              </Button>
            </div>

            {showExport && (
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                {t('export', '导出')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 交易记录列表 */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs luckymart-font-medium luckymart-text-secondary uppercase tracking-wider">
                  {t('transaction_info', '交易信息')}
                </th>
                <th className="px-4 py-3 text-left text-xs luckymart-font-medium luckymart-text-secondary uppercase tracking-wider">
                  {t('type', '类型')}
                </th>
                <th className="px-4 py-3 text-left text-xs luckymart-font-medium luckymart-text-secondary uppercase tracking-wider">
                  {t('amount', '金额')}
                </th>
                <th className="px-4 py-3 text-left text-xs luckymart-font-medium luckymart-text-secondary uppercase tracking-wider">
                  {t('balance_after', '余额')}
                </th>
                <th className="px-4 py-3 text-left text-xs luckymart-font-medium luckymart-text-secondary uppercase tracking-wider">
                  {t('status', '状态')}
                </th>
                <th className="px-4 py-3 text-left text-xs luckymart-font-medium luckymart-text-secondary uppercase tracking-wider">
                  {t('date', '日期')}
                </th>
              </tr>
            </thead>
            <tbody className="luckymart-bg-white divide-y divide-gray-200">
              {loading ? (
                // 加载骨架屏
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-gray-200 luckymart-rounded luckymart-animation-pulse"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredAndSortedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 luckymart-text-center luckymart-text-secondary">
                    <CreditCard className="w-12 h-12 mx-auto luckymart-spacing-md text-gray-300" />
                    <p>{t('no_transactions', '暂无交易记录')}</p>
                  </td>
                </tr>
              ) : (
                filteredAndSortedTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="luckymart-layout-flex luckymart-layout-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full luckymart-layout-flex luckymart-layout-center justify-center">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div className="ml-3">
                          <p className="luckymart-text-sm luckymart-font-medium text-gray-900">
                            {transaction.transactionId}
                          </p>
                          <p className="luckymart-text-sm luckymart-text-secondary">{transaction.description}</p>
                          {transaction.referenceId && (
                            <p className="text-xs text-gray-400">
                              {t('reference', '关联')}: {transaction.referenceId}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getTypeBadge(transaction.type)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-lg font-semibold">
                        {formatCurrency(transaction.amount)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="luckymart-text-sm text-gray-900">
                        {new Intl.NumberFormat(currentLanguage, {
                          style: 'currency',
                          currency: 'USD'
                        }).format(transaction.balanceAfter)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(transaction.status)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="luckymart-text-sm text-gray-900">
                        {formatDate(transaction.createDate)}
                      </div>
                      {transaction.completeDate && transaction.status === 'completed' && (
                        <div className="text-xs luckymart-text-secondary">
                          {t('completed_at', '完成于')}: {formatDate(transaction.completeDate)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {!loading && filteredAndSortedTransactions.length > 0 && (
          <div className="px-4 py-3 border-t luckymart-border-light luckymart-layout-flex luckymart-layout-center justify-between">
            <div className="luckymart-text-sm text-gray-700">
              {t('page_info', '显示 {{start}} - {{end}} 条，共 {{total}} 条', {
                start: (pagination.page - 1) * pagination.limit + 1,
                end: Math.min(pagination.page * pagination.limit, pagination.total),
                total: pagination.total
              })}
            </div>
            <div className="luckymart-layout-flex luckymart-spacing-sm">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 py-2 luckymart-text-sm text-gray-700">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TransactionList;