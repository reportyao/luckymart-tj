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
  Filter, 
  Download, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Award
} from 'lucide-react';

// Props接口定义
export interface InvitationHistoryProps {
  /** 自定义CSS类名 */
  className?: string;
  /** 每页显示数量 */
  pageSize?: number;
  /** 是否显示导出功能 */
  showExport?: boolean;
  /** 是否显示统计摘要 */
  showSummary?: boolean;
  /** 默认搜索关键词 */
  defaultSearch?: string;
  /** 默认状态筛选 */
  defaultStatusFilter?: string;
  /** 默认级别筛选 */
  defaultLevelFilter?: string;
  /** 自定义数据获取函数 */
  fetchData?: (params: any) => Promise<any>;
  /** 导出回调函数 */
  onExport?: (data: any[]) => void;
  /** 分页回调函数 */
  onPageChange?: (page: number) => void;
  /** 搜索回调函数 */
  onSearch?: (keyword: string) => void;
  /** 筛选回调函数 */
  onFilter?: (filters: { status?: string; level?: string }) => void;
  /** 错误回调函数 */
  onError?: (error: Error) => void;
}

interface InvitationRecord {
  id: string;
  username: string;
  email: string;
  phone?: string;
  referralLevel: 1 | 2 | 3;
  joinDate: string;
  status: 'pending' | 'confirmed' | 'rejected';
  firstPurchaseDate?: string;
  totalSpent: number;
  rewards: number;
  location?: string;
  device?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const InvitationHistory: React.FC<InvitationHistoryProps> = ({
  className = '',
  pageSize = 10,
  showExport = true,
  showSummary = true,
  defaultSearch = '',
  defaultStatusFilter = 'all',
  defaultLevelFilter = 'all',
  fetchData,
  onExport,
  onPageChange,
  onSearch,
  onFilter,
  onError
}) => {
  const { t } = useTranslation('referral');
  const { currentLanguage } = useLanguage();
  const [records, setRecords] = useState<InvitationRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(defaultSearch);
  const [statusFilter, setStatusFilter] = useState<string>(defaultStatusFilter);
  const [levelFilter, setLevelFilter] = useState<string>(defaultLevelFilter);

  // 模拟获取邀请历史数据
  useEffect(() => {
    const fetchInvitationHistory = async () => {
      setLoading(true);
      
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 模拟数据
      const mockRecords: InvitationRecord[] = [
        {
          id: '1',
          username: 'user001',
          email: 'user001@example.com',
          referralLevel: 1,
          joinDate: '2025-10-30T10:30:00Z',
          status: 'confirmed',
          firstPurchaseDate: '2025-10-30T14:20:00Z',
          totalSpent: 150.75,
          rewards: 7.54,
          location: '北京, 中国',
          device: 'iPhone 14'
        },
        {
          id: '2',
          username: 'user002',
          email: 'user002@example.com',
          phone: '+992901234567',
          referralLevel: 1,
          joinDate: '2025-10-29T16:45:00Z',
          status: 'pending',
          totalSpent: 0,
          rewards: 0,
          location: '杜尚别, 塔吉克斯坦',
          device: 'Android Samsung'
        },
        {
          id: '3',
          username: 'user003',
          email: 'user003@example.com',
          referralLevel: 2,
          joinDate: '2025-10-29T09:15:00Z',
          status: 'confirmed',
          firstPurchaseDate: '2025-10-29T11:30:00Z',
          totalSpent: 89.25,
          rewards: 1.79,
          location: '莫斯科, 俄罗斯',
          device: 'Desktop Chrome'
        },
        {
          id: '4',
          username: 'user004',
          email: 'user004@example.com',
          referralLevel: 1,
          joinDate: '2025-10-28T14:20:00Z',
          status: 'confirmed',
          firstPurchaseDate: '2025-10-28T16:45:00Z',
          totalSpent: 245.60,
          rewards: 12.28,
          location: '纽约, 美国',
          device: 'MacBook Pro'
        },
        {
          id: '5',
          username: 'user005',
          email: 'user005@example.com',
          phone: '+992907654321',
          referralLevel: 3,
          joinDate: '2025-10-28T08:30:00Z',
          status: 'rejected',
          totalSpent: 0,
          rewards: 0,
          location: '苦盏, 塔吉克斯坦',
          device: 'Android Huawei'
        }
      ];
      
      setRecords(mockRecords);
      setPagination({
        page: 1,
        limit: 10,
        total: mockRecords.length,
        totalPages: Math.ceil(mockRecords.length / 10)
      });
      setLoading(false);
    };

    fetchInvitationHistory();
  }, [currentLanguage]);

  const getStatusBadge = (status: InvitationRecord['status']) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t('active', '已确认')}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            {t('pending', '待确认')}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            {t('rejected', '已拒绝')}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <AlertCircle className="w-3 h-3 mr-1" />
            {t('unknown', '未知')}
          </Badge>
        );
    }
  };

  const getLevelBadge = (level: InvitationRecord['referralLevel']) => {
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

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport(filteredRecords);
    } else {
      // 实现导出功能
      console.log('导出邀请历史');
    }
  }, [onExport, filteredRecords]);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    onPageChange?.(newPage);
    // 这里应该重新获取数据
  }, [onPageChange]);

  // 过滤数据
  const filteredRecords = records.filter(record => {
    const matchesSearch = record.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesLevel = levelFilter === 'all' || record.referralLevel.toString() === levelFilter;
    
    return matchesSearch && matchesStatus && matchesLevel;
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 筛选和搜索 */}
      <Card className="luckymart-padding-md">
        <div className="luckymart-layout-flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={t('search_placeholder', '搜索用户名或邮箱...')}
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
              <option value="pending">{t('pending', '待确认')}</option>
              <option value="confirmed">{t('confirmed', '已确认')}</option>
              <option value="rejected">{t('rejected', '已拒绝')}</option>
            </select>

            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 luckymart-border border-gray-300 luckymart-rounded-md luckymart-text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('all_levels', '所有级别')}</option>
              <option value="1">{t('level_1', '一级')}</option>
              <option value="2">{t('level_2', '二级')}</option>
              <option value="3">{t('level_3', '三级')}</option>
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

      {/* 邀请记录列表 */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs luckymart-font-medium luckymart-text-secondary uppercase tracking-wider">
                  {t('username', '用户名')}
                </th>
                <th className="px-4 py-3 text-left text-xs luckymart-font-medium luckymart-text-secondary uppercase tracking-wider">
                  {t('referral_level', '推荐级别')}
                </th>
                <th className="px-4 py-3 text-left text-xs luckymart-font-medium luckymart-text-secondary uppercase tracking-wider">
                  {t('join_date', '加入时间')}
                </th>
                <th className="px-4 py-3 text-left text-xs luckymart-font-medium luckymart-text-secondary uppercase tracking-wider">
                  {t('status', '状态')}
                </th>
                <th className="px-4 py-3 text-left text-xs luckymart-font-medium luckymart-text-secondary uppercase tracking-wider">
                  {t('total_consumption', '总消费')}
                </th>
                <th className="px-4 py-3 text-left text-xs luckymart-font-medium luckymart-text-secondary uppercase tracking-wider">
                  {t('rewards', '我的奖励')}
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
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 luckymart-text-center luckymart-text-secondary">
                    <User className="w-12 h-12 mx-auto luckymart-spacing-md text-gray-300" />
                    <p>{t('no_data', '暂无邀请记录')}</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="luckymart-layout-flex luckymart-layout-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full luckymart-layout-flex luckymart-layout-center justify-center text-white luckymart-font-medium">
                          {record.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <p className="luckymart-text-sm luckymart-font-medium text-gray-900">{record.username}</p>
                          <p className="luckymart-text-sm luckymart-text-secondary">{record.email}</p>
                          {record.phone && (
                            <p className="text-xs text-gray-400">{record.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getLevelBadge(record.referralLevel)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="luckymart-text-sm text-gray-900">
                        {formatDate(record.joinDate)}
                      </div>
                      {record.location && (
                        <div className="text-xs luckymart-text-secondary">{record.location}</div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="luckymart-text-sm luckymart-font-medium text-gray-900">
                        ${record.totalSpent.toFixed(2)}
                      </div>
                      {record.firstPurchaseDate && (
                        <div className="text-xs luckymart-text-secondary">
                          {t('first_purchase', '首次购买')}: {formatDate(record.firstPurchaseDate)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="luckymart-text-sm luckymart-font-medium text-green-600">
                        ${record.rewards.toFixed(2)}
                      </div>
                      <div className="text-xs luckymart-text-secondary">
                        {((record.rewards / Math.max(record.totalSpent, 1)) * 100).toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {!loading && filteredRecords.length > 0 && (
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

      {/* 统计摘要 */}
      {showSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="luckymart-padding-md">
          <div className="luckymart-layout-flex luckymart-layout-center justify-between">
            <div>
              <p className="luckymart-text-sm text-gray-600">{t('total_invitations', '总邀请数')}</p>
              <p className="text-2xl luckymart-font-bold text-gray-800">{records.length}</p>
            </div>
            <User className="luckymart-size-lg luckymart-size-lg luckymart-text-primary" />
          </div>
        </Card>

        <Card className="luckymart-padding-md">
          <div className="luckymart-layout-flex luckymart-layout-center justify-between">
            <div>
              <p className="luckymart-text-sm text-gray-600">{t('confirmed_count', '已确认数')}</p>
              <p className="text-2xl luckymart-font-bold text-green-600">
                {records.filter(r => r.status === 'confirmed').length}
              </p>
            </div>
            <CheckCircle className="luckymart-size-lg luckymart-size-lg luckymart-text-success" />
          </div>
        </Card>

        <Card className="luckymart-padding-md">
          <div className="luckymart-layout-flex luckymart-layout-center justify-between">
            <div>
              <p className="luckymart-text-sm text-gray-600">{t('total_spent', '总消费额')}</p>
              <p className="text-2xl luckymart-font-bold text-purple-600">
                ${records.reduce((sum, r) => sum + r.totalSpent, 0).toFixed(2)}
              </p>
            </div>
            <DollarSign className="luckymart-size-lg luckymart-size-lg text-purple-500" />
          </div>
        </Card>

        <Card className="luckymart-padding-md">
          <div className="luckymart-layout-flex luckymart-layout-center justify-between">
            <div>
              <p className="luckymart-text-sm text-gray-600">{t('total_earned', '总获得奖励')}</p>
              <p className="text-2xl luckymart-font-bold text-orange-600">
                ${records.reduce((sum, r) => sum + r.rewards, 0).toFixed(2)}
              </p>
            </div>
            <Award className="luckymart-size-lg luckymart-size-lg text-orange-500" />
          </div>
        </Card>
      </div>
      )}
    </div>
  );
};\n\nexport default InvitationHistory;