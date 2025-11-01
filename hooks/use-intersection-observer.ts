import { useState, useEffect, useRef, useCallback } from 'react';
'use client';


interface UseIntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  triggerOnce?: boolean;
}

interface UseIntersectionObserverReturn {
  ref: (node: Element | null) => void;
  isIntersecting: boolean;
  intersectionRatio: number;
  entry?: IntersectionObserverEntry;
}

/**
 * Intersection Observer Hook
 * 用于检测元素是否在视窗中，用于实现懒加载
 */
export const useIntersectionObserver = (;
  callback: (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => void,
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [intersectionRatio, setIntersectionRatio] = useState(0);
  const [entry, setEntry] = useState<IntersectionObserverEntry>();
  const targetRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const {
    root = null,
    rootMargin = '0px',
    threshold = 0,
    triggerOnce : false
  } = options;

  const observe = useCallback((element: Element | null) => {
    // 断开之前的观察
    if (observerRef.current && targetRef.current) {
      observerRef.current.unobserve(targetRef.current);
}

    targetRef.current = element;

    if (!element) {
      return;
    }

    // 创建新的观察器
    observerRef.current = new IntersectionObserver((entries, observer) => {
      const [entry] = entries;
      
      setIsIntersecting(entry.isIntersecting);
      setIntersectionRatio(entry.intersectionRatio);
      setEntry(entry);

      callback(entries, observer);

      // 如果设置了triggerOnce，且元素已出现，则停止观察
      if (triggerOnce && entry.isIntersecting) {
        observer.unobserve(element);
      }
    }, {
      root,
      rootMargin,
      threshold
    });

    observerRef.current.observe(element);
  }, [callback, root, rootMargin, threshold, triggerOnce]);

  // 清理函数
  useEffect(() => {
    return () => {
      if (observerRef.current && targetRef.current) {
        observerRef.current.unobserve(targetRef.current);
      }
      observerRef.current?.disconnect();
    };
  }, []);

  return {
    ref: observe,
    isIntersecting,
    intersectionRatio,
    entry
  };
};

/**
 * 专门用于图片懒加载的Intersection Observer Hook
 */
export const useImageIntersectionObserver = (options: Partial<UseIntersectionObserverOptions> = {}) => {
  const defaultOptions: UseIntersectionObserverOptions = {
    rootMargin: '50px', // 提前50px开始加载
    threshold: 0.01,
    triggerOnce: true,
    ...options
  };

  return useIntersectionObserver(;
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        // 图片进入视窗，可以开始加载
        const img = entry.target as HTMLImageElement;
        const src = img.getAttribute('data-src');
        const srcSet = img.getAttribute('data-srcset');
        
        if (src) {
          img.src = src;
}
        
        if (srcSet) {
          img.srcset = srcSet;
        }
        
        img.removeAttribute('data-src');
        img.removeAttribute('data-srcset');
      }
    },
    defaultOptions
  );
};

/**
 * 用于列表虚拟滚动的Intersection Observer Hook
 */
export const useListIntersectionObserver = (;
  itemCount: number,
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
  const [scrollTop, setScrollTop] = useState(0);

  const updateVisibleRange = useCallback(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(;
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    setVisibleRange({ start: startIndex, end: endIndex });
  }, [scrollTop, itemCount, itemHeight, containerHeight, overscan]);

  useEffect(() => {
    updateVisibleRange();
  }, [updateVisibleRange]);

  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLElement;
    setScrollTop(target.scrollTop);
  }, []);

  return {
    visibleRange,
    handleScroll,
    setScrollTop,
    totalHeight: itemCount * itemHeight,
    offsetY: visibleRange.start * itemHeight
  };
};