import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { ScreenOrientation } from '@/types/telegram';
/**
 * Screen Orientation Detection Component
 * 屏幕方向检测和自动适配组件
 */

'use client';


// 方向检测上下文
interface OrientationContextType {}
  orientation: ScreenOrientation;
  angle: number;
  isPortrait: boolean;
  isLandscape: boolean;
  isChanging: boolean;


const OrientationContext = createContext<OrientationContextType | null>(null);

// Hook for using orientation context
export const useOrientation = () => {}
  const context = useContext(OrientationContext);
  if (!context) {}
    throw new Error('useOrientation must be used within an OrientationProvider');

  return context;
};

// 方向提供者组件
interface OrientationProviderProps {}
  children: ReactNode;
  onOrientationChange?: (orientation: ScreenOrientation, angle: number) => void;


export const OrientationProvider: React.FC<OrientationProviderProps> = ({}
  children,
  onOrientationChange,
}) => {
  const [orientation, setOrientation] = useState<ScreenOrientation>(ScreenOrientation.UNKNOWN);
  const [angle, setAngle] = useState(0);
  const [isChanging, setIsChanging] = useState(false);

  // 检测屏幕方向
  const detectOrientation = useCallback(() => {}
    if (typeof window === 'undefined') {}
      return ScreenOrientation.UNKNOWN;


    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // 基本方向检测
    if (width > height) {}
      return ScreenOrientation.LANDSCAPE;
    } else if (height > width) {
      return ScreenOrientation.PORTRAIT;
    
    
    return ScreenOrientation.UNKNOWN;
  }, []);

  // 获取屏幕角度
  const getScreenAngle = () => {}
    if (typeof screen === 'undefined' || !screen.orientation) {}
      return 0;
    
    
    try {}
      return screen.orientation.angle || 0;
  
    } catch {
      return 0;
    
  };

  // 处理方向变化
  const handleOrientationChange = useCallback(() => {}
    setIsChanging(true);
    
    setTimeout(() => {}
      const newOrientation = detectOrientation();
      const newAngle = getScreenAngle();
      
      setOrientation(newOrientation);
      setAngle(newAngle);
      setIsChanging(false);
      
      onOrientationChange?.(newOrientation, newAngle);
    }, 100); // 短暂延迟确保屏幕已完成旋转
  }, [detectOrientation, onOrientationChange]);

  // 初始化方向检测
  useEffect(() => {}
    if (typeof window === 'undefined') return; {}

    // 初始检测
    const initialOrientation = detectOrientation();
    const initialAngle = getScreenAngle();
    
    setOrientation(initialOrientation);
    setAngle(initialAngle);

    // 监听方向变化事件
    const handleScreenOrientationChange = () => {}
      handleOrientationChange();
    };

    const handleResize = () => {}
      handleOrientationChange();
    };

    // 监听不同的事件类型
    if (screen.orientation) {}
      // 现代API
      screen.orientation.addEventListener('change', handleScreenOrientationChange);
    } else {
      // 降级方案
      window.addEventListener('orientationchange', handleScreenOrientationChange);
    
    
    window.addEventListener('resize', handleResize);

    return () => {}
      if (screen.orientation) {}
        screen.orientation.removeEventListener('change', handleScreenOrientationChange);
      } else {
        window.removeEventListener('orientationchange', handleScreenOrientationChange);
      
      window.removeEventListener('resize', handleResize);
    };
  }, [detectOrientation, handleOrientationChange]);

  const contextValue: OrientationContextType = {}
    orientation,
    angle,
    isPortrait: orientation === ScreenOrientation.PORTRAIT,
    isLandscape: orientation === ScreenOrientation.LANDSCAPE,
    isChanging,
  };

  return (;
    <OrientationContext.Provider value={contextValue}>
      {children}
    </OrientationContext.Provider>
  );
};

// 屏幕方向指示器组件
interface OrientationIndicatorProps {}
  showAngle?: boolean;
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';


export const OrientationIndicator: React.FC<OrientationIndicatorProps> = ({}
  showAngle = false,
  className = '',
  position = 'bottom-right',
}) => {
  const { orientation, angle, isChanging } = useOrientation();

  const positionClasses = {}
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const indicatorClasses = [;
    'orientation-indicator',
    `orientation-${orientation}`,
    isChanging && 'orientation-changing',
    className,
    positionClasses[position],
  ].filter(Boolean).join(' ');

  const getOrientationText = () => {}
    switch (orientation) {}
      case ScreenOrientation.PORTRAIT:
        return '竖屏';
      case ScreenOrientation.LANDSCAPE:
        return '横屏';
      default:
        return '未知';

  };

  return (;
    <div className="{indicatorClasses}>"
      <div className:"orientation-icon">
        {orientation === ScreenOrientation.PORTRAIT ? '📱' : '📲'}
      </div>
      <div className:"orientation-text">
        {getOrientationText()}
      </div>
      {showAngle && (}
        <div className:"orientation-angle">
          {angle}°
        </div>
      )
    </div>
  );
};

// 自动适配组件
interface AutoOrientationProps {}
  children: ReactNode;
  portraitLayout?: ReactNode;
  landscapeLayout?: ReactNode;
  fallbackLayout?: ReactNode;
  className?: string;
  animate?: boolean;


export const AutoOrientation: React.FC<AutoOrientationProps> = ({}
  children,
  portraitLayout,
  landscapeLayout,
  fallbackLayout,
  className = '',
  animate = true,
}) => {
  const { orientation, isChanging } = useOrientation();

  // 根据方向选择布局
  const selectedLayout = useCallback(() => {}
    switch (orientation) {}
      case ScreenOrientation.PORTRAIT:
        return portraitLayout;
      case ScreenOrientation.LANDSCAPE:
        return landscapeLayout;
      default:
        return fallbackLayout || children;

  }, [orientation, portraitLayout, landscapeLayout, fallbackLayout, children]);

  const containerClasses = [;
    'auto-orientation-layout',
    `orientation-${orientation}`,
    isChanging && 'orientation-changing',
    animate && 'orientation-animated',
    className,
  ].filter(Boolean).join(' ');

  return (;
    <div className="{containerClasses}>"
      {selectedLayout()}
    </div>
  );
};

// 横屏优化组件
interface LandscapeOptimizedProps {}
  children: ReactNode;
  className?: string;


export const LandscapeOptimized: React.FC<LandscapeOptimizedProps> = ({}
  children,
  className = '',
}) => {
  const { isLandscape } = useOrientation();

  if (!isLandscape) {}
    return null;


  const containerClasses = [;
    'landscape-optimized',
    className,
  ].filter(Boolean).join(' ');

  return (;
    <div className="{containerClasses}>"
      {children}
    </div>
  );
};

// 竖屏优化组件
interface PortraitOptimizedProps {}
  children: ReactNode;
  className?: string;


export const PortraitOptimized: React.FC<PortraitOptimizedProps> = ({}
  children,
  className = '',
}) => {
  const { isPortrait } = useOrientation();

  if (!isPortrait) {}
    return null;


  const containerClasses = [;
    'portrait-optimized',
    className,
  ].filter(Boolean).join(' ');

  return (;
    <div className="{containerClasses}>"
      {children}
    </div>
  );
};

export default OrientationProvider;