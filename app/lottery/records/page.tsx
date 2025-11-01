'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import LotteryHistory from '../../../components/LotteryHistory';
import { useNetworkStatus } from '../../../hooks/use-network-status';

export interface LotteryRecord {
  id: string;
  roundId: string;
  productId: string;
  productName: string;
  productImage?: string;
  roundNumber: number;
  numbers: number[];
  sharesCount: number;
  cost: number;
  type: 'paid' | 'free';
  status: 'active' | 'completed' | 'drawn';
  isWinner: boolean;
  winningNumber?: number;
  winnerPrize?: number;
  drawTime?: string;
  participationTime: string;
}

export interface LotteryFilter {
  status: 'all' | 'active' | 'completed' | 'won';
  type: 'all' | 'paid' | 'free';
  page: number;
  limit: number;
}

function LotteryRecordsPage() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { isOnline } = useNetworkStatus();
  
  const [records, setRecords] = useState<LotteryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<LotteryFilter>({
    status: 'all',
    type: 'all',
    page: 1,
    limit: 20
  });
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [statistics, setStatistics] = useState({
    totalParticipations: 0,
    totalWins: 0,
    totalWinnings: 0,
    winRate: 0
  });

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    loadRecords();
    loadStatistics();
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    loadRecords(true);
  }, [filter.status, filter.type]);

  const loadRecords = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setFilter(prev => ({ ...prev, page: 1 }));
    }

    try {
      const response = await fetch(
        `/api/lottery/records?status=${filter.status}&type=${filter.type}&page=${filter.page}&limit=${filter.limit}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const data = await response.json();
      
      if (data.success) {
        if (reset) {
          setRecords(data.data.records);
        } else {
          setRecords(prev => [...prev, ...data.data.records]);
        }
        
        setHasMore(data.data.hasMore);
        setLoading(false);
        setLoadingMore(false);
      }
    } catch (error) {
      console.error('加载抽奖记录失败:', error);
      if (!isOnline) {
        // 离线模式，加载缓存数据
        loadCachedRecords();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const loadCachedRecords = () => {
    try {
      const cached = localStorage.getItem('lottery_records_cache');
      if (cached) {
        const cacheData = JSON.parse(cached);
        const filtered = cacheData.filter((record: LotteryRecord) => {
          const statusMatch = filter.status === 'all' || 
            (filter.status === 'active' && record.status === 'active') ||
            (filter.status === 'completed' && record.status === 'completed') ||
            (filter.status === 'won' && record.isWinner);
          
          const typeMatch = filter.type === 'all' || record.type === filter.type;
          
          return statusMatch && typeMatch;
        });
        setRecords(filtered);
        setLoading(false);
      }
    } catch (error) {
      console.error('加载缓存数据失败:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch('/api/lottery/statistics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      setFilter(prev => ({ ...prev, page: prev.page + 1 }));
      loadRecords();
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRecords(true);
    await loadStatistics();
  };

  const handleFilterChange = (newFilter: Partial<LotteryFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter, page: 1 }));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">需要登录</h3>
          <p className="text-gray-500 mb-4">请登录后查看您的抽奖记录</p>
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">{t('lottery.records.title', '抽奖记录')}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">{t('lottery.records.totalParticipations', '总参与')}</p>
                <p className="text-lg font-bold text-gray-900">{statistics.totalParticipations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">{t('lottery.records.totalWins', '中奖次数')}</p>
                <p className="text-lg font-bold text-gray-900">{statistics.totalWins}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">{t('lottery.records.totalWinnings', '总奖金')}</p>
                <p className="text-lg font-bold text-gray-900">{statistics.totalWinnings.toFixed(2)} TJS</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">{t('lottery.records.winRate', '中奖率')}</p>
                <p className="text-lg font-bold text-gray-900">{(statistics.winRate * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{t('lottery.records.filter', '筛选条件')}</h2>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {refreshing ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                <span className="ml-2">{t('common.refresh', '刷新')}</span>
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 状态筛选 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('lottery.records.status', '状态')}
                </label>
                <select
                  value={filter.status}
                  onChange={(e) => handleFilterChange({ status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">{t('lottery.records.statusAll', '全部')}</option>
                  <option value="active">{t('lottery.records.statusActive', '进行中')}</option>
                  <option value="completed">{t('lottery.records.statusCompleted', '已结束')}</option>
                  <option value="won">{t('lottery.records.statusWon', '中奖记录')}</option>
                </select>
              </div>

              {/* 类型筛选 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('lottery.records.type', '类型')}
                </label>
                <select
                  value={filter.type}
                  onChange={(e) => handleFilterChange({ type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">{t('lottery.records.typeAll', '全部')}</option>
                  <option value="paid">{t('lottery.records.typePaid', '付费')}</option>
                  <option value="free">{t('lottery.records.typeFree', '免费')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 抽奖历史组件 */}
        <LotteryHistory
          records={records}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
}