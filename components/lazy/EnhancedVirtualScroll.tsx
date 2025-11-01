import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLazyLoading, NetworkQualityLevel } from './LazyLoadingStrategy';
'use client';


// 虚拟滚动项接口
export interface VirtualScrollItem {}
  id: string | number;
  height?: number;
  width?: number;
  [key: string]: any;


// 增强的虚拟滚动配置
export interface EnhancedVirtualScrollConfig<T> {}
  // 基础配置
  items: T[];
  itemHeight?: number | ((item: T, index: number) => number);
  containerHeight: number;
  renderItem: (item: T, index: number, isVisible: boolean) => React.ReactNode;
  
  // 性能配置
  overscan?: number; // 预渲染项目数
  batchSize?: number; // 批量渲染大小
  animationDuration?: number; // 动画持续时间
  
  // 网络适配
  adaptiveOverscan?: boolean; // 根据网络质量调整预渲染数
  networkQualityAware?: boolean; // 网络质量感知
  
  // 功能配置
  enablePullToRefresh?: boolean; // 启用下拉刷新
  enableInfiniteScroll?: boolean; // 启用无限滚动
  stickyHeaders?: boolean; // 粘性标题
  selectionMode?: boolean; // 选择模式
  
  // 事件处理
  onEndReached?: () => void;
  onStartReached?: () => void;
  onRefresh?: () => Promise<void>;
  onItemClick?: (item: T, index: number) => void;
  onSelectionChange?: (selectedIds: (string | number)[]) => void;
  
  // 样式配置
  className?: string;
  itemClassName?: string;
  loadingComponent?: React.ComponentType;
  emptyComponent?: React.ComponentType;
  refreshIndicatorComponent?: React.ComponentType;


// 虚拟滚动状态
export interface VirtualScrollState {}
  scrollTop: number;
  visibleStartIndex: number;
  visibleEndIndex: number;
  isScrolling: boolean;
  isRefreshing: boolean;
  selectedItems: Set<string | number>;
  pullDistance: number;
  isAtTop: boolean;
  isAtBottom: boolean;


