'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface VirtualizedGridProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  columns: number;
  gap?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  scrollToIndex?: number;
  onScroll?: (scrollTop: number) => void;
}

function VirtualizedGrid<T>({
  items,
  itemHeight,
  containerHeight,
  columns,
  gap = 16,
  renderItem,
  overscan = 3,
  className = '',
  onEndReached,
  onEndReachedThreshold = 0.8,
  scrollToIndex,
  onScroll
}: VirtualizedGridProps<T>) {
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  // 计算网格布局
  const gridLayout = useMemo(() => {
    const rowsPerScreen = Math.ceil(containerHeight / (itemHeight + gap));
    const totalRows = Math.ceil(items.length / columns);
    
    return {
      rowsPerScreen,
      totalRows,
      rowHeight: itemHeight + gap,
      totalHeight: totalRows * itemHeight + (totalRows - 1) * gap
    };
  }, [items.length, columns, itemHeight, gap, containerHeight]);

  // 计算可见区域
  const [visibleRange, setVisibleRange] = useState({
    startRow: 0,
    endRow: 0,
    startIndex: 0,
    endIndex: 0
  });

  // 滚动处理
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    onScroll?.(scrollTop);

    // 计算可见行
    const startRow = Math.max(0, Math.floor(scrollTop / gridLayout.rowHeight) - overscan);
    const endRow = Math.min(gridLayout.totalRows - 1, startRow + gridLayout.rowsPerScreen + overscan * 2);

    // 转换为项目索引
    const startIndex = startRow * columns;
    const endIndex = Math.min(items.length - 1, (endRow + 1) * columns - 1);

    setVisibleRange({
      startRow,
      endRow,
      startIndex,
      endIndex
    });

    // 检测是否滚动到底部
    const { scrollTop: currentScrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const scrollPercentage = (currentScrollTop + clientHeight) / scrollHeight;
    
    if (scrollPercentage >= onEndReachedThreshold && onEndReached) {
      onEndReached();
    }

    // 设置滚动状态
    setIsScrolling(true);
    clearTimeout((scrollElementRef.current as any)?.scrollTimeout);
    (scrollElementRef.current as any).scrollTimeout = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, [
    gridLayout.rowHeight,
    gridLayout.rowsPerScreen,
    gridLayout.totalRows,
    columns,
    items.length,
    overscan,
    onEndReached,
    onEndReachedThreshold,
    onScroll
  ]);

  // 滚动到指定索引
  useEffect(() => {
    if (scrollToIndex !== undefined && scrollElementRef.current) {
      const targetRow = Math.floor(scrollToIndex / columns);
      const targetScrollTop = targetRow * gridLayout.rowHeight;

      scrollElementRef.current.scrollTop = targetScrollTop;
    }
  }, [scrollToIndex, columns, gridLayout.rowHeight]);

  // 计算偏移量
  const offsetY = useMemo(() => {
    return visibleRange.startRow * gridLayout.rowHeight;
  }, [visibleRange.startRow, gridLayout.rowHeight]);

  // 获取可见项目
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);

  // 渲染项目
  const renderVisibleItems = useMemo(() => {
    return visibleItems.map((item, index) => {
      const actualIndex = visibleRange.startIndex + index;
      const row = Math.floor(actualIndex / columns);
      const col = actualIndex % columns;
      
      return {
        item,
        index: actualIndex,
        style: {
          position: 'absolute' as const,
          top: `${row * gridLayout.rowHeight}px`,
          left: `${col * (100 / columns)}%`,
          width: `calc(${100 / columns}% - ${gap}px)`,
          height: `${itemHeight}px`,
          transform: `translateY(${offsetY}px)`,
          willChange: 'transform'
        }
      };
    });
  }, [visibleItems, visibleRange.startIndex, columns, gridLayout.rowHeight, itemHeight, gap, offsetY]);

  // 网格样式
  const gridStyle = useMemo(() => ({
    position: 'relative' as const,
    height: gridLayout.totalHeight,
    width: '100%'
  }), [gridLayout.totalHeight]);

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto virtualized-grid ${className} ${isScrolling ? 'scrolling' : ''}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={gridStyle}>
        <div
          className="virtualized-grid-content"
          style={{
            transform: `translateY(${-offsetY}px)`,
            willChange: 'transform'
          }}
        >
          {renderVisibleItems.map(({ item, index, style }) => (
            <div key={index} style={style}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
      
      {/* 滚动指示器 */}
      {isScrolling && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs z-10">
          {visibleRange.startRow + 1}/{gridLayout.totalRows} 行
        </div>
      )}
      
      {/* 性能监控信息 - 开发环境 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-2 left-2 bg-blue-500 bg-opacity-75 text-white px-2 py-1 rounded text-xs">
          可见: {visibleItems.length}/{items.length} 项
        </div>
      )}
    </div>
  );
}

export default VirtualizedGrid;

/**
 * Hook for creating a virtualized grid
 */
export function useVirtualGrid<T>(
  items: T[],
  options: {
    itemHeight: number;
    containerHeight: number;
    columns: number;
    gap?: number;
    overscan?: number;
  }
) {
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleRange, setVisibleRange] = useState({
    startRow: 0,
    endRow: 0,
    startIndex: 0,
    endIndex: 0
  });

  const { itemHeight, containerHeight, columns, gap = 16, overscan = 3 } = options;

  // 计算网格布局
  const gridLayout = useMemo(() => {
    const rowsPerScreen = Math.ceil(containerHeight / (itemHeight + gap));
    const totalRows = Math.ceil(items.length / columns);
    const rowHeight = itemHeight + gap;
    const totalHeight = totalRows * itemHeight + (totalRows - 1) * gap;
    
    return {
      rowsPerScreen,
      totalRows,
      rowHeight,
      totalHeight,
      itemWidth: `calc(${100 / columns}% - ${gap}px)`
    };
  }, [items.length, columns, itemHeight, gap, containerHeight]);

  // 更新可见区域
  useEffect(() => {
    const startRow = Math.max(0, Math.floor(scrollTop / gridLayout.rowHeight) - overscan);
    const endRow = Math.min(gridLayout.totalRows - 1, startRow + gridLayout.rowsPerScreen + overscan * 2);

    const startIndex = startRow * columns;
    const endIndex = Math.min(items.length - 1, (endRow + 1) * columns - 1);

    setVisibleRange({
      startRow,
      endRow,
      startIndex,
      endIndex
    });
  }, [scrollTop, gridLayout.rowHeight, gridLayout.rowsPerScreen, gridLayout.totalRows, columns, items.length, overscan]);

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const row = Math.floor(index / columns);
    const scrollTop = row * gridLayout.rowHeight;
    
    window.scrollTo({
      top: scrollTop,
      behavior
    });
  }, [columns, gridLayout.rowHeight]);

  const scrollToRow = useCallback((row: number, behavior: ScrollBehavior = 'smooth') => {
    const scrollTop = row * gridLayout.rowHeight;
    
    window.scrollTo({
      top: scrollTop,
      behavior
    });
  }, [gridLayout.rowHeight]);

  const scrollToTop = useCallback((behavior: ScrollBehavior = 'smooth') => {
    window.scrollTo({ top: 0, behavior });
  }, []);

  const getItemPosition = useCallback((index: number) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    
    return {
      row,
      col,
      top: row * gridLayout.rowHeight,
      left: col * (100 / columns)
    };
  }, [columns, gridLayout.rowHeight]);

  return {
    visibleRange,
    gridLayout,
    scrollTop,
    setScrollTop,
    scrollToIndex,
    scrollToRow,
    scrollToTop,
    getItemPosition,
    visibleItems: items.slice(visibleRange.startIndex, visibleRange.endIndex + 1),
    totalItems: items.length,
    totalRows: gridLayout.totalRows
  };
}