'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Language = 'zh' | 'en' | 'ru';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 翻译字典
const translations: Record<Language, Record<string, string>> = {
  zh: {
    // 首页
    'home.title': 'LuckyMart TJ 幸运集市',
    'home.subtitle': '1元夺宝，好运连连',
    'home.banner.title': '幸运夺宝，轻松中奖',
    'home.banner.subtitle': '超值商品，超低门槛，公平透明',
    'home.banner.button': '立即参与',
    'home.hot_products': '热门商品',
    'home.market_price': '市场价',
    'home.per_share': '每份',
    'home.total_shares': '总份数',
    'home.progress': '进度',
    'home.participate': '立即参与',
    
    // 导航
    'nav.home': '首页',
    'nav.orders': '我的订单',
    'nav.profile': '个人中心',
    'nav.resale': '转售市场',
    'nav.settings': '设置',
    'nav.transactions': '交易记录',
    'nav.withdraw': '提现',
    'nav.recharge': '充值',
    'nav.menu': '菜单',
    'nav.language': '语言设置',
    
    // 商品详情
    'product.detail': '商品详情',
    'product.description': '商品描述',
    'product.market_price': '市场价',
    'product.total_shares': '总份数',
    'product.price_per_share': '每份价格',
    'product.participation_progress': '参与进度',
    'product.remaining': '剩余',
    'product.select_shares': '选择份数',
    'product.need_coins': '需要',
    'product.participate_now': '立即参与',
    'product.participating': '参与中...',
    'product.recent_participations': '最近参与',
    'product.agree_rules': '参与即表示同意平台规则，祝您好运！',
    
    // 通用
    'common.loading': '加载中...',
    'common.shares': '份',
    'common.coins': '夺宝币',
    'common.tjs': 'TJS',
    'common.back': '返回',
    'common.confirm': '确认',
    'common.cancel': '取消',
  },
  en: {
    // Home
    'home.title': 'LuckyMart TJ',
    'home.subtitle': 'Win Big for Just $1',
    'home.banner.title': 'Lucky Draw, Easy Win',
    'home.banner.subtitle': 'Premium Products, Low Entry, Fair & Transparent',
    'home.banner.button': 'Join Now',
    'home.hot_products': 'Hot Products',
    'home.market_price': 'Market Price',
    'home.per_share': 'Per Share',
    'home.total_shares': 'Total Shares',
    'home.progress': 'Progress',
    'home.participate': 'Join Now',
    
    // Navigation
    'nav.home': 'Home',
    'nav.orders': 'My Orders',
    'nav.profile': 'Profile',
    'nav.resale': 'Resale Market',
    'nav.settings': 'Settings',
    'nav.transactions': 'Transactions',
    'nav.withdraw': 'Withdraw',
    'nav.recharge': 'Recharge',
    'nav.menu': 'Menu',
    'nav.language': 'Language',
    
    // Product Detail
    'product.detail': 'Product Detail',
    'product.description': 'Description',
    'product.market_price': 'Market Price',
    'product.total_shares': 'Total Shares',
    'product.price_per_share': 'Price per Share',
    'product.participation_progress': 'Participation Progress',
    'product.remaining': 'Remaining',
    'product.select_shares': 'Select Shares',
    'product.need_coins': 'Need',
    'product.participate_now': 'Join Now',
    'product.participating': 'Joining...',
    'product.recent_participations': 'Recent Participants',
    'product.agree_rules': 'By participating, you agree to the platform rules. Good luck!',
    
    // Common
    'common.loading': 'Loading...',
    'common.shares': 'shares',
    'common.coins': 'coins',
    'common.tjs': 'TJS',
    'common.back': 'Back',
    'common.confirm': 'Confirm',
    'common.cancel': 'Cancel',
  },
  ru: {
    // Главная
    'home.title': 'LuckyMart TJ Лотерея',
    'home.subtitle': 'Выиграй по 1 сомони',
    'home.banner.title': 'Лотерея удачи, легкий выигрыш',
    'home.banner.subtitle': 'Ценные товары, низкий порог, честно и прозрачно',
    'home.banner.button': 'Участвовать',
    'home.hot_products': 'Популярные товары',
    'home.market_price': 'Рыночная цена',
    'home.per_share': 'За долю',
    'home.total_shares': 'Всего долей',
    'home.progress': 'Прогресс',
    'home.participate': 'Участвовать',
    
    // Навигация
    'nav.home': 'Главная',
    'nav.orders': 'Мои заказы',
    'nav.profile': 'Профиль',
    'nav.resale': 'Вторичный рынок',
    'nav.settings': 'Настройки',
    'nav.transactions': 'Транзакции',
    'nav.withdraw': 'Вывод средств',
    'nav.recharge': 'Пополнение',
    'nav.menu': 'Меню',
    'nav.language': 'Язык',
    
    // Детали товара
    'product.detail': 'Детали товара',
    'product.description': 'Описание',
    'product.market_price': 'Рыночная цена',
    'product.total_shares': 'Всего долей',
    'product.price_per_share': 'Цена за долю',
    'product.participation_progress': 'Прогресс участия',
    'product.remaining': 'Осталось',
    'product.select_shares': 'Выберите доли',
    'product.need_coins': 'Требуется',
    'product.participate_now': 'Участвовать сейчас',
    'product.participating': 'Участие...',
    'product.recent_participations': 'Недавние участники',
    'product.agree_rules': 'Участвуя, вы соглашаетесь с правилами платформы. Удачи!',
    
    // Общее
    'common.loading': 'Загрузка...',
    'common.shares': 'долей',
    'common.coins': 'монет',
    'common.tjs': 'TJS',
    'common.back': 'Назад',
    'common.confirm': 'Подтвердить',
    'common.cancel': 'Отмена',
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('zh');
  const [isLoading, setIsLoading] = useState(false);

  // 从localStorage读取语言设置
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['zh', 'en', 'ru'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
  }, []);

  // 改进的语言切换函数
  const setLanguage = useCallback(async (lang: Language) => {
    if (lang === language) return;
    
    setIsLoading(true);
    
    try {
      setLanguageState(lang);
      localStorage.setItem('language', lang);
      
      // 触发自定义事件通知其他组件
      window.dispatchEvent(new CustomEvent('languageChange', { 
        detail: { language: lang } 
      }));
      
      // 可选：发送到服务器同步用户偏好
      await syncLanguagePreference(lang);
      
    } catch (error) {
      console.error('语言切换失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  // 翻译函数
  const t = useCallback((key: string): string => {
    return translations[language]?.[key] || key;
  }, [language]);

  // 同步语言偏好到服务器
  const syncLanguagePreference = async (lang: Language) => {
    try {
      await fetch('/api/user/language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang }),
      });
    } catch (error) {
      // 静默失败，不影响用户体验
      console.warn('同步语言偏好失败:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
