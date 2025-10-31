/**
 * Telegram Mini App Context Provider
 * 为LuckyMart TJ平台提供完整的Telegram集成管理
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import {
  TelegramContextType,
  TelegramUser,
  TelegramTheme,
  ThemeMode,
  ScreenOrientation,
  DeviceInfo,
  KeyboardState,
  TelegramMainButtonParams,
} from '@/types/telegram';

// 创建 Telegram 上下文
const TelegramContext = createContext<TelegramContextType | null>(null);

// 设备检测函数
const detectDeviceInfo = (): DeviceInfo => {
  if (typeof window === 'undefined') {
    return {
      isTelegram: false,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      screenOrientation: ScreenOrientation.UNKNOWN,
      viewportWidth: 1024,
      viewportHeight: 768,
      pixelRatio: 1,
      userAgent: '',
      platform: 'server',
      isIOS: false,
      isAndroid: false,
      isWeChat: false,
      isTelegramWebView: false,
    };
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // 检测Telegram环境
  const isTelegram = window.Telegram?.WebApp ? true : userAgent.includes('telegram');
  const isTelegramWebView = userAgent.includes('tg');
  
  // 检测移动设备
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
  const isDesktop = !isMobile && !isTablet;
  
  // 检测操作系统
  const isIOS = /iphone|ipad|ipod/i.test(userAgent);
  const isAndroid = /android/i.test(userAgent);
  
  // 检测微信内置浏览器
  const isWeChat = /micromessenger/i.test(userAgent);
  
  // 检测屏幕方向
  const orientation = width > height ? ScreenOrientation.LANDSCAPE : ScreenOrientation.PORTRAIT;
  
  return {
    isTelegram,
    isMobile,
    isTablet,
    isDesktop,
    screenOrientation: orientation,
    viewportWidth: width,
    viewportHeight: height,
    pixelRatio: window.devicePixelRatio || 1,
    userAgent: navigator.userAgent,
    platform,
    isIOS,
    isAndroid,
    isWeChat,
    isTelegramWebView,
  };
};

// Telegram主题转换函数
const convertTelegramTheme = (webApp: any, mode: ThemeMode): TelegramTheme => {
  if (!webApp || !webApp.themeParams) {
    // 默认主题
    return {
      mode,
      colors: {
        background: mode === ThemeMode.DARK ? '#1a1a1a' : '#ffffff',
        foreground: mode === ThemeMode.DARK ? '#ffffff' : '#171717',
        primary: '#007bff',
        secondary: '#6c757d',
        accent: '#28a745',
        muted: '#f8f9fa',
        border: '#dee2e6',
        success: '#28a745',
        warning: '#ffc107',
        error: '#dc3545',
        info: '#17a2b8',
      },
      isTelegramTheme: false,
    };
  }

  const params = webApp.themeParams;
  
  return {
    mode,
    colors: {
      background: params.bg_color || (mode === ThemeMode.DARK ? '#1a1a1a' : '#ffffff'),
      foreground: params.text_color || (mode === ThemeMode.DARK ? '#ffffff' : '#171717'),
      primary: params.button_color || '#007bff',
      secondary: params.secondary_bg_color || '#6c757d',
      accent: params.link_color || '#28a745',
      muted: params.secondary_bg_color || '#f8f9fa',
      border: params.secondary_bg_color || '#dee2e6',
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545',
      info: '#17a2b8',
    },
    isTelegramTheme: true,
  };
};

// 键盘状态管理Hook
const useKeyboardState = () => {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isVisible: false,
    height: 0,
    type: 'none' as any,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateKeyboardState = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      const heightDiff = windowHeight - viewportHeight;
      
      setKeyboardState({
        isVisible: heightDiff > 0,
        height: Math.abs(heightDiff),
        type: 'text' as any, // 默认类型，实际应用中可以根据输入框焦点动态设置
      });
    };

    // 初始化键盘状态
    updateKeyboardState();

    // 监听视口变化
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateKeyboardState);
      return () => window.visualViewport.removeEventListener('resize', updateKeyboardState);
    } else {
      window.addEventListener('resize', updateKeyboardState);
      return () => window.removeEventListener('resize', updateKeyboardState);
    }
  }, []);

  return keyboardState;
};

// Provider组件
interface TelegramProviderProps {
  children: ReactNode;
}

export const TelegramProvider: React.FC<TelegramProviderProps> = ({ children }) => {
  const [webApp, setWebApp] = useState<any>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>(ThemeMode.SYSTEM);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [deviceInfo] = useState<DeviceInfo>(() => detectDeviceInfo());
  const [keyboardState] = useState<KeyboardState>(() => useKeyboardState());
  const [theme, setTheme] = useState<TelegramTheme>(() => 
    convertTelegramTheme(null, ThemeMode.SYSTEM)
  );

  // 主题模式变更处理
  const handleThemeModeChange = useCallback((mode: ThemeMode) => {
    setThemeMode(mode);
    
    // 保存用户偏好
    if (typeof window !== 'undefined') {
      localStorage.setItem('luckymart-tj-theme-mode', mode);
    }
    
    // 更新主题
    setTheme(convertTelegramTheme(webApp, mode));
  }, [webApp]);

  // Telegram Web App 初始化
  useEffect(() => {
    const initTelegramWebApp = async () => {
      try {
        setIsLoading(true);
        
        if (typeof window === 'undefined') {
          setIsLoading(false);
          return;
        }

        // 等待 Telegram Web App 加载
        const telegram = (window as any).Telegram?.WebApp;
        
        if (!telegram) {
          // 非Telegram环境，使用系统设置
          const savedTheme = localStorage.getItem('luckymart-tj-theme-mode');
          const initialMode = savedTheme as ThemeMode || ThemeMode.SYSTEM;
          handleThemeModeChange(initialMode);
          setIsLoading(false);
          return;
        }

        // 初始化 Telegram Web App
        await new Promise<void>((resolve) => {
          telegram.ready();
          resolve();
        });

        setWebApp(telegram);
        setUser(telegram.initDataUnsafe?.user || null);

        // 确定初始主题模式
        let initialMode: ThemeMode;
        const savedTheme = localStorage.getItem('luckymart-tj-theme-mode');
        
        if (savedTheme) {
          initialMode = savedTheme as ThemeMode;
        } else {
          // 跟随系统或Telegram主题
          initialMode = ThemeMode.SYSTEM;
        }

        handleThemeModeChange(initialMode);

        // 监听主题变化
        const handleThemeChange = () => {
          setTheme(convertTelegramTheme(telegram, themeMode));
        };

        telegram.onEvent('themeChanged', handleThemeChange);

        setIsLoading(false);
      } catch (err) {
        console.error('Telegram Web App 初始化失败:', err);
        setError('初始化失败');
        setIsLoading(false);
      }
    };

    initTelegramWebApp();

    return () => {
      if (webApp) {
        webApp.offEvent('themeChanged');
      }
    };
  }, [handleThemeModeChange]);

  // 触觉反馈
  const hapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => {
    if (webApp?.HapticFeedback) {
      webApp.HapticFeedback.impactOccurred(type);
    }
  }, [webApp]);

  // 显示通知
  const showNotification = useCallback((type: 'error' | 'success' | 'warning', message: string) => {
    if (webApp?.HapticFeedback) {
      webApp.HapticFeedback.notificationOccurred(type);
    }
    
    if (type === 'error') {
      webApp?.showAlert?.(message);
    } else {
      // 轻量级通知，可以改为更优雅的toast
      console.log(`[${type}] ${message}`);
    }
  }, [webApp]);

  // 主按钮控制
  const showMainButton = useCallback((params: TelegramMainButtonParams) => {
    if (webApp?.MainButton) {
      webApp.MainButton.setParams(params);
      webApp.MainButton.show();
    }
  }, [webApp]);

  const hideMainButton = useCallback(() => {
    if (webApp?.MainButton) {
      webApp.MainButton.hide();
    }
  }, [webApp]);

  // 分享功能
  const shareContent = useCallback(async (data: { url?: string; text?: string; title?: string }) => {
    if (webApp) {
      if (data.url && webApp.openTelegramLink) {
        webApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(data.url)}&text=${encodeURIComponent(data.text || '')}`);
      }
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: data.title || 'LuckyMart TJ',
          text: data.text || '',
          url: data.url || window.location.href,
        });
      } catch (err) {
        console.error('分享失败:', err);
      }
    }
  }, [webApp]);

  // 保存到Telegram
  const saveToTelegram = useCallback(async (data: any, callback?: () => void) => {
    if (webApp?.CloudStorage) {
      const timestamp = Date.now();
      const key = `luckymart-save-${timestamp}`;
      
      webApp.CloudStorage.setItem(key, JSON.stringify(data), (error?: string) => {
        if (error) {
          console.error('保存到Telegram云存储失败:', error);
          showNotification('error', '保存失败');
        } else {
          showNotification('success', '已保存到Telegram');
          callback?.();
        }
      });
    }
  }, [webApp, showNotification]);

  // 初始化系统主题检测
  useEffect(() => {
    if (themeMode === ThemeMode.SYSTEM && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
        const newMode = e.matches ? ThemeMode.DARK : ThemeMode.LIGHT;
        setTheme(convertTelegramTheme(webApp, newMode));
      };

      mediaQuery.addEventListener('change', handleSystemThemeChange);
      
      // 设置初始主题
      const initialMode = mediaQuery.matches ? ThemeMode.DARK : ThemeMode.LIGHT;
      setTheme(convertTelegramTheme(webApp, initialMode));
      
      return () => {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      };
    }
  }, [themeMode, webApp]);

  const contextValue: TelegramContextType = {
    webApp,
    user,
    theme,
    deviceInfo,
    themeMode,
    isLoading,
    error,
    setThemeMode: handleThemeModeChange,
    showMainButton,
    hideMainButton,
    hapticFeedback,
    showNotification,
    shareContent,
    saveToTelegram,
  };

  return (
    <TelegramContext.Provider value={contextValue}>
      {children}
    </TelegramContext.Provider>
  );
};

// Hook for using Telegram context
export const useTelegram = (): TelegramContextType => {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
};

export default TelegramProvider;