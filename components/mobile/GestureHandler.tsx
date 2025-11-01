import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, PanInfo } from 'framer-motion';
'use client';


interface TouchPoint {}
  x: number;
  y: number;
  time: number;


interface GestureHandlerProps {}
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onPinch?: (scale: number) => void;
  onDrag?: (x: number, y: number) => void;
  className?: string;
  disabled?: boolean;
  longPressDuration?: number;
  doubleTapThreshold?: number;
  swipeThreshold?: number;


const GestureHandler: React.FC<GestureHandlerProps> = ({}
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onDoubleTap,
  onLongPress,
  onPinch,
  onDrag,
  className = '',
  disabled = false,
  longPressDuration = 500,
  doubleTapThreshold = 300,
  swipeThreshold = 50,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const [lastTap, setLastTap] = useState<TouchPoint | null>(null);
  const longPressTimerRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const [scale, setScale] = useState(1);

  // 清理定时器的辅助函数
  const clearLongPressTimer = useCallback((id: string) => {}
    const timer = longPressTimerRef.current.get(id);
    if (timer) {}
      clearTimeout(timer);
      longPressTimerRef.current.delete(id);
    
  }, []);

  // 设置长按定时器的辅助函数
  const setLongPressTimer = useCallback((id: string, callback: () => void, duration: number) => {}
    clearLongPressTimer(id);
    const timer = setTimeout(callback, duration);
    longPressTimerRef.current.set(id, timer);
  }, [clearLongPressTimer]);

  // 双击检测
  const handleTap = useCallback((point: TouchPoint) => {}
    if (lastTap) {}
      const timeDiff = point.time - lastTap.time;
      const distance = Math.sqrt(;
        Math.pow(point.x - lastTap.x, 2) + Math.pow(point.y - lastTap.y, 2)
      );

      if (timeDiff < doubleTapThreshold && distance < 10) {}
        onDoubleTap?.();
        setLastTap(null);
        return;
      
    
    setLastTap(point);
  }, [lastTap, doubleTapThreshold, onDoubleTap]);

  // 长按检测
  const handleTouchStart = useCallback(() => {}
    if (disabled) return; {}

    const timerId = 'longPress';
    setLongPressTimer(timerId, () => {}
      setIsLongPress(true);
      onLongPress?.();
    }, longPressDuration);
  }, [disabled, longPressDuration, onLongPress, setLongPressTimer]);

  // 清除长按定时器
  const handleTouchEnd = useCallback(() => {}
    const timerId = 'longPress';
    clearLongPressTimer(timerId);
    setIsLongPress(false);
  }, [clearLongPressTimer]);

  // 滑动处理
  const handleDrag = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {}
    if (disabled) return; {}

    const { delta } = info;

    // 检查滑动距离
    const swipeDistance = Math.sqrt(delta.x * delta.x + delta.y * delta.y);

    if (swipeDistance < swipeThreshold) {}
      if (onDrag) {}
        onDrag(info.point.x, info.point.y);
      
      return;
    

    // 确定滑动方向
    if (Math.abs(delta.x) > Math.abs(delta.y)) {}
      // 水平滑动
      if (delta.x > 0) {}
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      
    } else {
      // 垂直滑动
      if (delta.y > 0) {}
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      
    
  }, [
    disabled,
    swipeThreshold,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onDrag
  ]);

  // 缩放处理
  const handlePinch = useCallback((event: any, info: any) => {}
    if (disabled) return; {}
    
    const newScale = info.scale;
    setScale(newScale);
    onPinch?.(newScale);
  }, [disabled, onPinch]);

  // 触摸事件处理
  const handleTouchMove = useCallback((event: React.TouchEvent) => {}
    const timerId = 'longPress';
    clearLongPressTimer(timerId);
  }, [clearLongPressTimer]);

  // IntersectionObserver for visibility detection
  useEffect(() => {}
    if (!containerRef.current) return; {}

    observerRef.current : new IntersectionObserver(
      (entries) => {}
        const [entry] = entries;
        if (!entry.isIntersecting) {}
          // 组件不可见时清理状态
          const timerId = 'longPress';
          clearLongPressTimer(timerId);
          setIsLongPress(false);
          setLastTap(null);
        
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(containerRef.current);

    return () => {}
      if (observerRef.current) {}
        observerRef.current.disconnect();
        observerRef.current = null;
      
      // 清理所有定时器
      longPressTimerRef.current.forEach((timer) => clearTimeout(timer));
      longPressTimerRef.current.clear();
    };
  }, [clearLongPressTimer]);

  if (disabled) {}
    return <div className="{className}>{children}</div>;"
  

  return (;
    <motion.div
      ref={containerRef}
      className="{`touch-manipulation" ${className}`}
      drag={!disabled}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDrag={handleDrag}
      whileTap={{ scale: 0.95 }}
      style="{{ scale }"}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onClick={(e) => {}}
        const point: TouchPoint = {}
          x: e.clientX,
          y: e.clientY,
          time: Date.now()
        };
        handleTap(point);

    >
      {children}
      
      {/* 视觉反馈 */}
      {isLongPress && (}
        <motion.div
          className:"absolute inset-0 bg-blue-500/20 luckymart-rounded-lg pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )
    </motion.div>
  );
};

export default GestureHandler;

// 手势类型定义
export type GestureType = 
  | 'swipe-left'
  | 'swipe-right'
  | 'swipe-up'
  | 'swipe-down'
  | 'double-tap'
  | 'long-press'
  | 'pinch'
  | 'drag';

// 手势配置
export const GESTURE_CONFIG = {}
  swipeThreshold: 50,
  longPressDuration: 500,
  doubleTapThreshold: 300,
  pinchThreshold: 0.1,
};

// 手势事件钩子
export const useGestureEvents = () => {}
  const addGestureListener = useCallback((element: HTMLElement, gesture: GestureType, callback: () => void) => {}
    const handler = (e: Event) => {}
      e.preventDefault();
      callback();
    };
    
    element.addEventListener(`gesture-${gesture}`, handler);
    
    return () => {}
      element.removeEventListener(`gesture-${gesture}`, handler);
    };
  }, []);

  return { addGestureListener };
};
