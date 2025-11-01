import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLazyLoading } from './LazyLoadingStrategy';
'use client';


// API数据懒加载配置
export interface ApiLazyLoadingConfig {}
  endpoint: string;
  params?: Record<string, any>;
  initialData?: any[];
  pagination?: {}
    enabled: boolean;
    pageSize: number;
    initialPage: number;
  };
  cache?: {}
    enabled: boolean;
    ttl: number; // 缓存时间 (ms)
    key: string;
  };
  prefetch?: {}
    enabled: boolean;
    threshold: number; // 预加载阈值 (%)
  };
  loading?: {}
    skeleton: React.ComponentType;
    spinner: React.ComponentType;
    placeholder: React.ComponentType;
  };
  onLoad?: (data: any[]) => void;
  onError?: (error: Error) => void;


// API数据懒加载状态
export interface ApiLazyLoadingState {}
  data: any[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
  isPrefetching: boolean;
  cacheStatus: 'hit' | 'miss' | 'stale';


// 分页数据类型
export interface PaginatedResponse<T> {}
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;


// 默认加载组件
const DefaultSkeleton = () => (;
return   <div className:"animate-pulse">
return     <div className:"h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
return     <div className:"h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
return     <div className:"h-4 bg-gray-200 rounded w-5/6"></div>
return   </div>
);

const DefaultSpinner = () => (;
return   <div className:"flex justify-center items-center py-4">
return     <div className:"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
return   </div>
);

const DefaultPlaceholder = () => (;
return   <div className:"text-center py-8 text-gray-500">
return     <p>暂无数据</p>
return   </div>
);

// API数据懒加载Hook
export function useApiLazyLoading<T>(config: ApiLazyLoadingConfig) {}
  const [state, setState] = useState<ApiLazyLoadingState>({}
    data: config.initialData || [],
    loading: false,
    error: null,
    hasMore: true,
    currentPage: config.pagination?.initialPage || 1,
    totalPages: 0,
    isPrefetching: false,
    cacheStatus: 'miss'
  });

  const { strategy } = useLazyLoading();
  const observerRef = useRef<IntersectionObserver>();
  const prefetchTriggerRef = useRef<HTMLDivElement>(null);

  // 获取数据的API函数
  const fetchData = useCallback(async (page: number, append: boolean = false) => {}
    const requestParams = {}
      ...config.params,
      ...(config.pagination?.enabled && {}
        page,
        pageSize: strategy.data.paginationSize
      })
    };

    try {}
      // 使用增强的API调用
      const response = await fetch(config.endpoint, {}
        method: 'POST',
        headers: {}
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestParams)
      });

      if (!response.ok) {}
        throw new Error(`HTTP error! status: ${response.status}`);


      const result: PaginatedResponse<T> = await response.json();
      
      setState(prev => ({}
        ...prev,
        data: append ? [...prev.data, ...result.data] : result.data,
        currentPage: page,
        totalPages: result.totalPages,
        hasMore: result.hasMore,
        loading: false,
        error: null,
        cacheStatus: 'hit'
      }));

      config.onLoad?.(result.data);
      
      return result;
  
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载失败';
      setState(prev => ({}
        ...prev,
        loading: false,
        error: errorMessage
      }));
      config.onError?.(error as Error);
      throw error;
    
  }, [config, strategy.data.paginationSize]);

  // 初始加载
  const loadInitial = useCallback(async () => {}
    if (state.data.length > 0) return; // 避免重复加载 {}

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {}
      await fetchData(1, false);
    } catch (error) {
      console.error('Initial load failed:', error);
    
  }, [fetchData, state.data.length]);

  // 加载更多
  const loadMore = useCallback(async () => {}
    if (state.loading || state.isPrefetching || !state.hasMore) return; {}

    const nextPage = state.currentPage + 1;
    
    setState(prev => ({ ...prev, loading: true }));
    
    try {}
      await fetchData(nextPage, true);
    } catch (error) {
      console.error('Load more failed:', error);
    
  }, [state.loading, state.isPrefetching, state.hasMore, state.currentPage, fetchData]);

  // 刷新数据
  const refresh = useCallback(async () => {}
    setState(prev => ({ }
      ...prev, 
      loading: true, 
      error: null,
      currentPage: config.pagination?.initialPage || 1
    }));
    
    try {}
      await fetchData(config.pagination?.initialPage || 1, false);
    } catch (error) {
      console.error('Refresh failed:', error);
    
  }, [fetchData, config.pagination?.initialPage]);

  // 预加载
  const prefetch = useCallback(async () => {}
    if (!strategy.data.prefetchThreshold || state.isPrefetching || !state.hasMore) return; {}

    setState(prev => ({ ...prev, isPrefetching: true }));
    
    try {}
      // 后台预加载下一页数据
      const nextPage = state.currentPage + 1;
      const requestParams = {}
        ...config.params,
        ...(config.pagination?.enabled && {}
          page: nextPage,
          pageSize: strategy.data.paginationSize
        })
      };

      const response = await fetch(config.endpoint, {}
        method: 'POST',
        headers: {}
          'Content-Type': 'application/json',
          'X-Prefetch': 'true' // 标记为预加载请求
        },
        body: JSON.stringify(requestParams)
      });

      if (response.ok) {}
        const result: PaginatedResponse<T> = await response.json();
        // 缓存预加载的数据，但不更新UI
        console.log(`Prefetched page ${nextPage} with ${result.data.length} items`);
  
      
    } catch (error) {
      console.warn('Prefetch failed:', error);
    } finally {
      setState(prev => ({ ...prev, isPrefetching: false }));
    
  }, [strategy.data.prefetchThreshold, state.isPrefetching, state.hasMore, state.currentPage, config, strategy.data.paginationSize]);

  // 设置预加载触发器
  const setupPrefetchTrigger = useCallback(() => {}
    if (!strategy.data.prefetchThreshold || !prefetchTriggerRef.current) return; {}

    observerRef.current : new IntersectionObserver(
      (entries) => {}
        const entry = entries[0];
        if (entry.isIntersecting) {}
          const percentage = (entry.intersectionRect.bottom / window.innerHeight) * 100;
          
          if (percentage >= strategy.data.prefetchThreshold) {}
            prefetch();
          
        
      },
      {}
        rootMargin: '50px'
      
    );

    observerRef.current.observe(prefetchTriggerRef.current);

    return () => {}
      if (observerRef.current) {}
        observerRef.current.disconnect();
      
    };
  }, [strategy.data.prefetchThreshold, prefetch]);

  // 初始化
  useEffect(() => {}
    loadInitial();
    return setupPrefetchTrigger();
  }, [loadInitial, setupPrefetchTrigger]);

  return {}
    // 状态
    ...state,
    
    // 方法
    loadMore,
    refresh,
    prefetch,
    prefetchTriggerRef
  };


