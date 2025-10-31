'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/src/i18n/config';
import MobileLanguageBottomSheet from './MobileLanguageBottomSheet';

/**
 * 移动端语言切换器组件属性
 */
interface LanguageSwitcherMobileProps {
  /** 自定义CSS类名 */
  className?: string;
  /** 语言改变时的回调函数 */
  onLanguageChange?: (language: string) => void;
  /** 是否显示底部弹窗 */
  showBottomSheet?: boolean;
}

const LanguageSwitcherMobile: React.FC<LanguageSwitcherMobileProps> = ({
  className = '',
  onLanguageChange,
  showBottomSheet = true
}) => {
  const { i18n, t } = useTranslation(['common', 'settings']);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const currentLang = i18n.language || 'tg-TJ';
  const currentLangInfo = SUPPORTED_LANGUAGES[currentLang as SupportedLanguage] || SUPPORTED_LANGUAGES['tg-TJ'];

  const handleLanguageChange = async (langCode: string) => {
    if (isChanging || langCode === currentLang) return;
    
    setIsChanging(true);
    try {
      await i18n.changeLanguage(langCode);
      
      // 同步语言偏好到服务器
      try {
        await fetch('/api/user/language', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: langCode }),
        });
      } catch (error) {
        console.warn('同步语言偏好失败:', error);
      }
    } catch (error) {
      console.error('语言切换失败:', error);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <>
      {/* 移动端语言切换按钮 */}
      <button
        onClick={() => setIsSheetOpen(true)}
        disabled={isChanging}
        className={`language-switcher-mobile flex items-center gap-3 w-full p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 min-h-[44px] active:scale-[0.98] shadow-sm hover:shadow-md ${className}`}
        aria-label={t('common:settings.select_language')}
      >
        {/* 语言标志 */}
        <div className="text-2xl flex-shrink-0" aria-hidden="true">
          {currentLangInfo.flag}
        </div>
        
        {/* 语言信息 */}
        <div className="flex-1 text-left">
          <div className="luckymart-font-medium text-gray-900 dark:text-white text-base">
            {currentLangInfo.nativeName}
          </div>
          <div className="luckymart-text-sm luckymart-text-secondary dark:text-gray-400">
            {currentLangInfo.name}
          </div>
        </div>

        {/* 状态指示器 */}
        <div className="flex-shrink-0">
          {isChanging ? (
            <svg className="luckymart-size-md luckymart-size-md luckymart-animation-spin text-purple-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg 
              className="luckymart-size-md luckymart-size-md text-gray-400 transition-transform duration-200" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </button>

      {/* 底部语言选择弹窗 */}
      {showBottomSheet && (
        <MobileLanguageBottomSheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          currentLanguage={currentLang}
          onLanguageChange={(lang) => {
            handleLanguageChange(lang);
            onLanguageChange?.(lang);
          }}
          isChanging={isChanging}
        />
      )}
    </>
  );
};

export default LanguageSwitcherMobile;