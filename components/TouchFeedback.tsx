'use client';

import React, { useEffect, useState, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGestureI18n } from '../hooks/use-gesture-i18n';
import { GestureEvent, GestureState } from '../utils/gesture-translations';

interface TouchFeedbackProps {
  /** 子组件 */
  children: ReactNode;
  
  /** 反馈类型 */
  type?: 'ripple' | 'scale' | 'glow' | 'color' | 'custom';
  
  /** 触觉反馈强度 */
  hapticIntensity?: 'light' | 'medium' | 'heavy';
  
  /** 声音反馈 */
  soundFeedback?: boolean;
  
  /** 视觉反馈 */
  visualFeedback?: boolean;
  
  /** 自定义反馈组件 */
  customFeedback?: (state: GestureState) => ReactNode;
  
  /** 触摸反馈样式 */
  feedbackStyle?: React.CSSProperties;
  
  /** 动画持续时间 */
  duration?: number;
  
  /** 是否禁用反馈 */
  disabled?: boolean;
  
  /** 手势回调 */
  onTouchStart?: (event: GestureEvent) => void;
  onTouchEnd?: (event: GestureEvent) => void;
  onLongPress?: (event: GestureEvent) => void;
  
  /** 成功/失败回调 */
  onSuccess?: () => void;
  onFailed?: () => void;
  
  /** 样式类 */
  className?: string;
  
  /** 是否显示反馈提示文本 */
  showFeedbackText?: boolean;
  
  /** 多语言反馈文本 */
  feedbackTexts?: {
    touch?: string;
    press?: string;
    success?: string;
    error?: string;
  };
}

