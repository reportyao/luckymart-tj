'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/src/i18n/useLanguageCompat';

/**
 * 动态设置HTML lang和dir属性的组件
 * 确保根据当前语言正确设置文档方向
 */
function LanguageAttributes() {
  const { i18n } = useTranslation();
  const { language } = useLanguage();

  useEffect(() => {
    // 从完整语言代码提取语言部分 (如 'tg-TJ' -> 'tg')
    const langCode = i18n.language.split('-')[0] || 'tg';
    
    // 获取语言方向配置
    // 注意：由于所有支持的语言都是LTR，这里简化处理
    // 如果将来支持RTL语言，需要添加方向映射表
    const dir = 'ltr'; // zh-CN, en-US, ru-RU, tg-TJ 都是LTR
    
    // 设置HTML属性
    const htmlElement = document.documentElement;
    htmlElement.setAttribute('lang', langCode);
    htmlElement.setAttribute('dir', dir);
    
    console.log(`语言属性已更新: lang="${langCode}", dir="${dir}"`);
  }, [i18n.language]);

  // 这个组件不渲染任何内容
  return null;
}