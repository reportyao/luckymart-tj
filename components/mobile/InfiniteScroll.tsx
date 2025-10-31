'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InfiniteScrollProps<T = any> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  loadMore: (page: number) => Promise<T[]> | T[];
  hasMore: boolean;
  threshold?: number;
  pageSize?: number;
  className?: string;
  loadingComponent?: React.ReactNode;
  endComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  onLoadMore?: () => void;
  onError?: (error: Error) => void;
  onEmpty?: () => void;
  refreshTrigger?: any; // 用于触发刷新
  preloadDistance?: number; // 预加载距离
  debounceMs?: number; // 防抖时间
}

type LoadState = 'idle' | 'loading' | 'success' | 'error' | 'end' | 'empty';

const InfiniteScroll = <T extends any>({
  data,
  renderItem,
  loadMore,
  hasMore,
  threshold = 300,
  pageSize = 20,
  className = '',
  loadingComponent,
  endComponent,
  errorComponent,
  emptyComponent,
  onLoadMore,
  onError,
  onEmpty,
  refreshTrigger,
  preloadDistance = 500,
  debounceMs = 300,
}: InfiniteScrollProps<T>) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // 默认组件
  const defaultLoadingComponent = (
    <div className="luckymart-layout-flex luckymart-layout-center justify-center py-8">
      <div className="luckymart-layout-flex luckymart-layout-center gap-2">
        <motion.div
          className="luckymart-size-md luckymart-size-md border-2 border-blue-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <span className="text-gray-600">加载中...</span>
      </div>
    </div>
  );

  const defaultEndComponent = (
    <div className="luckymart-layout-flex luckymart-layout-center justify-center py-8 luckymart-text-secondary">
      <div className="luckymart-text-center">
        <svg className="luckymart-size-lg luckymart-size-lg mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>没有更多数据了</p>
      </div>
    </div>
  );

  const defaultErrorComponent = (
    <div className="luckymart-layout-flex luckymart-layout-center justify-center py-8 luckymart-text-error">
      <div className="luckymart-text-center">
        <svg className="luckymart-size-lg luckymart-size-lg mx-auto mb-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p>加载失败</p>
        <button
          onClick={() => handleRetry()}
          className="mt-2 px-4 py-2 luckymart-bg-error text-white luckymart-rounded-lg hover:bg-red-600 transition"
        >
          重试
        </button>
      </div>
    </div>
  );

  const defaultEmptyComponent = (
    <div className="luckymart-layout-flex luckymart-layout-center justify-center py-16 luckymart-text-secondary">
      <div className="luckymart-text-center">
        <svg className="w-16 h-16 mx-auto luckymart-spacing-md text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="luckymart-text-lg luckymart-font-medium">暂无数据</p>
        <p className="luckymart-text-sm text-gray-400">下拉刷新试试看</p>
      </div>
    </div>
  );

  // 加载数据
  const loadData = useCallback(async (page: number, isRetry = false) => {
    if (isLoading || (!hasMore && page > 1)) return;

    setIsLoading(true);
    setLoadState('loading');
    setError(null);

    try {
      const newData = await loadMore(page);
      
      if (page === 1 && newData.length === 0) {
        setLoadState('empty');
        onEmpty?.();
      } else if (newData.length < pageSize || !hasMore) {
        setLoadState('end');
      } else {
        setLoadState('success');
        setCurrentPage(page);
      }
      
      onLoadMore?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('加载失败');
      setError(error);
      setLoadState('error');
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, pageSize, loadMore, onLoadMore, onError, onEmpty]);

  // 监听滚动
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    
    if (entry.isIntersecting && !isLoading && hasMore) {
      // 防抖处理
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      
      debounceTimer.current = setTimeout(() => {
        loadData(currentPage + 1);
      }, debounceMs);
    }
  }, [isLoading, hasMore, currentPage, loadData, debounceMs]);

  // 清理防抖定时器和观察器
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  // 设置观察器
  useEffect(() => {
    if (loadingRef.current) {
      observerRef.current = new IntersectionObserver(handleIntersection, {
        root: containerRef.current,
        rootMargin: `${preloadDistance}px`,
        threshold: 0.1,
      });

      observerRef.current.observe(loadingRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, preloadDistance]);

  // 监听刷新触发器
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      setCurrentPage(1);
      loadData(1);
    }
  }, [refreshTrigger, loadData]);

  // 初始化加载
  useEffect(() => {
    if (data.length === 0 && loadState === 'idle') {
      loadData(1);
    }
  }, [data.length, loadState, loadData]);

  // 重试加载
  const handleRetry = useCallback(() => {
    if (loadState === 'error') {
      loadData(currentPage, true);
    }
  }, [loadState, currentPage, loadData]);

  // 预加载更多数据
  const handlePrefetch = useCallback(() => {
    if (hasMore && !isLoading) {
      const nextPage = currentPage + 1;
      // 预加载但不更新状态
      loadMore(nextPage).catch(() => {
        // 静默失败，不影响用户体验
      });
    }
  }, [hasMore, isLoading, currentPage, loadMore]);

  // 滚动事件处理
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    // 预加载触发点
    if (scrollPercentage > 0.8 && hasMore && !isLoading) {
      handlePrefetch();
    }
  }, [handlePrefetch, hasMore, isLoading]);

  // 渲染项目
  const renderItems = useMemo(() => {
    return data.map((item, index) => (
      <motion.div
        key={`${item.id || index}-${index}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ 
          duration: 0.3,
          delay: index * 0.05, // 错开动画
        }}
      >
        {renderItem(item, index)}
      </motion.div>
    ));
  }, [data, renderItem]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      onScroll={handleScroll}
      style={{ 
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch', // iOS 优化
      }}
    >
      {/* 内容区域 */}
      <AnimatePresence mode="popLayout">
        {data.length > 0 ? (
          <div className="space-y-0">
            {renderItems}
          </div>
        ) : (
          <AnimatePresence>
            {(loadState === 'empty') && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                {emptyComponent || defaultEmptyComponent}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </AnimatePresence>

      {/* 加载更多触发点 */}
      <div ref={loadingRef} className="h-1" />

      {/* 状态指示器 */}
      <AnimatePresence>
        {isLoading && loadState === 'loading' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="sticky bottom-0 luckymart-bg-white border-t luckymart-border-light"
          >
            {loadingComponent || defaultLoadingComponent}
          </motion.div>
        )}

        {loadState === 'end' && hasMore === false && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="sticky bottom-0 luckymart-bg-white border-t border-gray-100"
          >
            {endComponent || defaultEndComponent}
          </motion.div>
        )}

        {loadState === 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="sticky bottom-0 luckymart-bg-white border-t border-red-200"
          >
            {errorComponent || defaultErrorComponent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InfiniteScroll;

// 无限滚动钩子
export const useInfiniteScroll = <T = any>(
  fetchFn: (page: number) => Promise<{ data: T[]; hasMore: boolean }>,
  options?: {
    pageSize?: number;
    threshold?: number;
    enabled?: boolean;
  }
) => {
  const [data, setData] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const pageSize = options?.pageSize || 20;
  const enabled = options?.enabled !== false;

  const fetchData = useCallback(async (page: number, reset = false) => {
    if (!enabled || loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn(page);
      
      if (reset) {
        setData(result.data);
        setCurrentPage(page);
      } else {
        setData(prev => [...prev, ...result.data]);
      }
      
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('获取数据失败'));
    } finally {
      setLoading(false);
    }
  }, [fetchFn, enabled, loading]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchData(currentPage + 1);
    }
  }, [hasMore, loading, currentPage, fetchData]);

  const refresh = useCallback(() => {
    setCurrentPage(1);
    fetchData(1, true);
  }, [fetchData]);

  const reset = useCallback(() => {
    setData([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
  }, []);

  // 初始化加载
  useEffect(() => {
    if (enabled) {
      fetchData(1, true);
    }
  }, [fetchData, enabled]);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    reset,
    currentPage,
  };
};

// 智能预加载钩子
export const useSmartPrefetch = (
  fetchFn: (page: number) => Promise<any>,
  dependencies: any[] = []
) => {
  const prefetchCache = useRef<Map<number, Promise<any>>>(new Map());

  const prefetch = useCallback((page: number) => {
    if (!prefetchCache.current.has(page)) {
      const promise = fetchFn(page)
        .then(result => {
          prefetchCache.current.delete(page);
          return result;
        })
        .catch(() => {
          prefetchCache.current.delete(page);
        });
      
      prefetchCache.current.set(page, promise);
    }
    
    return prefetchCache.current.get(page);
  }, [fetchFn, ...dependencies]);

  const clearCache = useCallback(() => {
    prefetchCache.current.clear();
  }, []);

  return { prefetch, clearCache };
};