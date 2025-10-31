'use client';

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, PanInfo, useAnimationControls } from 'framer-motion';
import { useGestureI18n } from '../hooks/use-gesture-i18n';
import { GestureEvent, SwipeDirection, GestureState } from '../utils/gesture-translations';

interface SwipeAction {
  /** 操作ID */
  id: string;
  /** 显示文本 */
  text: string;
  /** 图标 */
  icon?: ReactNode;
  /** 背景色 */
  background: string;
  /** 文字颜色 */
  color?: string;
  /** 触发的操作 */
  onClick: () => void;
  /** 手势提示 */
  gestureText?: string;
}

interface SwipeActionsProps {
  /** 子组件 */
  children: ReactNode;
  
  /** 左侧操作 */
  leftActions?: SwipeAction[];
  
  /** 右侧操作 */
  rightActions?: SwipeAction[];
  
  /** 滑动阈值 */
  threshold?: number;
  
  /** 最大滑动距离 */
  maxSwipeDistance?: number;
  
  /** 是否禁用滑动 */
  disabled?: boolean;
  
  /** 滑动手势提示 */
  gestureHint?: boolean;
  
  /** 成功后重置 */
  resetAfterAction?: boolean;
  
  /** 回调函数 */
  onSwipeStart?: (direction: SwipeDirection) => void;
  onSwipeEnd?: (direction: SwipeDirection, actionId?: string) => void;
  onSwipeProgress?: (progress: number, direction: SwipeDirection) => void;
  
  /** 样式类 */
  className?: string;
}

