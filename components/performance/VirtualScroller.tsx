import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface VirtualScrollerItem {
  id: string | number;
  key?: string | number;
  height?: number;
  [key: string]: any;
}

export interface VirtualScrollerProps<T extends VirtualScrollerItem> {
  items: T[];
  itemHeight: number | ((item: T) => number);
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  overscan?: number;
  className?: string;
  getItemKey?: (item: T, index: number) => string | number;
  estimateItemHeight?: (item: T) => number;
}

const VirtualScroller = <T extends VirtualScrollerItem>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  onEndReached,
  onEndReachedThreshold = 0.8,
  overscan = 5,
  className,
  getItemKey,
  estimateItemHeight
}: VirtualScrollerProps<T>) => {
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [itemHeights, setItemHeights] = useState<number[]>([]);
  const [containerHeightState, setContainerHeightState] = useState(containerHeight);

  // 获取项目key
  const getKey = useCallback((item: T, index: number) => {
    return getItemKey ? getItemKey(item, index) : (item.key ?? item.id ?? index);
  }, [getItemKey]);

  // 计算动态高度
  const getItemHeight = useCallback((item: T, index: number) => {
    if (typeof itemHeight === 'function') {
      return itemHeight(item);
    }
    return itemHeight;
  }, [itemHeight]);

  // 预估高度
  const estimatedHeight = useCallback((item: T) => {
    if (estimateItemHeight) {
      return estimateItemHeight(item);
    }
    if (typeof itemHeight === 'function') {
      return itemHeight(item);
    }
    return itemHeight;
  }, [itemHeight, estimateItemHeight]);

  // 初始化项目高度
  useEffect(() => {
    const heights = items.map((item, index) => {
      const existingHeight = itemHeights[index];
      if (existingHeight) return existingHeight;
      
      return item.height || estimatedHeight(item);
    });
    setItemHeights(heights);
  }, [items, estimatedHeight]);

  // 计算可见区域
  const { visibleStartIndex, visibleEndIndex, totalHeight, offsetY } = useMemo(() => {
    let accumulatedHeight = 0;
    let startIndex = 0;
    let endIndex = 0;
    let total = 0;

    // 找到可见区域的开始索引
    for (let i = 0; i < itemHeights.length; i++) {
      if (accumulatedHeight + itemHeights[i] > scrollTop) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
      accumulatedHeight += itemHeights[i];
    }

    // 找到可见区域的结束索引
    accumulatedHeight = itemHeights.slice(0, startIndex).reduce((sum, height) => sum + height, 0);
    const targetBottom = scrollTop + containerHeightState;

    for (let i = startIndex; i < itemHeights.length; i++) {
      accumulatedHeight += itemHeights[i];
      if (accumulatedHeight >= targetBottom) {
        endIndex = Math.min(itemHeights.length - 1, i + overscan);
        break;
      }
      if (i === itemHeights.length - 1) {
        endIndex = itemHeights.length - 1;
      }
    }

    // 计算总高度
    total = itemHeights.reduce((sum, height) => sum + height, 0);

    // 计算偏移量
    const offset = itemHeights.slice(0, startIndex).reduce((sum, height) => sum + height, 0);

    return {
      visibleStartIndex: startIndex,
      visibleEndIndex: endIndex,
      totalHeight: total,
      offsetY: offset
    };
  }, [itemHeights, scrollTop, containerHeightState, overscan]);

  // 更新项目高度
  const updateItemHeight = useCallback((index: number, height: number) => {
    setItemHeights(prev => {
      const newHeights = [...prev];
      newHeights[index] = height;
      return newHeights;
    });
  }, []);

  // 滚动处理
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollTop(scrollTop);

    // 检查是否到达底部
    const { scrollHeight, clientHeight } = e.currentTarget;
    const scrolled = scrollTop + clientHeight;
    const remaining = scrollHeight - scrolled;
    const threshold = clientHeight * (1 - onEndReachedThreshold);

    if (remaining <= threshold && onEndReached) {
      onEndReached();
    }
  }, [onEndReached, onEndReachedThreshold]);

  // 容器高度调整
  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect.height !== containerHeightState) {
          setContainerHeightState(entry.contentRect.height);
        }
      }
    });

    if (scrollElementRef.current) {
      resizeObserver.observe(scrollElementRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [containerHeightState]);

  // 滚动到顶部
  const scrollToTop = useCallback(() => {
    if (scrollElementRef.current) {
      scrollElementRef.current.scrollTop = 0;
    }
  }, []);

  // 滚动到索引
  const scrollToIndex = useCallback((index: number, align: 'auto' | 'start' | 'center' | 'end' = 'auto') => {
    if (!scrollElementRef.current || index < 0 || index >= items.length) return;

    const offsetTop = itemHeights.slice(0, index).reduce((sum, height) => sum + height, 0);
    
    let scrollTop = offsetTop;
    
    if (align === 'center') {
      scrollTop = offsetTop - (containerHeightState / 2);
    } else if (align === 'end') {
      scrollTop = offsetTop - containerHeightState + itemHeights[index];
    }

    scrollTop = Math.max(0, Math.min(scrollTop, totalHeight - containerHeightState));
    scrollElementRef.current.scrollTop = scrollTop;
  }, [items.length, itemHeights, containerHeightState, totalHeight]);

  return (
    <div
      ref={scrollElementRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeightState }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative'
        }}
      >
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {items.slice(visibleStartIndex, visibleEndIndex + 1).map((item, index) => {
            const actualIndex = visibleStartIndex + index;
            const itemKey = getKey(item, actualIndex);
            
            return (
              <div
                key={itemKey}
                style={{
                  height: itemHeights[actualIndex]
                }}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VirtualScroller;

// 辅助函数：测量元素高度
export const useMeasureElement = () => {
  const elementRef = useRef<HTMLElement>(null);
  
  const measure = useCallback(() => {
    if (elementRef.current) {
      return elementRef.current.getBoundingClientRect().height;
    }
    return 0;
  }, []);

  return [elementRef, measure] as const;
};

// 虚拟列表Hook
export const useVirtualList = <T extends VirtualScrollerItem>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: {
  items: T[];
  itemHeight: number | ((item: T) => number);
  containerHeight: number;
  overscan?: number;
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeightState, setContainerHeightState] = useState(containerHeight);

  const getItemHeight = useCallback((item: T) => {
    if (typeof itemHeight === 'function') {
      return itemHeight(item);
    }
    return itemHeight;
  }, [itemHeight]);

  const totalHeight = useMemo(() => {
    return items.reduce((sum, item) => sum + getItemHeight(item), 0);
  }, [items, getItemHeight]);

  const { visibleStartIndex, visibleEndIndex } = useMemo(() => {
    let accumulatedHeight = 0;
    let startIndex = 0;
    let endIndex = 0;

    // 找到可见区域的开始索引
    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(items[i]);
      if (accumulatedHeight + height > scrollTop) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
      accumulatedHeight += height;
    }

    // 找到可见区域的结束索引
    accumulatedHeight = items.slice(0, startIndex).reduce((sum, item, i) => {
      return sum + getItemHeight(items[i]);
    }, 0);

    const targetBottom = scrollTop + containerHeightState;

    for (let i = startIndex; i < items.length; i++) {
      accumulatedHeight += getItemHeight(items[i]);
      if (accumulatedHeight >= targetBottom) {
        endIndex = Math.min(items.length - 1, i + overscan);
        break;
      }
      if (i === items.length - 1) {
        endIndex = items.length - 1;
      }
    }

    return { visibleStartIndex: startIndex, visibleEndIndex: endIndex };
  }, [items, scrollTop, containerHeightState, overscan, getItemHeight]);

  return {
    scrollTop,
    setScrollTop,
    containerHeight: containerHeightState,
    setContainerHeight: setContainerHeightState,
    totalHeight,
    visibleItems: items.slice(visibleStartIndex, visibleEndIndex + 1),
    visibleStartIndex,
    visibleEndIndex
  };
};