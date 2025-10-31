'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useListIntersectionObserver } from '@/hooks/use-intersection-observer';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number | ((index: number) => number);
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  scrollToIndex?: number;
  onScroll?: (scrollTop: number) => void;
}

function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
  onEndReached,
  onEndReachedThreshold = 0.8,
  scrollToIndex,
  onScroll
}: VirtualizedListProps<T>) {
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  // 计算可见区域
  const {
    visibleRange,
    handleScroll,
    setScrollTop,
    totalHeight,
    offsetY
  } = useListIntersectionObserver(
    items.length,
    typeof itemHeight === 'function' ? 100 : itemHeight, // 使用默认高度进行计算
    containerHeight,
    overscan
  );

  // 获取实际项目高度
  const getItemHeight = useCallback((index: number): number => {
    return typeof itemHeight === 'function' ? itemHeight(index) : itemHeight;
  }, [itemHeight]);

  // 计算精确的总高度
  const totalListHeight = useMemo(() => {
    if (typeof itemHeight === 'function') {
      let height = 0;
      for (let i = 0; i < items.length; i++) {
        height += getItemHeight(i);
      }
      return height;
    }
    return items.length * itemHeight;
  }, [items.length, itemHeight, getItemHeight]);

  // 计算精确的偏移量
  const preciseOffsetY = useMemo(() => {
    if (typeof itemHeight === 'function') {
      let offset = 0;
      for (let i = 0; i < visibleRange.start; i++) {
        offset += getItemHeight(i);
      }
      return offset;
    }
    return visibleRange.start * itemHeight;
  }, [visibleRange.start, itemHeight, getItemHeight]);

  // 滚动处理
  const handleScrollEvent = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    handleScroll(e);
    onScroll?.(scrollTop);

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
  }, [handleScroll, onEndReached, onEndReachedThreshold, onScroll]);

  // 滚动到指定索引
  useEffect(() => {
    if (scrollToIndex !== undefined && scrollElementRef.current) {
      const targetScrollTop = typeof itemHeight === 'function' 
        ? items.slice(0, scrollToIndex).reduce((sum, _, i) => sum + getItemHeight(i), 0)
        : scrollToIndex * itemHeight;

      scrollElementRef.current.scrollTop = targetScrollTop;
    }
  }, [scrollToIndex, itemHeight, getItemHeight, items]);

  // 获取可见项目
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1);
  }, [items, visibleRange]);

  // 渲染项目
  const renderVisibleItems = useMemo(() => {
    return visibleItems.map((item, index) => {
      const actualIndex = visibleRange.start + index;
      const height = getItemHeight(actualIndex);
      
      return (
        <div
          key={actualIndex}
          style={{
            height: `${height}px`,
            minHeight: `${height}px`,
          }}
          className="virtual-list-item"
        >
          {renderItem(item, actualIndex)}
        </div>
      );
    });
  }, [visibleItems, visibleRange.start, getItemHeight, renderItem]);

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className} ${isScrolling ? 'scrolling' : ''}`}
      style={{ height: containerHeight }}
      onScroll={handleScrollEvent}
    >
      <div
        className="virtual-list-content"
        style={{ 
          height: totalListHeight, 
          position: 'relative',
          transform: `translateY(${preciseOffsetY}px)`,
          willChange: 'transform'
        }}
      >
        <div className="virtual-list-items">
          {renderVisibleItems}
        </div>
      </div>
      
      {/* 滚动指示器 */}
      {isScrolling && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          滚动中...
        </div>
      )}
    </div>
  );
}

export default VirtualizedList;

/**
 * Hook for creating a virtualized list with dynamic item heights
 */
export function useVirtualList<T>(
  items: T[],
  options: {
    itemHeight: number | ((index: number) => number);
    containerHeight: number;
    overscan?: number;
  }
) {
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });

  const { itemHeight, containerHeight, overscan = 5 } = options;

  // 计算可见区域
  useEffect(() => {
    const getItemHeight = (index: number): number => 
      typeof itemHeight === 'function' ? itemHeight(index) : itemHeight;

    const startIndex = Math.max(0, Math.floor(scrollTop / getItemHeight(0)) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / getItemHeight(0)) + overscan
    );

    setVisibleRange({ start: startIndex, end: endIndex });
  }, [scrollTop, items.length, itemHeight, containerHeight, overscan]);

  const totalHeight = useMemo(() => {
    if (typeof itemHeight === 'function') {
      return items.reduce((total, _, index) => total + itemHeight(index), 0);
    }
    return items.length * itemHeight;
  }, [items, itemHeight]);

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const getItemHeight = (idx: number): number => 
      typeof itemHeight === 'function' ? itemHeight(idx) : itemHeight;

    const scrollTop = items.slice(0, index).reduce((sum, _, i) => sum + getItemHeight(i), 0);
    
    window.scrollTo({
      top: scrollTop,
      behavior
    });
  }, [items, itemHeight]);

  const scrollToTop = useCallback((behavior: ScrollBehavior = 'smooth') => {
    window.scrollTo({ top: 0, behavior });
  }, []);

  return {
    visibleRange,
    totalHeight,
    scrollTop,
    setScrollTop,
    scrollToIndex,
    scrollToTop,
    visibleItems: items.slice(visibleRange.start, visibleRange.end + 1)
  };
}