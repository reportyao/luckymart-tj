// 向后兼容的hooks - 将旧的useLanguage映射到i18next
'use client';

import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import type { ReactNode } from 'react';

type Language = 'zh' | 'en' | 'ru' | 'tg';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isLoading: boolean;
}

// 语言代码映射：旧格式 -> 新格式
const LANG_MAP: Record<Language, string> = {
  zh: 'zh-CN',
  en: 'en-US',
  ru: 'ru-RU',
  tg: 'tg-TJ',
};

// 反向映射：新格式 -> 旧格式
const REVERSE_LANG_MAP: Record<string, Language> = {
  'zh-CN': 'zh',
  'en-US': 'en',
  'ru-RU': 'ru',
  'tg-TJ': 'tg',
};

/**
 * 向后兼容的useLanguage hook
 * 将现有的简单语言代码映射到i18next的完整语言代码
 */
export function useLanguage(): LanguageContextType {
  const { t: i18nT, i18n } = useTranslation();
  
  // 获取当前语言（映射到旧格式）
  const currentLang = i18n.language || 'tg-TJ';
  const language = REVERSE_LANG_MAP[currentLang] || 'tg';
  
  // 设置语言函数
  const setLanguage = useCallback(async (lang: Language) => {
    const newLang = LANG_MAP[lang] || 'tg-TJ';
    await i18n.changeLanguage(newLang);
  }, [i18n]);
  
  // 翻译函数 - 支持旧的点号key格式
  const t = useCallback((key: string): string => {
    // 处理旧的翻译key格式（如 'home.title'）
    // i18next使用冒号分隔命名空间 (如 'common:home.title')
    
    // 如果key已经包含命名空间，直接使用
    if (key.includes(':')) {
      return i18nT(key);
    }
    
    // 否则，尝试从common命名空间获取
    const translatedText = i18nT(`common:${key}`);
    
    // 如果翻译失败（返回key本身），尝试不带命名空间
    if (translatedText === `common:${key}`) {
      return i18nT(key);
    }
    
    return translatedText;
  }, [i18nT]);
  
  return {
    language,
    setLanguage,
    t,
    isLoading: !i18n.isInitialized,
  };
}

// 导出旧的Provider供现有代码使用
export function LanguageProvider({ children }: { children: ReactNode }) {
  // 不再需要Provider逻辑，因为I18nProvider已经提供了i18next上下文
  // 这里只是为了向后兼容
  return children;
}
