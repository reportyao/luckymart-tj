/**
 * Telegram Theme Provider
 * 为主题切换和Telegram样式提供统一管理
 */

'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
import { ThemeMode } from '@/types/telegram';

interface ThemeProviderProps {
  children: React.ReactNode;
}

interface ThemeContextType {
  theme: 'light' | 'dark';
  colors: Record<string, string>;
  isTelegramTheme: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { theme, themeMode } = useTelegram();

  // 更新CSS变量
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    
    // 设置基本CSS变量
    root.style.setProperty('--background', theme.colors.background);
    root.style.setProperty('--foreground', theme.colors.foreground);
    root.style.setProperty('--primary', theme.colors.primary);
    root.style.setProperty('--secondary', theme.colors.secondary);
    root.style.setProperty('--accent', theme.colors.accent);
    root.style.setProperty('--muted', theme.colors.muted);
    root.style.setProperty('--border', theme.colors.border);
    root.style.setProperty('--success', theme.colors.success);
    root.style.setProperty('--warning', theme.colors.warning);
    root.style.setProperty('--error', theme.colors.error);
    root.style.setProperty('--info', theme.colors.info);

    // 添加主题类
    root.classList.remove('light', 'dark');
    root.classList.add(theme.mode === ThemeMode.DARK ? 'dark' : 'light');

    // Telegram主题特殊处理
    if (theme.isTelegramTheme) {
      root.classList.add('telegram-theme');
    } else {
      root.classList.remove('telegram-theme');
    }
  }, [theme]);

  const contextValue: ThemeContextType = {
    theme: theme.mode === ThemeMode.DARK ? 'dark' : 'light',
    colors: theme.colors,
    isTelegramTheme: theme.isTelegramTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;