const TouchFeedback: React.FC<TouchFeedbackProps> = ({
  children,
  type = 'ripple',
  hapticIntensity = 'light',
  soundFeedback = false,
  visualFeedback = true,
  customFeedback,
  feedbackStyle,
  duration = 300,
  disabled = false,
  onTouchStart,
  onTouchEnd,
  onLongPress,
  onSuccess,
  onFailed,
  className = '',
  showFeedbackText = false,
  feedbackTexts,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [feedbackPosition, setFeedbackPosition] = useState({ x: 0, y: 0 });
  const [feedbackText, setFeedbackText] = useState('');
  const longPressTimer = useRef<NodeJS.Timeout>();
  const touchStartTime = useRef<number>(0);
  
  const {
    getSuccessText,
    getErrorText,
    getActionText,
    updateGestureState,
    triggerFeedback,
    gestureState,
  } = useGestureI18n({
    enableHaptic: true,
    enableSound: soundFeedback,
    enableVisual: visualFeedback,
    longPressDuration: 500,
  }, {
    onTap: (event) => {
      updateGestureState('success');
      triggerFeedback('tap', hapticIntensity);
      onSuccess?.();
    },
    onLongPress: (event) => {
      updateGestureState('success');
      triggerFeedback('success', 'medium');
      onSuccess?.();
    },
    onGestureFailed: () => {
      updateGestureState('failed');
      triggerFeedback('error', hapticIntensity);
      onFailed?.();
    },
  });

  // 获取反馈文本
  const getFeedbackText = (state: GestureState): string => {
    if (feedbackTexts?.touch && state === 'active') return feedbackTexts.touch;
    if (feedbackTexts?.press && state === 'press') return feedbackTexts.press;
    if (feedbackTexts?.success && state === 'success') return feedbackTexts.success;
    if (feedbackTexts?.error && state === 'failed') return feedbackTexts.error;
    
    switch (state) {
      case 'active':
        return getActionText('tap');
      case 'press':
        return getActionText('long');
      case 'success':
        return getSuccessText('completed');
      case 'failed':
        return getErrorText('invalid');
      default:
        return '';
    }
  };

  // 触摸开始
  const handleTouchStart = (event: React.TouchEvent | React.MouseEvent) => {
    if (disabled) return;
    
    const touch = 'touches' in event ? event.touches[0] : null;
    if (!touch) return;
    
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    setFeedbackPosition({ x, y });
    setIsPressed(true);
    touchStartTime.current = Date.now();
    
    updateGestureState('active');
    
    const gestureEvent: GestureEvent = {
      type: 'tap',
      position: { x, y },
      timestamp: Date.now(),
    };
    
    onTouchStart?.(gestureEvent);
    
    // 设置长按检测
    longPressTimer.current = setTimeout(() => {
      if (Date.now() - touchStartTime.current >= 500) {
        updateGestureState('press');
        setFeedbackText(getActionText('long'));
        
        const longPressEvent: GestureEvent = {
          type: 'press',
          position: { x, y },
          duration: 500,
          timestamp: Date.now(),
        };
        
        onLongPress?.(longPressEvent);
      }
    }, 500);
  };

  // 触摸结束
  const handleTouchEnd = (event: React.TouchEvent | React.MouseEvent) => {
    if (disabled) return;
    
    clearTimeout(longPressTimer.current);
    
    const touch = 'changedTouches' in event ? event.changedTouches[0] : null;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = touch ? touch.clientX - rect.left : feedbackPosition.x;
    const y = touch ? touch.clientY - rect.top : feedbackPosition.y;
    
    const duration = Date.now() - touchStartTime.current;
    
    setIsPressed(false);
    setFeedbackText('');
    
    const gestureEvent: GestureEvent = {
      type: duration > 500 ? 'press' : 'tap',
      position: { x, y },
      duration,
      timestamp: Date.now(),
    };
    
    onTouchEnd?.(gestureEvent);
  };

  // 触摸取消
  const handleTouchCancel = () => {
    if (disabled) return;
    
    clearTimeout(longPressTimer.current);
    setIsPressed(false);
    setFeedbackText('');
    updateGestureState('cancelled');
  };

  // 渲染涟漪效果
  const renderRipple = () => (
    <AnimatePresence>
      {isPressed && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 4, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: duration / 1000, ease: 'easeOut' }}
        >
          <div
            className="w-full h-full rounded-full border-2 border-blue-500"
            style={{
              position: 'absolute',
              left: feedbackPosition.x - 16,
              top: feedbackPosition.y - 16,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

  // 渲染缩放效果
  const renderScale = () => (
    <motion.div
      className="w-full h-full"
      animate={isPressed ? { scale: 0.95 } : { scale: 1 }}
      transition={{ duration: duration / 1000, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );

  // 渲染发光效果
  const renderGlow = () => (
    <motion.div
      className="w-full h-full relative"
      animate={isPressed ? { 
        boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
        filter: 'brightness(1.1)'
      } : { 
        boxShadow: '0 0 0px rgba(59, 130, 246, 0)',
        filter: 'brightness(1)'
      }}
      transition={{ duration: duration / 1000, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );

  // 渲染颜色变化效果
  const renderColor = () => (
    <motion.div
      className="w-full h-full"
      animate={isPressed ? { backgroundColor: 'rgba(59, 130, 246, 0.1)' } : { backgroundColor: 'transparent' }}
      transition={{ duration: duration / 1000, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );

  // 渲染自定义效果
  const renderCustom = () => {
    if (!customFeedback) return null;
    return customFeedback(gestureState);
  };

  // 获取反馈组件
  const renderFeedback = () => {
    if (customFeedback) return renderCustom();
    
    switch (type) {
      case 'ripple':
        return renderRipple();
      case 'scale':
        return renderScale();
      case 'glow':
        return renderGlow();
      case 'color':
        return renderColor();
      default:
        return children;
    }
  };

  // 获取容器样式
  const getContainerStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'relative',
      overflow: 'hidden',
    };
    
    if (feedbackStyle) {
      Object.assign(baseStyle, feedbackStyle);
    }
    
    return baseStyle;
  };

  return (
    <div
      className={`
        relative inline-block select-none
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${className}
      `}
      style={getContainerStyle()}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchCancel}
    >
      {/* 触摸反馈效果 */}
      {(type === 'ripple' || type === 'custom') && renderFeedback()}
      
      {/* 其他类型的反馈 */}
      {type !== 'ripple' && type !== 'custom' && renderFeedback()}
      
      {/* 手势状态指示器 */}
      <div className="absolute top-1 right-1 z-10">
        {gestureState === 'active' && (
          <motion.div
            className="w-2 h-2 bg-blue-500 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        )}
        {gestureState === 'press' && (
          <motion.div
            className="w-2 h-2 bg-purple-500 rounded-full"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ repeat: Infinity, duration: 0.5 }}
          />
        )}
        {gestureState === 'success' && (
          <div className="w-2 h-2 bg-green-500 rounded-full" />
        )}
        {gestureState === 'failed' && (
          <div className="w-2 h-2 bg-red-500 rounded-full" />
        )}
      </div>

      {/* 反馈文本 */}
      <AnimatePresence>
        {showFeedbackText && feedbackText && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-sm rounded"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {feedbackText}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 触摸区域高亮 */}
      <AnimatePresence>
        {isPressed && (
          <motion.div
            className="absolute inset-0 bg-blue-500 bg-opacity-10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TouchFeedback;