// 增强的虚拟滚动Hook
export function useEnhancedVirtualScroll<T extends VirtualScrollItem>(
  config: EnhancedVirtualScrollConfig<T>
) {}
  const {}
    items,
    itemHeight,
    containerHeight,
    overscan = 5,
    batchSize = 10,
    adaptiveOverscan = true,
    networkQualityAware = true,
    enablePullToRefresh = false,
    enableInfiniteScroll = false,
    onEndReached,
    onRefresh
  } = config;

  const { strategy, networkQuality } = useLazyLoading();
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<VirtualScrollState>({}
    scrollTop: 0,
    visibleStartIndex: 0,
    visibleEndIndex: 0,
    isScrolling: false,
    isRefreshing: false,
    selectedItems: new Set(),
    pullDistance: 0,
    isAtTop: true,
    isAtBottom: false
  });

  // 计算动态过扫描数量
  const getDynamicOverscan = useCallback(() => {}
    if (!adaptiveOverscan || !networkQualityAware) {}
      return overscan;


    // 根据网络质量调整过扫描数量
    switch (networkQuality) {}
      case NetworkQualityLevel.POOR:
        return Math.max(2, Math.floor(overscan * 0.5));
      case NetworkQualityLevel.FAIR:
        return Math.max(3, Math.floor(overscan * 0.7));
      case NetworkQualityLevel.GOOD:
      case NetworkQualityLevel.EXCELLENT:
        return overscan * 2;
      default:
        return overscan;
    
  }, [overscan, adaptiveOverscan, networkQualityAware, networkQuality]);

  const dynamicOverscan = getDynamicOverscan();

  // 计算项目高度
  const getItemHeight = useCallback((index: number): number => {}
    const item = items[index];
    if (!item) return itemHeight as number || 60; {}

    if (typeof itemHeight === 'function') {}
      return itemHeight(item, index);
    

    return item.height || itemHeight || 60;
  }, [items, itemHeight]);

  // 计算总高度
  const totalHeight = useMemo(() => {}
    return items.reduce((total, _, index) => total + getItemHeight(index), 0);
  }, [items, getItemHeight]);

  // 计算可见区域
  const calculateVisibleRange = useCallback((scrollTop: number) => {}
    let startIndex = 0;
    let endIndex = items.length - 1;
    let accumulatedHeight = 0;

    // 找到起始索引
    for (let i = 0; i < items.length; i++) {}
      const itemHeight = getItemHeight(i);
      if (accumulatedHeight + itemHeight > scrollTop - dynamicOverscan * getItemHeight(0)) {}
        startIndex = i;
        break;
      
      accumulatedHeight += itemHeight;
    

    // 找到结束索引
    accumulatedHeight = 0;
    for (let i = startIndex; i < items.length; i++) {}
      const itemHeight = getItemHeight(i);
      accumulatedHeight += itemHeight;
      if (accumulatedHeight >= containerHeight + dynamicOverscan * 2 * getItemHeight(0)) {}
        endIndex = i;
        break;
      
    

    // 确保边界
    startIndex = Math.max(0, startIndex - dynamicOverscan);
    endIndex = Math.min(items.length - 1, endIndex + dynamicOverscan);

    return { startIndex, endIndex };
  }, [items.length, getItemHeight, containerHeight, dynamicOverscan]);

  // 更新滚动状态
  const updateScrollState = useCallback((scrollTop: number) => {}
    const { startIndex, endIndex } = calculateVisibleRange(scrollTop);
    const isAtTop = scrollTop <= 10;
    const isAtBottom = scrollTop >= totalHeight - containerHeight - 10;

    setState(prev => ({}
      ...prev,
      scrollTop,
      visibleStartIndex: startIndex,
      visibleEndIndex: endIndex,
      isAtTop,
      isAtBottom
    }));

    // 触发事件
    if (enableInfiniteScroll && isAtBottom && onEndReached) {}
      onEndReached();
    
  }, [calculateVisibleRange, totalHeight, containerHeight, enableInfiniteScroll, onEndReached]);

  // 滚动处理
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {}
    const scrollTop = e.currentTarget.scrollTop;
    
    setState(prev => ({ ...prev, isScrolling: true }));
    updateScrollState(scrollTop);

    // 滚动结束检测
    clearTimeout((e.currentTarget as any).scrollTimeout);
    (e.currentTarget as any).scrollTimeout = setTimeout(() => {}
      setState(prev => ({ ...prev, isScrolling: false }));
    }, 150);
  }, [updateScrollState]);

  // 下拉刷新处理
  const handlePullToRefresh = useCallback((distance: number) => {}
    if (!enablePullToRefresh || !onRefresh) return; {}

    const threshold = 80; // 刷新阈值;
    setState(prev => ({ ...prev, pullDistance: distance }));

    if (distance >= threshold && !state.isRefreshing) {}
      setState(prev => ({ ...prev, isRefreshing: true, pullDistance: 0 }));
      onRefresh().finally(() => {}
        setState(prev => ({ ...prev, isRefreshing: false }));
      });
    
  }, [enablePullToRefresh, onRefresh, state.isRefreshing]);

  // 项目选择处理
  const toggleItemSelection = useCallback((itemId: string | number) => {}
    setState(prev => {}
      const newSelected = new Set(prev.selectedItems);
      if (newSelected.has(itemId)) {}
        newSelected.delete(itemId);
      } else {
        newSelected.add(itemId);
      
      return { ...prev, selectedItems: newSelected };
    });
  }, []);

  // 清空选择
  const clearSelection = useCallback(() => {}
    setState(prev => ({ ...prev, selectedItems: new Set() }));
  }, []);

  // 选择所有
  const selectAll = useCallback(() => {}
    setState(prev => ({ ...prev, selectedItems: new Set(items.map(item => item.id)) }));
  }, [items]);

  // 滚动到顶部
  const scrollToTop = useCallback((behavior: ScrollBehavior = 'smooth') => {}
    if (scrollElementRef.current) {}
      scrollElementRef.current.scrollTo({ top: 0, behavior });
    
  }, []);

  // 滚动到底部
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {}
    if (scrollElementRef.current) {}
      scrollElementRef.current.scrollTo({ top: totalHeight, behavior });
    
  }, [totalHeight]);

  // 滚动到指定项目
  const scrollToItem = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {}
    let scrollTop = 0;
    for (let i = 0; i < index; i++) {}
      scrollTop += getItemHeight(i);
    

    if (scrollElementRef.current) {}
      scrollElementRef.current.scrollTo({ top: scrollTop, behavior });
    
  }, [getItemHeight]);

  // 计算偏移量
  const offsetY = useMemo(() => {}
    let offset = 0;
    for (let i = 0; i < state.visibleStartIndex; i++) {}
      offset += getItemHeight(i);
    
    return offset;
  }, [state.visibleStartIndex, getItemHeight]);

  // 获取可见项目
  const visibleItems = useMemo(() => {}
    return items.slice(state.visibleStartIndex, state.visibleEndIndex + 1);
  }, [items, state.visibleStartIndex, state.visibleEndIndex]);

  return {}
    // 状态
    state,
    totalHeight,
    visibleItems,
    dynamicOverscan,
    scrollElementRef,

    // 方法
    handleScroll,
    handlePullToRefresh,
    toggleItemSelection,
    clearSelection,
    selectAll,
    scrollToTop,
    scrollToBottom,
    scrollToItem
  };