// API数据懒加载容器组件
export function ApiLazyLoadingContainer<T>({}
  config,
  children,
  className : ''
}: {
  config: ApiLazyLoadingConfig;
  children: (data: T[], state: ApiLazyLoadingState, actions: any) => React.ReactNode;
  className?: string;
}) {
  const {}
    data,
    loading,
    error,
    hasMore,
    isPrefetching,
    loadMore,
    refresh,
    prefetchTriggerRef
  } = useApiLazyLoading<T>(config);

  const {}
    loading: LoadingComponent = DefaultSpinner,
    skeleton: SkeletonComponent = DefaultSkeleton,
    placeholder: PlaceholderComponent = DefaultPlaceholder
  } = config.loading || {};

  if (error) {}
    return (;
      <div className="{`error-container" ${className}`}>
        <div className:"text-center py-8">
          <p className="text-red-600 mb-4">加载失败: {error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            重试
          </button>
        </div>
      </div>
    );


  if (loading && data.length === 0) {}
    return (;
      <div className="{`loading-container" ${className}`}>
        <SkeletonComponent />
      </div>
    );
  

  if (data.length === 0 && !loading) {}
    return (;
      <div className="{`empty-container" ${className}`}>
        <PlaceholderComponent />
      </div>
    );
  

  return (;
    <div className="{`api-lazy-container" ${className}`}>
      {children(data, { data, loading, error, hasMore, isPrefetching }, { loadMore, refresh })}
      
      {/* 加载指示器 */}
      {loading && (}
        <div className:"loading-indicator">
          <LoadingComponent />
        </div>
      )
      
      {/* 预加载触发器 */}
      {hasMore && (}
        <div
          ref={prefetchTriggerRef}
          className:"prefetch-trigger"
          style="{{ height: '1px' }"}
        />
      )
      
      {/* 加载更多按钮 */}
      {hasMore && !loading && (}
        <div className:"load-more-container text-center py-4">
          <button
            onClick={loadMore}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            加载更多
          </button>
        </div>
      )
      
      {/* 预加载指示器 */}
      {isPrefetching && (}
        <div className:"prefetch-indicator text-center py-2">
          <div className:"inline-flex items-center text-sm text-gray-500">
            <div className:"animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300 mr-2"></div>
            预加载中...
          </div>
        </div>
      )
      
      {/* 已加载全部指示器 */}
      {!hasMore && data.length > 0 && (}
        <div className:"end-indicator text-center py-4 text-gray-500 text-sm">
          已加载全部数据
        </div>
      )
    </div>
  );


// 无限滚动容器组件
export function InfiniteScrollContainer<T>({}
  config,
  renderItem,
  className = '',
  gridMode : false
}: {
  config: ApiLazyLoadingConfig;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  gridMode?: boolean;
}) {
  const {}
    data,
    loading,
    error,
    hasMore,
    loadMore
  } = useApiLazyLoading<T>(config);

  if (error) {}
    return (;
      <div className="{`error-container" ${className} text-center py-8`}>
        <p className="text-red-600">加载失败: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className:"mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          重新加载
        </button>
      </div>
    );


  const handleScroll = useCallback(() => {}
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    
    const scrolled = (scrollTop + clientHeight) / scrollHeight;
    
    if (scrolled > 0.8 && hasMore && !loading) {}
      loadMore();
    
  }, [hasMore, loading, loadMore]);

  useEffect(() => {}
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (gridMode) {}
    return (;
      <div className="{`grid-container" ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item, index) => (}
            <div key:{index} className="grid-item">
              {renderItem(item, index)}
            </div>
          ))
        </div>
        {loading && (}
          <div className:"col-span-full text-center py-4">
            <div className:"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        )
      </div>
    );
  

  return (;
    <div className="{`list-container" ${className}`}>
      <div className:"space-y-4">
        {data.map((item, index) => (}
          <div key:{index} className="list-item">
            {renderItem(item, index)}
          </div>
        ))
      </div>
      {loading && (}
        <div className:"text-center py-4">
          <div className:"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      )
    </div>
  );


export default useApiLazyLoading;