const SwipeActions: React.FC<SwipeActionsProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 100,
  maxSwipeDistance = 150,
  disabled = false,
  gestureHint = true,
  resetAfterAction = true,
  onSwipeStart,
  onSwipeEnd,
  onSwipeProgress,
  className = '',
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState<SwipeDirection | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();
  
  const {
    getSwipeText,
    getActionText,
    updateGestureState,
    triggerFeedback,
    gestureState,
  } = useGestureI18n({
    minSwipeDistance: threshold,
    enableHaptic: true,
    enableSound: false,
    enableVisual: true,
  }, {
    onSwipeLeft: (event) => {
      handleSwipeComplete('left');
    },
    onSwipeRight: (event) => {
      handleSwipeComplete('right');
    },
    onGestureFailed: () => {
      resetPosition();
    },
  });

  // 重置位置
  const resetPosition = async () => {
    setOffsetX(0);
    setDragDirection(null);
    updateGestureState('idle');
    await controls.start({ x: 0 });
  };

  // 滑动手势开始
  const handleDragStart = () => {
    if (disabled) return;
    
    setIsDragging(true);
    updateGestureState('active');
    onSwipeStart?.(dragDirection || 'left');
  };

  // 滑动手势更新
  const handleDragUpdate = (info: PanInfo) => {
    if (disabled) return;
    
    const newOffsetX = info.offset.x;
    
    // 限制滑动范围
    if (newOffsetX > 0 && leftActions.length === 0) return;
    if (newOffsetX < 0 && rightActions.length === 0) return;
    
    // 限制最大滑动距离
    const limitedOffset = Math.max(
      -maxSwipeDistance, 
      Math.min(maxSwipeDistance, newOffsetX)
    );
    
    setOffsetX(limitedOffset);
    
    // 确定滑动方向
    if (limitedOffset > 10) {
      setDragDirection('left');
      updateGestureState('swipe');
    } else if (limitedOffset < -10) {
      setDragDirection('right');
      updateGestureState('swipe');
    } else {
      setDragDirection(null);
      updateGestureState('active');
    }
    
    // 计算进度
    const progress = Math.min(1, Math.abs(limitedOffset) / threshold);
    if (dragDirection) {
      onSwipeProgress?.(progress, dragDirection);
    }
  };

  // 滑动手势结束
  const handleDragEnd = (info: PanInfo) => {
    if (disabled) return;
    
    setIsDragging(false);
    
    const velocity = info.velocity.x;
    const finalOffset = offsetX;
    
    // 判断是否触发操作
    if (Math.abs(finalOffset) > threshold || Math.abs(velocity) > 500) {
      const direction = finalOffset > 0 ? 'left' : 'right';
      updateGestureState('swipe');
      triggerFeedback('tap', 'light');
    } else {
      updateGestureState('cancelled');
      resetPosition();
    }
  };

  // 处理滑动完成
  const handleSwipeComplete = (direction: SwipeDirection) => {
    const actions = direction === 'left' ? leftActions : rightActions;
    if (actions.length === 0) {
      resetPosition();
      return;
    }
    
    const action = actions[0]; // 默认执行第一个操作
    const actionId = action.id;
    
    updateGestureState('success');
    triggerFeedback('success', 'medium');
    
    // 执行操作
    action.onClick();
    
    onSwipeEnd?.(direction, actionId);
    
    // 重置位置
    if (resetAfterAction) {
      setTimeout(resetPosition, 300);
    }
  };

  // 获取操作按钮样式
  const getActionButtonStyle = (action: SwipeAction, index: number) => {
    const baseStyle = `
      absolute top-0 bottom-0 flex items-center justify-center
      ${direction === 'left' ? 'left-0' : 'right-0'}
      ${action.background} ${action.color || 'text-white'}
      transition-all duration-200 ease-out
    `;
    
    const direction = action.background.includes('green') ? 'right' : 'left';
    
    return baseStyle;
  };

  // 获取操作按钮文本
  const getActionButtonText = (action: SwipeAction, direction: SwipeDirection) => {
    return action.gestureText || action.text;
  };

  // 获取滑动手势提示文本
  const getSwipeHintText = (direction: SwipeDirection) => {
    return getSwipeText(direction, 'start');
  };

  return (
    <div className={`relative overflow-hidden ${className}`} ref={containerRef}>
      {/* 左侧操作按钮 */}
      {leftActions.length > 0 && (
        <motion.div
          className="absolute inset-y-0 left-0 flex"
          animate={{ 
            x: offsetX > 0 ? offsetX - 100 : -100,
            opacity: offsetX > 20 ? 1 : 0.8
          }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        >
          {leftActions.map((action, index) => (
            <div
              key={action.id}
              className={`
                w-20 flex flex-col items-center justify-center px-3
                ${action.background} ${action.color || 'text-white'}
                border-r border-gray-200
              `}
            >
              {action.icon && (
                <div className="mb-1">
                  {action.icon}
                </div>
              )}
              <span className="text-xs text-center leading-tight">
                {getActionButtonText(action, 'left')}
              </span>
            </div>
          ))}
        </motion.div>
      )}

      {/* 右侧操作按钮 */}
      {rightActions.length > 0 && (
        <motion.div
          className="absolute inset-y-0 right-0 flex"
          animate={{ 
            x: offsetX < 0 ? offsetX + 100 : 100,
            opacity: Math.abs(offsetX) > 20 ? 1 : 0.8
          }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        >
          {rightActions.map((action, index) => (
            <div
              key={action.id}
              className={`
                w-20 flex flex-col items-center justify-center px-3
                ${action.background} ${action.color || 'text-white'}
                border-l border-gray-200
              `}
            >
              {action.icon && (
                <div className="mb-1">
                  {action.icon}
                </div>
              )}
              <span className="text-xs text-center leading-tight">
                {getActionButtonText(action, 'right')}
              </span>
            </div>
          ))}
        </motion.div>
      )}

      {/* 主内容区域 */}
      <motion.div
        className={`
          relative z-10 bg-white
          ${disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}
          ${gestureState === 'active' ? 'shadow-md' : 'shadow-sm'}
          ${gestureState === 'success' ? 'bg-green-50' : ''}
          ${gestureState === 'failed' ? 'bg-red-50' : ''}
        `}
        drag={!disabled}
        dragDirectionLock
        dragConstraints={{ left: -(rightActions.length * 80), right: (leftActions.length * 80) }}
        dragElastic={0.1}
        onDragStart={handleDragStart}
        onDrag={handleDragUpdate}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x: offsetX }}
        whileDrag={{ scale: 0.98 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {children}
        
        {/* 手势提示覆盖层 */}
        {gestureHint && !isDragging && gestureState === 'idle' && offsetX === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-5 pointer-events-none">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              {leftActions.length > 0 && (
                <>
                  <span>{getSwipeHintText('left')}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </>
              )}
              {rightActions.length > 0 && leftActions.length > 0 && (
                <span className="text-gray-300">|</span>
              )}
              {rightActions.length > 0 && (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>{getSwipeHintText('right')}</span>
                </>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* 手势状态指示器 */}
      <div className="absolute top-2 right-2 z-20">
        {gestureState === 'active' && (
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        )}
        {gestureState === 'success' && (
          <div className="w-2 h-2 bg-green-500 rounded-full" />
        )}
        {gestureState === 'failed' && (
          <div className="w-2 h-2 bg-red-500 rounded-full" />
        )}
      </div>

      {/* 滑动进度指示器 */}
      {isDragging && dragDirection && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="w-20 h-1 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-500"
              animate={{ width: `${Math.min(100, (Math.abs(offsetX) / threshold) * 100)}%` }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SwipeActions;