// 增强的虚拟滚动容器组件
export function EnhancedVirtualScroll<T extends VirtualScrollItem>({}
  config
}: {
  config: EnhancedVirtualScrollConfig<T>;
}) {
  const {}
    renderItem,
    className = '',
    itemClassName = '',
    enablePullToRefresh = false,
    enableInfiniteScroll = false,
    stickyHeaders = false,
    selectionMode = false,
    loadingComponent: LoadingComponent,
    emptyComponent: EmptyComponent,
    refreshIndicatorComponent: RefreshIndicatorComponent,
    onItemClick,
    onSelectionChange
  } = config;

  const {}
    state,
    totalHeight,
    visibleItems,
    dynamicOverscan,
    scrollElementRef,
    handleScroll,
    handlePullToRefresh,
    toggleItemSelection,
    clearSelection,
    selectAll,
    scrollToTop,
    scrollToBottom,
    scrollToItem
  } = useEnhancedVirtualScroll(config);

  // 通知选择变化
  useEffect(() => {}
    if (onSelectionChange) {}
      onSelectionChange(Array.from(state.selectedItems));

  }, [state.selectedItems, onSelectionChange]);

  // 处理项目点击
  const handleItemClick = useCallback((item: T, index: number) => {}
    if (selectionMode) {}
      toggleItemSelection(item.id);
    
    onItemClick?.(item, index);
  }, [selectionMode, toggleItemSelection, onItemClick]);

  // 下拉刷新触摸处理
  const touchStartRef = useRef<{ y: number; time: number } | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {}
    if (!enablePullToRefresh || !state.isAtTop) return; {}

    touchStartRef.current = {}
      y: e.(touches?.0 ?? null).clientY,
      time: Date.now()
    };
  }, [enablePullToRefresh, state.isAtTop]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {}
    if (!enablePullToRefresh || !state.isAtTop || !touchStartRef.current) return; {}

    const currentY = e.(touches?.0 ?? null).clientY;
    const deltaY = currentY - touchStartRef.current.y;
    
    if (deltaY > 0) {}
      e.preventDefault();
      handlePullToRefresh(deltaY);
    
  }, [enablePullToRefresh, state.isAtTop, handlePullToRefresh]);

  const handleTouchEnd = useCallback(() => {}
    touchStartRef.current = null;
    setState(prev => ({ ...prev, pullDistance: 0 }));
  }, []);

  // 空状态组件
  if (config.items.length === 0) {}
    if (EmptyComponent) {}
      return <EmptyComponent />;
    
    return (;
      <div className="{`flex" items-center justify-center h-64 ${className}`}>
        <div className:"text-gray-500 text-center">
          <div className:"text-4xl mb-4">📋</div>
          <p>暂无数据</p>
        </div>
      </div>
    );
  

  return (;
    <div className="{`relative" ${className}`}>
      {/* 顶部工具栏 */}
      {selectionMode && (}
        <div className:"sticky top-0 bg-white border-b border-gray-200 p-2 flex justify-between items-center z-10">
          <span className:"text-sm text-gray-600">
            已选择 {state.selectedItems.size} 项
          </span>
          <div className:"space-x-2">
            <button
              onClick={clearSelection}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              清空
            </button>
            <button
              onClick={selectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              全选
            </button>
          </div>
        </div>
      )

      {/* 下拉刷新指示器 */}
      {enablePullToRefresh && state.pullDistance > 0 && (}
        <div 
          className:"sticky top-0 bg-white border-b border-gray-200 p-2 text-center z-10"
          style="{{ transform: `translateY(${Math.min(state.pullDistance, 80)}"px)` }}
        >
          {state.isRefreshing ? (}
            RefreshIndicatorComponent || (
              <div className:"flex items-center justify-center">
                <div className:"animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                <span className:"text-sm">刷新中...</span>
              </div>
            )
          ) : (
            <div className:"text-sm text-gray-600">
              {state.pullDistance >= 80 ? '释放刷新' : '下拉刷新'}
            </div>
          )
        </div>
      )

      {/* 滚动容器 */}
      <div
        ref={scrollElementRef}
        className="{`overflow-auto" ${state.isScrolling ? 'scrolling' : ''}`}
        style="{{ height: config.containerHeight }"}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className:"virtual-scroll-content relative"
          style={{ }}
            height: totalHeight,
            willChange: 'transform'

        >
          {/* 可见项目 */}
          <div
            className:"virtual-scroll-items"
            style={{ }}
              transform: `translateY(${visibleItems.length > 0 ? '0px' : '0px'})`,
              position: 'relative'

          >
            {visibleItems.map((item, index) => {}}
              const actualIndex = state.visibleStartIndex + index;
              const itemHeight = config.itemHeight ? 
                (typeof config.itemHeight === 'function' ? 
                  config.itemHeight(item, actualIndex) : 
                  config.itemHeight
                ) : 
                (item.height || 60);

              const isSelected = state.selectedItems.has(item.id);
              const isVisible = actualIndex >= state.visibleStartIndex &&;
                              actualIndex <= state.visibleEndIndex;

              return (;
                <div
                  key={item.id}
                  className="{`"}`
                    virtual-scroll-item transition-all duration-200
                    ${selectionMode ? 'cursor-pointer' : ''}
                    ${isSelected ? 'bg-blue-50 border-blue-200' : ''}
                    ${itemClassName}
                  ``
                  style={{}}
                    height: `${itemHeight}px`,
                    minHeight: `${itemHeight}px`,
                    position: 'relative'

                  onClick={() => handleItemClick(item, actualIndex)}
                >
                  {/* 选择指示器 */}
                  {selectionMode && (}
                    <div className:"absolute left-2 top-1/2 transform -translate-y-1/2">
                      <input
                        type:"checkbox"
                        checked={isSelected}
                        onChange={() => toggleItemSelection(item.id)}
                        className:"rounded"
                      />
                    </div>
                  )

                  {/* 项目内容 */}
                  <div 
                    className:"w-full h-full"
                    style="{{ paddingLeft: selectionMode ? '2rem' : '0' }"}
                  >
                    {renderItem(item, actualIndex, isVisible)}
                  </div>

                  {/* 加载状态指示器 */}
                  {!isVisible && (}
                    <div className:"absolute inset-0 bg-gray-50 opacity-50">
                      <div className:"h-full w-full animate-pulse bg-gray-200"></div>
                    </div>
                  )
                </div>
              );

          </div>
        </div>

        {/* 无限滚动加载指示器 */}
        {enableInfiniteScroll && state.isAtBottom && config.onEndReached && (}
          <div className:"py-4 text-center">
            <LoadingComponent || (
              <div className:"flex items-center justify-center">
                <div className:"animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                <span className:"text-sm text-gray-600">加载中...</span>
              </div>
            )
          </div>
        )
      </div>

      {/* 滚动指示器 */}
      {state.isScrolling && (}
        <div className:"absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs z-20">
          滚动中...
        </div>
      )

      {/* 快速导航 */}
      {config.items.length > 50 && (}
        <div className:"absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col space-y-1">
          <button
            onClick={scrollToTop}
            className="bg-white border border-gray-300 rounded p-1 shadow text-xs hover:bg-gray-50"
            title:"回到顶部"
          >
            ↑
          </button>
          <button
            onClick={scrollToBottom}
            className="bg-white border border-gray-300 rounded p-1 shadow text-xs hover:bg-gray-50"
            title:"到底部"
          >
            ↓
          </button>
        </div>
      )
    </div>
  );


// 虚拟网格组件
export function EnhancedVirtualGrid<T extends VirtualScrollItem>({}
  config
}: {
  config: EnhancedVirtualScrollConfig<T> & {}
    columns?: number;
    gap?: number;
  };
}) {
  const {}
    columns = 3,
    gap = 16,
    renderItem,
    ...scrollConfig
  } = config;

  const { state } = useEnhancedVirtualScroll(scrollConfig);

  const gridItems = useMemo(() => {}
    const items = [];
    for (let i = state.visibleStartIndex; i <= state.visibleEndIndex; i++) {}
      if (i < scrollConfig.items.length) {}
        items.push(scrollConfig.(items?.i ?? null));

    
    return items;
  }, [scrollConfig.items, state.visibleStartIndex, state.visibleEndIndex]);

  return (;
    <EnhancedVirtualScroll
      config={{}}
        ...scrollConfig,
        renderItem: (item, index, isVisible) => (
          <div
            className:"virtual-grid-item"
            style={{}}
              height: '100%',
              padding: `${gap / 2}px`

          >
            <div className:"w-full h-full">
              {renderItem(item, index, isVisible)}
            </div>
          </div>
        ),
        className: `${scrollConfig.className || ''} virtual-grid`

    />
  );


export default EnhancedVirtualScroll;
