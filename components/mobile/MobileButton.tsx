'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { useHaptics } from '@/hooks/use-mobile-performance';

interface MobileButtonProps {
  children: React.ReactNode;
  onClick?: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  hapticFeedback?: boolean;
  rippleEffect?: boolean;
  debounceMs?: number;
  maxTouches?: number;
  touchArea?: 'normal' | 'large' | 'extra-large';
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  badge?: React.ReactNode | string | number;
}

const MobileButton: React.FC<MobileButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  hapticFeedback = true,
  rippleEffect = true,
  debounceMs = 300,
  maxTouches = 1,
  touchArea = 'normal',
  onTouchStart,
  onTouchEnd,
  icon,
  trailingIcon,
  badge,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [clickedAt, setClickedAt] = useState(0);
  const [touchCount, setTouchCount] = useState(0);
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const motionX = useMotionValue(0);
  const motionY = useMotionValue(0);
  const scale = useTransform(motionY, [0, 50], [1, 0.95]);
  const opacity = useTransform(motionY, [0, 50], [1, 0.8]);

  const haptics = useHaptics();

  // 防抖处理
  const lastClickRef = useRef(0);

  // 样式变体 - 直接定义，无需useMemo
  const variants = {
    primary: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300',
    success: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg',
    danger: 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg',
    ghost: 'text-purple-600 hover:bg-purple-50',
  };

  // 尺寸样式 - 直接定义
  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-3 text-base min-h-[44px]',
    lg: 'px-6 py-4 text-lg min-h-[52px]',
    xl: 'px-8 py-5 text-xl min-h-[60px]',
  };

  // 触摸区域样式 - 直接定义
  const touchAreas = {
    normal: '',
    large: 'min-h-[44px] min-w-[44px]',
    'extra-large': 'min-h-[56px] min-w-[56px] px-6',
  };

  // 波动效果
  const createRipple = (e: React.TouchEvent | React.MouseEvent) => {
    if (!rippleEffect || disabled || loading) return;

    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = 'touches' in e ? e.touches[0]?.clientX || 0 : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY || 0 : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const ripple = {
      id: Date.now() + Math.random(),
      x,
      y,
    };

    setRipples(prev => [...prev, ripple]);

    // 移除波动效果
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== ripple.id));
    }, 600);
  };

  // 触觉反馈
  const triggerHaptic = () => {
    if (hapticFeedback) {
      switch (variant) {
        case 'primary':
          haptics.light();
          break;
        case 'success':
          haptics.medium();
          break;
        case 'danger':
          haptics.heavy();
          break;
        default:
          haptics.light();
      }
    }
  };

  // 处理触摸开始
  const handleTouchStart = (e: React.TouchEvent) => {
    onTouchStart?.();
    setIsPressed(true);
    setTouchCount(e.touches.length);
    
    if (e.touches.length <= maxTouches) {
      createRipple(e);
      triggerHaptic();
      motionY.set(10);
    }
  };

  // 处理触摸结束
  const handleTouchEnd = (e: React.TouchEvent) => {
    onTouchEnd?.();
    setTouchCount(0);
    
    setTimeout(() => {
      setIsPressed(false);
      motionY.set(0);
    }, 100);

    // 检查是否还在触摸
    if (e.touches.length === 0 && touchCount <= maxTouches) {
      handleClick();
    }
  };

  // 处理鼠标事件
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // 只处理左键
    setIsPressed(true);
    createRipple(e);
    triggerHaptic();
    motionY.set(10);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
    motionY.set(0);
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
    motionY.set(0);
  };

  // 处理点击
  const handleClick = async () => {
    const now = Date.now();
    
    // 防抖检查
    if (now - lastClickRef.current < debounceMs) {
      return;
    }
    
    // 状态检查
    if (disabled || loading || touchCount > maxTouches) {
      return;
    }

    lastClickRef.current = now;
    setClickedAt(now);

    if (onClick) {
      try {
        await onClick();
      } catch (error) {
        console.error('按钮点击处理失败:', error);
      }
    }
  };

  // 键盘支持
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // 加载状态动画
  const LoadingSpinner = () => (
    <motion.div
      className="luckymart-size-sm luckymart-size-sm border-2 border-white border-t-transparent rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );

  // Badge 组件
  const Badge = () => {
    if (!badge) return null;

    return (
      <motion.span
        className="absolute -top-1 -right-1 min-w-[20px] luckymart-size-sm luckymart-bg-error text-white text-xs rounded-full luckymart-layout-flex luckymart-layout-center justify-center px-1"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500 }}
      >
        {typeof badge === 'number' && badge > 99 ? '99+' : badge}
      </motion.span>
    );
  };

  return (
    <motion.button
      ref={buttonRef}
      className={`
        relative inline-flex items-center justify-center gap-2 rounded-xl font-medium
        transition-all duration-200 ease-out select-none
        ${variants[variant]}
        ${sizes[size]}
        ${touchAreas[touchArea]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      disabled={disabled || loading}
      style={{ scale, opacity }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      whileTap={{ scale: disabled || loading ? 1 : 0.95 }}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      animate={{
        scale: isPressed ? 0.95 : 1,
        y: isPressed ? 2 : 0,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* 背景波动效果 */}
      {ripples.map(ripple => (
        <motion.div
          key={ripple.id}
          className="absolute bg-white/30 rounded-full pointer-events-none"
          style={{
            left: ripple.x - 50,
            top: ripple.y - 50,
            width: 100,
            height: 100,
          }}
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}

      {/* 内容 */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            className="luckymart-layout-flex luckymart-layout-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoadingSpinner />
            <span>加载中...</span>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            className="luckymart-layout-flex luckymart-layout-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {icon && <span className="flex-shrink-0">{icon}</span>}
            <span>{children}</span>
            {trailingIcon && <span className="flex-shrink-0">{trailingIcon}</span>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Badge */}
      <Badge />

      {/* 点击反馈动画 */}
      <AnimatePresence>
        {clickedAt > 0 && (
          <motion.div
            className="absolute inset-0 bg-white/20 rounded-xl"
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 1.2, opacity: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default MobileButton;

// 按钮组组件
export const ButtonGroup: React.FC<{
  children: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  gap?: string;
  className?: string;
}> = ({ children, direction = 'horizontal', gap = '2', className = '' }) => {
  const directionClass = direction === 'horizontal' ? 'flex-row' : 'flex-col';
  const gapClass = `gap-${gap}`;

  return (
    <div className={`flex ${directionClass} ${gapClass} ${className}`}>
      {children}
    </div>
  );
};

// 浮动操作按钮
export const FloatingActionButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  badge?: React.ReactNode | string | number;
}> = ({
  children,
  onClick,
  position = 'bottom-right',
  size = 'md',
  className = '',
  disabled = false,
  badge,
}) => {
  const positions = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  };

  return (
    <motion.button
      className={`
        fixed ${positions[position]} ${sizes[size]} 
        rounded-full bg-gradient-to-r from-purple-600 to-blue-600 
        text-white shadow-lg hover:shadow-xl 
        flex items-center justify-center
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {children}
      
      {badge && (
        <span className="absolute -top-1 -right-1 min-w-[20px] luckymart-size-sm luckymart-bg-error text-white text-xs rounded-full luckymart-layout-flex luckymart-layout-center justify-center px-1">
          {typeof badge === 'number' && badge > 99 ? '99+' : badge}
        </span>
      )}
    </motion.button>
  );
};