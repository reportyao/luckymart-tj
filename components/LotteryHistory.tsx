'use client';

import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import LotteryRecordCard from './LotteryRecordCard';
import { LotteryRecord } from '../app/lottery/records/page';
import { useNetworkStatus } from '../hooks/use-network-status';

interface LotteryHistoryProps {
  records: LotteryRecord[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
}

function LotteryHistory({
  records,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  onRefresh
}: LotteryHistoryProps) {
  const { t } = useTranslation();
  const { isOnline } = useNetworkStatus();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 监听滚动显示回到顶部按钮
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 设置无限滚动监听器
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && !loadingMore && hasMore) {
          onLoadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, onLoadMore]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="luckymart-bg-white rounded-xl luckymart-shadow-sm luckymart-padding-lg">
        <div className="luckymart-animation-pulse">
          <div className="luckymart-layout-flex luckymart-layout-center justify-between mb-6">
            <div className="luckymart-size-md bg-gray-200 luckymart-rounded w-32"></div>
            <div className="luckymart-size-lg bg-gray-200 luckymart-rounded w-20"></div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="luckymart-border luckymart-border-light luckymart-rounded-lg luckymart-padding-md">
                <div className="luckymart-layout-flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-200 luckymart-rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 luckymart-rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 luckymart-rounded w-1/2 luckymart-spacing-md"></div>
                    <div className="luckymart-layout-flex gap-2">
                      {[...Array(5)].map((_, j) => (
                        <div key={j} className="luckymart-size-lg luckymart-size-lg bg-gray-200 rounded-full"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="luckymart-bg-white rounded-xl luckymart-shadow-sm p-8">
        <div className="luckymart-text-center">
          <div className="w-16 h-16 mx-auto luckymart-spacing-md luckymart-bg-gray-light rounded-full luckymart-layout-flex luckymart-layout-center justify-center">
            <svg className="luckymart-size-lg luckymart-size-lg text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="luckymart-text-lg luckymart-font-medium text-gray-900 mb-2">
            {t('lottery.records.noRecords', '暂无抽奖记录')}
          </h3>
          <p className="luckymart-text-secondary mb-6">
            {t('lottery.records.noRecordsDesc', '您还没有参与过任何抽奖，去参与抽奖赢取奖品吧！')}
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex luckymart-layout-center px-4 py-2 luckymart-border border-transparent luckymart-text-sm luckymart-font-medium luckymart-rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {t('lottery.records.goLottery', '去抽奖')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 记录列表 */}
      <div className="luckymart-bg-white rounded-xl luckymart-shadow-sm overflow-hidden">
        <div className="luckymart-padding-md border-b luckymart-border-light">
          <div className="luckymart-layout-flex luckymart-layout-center justify-between">
            <h2 className="luckymart-text-lg font-semibold text-gray-900">
              {t('lottery.records.history', '抽奖历史')} ({records.length})
            </h2>
            
            {/* 离线指示器 */}
            {!isOnline && (
              <div className="luckymart-layout-flex luckymart-layout-center gap-2 luckymart-text-sm text-orange-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>{t('common.offline', '离线模式')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="luckymart-padding-md">
          <div className="grid gap-4">
            {records.map((record) => (
              <LotteryRecordCard
                key={record.id}
                record={record}
                onViewDetails={(record) => {
                  // 这里可以打开详情弹窗或导航到详情页
                  console.log('查看详情:', record);
                }}
              />
            ))}
          </div>

          {/* 加载更多指示器 */}
          <div ref={loadMoreRef} className="mt-6">
            {loadingMore && (
              <div className="luckymart-layout-flex luckymart-layout-center justify-center py-4">
                <svg className="luckymart-size-md luckymart-size-md luckymart-animation-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="ml-2 luckymart-text-sm text-gray-600">
                  {t('common.loadingMore', '加载中...')}
                </span>
              </div>
            )}

            {!hasMore && records.length > 0 && (
              <div className="luckymart-text-center py-4 luckymart-text-sm luckymart-text-secondary">
                {t('common.noMoreData', '没有更多数据了')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 回到顶部按钮 */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full luckymart-shadow-lg luckymart-layout-flex luckymart-layout-center justify-center transition-all duration-200 z-50"
          aria-label={t('common.backToTop', '回到顶部')}
        >
          <svg className="luckymart-size-md luckymart-size-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}

      {/* 下拉刷新指示器 */}
      {refreshing && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="bg-indigo-600 text-white luckymart-text-center py-2 luckymart-text-sm">
            <svg className="w-4 h-4 inline luckymart-animation-spin mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {t('common.refreshing', '刷新中...')}
          </div>
        </div>
      )}
    </div>
  );
}