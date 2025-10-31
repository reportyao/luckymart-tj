/**
 * Responsive Layout Component
 * 响应式布局组件，支持横竖屏适配和Telegram环境优化
 */

'use client';

import React, { useEffect, useState, useMemo, ReactNode } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
import { ScreenOrientation, DeviceInfo } from '@/types/telegram';

interface ResponsiveLayoutProps {
  children: ReactNode;
  className?: string;
  showDebugInfo?: boolean;
}

// 断点配置
const BREAKPOINTS = {
  xs: 320,    // 小屏手机
  sm: 768,    // 大屏手机
  md: 1024,   // 平板
  lg: 1440,   // 桌面
  xl: 1920,   // 大屏幕
};

// 方向配置
const ORIENTATIONS = {
  portrait: { maxWidth: 768 },
  landscape: { minWidth: 769 },
};

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  className = '',
  showDebugInfo = false,
}) => {
  const { deviceInfo } = useTelegram();
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  // 更新尺寸
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    window.addEventListener('orientationchange', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('orientationchange', updateDimensions);
    };
  }, []);

  // 计算断点
  const currentBreakpoint = useMemo(() => {
    const width = dimensions.width;
    
    if (width >= BREAKPOINTS.xl) return 'xl';
    if (width >= BREAKPOINTS.lg) return 'lg';
    if (width >= BREAKPOINTS.md) return 'md';
    if (width >= BREAKPOINTS.sm) return 'sm';
    return 'xs';
  }, [dimensions.width]);

  // 计算屏幕方向
  const screenOrientation = useMemo(() => {
    return dimensions.width > dimensions.height 
      ? ScreenOrientation.LANDSCAPE 
      : ScreenOrientation.PORTRAIT;
  }, [dimensions.width, dimensions.height]);

  // 设备信息
  const deviceType = useMemo(() => {
    const { isMobile, isTablet, isDesktop } = deviceInfo;
    
    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    if (isDesktop) return 'desktop';
    return 'unknown';
  }, [deviceInfo]);

  // 容器类名生成
  const containerClasses = useMemo(() => {
    const classes = ['responsive-layout'];
    
    // 断点类名
    classes.push(`breakpoint-${currentBreakpoint}`);
    
    // 方向类名
    classes.push(`orientation-${screenOrientation}`);
    
    // 设备类型类名
    classes.push(`device-${deviceType}`);
    
    // Telegram环境类名
    if (deviceInfo.isTelegram) {
      classes.push('telegram-environment');
    }
    
    // 微信环境类名
    if (deviceInfo.isWeChat) {
      classes.push('wechat-environment');
    }
    
    // 自定义类名
    if (className) {
      classes.push(className);
    }
    
    return classes.join(' ');
  }, [currentBreakpoint, screenOrientation, deviceType, deviceInfo.isTelegram, deviceInfo.isWeChat, className]);

  // 调试信息
  const debugInfo = useMemo(() => {
    if (!showDebugInfo) return null;
    
    return {
      width: dimensions.width,
      height: dimensions.height,
      breakpoint: currentBreakpoint,
      orientation: screenOrientation,
      deviceType,
      isTelegram: deviceInfo.isTelegram,
      isWeChat: deviceInfo.isWeChat,
      userAgent: deviceInfo.userAgent,
    };
  }, [dimensions, currentBreakpoint, screenOrientation, deviceType, deviceInfo, showDebugInfo]);

  return (
    <>
      <div className={containerClasses}>
        <div className="responsive-content">
          {children}
        </div>
      </div>
      
      {/* 调试信息 */}
      {showDebugInfo && debugInfo && (
        <div className="debug-info fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-2 rounded text-xs font-mono z-50 max-w-xs">
          <div className="space-y-1">
            <div><strong>Size:</strong> {debugInfo.width} × {debugInfo.height}</div>
            <div><strong>Breakpoint:</strong> {debugInfo.breakpoint}</div>
            <div><strong>Orientation:</strong> {debugInfo.orientation}</div>
            <div><strong>Device:</strong> {debugInfo.deviceType}</div>
            <div><strong>Telegram:</strong> {debugInfo.isTelegram ? 'Yes' : 'No'}</div>
            <div><strong>WeChat:</strong> {debugInfo.isWeChat ? 'Yes' : 'No'}</div>
            <div className="text-xs opacity-70 break-all">{debugInfo.userAgent}</div>
          </div>
        </div>
      )}
    </>
  );
};

export default ResponsiveLayout;