'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TouchFeedbackProps {
  children: React.ReactNode;
  type?: 'ripple' | 'press' | 'glow' | 'highlight' | 'scale';
  color?: string;
  duration?: number;
  disabled?: boolean;
  className?: string;
  hapticFeedback?: boolean;
  preventDefault?: boolean;
}

interface RipplePoint {
  id: number;
  x: number;
  y: number;
  size: number;
}

const TouchFeedback: React.FC<TouchFeedbackProps> = ({
  children,
  type = 'ripple',
  color = '#3B82F6',
  duration = 600,
  disabled = false,
  className = '',
  hapticFeedback = true,
  preventDefault = false,
}) => {
  const [ripples, setRipples] = useState<RipplePoint[]>([]);
  const [isPressed, setIsPressed] = useState(false);
  const [pressStart, setPressStart] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const rippleIdRef = useRef(0);

  // 触觉反馈与错误处理
  const triggerHaptic = useCallback(async () => {
    if (!hapticFeedback) return;
    
    try {
      if ('vibrate' in navigator && navigator.vibrate) {
        // 根据反馈类型设置震动强度
        const intensity = type === 'glow' ? 30 : type === 'press' ? 20 : 10;
        const success = navigator.vibrate(intensity);
        
        if (!success) {
          console.warn('振动被取消或阻止');
          provideVisualFeedback();
        }
      } else {
        // 设备不支持振动，提供视觉反馈
        console.info('设备不支持振动功能，使用视觉反馈');
        provideVisualFeedback();
      }
    } catch (error) {
      console.error('振动反馈失败:', error);
      // 提供视觉反馈作为降级方案，确保用户体验
      provideVisualFeedback();
    }
  }, [hapticFeedback, type]);

  // 视觉反馈降级方案
  const provideVisualFeedback = useCallback(() => {
    if (containerRef.current) {
      const originalTransition = containerRef.current.style.transition;
      containerRef.current.style.transition = 'background-color 0.1s ease';
      containerRef.current.style.backgroundColor = `${color}20`;
      
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.backgroundColor = '';
          containerRef.current.style.transition = originalTransition;
        }
      }, 100);
    }
  }, [color]);

  // 创建波纹效果
  const createRipple = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (disabled || type !== 'ripple') return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = 'touches' in event ? event.touches[0]?.clientX || 0 : event.clientX;
    const clientY = 'touches' in event ? event.touches[0]?.clientY || 0 : event.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // 计算最大距离（对角线）
    const size = Math.sqrt(rect.width * rect.width + rect.height * rect.height);
    
    const newRipple: RipplePoint = {
      id: rippleIdRef.current++,
      x,
      y,
      size,
    };

    setRipples(prev => [...prev, newRipple]);

    // 移除波纹
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, duration);

    triggerHaptic();

    if (preventDefault) {
      event.preventDefault();
    }
  }, [disabled, type, duration, triggerHaptic, preventDefault]);

  // 按压开始
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (disabled) return;

    setIsPressed(true);
    setPressStart(Date.now());

    if (type === 'ripple') {
      createRipple(event);
    } else {
      triggerHaptic();
    }

    if (preventDefault) {
      event.preventDefault();
    }
  }, [disabled, type, createRipple, triggerHaptic, preventDefault]);

  // 按压结束
  const handleTouchEnd = useCallback(() => {
    if (disabled) return;

    const pressDuration = Date.now() - pressStart;
    
    // 长按检测
    if (pressDuration > 500) {
      // 长按反馈
      try {
        if ('vibrate' in navigator && navigator.vibrate) {
          const success = navigator.vibrate([50, 50]);
          if (!success) {
            console.warn('长按振动反馈失败');
          }
        } else {
          console.warn('设备不支持振动反馈');
        }
      } catch (error) {
        console.error('长按振动反馈错误:', error);
      }
    }

    setTimeout(() => {
      setIsPressed(false);
    }, 100);
  }, [disabled, pressStart]);

  // 鼠标事件
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (disabled || event.button !== 0) return;

    setIsPressed(true);
    
    if (type === 'ripple') {
      createRipple(event);
    } else {
      triggerHaptic();
    }

    if (preventDefault) {
      event.preventDefault();
    }
  }, [disabled, type, createRipple, triggerHaptic, preventDefault]);

  const handleMouseUp = useCallback(() => {
    if (disabled) return;
    setTimeout(() => setIsPressed(false), 100);
  }, [disabled]);

  const handleMouseLeave = useCallback(() => {
    if (disabled) return;
    setIsPressed(false);
  }, [disabled]);

  // 按压反馈样式
  const pressAnimation = {
    scale: isPressed ? 0.95 : 1,
    y: isPressed ? 2 : 0,
    transition: { type: "spring", stiffness: 400, damping: 25 }
  };

  // 发光效果
  const glowAnimation = {
    boxShadow: isPressed 
      ? `0 0 20px ${color}40, 0 0 40px ${color}20` 
      : '0 0 0px transparent',
    transition: { duration: 0.2 }
  };

  // 高亮效果
  const highlightAnimation = {
    backgroundColor: isPressed ? `${color}20` : 'transparent',
    transition: { duration: 0.1 }
  };

  // 缩放效果
  const scaleAnimation = {
    scale: isPressed ? 1.05 : 1,
    transition: { type: "spring", stiffness: 300, damping: 20 }
  };

  // 根据类型选择动画
  const getAnimation = () => {
    switch (type) {
      case 'press':
        return pressAnimation;
      case 'glow':
        return { ...pressAnimation, ...glowAnimation };
      case 'highlight':
        return { ...pressAnimation, ...highlightAnimation };
      case 'scale':
        return scaleAnimation;
      case 'ripple':
        return pressAnimation;
      default:
        return pressAnimation;
    }
  };

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={containerRef}
      className={`relative overflow-hidden touch-manipulation select-none ${className}`}
      {...getAnimation()}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ touchAction: 'manipulation' }}
    >
      {children}

      {/* 波纹效果 */}
      <AnimatePresence>
        {type === 'ripple' && ripples.map(ripple => (
          <motion.div
            key={ripple.id}
            className="absolute pointer-events-none rounded-full"
            style={{
              left: ripple.x - ripple.size / 2,
              top: ripple.y - ripple.size / 2,
              width: ripple.size,
              height: ripple.size,
              backgroundColor: color,
            }}
            initial={{ 
              scale: 0, 
              opacity: 0.6,
            }}
            animate={{ 
              scale: 1, 
              opacity: 0,
            }}
            exit={{ 
              scale: 1.2, 
              opacity: 0,
            }}
            transition={{ 
              duration: duration / 1000,
              ease: "easeOut",
            }}
          />
        ))}
      </AnimatePresence>

      {/* 按压指示器 */}
      <AnimatePresence>
        {isPressed && type !== 'ripple' && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, ${color}20 0%, transparent 70%)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TouchFeedback;

