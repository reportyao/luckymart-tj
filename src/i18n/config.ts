import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 导入所有翻译文件
import zhCN_common from '../locales/zh-CN/common.json';
import zhCN_auth from '../locales/zh-CN/auth.json';
import zhCN_lottery from '../locales/zh-CN/lottery.json';
import zhCN_wallet from '../locales/zh-CN/wallet.json';
import zhCN_referral from '../locales/zh-CN/referral.json';
import zhCN_task from '../locales/zh-CN/task.json';
import zhCN_error from '../locales/zh-CN/error.json';
import zhCN_admin from '../locales/zh-CN/admin.json';

import enUS_common from '../locales/en-US/common.json';
import enUS_auth from '../locales/en-US/auth.json';
import enUS_lottery from '../locales/en-US/lottery.json';
import enUS_wallet from '../locales/en-US/wallet.json';
import enUS_referral from '../locales/en-US/referral.json';
import enUS_task from '../locales/en-US/task.json';
import enUS_error from '../locales/en-US/error.json';
import enUS_admin from '../locales/en-US/admin.json';

import ruRU_common from '../locales/ru-RU/common.json';
import ruRU_auth from '../locales/ru-RU/auth.json';
import ruRU_lottery from '../locales/ru-RU/lottery.json';
import ruRU_wallet from '../locales/ru-RU/wallet.json';
import ruRU_referral from '../locales/ru-RU/referral.json';
import ruRU_task from '../locales/ru-RU/task.json';
import ruRU_error from '../locales/ru-RU/error.json';
import ruRU_admin from '../locales/ru-RU/admin.json';

import tgTJ_common from '../locales/tg-TJ/common.json';
import tgTJ_auth from '../locales/tg-TJ/auth.json';
import tgTJ_lottery from '../locales/tg-TJ/lottery.json';
import tgTJ_wallet from '../locales/tg-TJ/wallet.json';
import tgTJ_referral from '../locales/tg-TJ/referral.json';
import tgTJ_task from '../locales/tg-TJ/task.json';
import tgTJ_error from '../locales/tg-TJ/error.json';
import tgTJ_admin from '../locales/tg-TJ/admin.json';

// 支持的语言列表
export const SUPPORTED_LANGUAGES = {
  'zh-CN': { 
    name: '中文', 
    nativeName: '中文', 
    flag: '🇨🇳',
    dir: 'ltr'
  },
  'en-US': { 
    name: 'English', 
    nativeName: 'English', 
    flag: '🇬🇧',
    dir: 'ltr'
  },
  'ru-RU': { 
    name: 'Russian', 
    nativeName: 'Русский', 
    flag: '🇷🇺',
    dir: 'ltr'
  },
  'tg-TJ': { 
    name: 'Tajik', 
    nativeName: 'Тоҷикӣ', 
    flag: '🇹🇯',
    dir: 'ltr'
  }
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// 组织翻译资源
const resources = {
  'zh-CN': {
    common: zhCN_common,
    auth: zhCN_auth,
    lottery: zhCN_lottery,
    wallet: zhCN_wallet,
    referral: zhCN_referral,
    task: zhCN_task,
    error: zhCN_error,
    admin: zhCN_admin,
  },
  'en-US': {
    common: enUS_common,
    auth: enUS_auth,
    lottery: enUS_lottery,
    wallet: enUS_wallet,
    referral: enUS_referral,
    task: enUS_task,
    error: enUS_error,
    admin: enUS_admin,
  },
  'ru-RU': {
    common: ruRU_common,
    auth: ruRU_auth,
    lottery: ruRU_lottery,
    wallet: ruRU_wallet,
    referral: ruRU_referral,
    task: ruRU_task,
    error: ruRU_error,
    admin: ruRU_admin,
  },
  'tg-TJ': {
    common: tgTJ_common,
    auth: tgTJ_auth,
    lottery: tgTJ_lottery,
    wallet: tgTJ_wallet,
    referral: tgTJ_referral,
    task: tgTJ_task,
    error: tgTJ_error,
    admin: tgTJ_admin,
  },
};

// 初始化i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'tg-TJ', // 默认语言：塔吉克语
    supportedLngs: Object.keys(SUPPORTED_LANGUAGES),
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    
    interpolation: {
      escapeValue: false, // React已自动转义
    },
    
    // 命名空间配置
    ns: ['common', 'auth', 'lottery', 'wallet', 'referral', 'task', 'error', 'admin'],
    defaultNS: 'common',
    
    // 性能优化
    load: 'languageOnly', // 只加载语言部分，不加载地区
    
    // 开发模式调试
    debug: false,
    
    // React特定配置
    react: {
      useSuspense: false, // 禁用Suspense模式，避免SSR问题
    },
  });

export default i18n;
