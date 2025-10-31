'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGestureI18n } from '../hooks/use-gesture-i18n';
import { GestureEvent, SwipeDirection, GestureState } from '../utils/gesture-translations';

interface MultilingualGestureTooltipProps {
  /** 触发元素 */
  children: React.ReactNode;
  
  /** 手势类型 */
  gestureType: 'swipe' | 'tap' | 'press';
  
  /** 滑动的方向 */
  direction?: SwipeDirection;
  
  /** 自定义提示文本 */
  customText?: string;
  
  /** 位置 */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  
  /** 显示时长 */
  duration?: number;
  
  /** 是否自动显示 */
  autoShow?: boolean;
  
  /** 触发回调 */
  onGesture?: (event: GestureEvent) => void;
  
  /** 成功回调 */
  onSuccess?: () => void;
  
  /** 失败回调 */
  onFailed?: () => void;
  
  /** 样式类 */
  className?: string;
  
  /** 是否显示箭头 */
  showArrow?: boolean;
  
  /** 手势图标 */
  gestureIcon?: React.ReactNode;
}

const MultilingualGestureTooltip: React.FC<MultilingualGestureTooltipProps> = ({
  children,
  gestureType,
  direction,
  customText,
  position = 'top',
  duration = 3000,
  autoShow = false,
  onGesture,
  onSuccess,
  onFailed,
  className = '',
  showArrow = true,
  gestureIcon,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const {
    getSwipeText,
    getActionText,
    getStateText,
    getGuidanceText,
    updateGestureState,
    triggerFeedback,
    gestureState,
  } = useGestureI18n({
    // 手势配置
    minSwipeDistance: 50,
    enableHaptic: true,
    enableSound: false,
    enableVisual: true,
  }, {
    onGestureSuccess: (event) => {
      onSuccess?.();
      triggerFeedback('success', 'light');
      hideTooltip();
    },
    onGestureFailed: () => {
      onFailed?.();
      triggerFeedback('error', 'light');
    },
  });

  // 获取提示文本
  const getTooltipText = (): string => {
    if (customText) return customText;
    
    switch (gestureType) {
      case 'swipe':
        if (direction) {
          return getSwipeText(direction, 'start');
        }
        return getGuidanceText('hint');
        
      case 'tap':
        return getActionText('tap');
        
      case 'press':
        return getActionText('long');
        
      default:
        return getGuidanceText('hint');
    }
  };

  // 显示提示
  const showTooltip = () => {
    if (hasShown && !autoShow) return;
    
    setIsVisible(true);
    setHasShown(true);
    clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      hideTooltip();
    }, duration);
  };

  // 隐藏提示
  const hideTooltip = () => {
    setIsVisible(false);
    clearTimeout(timeoutRef.current);
  };

  // 重置显示状态
  const resetTooltip = () => {
    setHasShown(false);
  };

  // 自动显示处理
  useEffect(() => {
    if (autoShow && !hasShown) {
      showTooltip();
    }
  }, [autoShow, hasShown]);

  // 清理定时器
  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  // 获取位置样式
  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      case 'center':
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  // 获取箭头样式
  const getArrowStyles = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800';
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800';
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800';
      default:
        return '';
    }
  };

  // 手势状态颜色
  const getStateColor = () => {
    switch (gestureState) {
      case 'success':
        return 'bg-green-600 border-green-500';
      case 'failed':
        return 'bg-red-600 border-red-500';
      case 'active':
        return 'bg-blue-600 border-blue-500';
      default:
        return 'bg-gray-800 border-gray-700';
    }
  };

  // 手势图标组件
  const GestureIcon = () => {
    if (gestureIcon) return <>{gestureIcon}</>;
    
    const iconStyles = "w-4 h-4 text-white";
    
    switch (gestureType) {
      case 'swipe':
        switch (direction) {
          case 'left':
            return (
              <svg className={iconStyles} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            );
          case 'right':
            return (
              <svg className={iconStyles} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            );
          case 'up':
            return (
              <svg className={iconStyles} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            );
          case 'down':
            return (
              <svg className={iconStyles} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            );
          default:
            return (
              <svg className={iconStyles} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            );
        }
      case 'tap':
        return (
          <svg className={iconStyles} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        );
      case 'press':
        return (
          <svg className={iconStyles} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* 触发元素 */}
      <div 
        onClick={() => showTooltip()}
        onTouchStart={(e) => {
          e.preventDefault();
          showTooltip();
        }}
      >
        {children}
      </div>

      {/* 手势提示 */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: position === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: position === 'top' ? 10 : -10 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-50 ${getPositionStyles()}`}
          >
            <div className={`
              ${getStateColor()}
              text-white text-sm px-3 py-2 rounded-lg shadow-lg 
              border backdrop-blur-sm min-w-max
              ${gestureState === 'active' ? 'animate-pulse' : ''}
            `}>
              {/* 提示内容 */}
              <div className="luckymart-layout-flex luckymart-layout-center gap-2">
                <GestureIcon />
                <span>{getTooltipText()}</span>
              </div>

              {/* 箭头 */}
              {showArrow && (
                <div className={`
                  absolute w-0 h-0 border-4 
                  ${getArrowStyles()}
                `} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 手势状态指示器 */}
      <AnimatePresence>
        {gestureState !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStateColor().split(' ')[0]}`}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MultilingualGestureTooltip;