// 多点触摸反馈组件
export const MultiTouchFeedback: React.FC<{
  children: React.ReactNode;
  maxTouches?: number;
  onTouchCountChange?: (count: number) => void;
  className?: string;
}> = ({ 
  children, 
  maxTouches = 2, 
  onTouchCountChange,
  className = ''
}) => {
  const [touchCount, setTouchCount] = useState(0);
  const [touchPoints, setTouchPoints] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touches = Array.from(e.touches).map(touch => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
    }));

    setTouchCount(touches.length);
    setTouchPoints(touches);
    onTouchCountChange?.(touches.length);

    if (touches.length <= maxTouches) {
      // 触觉反馈
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }
    }

    e.preventDefault();
  }, [maxTouches, onTouchCountChange]);

  const handleTouchEnd = useCallback(() => {
    setTouchCount(0);
    setTouchPoints([]);
    onTouchCountChange?.(0);
  }, [onTouchCountChange]);

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {children}
      
      {/* 触摸点指示器 */}
      {touchCount > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {touchPoints.map(point => (
            <motion.div
              key={point.id}
              className="absolute luckymart-size-md luckymart-size-md bg-blue-500/30 rounded-full border-2 border-blue-500"
              style={{
                left: point.x - 12,
                top: point.y - 12,
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            />
          ))}
        </div>
      )}
      
      {/* 多点触摸提示 */}
      {touchCount > maxTouches && (
        <motion.div
          className="absolute top-2 left-1/2 transform -translate-x-1/2 luckymart-bg-error text-white text-xs px-2 py-1 rounded-full"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          最多支持 {maxTouches} 点触摸
        </motion.div>
      )}
    </div>
  );
};

// 区域触摸反馈组件
export const AreaTouchFeedback: React.FC<{
  children: React.ReactNode;
  areas: Array<{
    id: string;
    x: number; // 百分比
    y: number; // 百分比
    width: number; // 百分比
    height: number; // 百分比
    feedback?: 'light' | 'medium' | 'heavy';
    onTap?: () => void;
  }>;
  className?: string;
}> = ({ children, areas, className = '' }) => {
  const [activeArea, setActiveArea] = useState<string | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;

    // 检查触摸点是否在指定区域内
    const hitArea = areas.find(area => 
      x >= area.x && 
      x <= area.x + area.width && 
      y >= area.y && 
      y <= area.y + area.height
    );

    if (hitArea) {
      setActiveArea(hitArea.id);
      
      // 触觉反馈
      const vibrationMap = { light: 10, medium: 20, heavy: 30 };
      if ('vibrate' in navigator) {
        navigator.vibrate(vibrationMap[hitArea.feedback || 'light']);
      }

      hitArea.onTap?.();
      e.preventDefault();
    }
  }, [areas]);

  const handleTouchEnd = useCallback(() => {
    setActiveArea(null);
  }, []);

  return (
    <div 
      className={`relative ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {children}
      
      {/* 活动区域高亮 */}
      {activeArea && (
        <div className="absolute pointer-events-none">
          {areas.map(area => {
            if (area.id === activeArea) {
              return (
                <motion.div
                  key={area.id}
                  className="absolute border-2 border-blue-500 bg-blue-500/10 luckymart-rounded"
                  style={{
                    left: `${area.x}%`,
                    top: `${area.y}%`,
                    width: `${area.width}%`,
                    height: `${area.height}%`,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
};