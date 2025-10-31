'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/src/i18n/config';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const currentLang = i18n.language || 'tg-TJ';
  const currentLangInfo = SUPPORTED_LANGUAGES[currentLang as SupportedLanguage] || SUPPORTED_LANGUAGES['tg-TJ'];

  const handleLanguageChange = async (langCode: string) => {
    if (isChanging || langCode === currentLang) return;
    
    setIsChanging(true);
    try {
      await i18n.changeLanguage(langCode);
      setIsOpen(false);
      
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
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isChanging}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="选择语言"
      >
        <span className="text-xl" aria-hidden="true">{currentLangInfo.flag}</span>
        <span className="text-sm font-medium">{currentLangInfo.nativeName}</span>
        {isChanging ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg 
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-xl border dark:border-gray-700 z-20 overflow-hidden">
            {Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => (
              <button
                key={code}
                onClick={() => handleLanguageChange(code)}
                disabled={isChanging}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50 ${
                  currentLang === code ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' : ''
                }`}
                aria-label={`切换到${info.nativeName}`}
              >
                <span className="text-xl" aria-hidden="true">{info.flag}</span>
                <span className="font-medium">{info.nativeName}</span>
                {currentLang === code && (
                  <svg className="w-5 h-5 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
