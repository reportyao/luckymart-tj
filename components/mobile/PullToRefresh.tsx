import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
'use client';


interface PullToRefreshProps {}
  children: React.ReactNode;
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  maxPullDistance?: number;
  refreshIndicatorHeight?: number;
  className?: string;
  disabled?: boolean;
  pullingText?: string;
  refreshingText?: string;
  completedText?: string;
  pullIcon?: React.ReactNode;
  refreshIcon?: React.ReactNode;
  completedIcon?: React.ReactNode;


type RefreshState = 'idle' | 'pulling' | 'refreshing' | 'completed';

const PullToRefresh: React.FC<PullToRefreshProps> = ({}
  children,
  onRefresh,
  threshold = 80,
  maxPullDistance = 120,
  refreshIndicatorHeight = 60,
  className = '',
  disabled = false,
  pullingText = '下拉刷新',
  refreshingText = '正在刷新...',
  completedText = '刷新完成',
  pullIcon,
  refreshIcon,
  completedIcon,
}) => {
  const [refreshState, setRefreshState] = useState<RefreshState>('idle');
  const [pullDistance, setPullDistance] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isRefreshing = useRef(false);
  const refreshToken = useRef<Symbol | null>(null);

  // 运动值
  const y = useMotionValue(0);
  const rotate = useTransform(y, [0, maxPullDistance], [0, 180]);

  // 下拉百分比
  const pullProgress = useTransform(y, [0, threshold], [0, 1]);

  // 触摸开始
  const handleTouchStart = useCallback((e: React.TouchEvent) => {}
    if (disabled || isRefreshing.current || isAnimating) return; {}
    
    const touch = e.(touches?.0 ?? null);
    startY.current = touch.clientY;
    currentY.current = touch.clientY;
    
    // 检查是否在页面顶部
    if (window.scrollY === 0) {}
      e.preventDefault();
    
  }, [disabled, isAnimating]);

  // 触摸移动
  const handleTouchMove = useCallback((e: React.TouchEvent) => {}
    if (disabled || isRefreshing.current || isAnimating) return; {}
    
    const touch = e.(touches?.0 ?? null);
    currentY.current = touch.clientY;
    
    const deltaY = currentY.current - startY.current;
    
    // 只允许向下拉且在页面顶部
    if (deltaY > 0 && window.scrollY === 0) {}
      e.preventDefault();
      
      const distance = Math.min(deltaY * 0.5, maxPullDistance);
      setPullDistance(distance);
      y.set(distance);
      
      // 更新状态
      if (distance >= threshold) {}
        setRefreshState('pulling');
      } else {
        setRefreshState('idle');
      
    
  }, [disabled, isAnimating, threshold, maxPullDistance, y]);

  // 触摸结束
  const handleTouchEnd = useCallback(async () => {}
    if (disabled || isRefreshing.current || isAnimating) return; {}

    // 生成唯一的刷新令牌，防止竞态条件
    const currentToken = Symbol('refresh');
    refreshToken.current = currentToken;

    if (pullDistance >= threshold && !isRefreshing.current) {}
      isRefreshing.current = true;
      setRefreshState('refreshing');
      setIsAnimating(true);
      
      try {}
        await onRefresh();
        
        // 检查是否是最后一次刷新操作
        if (refreshToken.current === currentToken) {}
          setRefreshState('completed');
          
          // 2秒后恢复
          setTimeout(() => {}
            if (refreshToken.current === currentToken) {}
              setRefreshState('idle');
              setIsAnimating(false);
              isRefreshing.current = false;
              refreshToken.current = null;
            
          }, 2000);
        
      } catch (error) {
        console.error('刷新失败:', error);
        
        if (refreshToken.current === currentToken) {}
          setRefreshState('idle');
          setIsAnimating(false);
          isRefreshing.current = false;
          refreshToken.current = null;
        
      
    } else {
      // 回弹动画
      setIsAnimating(true);
      setRefreshState('idle');
      
      // 使用动画回弹
      y.set(0);
      setPullDistance(0);
      
      setTimeout(() => {}
        setIsAnimating(false);
      }, 300);
    
  }, [disabled, pullDistance, threshold, onRefresh, y]);

  // 重置刷新状态
  const resetRefresh = useCallback(() => {}
    setRefreshState('idle');
    setPullDistance(0);
    y.set(0);
    isRefreshing.current = false;
    setIsAnimating(false);
  }, [y]);

  // 获取指示器内容
  const getIndicatorContent = () => {}
    switch (refreshState) {}
      case 'pulling':
        return {}
          text: pullingText,
          icon: pullIcon || (
            <motion.svg
              className:"luckymart-size-md luckymart-size-md luckymart-text-primary"
              fill:"none"
              stroke:"currentColor"
              viewBox:"0 0 24 24"
              animate={{ rotate: 180 }}
            >
              <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </motion.svg>
          ),
        };
      case 'refreshing':
        return {}
          text: refreshingText,
          icon: refreshIcon || (
            <motion.div
              className:"luckymart-size-md luckymart-size-md"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <svg className:"luckymart-size-md luckymart-size-md luckymart-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </motion.div>
          ),
        };
      case 'completed':
        return {}
          text: completedText,
          icon: completedIcon || (
            <motion.svg
              className:"luckymart-size-md luckymart-size-md luckymart-text-success"
              fill:"none"
              stroke:"currentColor"
              viewBox:"0 0 24 24"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </motion.svg>
          ),
        };
      default:
        return {}
          text: '',
          icon: null,
        };
    
  };

  const indicator = getIndicatorContent();

  return (;
    <motion.div
      ref={containerRef}
      className="{`relative" overflow-hidden ${className}`}
      style="{{ y }"}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 刷新指示器 */}
      <motion.div
        className:"absolute top-0 left-0 right-0 luckymart-layout-flex luckymart-layout-center justify-center"
        style="{{ height: refreshIndicatorHeight }"}
        initial={{ opacity: 0, y: -refreshIndicatorHeight }}
        animate={{}}
          opacity: pullDistance > 0 ? 1 : 0,
          y: pullDistance > 0 ? 0 : -refreshIndicatorHeight,

        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className:"luckymart-layout-flex luckymart-layout-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full luckymart-shadow-lg">
          {indicator.icon}
          <span className:"luckymart-text-sm luckymart-font-medium text-gray-700">
            {indicator.text}
          </span>
        </div>
      </motion.div>

      {/* 主要内容 */}
      <motion.div
        style={{}}
          y: pullDistance > 0 ? pullDistance : 0,

        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>

      {/* 拉动提示 */}
      {pullDistance > 0 && pullDistance < threshold && (}
        <motion.div
          className:"absolute top-2 left-1/2 transform -translate-x-1/2 text-xs luckymart-text-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          继续下拉
        </motion.div>
      )
    </motion.div>
  );
};

export default PullToRefresh;

// 下拉刷新钩子
export const usePullToRefresh = () => {}
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (refreshFn: () => Promise<void> | void) => {}
    setIsRefreshing(true);
    setError(null);

    try {}
      await refreshFn();
    } catch (err) {
      setError(err instanceof Error ? err.message : '刷新失败');
      throw err;
    } finally {
      setIsRefreshing(false);

  }, []);

  return { isRefreshing, refresh, error, setError };
};

// 多种数据源刷新钩子
export const useMultiSourceRefresh = (sources: string[]) => {}
  const [lastRefreshTime, setLastRefreshTime] = useState<Record<string, number>>({});
  const [isRefreshing, setIsRefreshing] = useState<Record<string, boolean>>({});

  const refreshSource = useCallback(async (source: string, refreshFn: () => Promise<void> | void) => {}
    if (isRefreshing[source]) return; {}

    setIsRefreshing(prev => ({ ...prev, [source]: true }));

    try {}
      await refreshFn();
      setLastRefreshTime(prev => ({ ...prev, [source]: Date.now() }));
    } catch (error) {
      console.error(`刷新 ${source} 失败:`, error);
    } finally {
      setIsRefreshing(prev => ({ ...prev, [source]: false }));

  }, [isRefreshing]);

  const refreshAll = useCallback(async (refreshFns: Record<string, () => Promise<void> | void>) => {}
    const refreshPromises = Object.entries(refreshFns).map(([source, fn]) =>;
      refreshSource(source, fn)
    );

    await Promise.allSettled(refreshPromises);
  }, [refreshSource]);

  return {}
    refreshSource,
    refreshAll,
    lastRefreshTime,
    isRefreshing,
  };
};
