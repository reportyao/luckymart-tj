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
  ArrowUpDown
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// Props接口定义
export interface CommissionHistoryProps {
  /** 自定义CSS类名 */
  className?: string;
  /** 每页显示数量 */
  pageSize?: number;
  /** 是否显示导出功能 */
  showExport?: boolean;
  /** 是否显示图表视图 */
  showCharts?: boolean;
  /** 默认激活的视图类型 */
  defaultView?: 'list' | 'chart';
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

interface CommissionRecord {
  id: string;
  userId: string;
  username: string;
  referralLevel: 1 | 2 | 3;
  orderId: string;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createDate: string;
  confirmDate?: string;
  description: string;
  category: string;
}

interface MonthlyStats {
  month: string;
  totalCommission: number;
  confirmedCommission: number;
  pendingCommission: number;
  orderCount: number;
  averageOrderAmount: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const CommissionHistory: React.FC<CommissionHistoryProps> = ({
  className = '',
  pageSize = 10,
  showExport = true,
  showCharts = true,
  defaultView = 'list',
  fetchData,
  onExport,
  onPageChange,
  onFilter,
  onError
}) => {
  const { t } = useTranslation('referral');
  const { currentLanguage } = useLanguage();
  const [records, setRecords] = useState<CommissionRecord[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [activeView, setActiveView] = useState<'list' | 'chart'>(defaultView);

  // 模拟获取返利历史数据
  useEffect(() => {
    const fetchCommissionHistory = async () => {
      setLoading(true);
      
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟返利记录数据
      const mockRecords: CommissionRecord[] = [
        {
          id: '1',
          userId: 'user001',
          username: 'user001',
          referralLevel: 1,
          orderId: 'ORD-2025-10-30-001',
          orderAmount: 150.75,
          commissionRate: 0.05,
          commissionAmount: 7.54,
          status: 'confirmed',
          createDate: '2025-10-30T14:20:00Z',
          confirmDate: '2025-10-30T15:30:00Z',
          description: '购买电子产品',
          category: 'electronics'
        },
        {
          id: '2',
          userId: 'user003',
          username: 'user003',
          referralLevel: 2,
          orderId: 'ORD-2025-10-29-002',
          orderAmount: 89.25,
          commissionRate: 0.02,
          commissionAmount: 1.79,
          status: 'confirmed',
          createDate: '2025-10-29T11:30:00Z',
          confirmDate: '2025-10-29T12:15:00Z',
          description: '购买服装',
          category: 'fashion'
        },
        {
          id: '3',
          userId: 'user004',
          username: 'user004',
          referralLevel: 1,
          orderId: 'ORD-2025-10-28-003',
          orderAmount: 245.60,
          commissionRate: 0.05,
          commissionAmount: 12.28,
          status: 'pending',
          createDate: '2025-10-28T16:45:00Z',
          description: '购买家居用品',
          category: 'home'
        },
        {
          id: '4',
          userId: 'user005',
          username: 'user005',
          referralLevel: 3,
          orderId: 'ORD-2025-10-27-004',
          orderAmount: 67.80,
          commissionRate: 0.01,
          commissionAmount: 0.68,
          status: 'cancelled',
          createDate: '2025-10-27T10:15:00Z',
          description: '购买书籍',
          category: 'books'
        },
        {
          id: '5',
          userId: 'user006',
          username: 'user006',
          referralLevel: 1,
          orderId: 'ORD-2025-10-26-005',
          orderAmount: 199.99,
          commissionRate: 0.05,
          commissionAmount: 10.00,
          status: 'confirmed',
          createDate: '2025-10-26T09:20:00Z',
          confirmDate: '2025-10-26T10:30:00Z',
          description: '购买运动用品',
          category: 'sports'
        }
      ];

      // 模拟月度统计数据
      const mockMonthlyStats: MonthlyStats[] = [
        {
          month: '2025-06',
          totalCommission: 45.67,
          confirmedCommission: 38.90,
          pendingCommission: 6.77,
          orderCount: 12,
          averageOrderAmount: 95.23
        },
        {
          month: '2025-07',
          totalCommission: 52.34,
          confirmedCommission: 48.12,
          pendingCommission: 4.22,
          orderCount: 15,
          averageOrderAmount: 102.15
        },
        {
          month: '2025-08',
          totalCommission: 38.91,
          confirmedCommission: 35.45,
          pendingCommission: 3.46,
          orderCount: 10,
          averageOrderAmount: 87.65
        },
        {
          month: '2025-09',
          totalCommission: 61.23,
          confirmedCommission: 58.77,
          pendingCommission: 2.46,
          orderCount: 18,
          averageOrderAmount: 109.82
        },
        {
          month: '2025-10',
          totalCommission: 32.29,
          confirmedCommission: 22.61,
          pendingCommission: 9.68,
          orderCount: 8,
          averageOrderAmount: 124.56
        }
      ];
      
      setRecords(mockRecords);
      setMonthlyStats(mockMonthlyStats);
      setPagination({
        page: 1,
        limit: 10,
        total: mockRecords.length,
        totalPages: Math.ceil(mockRecords.length / 10)
      });
      setLoading(false);
    };

    fetchCommissionHistory();
  }, [currentLanguage]);

  const getStatusBadge = (status: CommissionRecord['status']) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t('confirmed_rewards', '已确认')}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            {t('pending_rewards', '待确认')}
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            {t('cancelled', '已取消')}
          </Badge>
        );
    }
  };

  const getLevelBadge = (level: CommissionRecord['referralLevel']) => {
    const colors = {
      1: 'bg-blue-100 text-blue-800 border-blue-200',
      2: 'bg-green-100 text-green-800 border-green-200',
      3: 'bg-purple-100 text-purple-800 border-purple-200'
    };

    return (
      <Badge className={colors[level]}>
        {t('level', '级别')} {level}
      </Badge>
    );
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
    return new Intl.NumberFormat(currentLanguage, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport(filteredAndSortedRecords);
    } else {
      // 实现导出功能
      console.log('导出返利历史');
    }
  }, [onExport, filteredAndSortedRecords]);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    onPageChange?.(newPage);
  }, [onPageChange]);

  // 计算统计数据
  const totalCommission = records.reduce((sum, r) => sum + r.commissionAmount, 0);
  const confirmedCommission = records
    .filter(r => r.status === 'confirmed')
    .reduce((sum, r) => sum + r.commissionAmount, 0);
  const pendingCommission = records
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.commissionAmount, 0);

  // 过滤和排序数据
  const filteredAndSortedRecords = records
    .filter(record => {
      const matchesSearch = record.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.orderId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createDate).getTime() - new Date(a.createDate).getTime();
      } else {
        return b.commissionAmount - a.commissionAmount;
      }
    });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="luckymart-padding-lg bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="luckymart-layout-flex luckymart-layout-center justify-between">
            <div>
              <p className="luckymart-text-sm luckymart-font-medium text-green-600">{t('total_earnings', '总收益')}</p>
              <p className="text-2xl luckymart-font-bold text-green-700">{formatCurrency(totalCommission)}</p>
            </div>
            <DollarSign className="w-10 h-10 luckymart-text-success" />
          </div>
        </Card>

        <Card className="luckymart-padding-lg bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="luckymart-layout-flex luckymart-layout-center justify-between">
            <div>
              <p className="luckymart-text-sm luckymart-font-medium text-blue-600">{t('confirmed_rewards', '已确认奖励')}</p>
              <p className="text-2xl luckymart-font-bold text-blue-700">{formatCurrency(confirmedCommission)}</p>
            </div>
            <CheckCircle className="w-10 h-10 luckymart-text-primary" />
          </div>
        </Card>

        <Card className="luckymart-padding-lg bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="luckymart-layout-flex luckymart-layout-center justify-between">
            <div>
              <p className="luckymart-text-sm luckymart-font-medium text-yellow-600">{t('pending_rewards', '待确认奖励')}</p>
              <p className="text-2xl luckymart-font-bold text-yellow-700">{formatCurrency(pendingCommission)}</p>
            </div>
            <Clock className="w-10 h-10 luckymart-text-warning" />
          </div>
        </Card>

        <Card className="luckymart-padding-lg bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="luckymart-layout-flex luckymart-layout-center justify-between">
            <div>
              <p className="luckymart-text-sm luckymart-font-medium text-purple-600">{t('monthly_earnings', '月度收益')}</p>
              <p className="text-2xl luckymart-font-bold text-purple-700">
                {formatCurrency(monthlyStats[monthlyStats.length - 1]?.totalCommission || 0)}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* 视图切换 */}
      <div className="luckymart-layout-flex justify-between luckymart-layout-center">
        <div className="luckymart-layout-flex luckymart-spacing-sm">
          {showCharts && (
            <Button
              variant={activeView === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('list')}
            >
              {t('list', '列表')}
            </Button>
          )}
          {showCharts && (
            <Button
              variant={activeView === 'chart' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('chart')}
            >
              {t('chart', '图表')}
            </Button>
          )}
        </div>

        <div className="luckymart-layout-flex luckymart-layout-center luckymart-spacing-sm">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
            className="px-3 py-1 luckymart-border border-gray-300 luckymart-rounded luckymart-text-sm"
          >
            <option value="date">{t('sort_by_date', '按日期排序')}</option>
            <option value="amount">{t('sort_by_amount', '按金额排序')}</option>
          </select>
        </div>
      </div>

      {/* 内容区域 */}
      {activeView === 'chart' ? (
        <Card className="luckymart-padding-lg">
          <h3 className="luckymart-text-lg font-semibold text-gray-800 luckymart-spacing-md">
            {t('monthly_trend', '月度趋势')}
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value, name) => [
                    formatCurrency(Number(value)),
                    name === 'totalCommission' ? '总收益' : 
                    name === 'confirmedCommission' ? '已确认收益' : '待确认收益'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="totalCommission"
                  stackId="1"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="confirmedCommission"
                  stackId="2"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.8}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ) : (
        <>
          {/* 筛选和搜索 */}
          <Card className="luckymart-padding-md">
            <div className="luckymart-layout-flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder={t('search_orders', '搜索订单号或用户名...')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="luckymart-layout-flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 luckymart-border border-gray-300 luckymart-rounded-md luckymart-text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">{t('all_status', '所有状态')}</option>
                  <option value="pending">{t('pending_rewards', '待确认')}</option>
                  <option value="confirmed">{t('confirmed_rewards', '已确认')}</option>
                  <option value="cancelled">{t('cancelled', '已取消')}</option>
                </select>

                {showExport && (
                  <Button onClick={handleExport} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    {t('export', '导出')}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* 返利记录列表 */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs luckymart-font-medium luckymart-text-secondary uppercase tracking-wider">
                      {t('user_info', '用户信息')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs luckymart-font-medium luckymart-text-secondary uppercase tracking-wider">
                      {t('order_info', '订单信息')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs luckymart-font-medium luckymart-text-secondary uppercase tracking-wider">
                      {t('commission_rate', '佣金率')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs luckymart-font-medium luckymart-text-secondary uppercase tracking-wider">
                      {t('commission_amount', '佣金金额')}
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
                  ) : filteredAndSortedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 luckymart-text-center luckymart-text-secondary">
                        <DollarSign className="w-12 h-12 mx-auto luckymart-spacing-md text-gray-300" />
                        <p>{t('no_data', '暂无返利记录')}</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="luckymart-layout-flex luckymart-layout-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full luckymart-layout-flex luckymart-layout-center justify-center text-white luckymart-font-medium">
                              {record.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3">
                              <p className="luckymart-text-sm luckymart-font-medium text-gray-900">{record.username}</p>
                              <p className="luckymart-text-sm luckymart-text-secondary">{t('user_id', '用户ID')}: {record.userId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="luckymart-text-sm luckymart-font-medium text-gray-900">{record.orderId}</div>
                          <div className="luckymart-text-sm luckymart-text-secondary">{record.description}</div>
                          <div className="text-xs text-gray-400">
                            {formatCurrency(record.orderAmount)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="luckymart-layout-flex luckymart-layout-center luckymart-spacing-sm">
                            {getLevelBadge(record.referralLevel)}
                            <span className="luckymart-text-sm text-gray-600">
                              {(record.commissionRate * 100).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="luckymart-text-lg font-semibold text-green-600">
                            {formatCurrency(record.commissionAmount)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {getStatusBadge(record.status)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="luckymart-text-sm text-gray-900">
                            {formatDate(record.createDate)}
                          </div>
                          {record.confirmDate && (
                            <div className="text-xs luckymart-text-secondary">
                              {t('confirmed_at', '确认于')}: {formatDate(record.confirmDate)}
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
            {!loading && filteredAndSortedRecords.length > 0 && (
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
        </>
      )}
    </div>
  );
};\n\nexport default CommissionHistory;