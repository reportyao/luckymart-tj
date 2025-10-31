// 翻译缓存配置文件
// Translation Cache Configuration

// 缓存版本信息
export const CACHE_CONFIG = {
  VERSION: '1.0.0',
  NAME: 'translations-cache-v1.0.0',
} as const;

// 缓存大小和清理配置
export const CACHE_LIMITS = {
  MAX_SIZE: 50 * 1024 * 1024,        // 50MB最大缓存
  CLEANUP_THRESHOLD: 40 * 1024 * 1024, // 40MB清理阈值
  LRU_REMOVE_RATIO: 0.2,             // LRU删除20%最旧缓存
  MAX_FILE_SIZE: 5 * 1024 * 1024,    // 单文件最大5MB
} as const;

// 缓存过期配置
export const CACHE_EXPIRATION = {
  MAX_AGE: 30 * 24 * 60 * 60 * 1000, // 30天过期
  CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24小时清理间隔
  STALE_GRACE_PERIOD: 7 * 24 * 60 * 60 * 1000, // 7天宽限期
} as const;

// 支持的语言和命名空间
export const SUPPORTED_CACHE_CONFIG = {
  LANGUAGES: ['zh-CN', 'en-US', 'ru-RU', 'tg-TJ'] as const,
  NAMESPACES: ['common', 'auth', 'lottery', 'wallet', 'referral', 'task', 'error', 'admin'] as const,
} as const;

// 预加载配置
export const PRELOAD_CONFIG = {
  // 核心文件优先预加载
  ESSENTIAL_FILES: [
    { lang: 'zh-CN', namespace: 'common' },
    { lang: 'en-US', namespace: 'common' },
    { lang: 'tg-TJ', namespace: 'common' },
    { lang: 'ru-RU', namespace: 'common' },
  ],
  
  // 预加载策略
  STRATEGIES: {
    // 首次访问：预加载所有核心文件
    FIRST_VISIT: 'first-visit',
    // 智能模式：根据使用情况预加载
    SMART: 'smart',
    // 按需模式：只预加载当前语言
    ON_DEMAND: 'on-demand',
    // 完整模式：预加载所有文件
    FULL: 'full',
  },
  
  // 预加载超时
  TIMEOUT: 10000, // 10秒
  PARALLEL_LIMIT: 5, // 并发限制
} as const;

// 网络配置
export const NETWORK_CONFIG = {
  TIMEOUT: 5000,           // 请求超时5秒
  RETRY_ATTEMPTS: 3,       // 重试3次
  RETRY_DELAY: 1000,       // 重试间隔1秒
  OFFLINE_GRACE_PERIOD: 1000, // 离线宽限期
} as const;

// Service Worker配置
export const SW_CONFIG = {
  // 缓存键格式
  CACHE_KEY_FORMAT: 'translations:{lang}:{namespace}:{version}',
  
  // 消息类型
  MESSAGE_TYPES: {
    SKIP_WAITING: 'SKIP_WAITING',
    GET_CACHE_STATUS: 'GET_CACHE_STATUS',
    CLEAR_CACHE: 'CLEAR_CACHE',
    PRELOAD_TRANSLATIONS: 'PRELOAD_TRANSLATIONS',
    UPDATE_CACHE: 'UPDATE_CACHE',
  } as const,
  
  // 事件监听器
  EVENT_LISTENERS: {
    INSTALL: 'install',
    ACTIVATE: 'activate',
    FETCH: 'fetch',
    MESSAGE: 'message',
  } as const,
} as const;

// 错误处理配置
export const ERROR_CONFIG = {
  // 错误类型
  ERROR_TYPES: {
    NETWORK_ERROR: 'network-error',
    CACHE_ERROR: 'cache-error',
    VERSION_ERROR: 'version-error',
    PERMISSION_ERROR: 'permission-error',
    TIMEOUT_ERROR: 'timeout-error',
  } as const,
  
  // 降级策略
  FALLBACK_STRATEGIES: {
    // 使用过期缓存
    USE_STALE_CACHE: 'use-stale-cache',
    // 使用默认翻译
    USE_DEFAULT_TRANSLATIONS: 'use-default-translations',
    // 显示错误信息
    SHOW_ERROR_MESSAGE: 'show-error-message',
  } as const,
} as const;

// 监控配置
export const MONITORING_CONFIG = {
  // 健康检查间隔
  HEALTH_CHECK_INTERVAL: 30000, // 30秒
  
  // 性能监控
  PERFORMANCE_TRACKING: {
    ENABLED: process.env.NODE_ENV === 'development',
    METRICS: [
      'cache-hit-rate',
      'cache-size',
      'preload-duration',
      'network-requests',
      'error-rate',
    ] as const,
  },
  
  // 日志级别
  LOG_LEVELS: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
  } as const,
} as const;

// 用户界面配置
export const UI_CONFIG = {
  // 显示配置
  DISPLAY: {
    SHOW_CACHE_SIZE: true,
    SHOW_CACHE_COUNT: true,
    SHOW_LANGUAGE_STATS: true,
    SHOW_PERFORMANCE_METRICS: process.env.NODE_ENV === 'development',
  },
  
  // 动画配置
  ANIMATIONS: {
    ENABLED: true,
    DURATION: 300, // ms
    EASING: 'ease-in-out',
  },
  
  // 主题配置
  THEMES: {
    DEFAULT: 'default',
    DARK: 'dark',
    AUTO: 'auto',
  },
} as const;

// 开发环境配置
export const DEVELOPMENT_CONFIG = {
  // 开发模式特殊设置
  DEBUG_MODE: process.env.NODE_ENV === 'development',
  
  // 调试选项
  DEBUG_OPTIONS: {
    VERBOSE_LOGGING: false,
    SHOW_CACHE_KEYS: false,
    SIMULATE_NETWORK_ERRORS: false,
    FORCE_CACHE_CLEAR: false,
  },
  
  // 开发工具
  DEV_TOOLS: {
    ENABLED: process.env.NODE_ENV === 'development',
    PANEL_ENABLED: true,
    HOT_RELOAD: true,
  },
} as const;

// 导出完整配置对象
export const TRANSLATION_CACHE_CONFIG = {
  VERSION: CACHE_CONFIG.VERSION,
  CACHE_NAME: CACHE_CONFIG.NAME,
  LIMITS: CACHE_LIMITS,
  EXPIRATION: CACHE_EXPIRATION,
  SUPPORTED: SUPPORTED_CACHE_CONFIG,
  PRELOAD: PRELOAD_CONFIG,
  NETWORK: NETWORK_CONFIG,
  SERVICE_WORKER: SW_CONFIG,
  ERROR: ERROR_CONFIG,
  MONITORING: MONITORING_CONFIG,
  UI: UI_CONFIG,
  DEVELOPMENT: DEVELOPMENT_CONFIG,
} as const;

// 类型定义
export type CacheVersion = typeof CACHE_CONFIG.VERSION;
export type SupportedCacheLanguage = typeof SUPPORTED_CACHE_CONFIG.LANGUAGES[number];
export type SupportedCacheNamespace = typeof SUPPORTED_CACHE_CONFIG.NAMESPACES[number];
export type PreloadStrategy = typeof PRELOAD_CONFIG.STRATEGIES[keyof typeof PRELOAD_CONFIG.STRATEGIES];
export type LogLevel = typeof MONITORING_CONFIG.LOG_LEVELS[keyof typeof MONITORING_CONFIG.LOG_LEVELS];
export type ErrorType = typeof ERROR_CONFIG.ERROR_TYPES[keyof typeof ERROR_CONFIG.ERROR_TYPES];
export type FallbackStrategy = typeof ERROR_CONFIG.FALLBACK_STRATEGIES[keyof typeof ERROR_CONFIG.FALLBACK_STRATEGIES];
export type Theme = typeof UI_CONFIG.THEMES[keyof typeof UI_CONFIG.THEMES];

// 默认配置导出
export const DEFAULT_CONFIG = {
  language: 'tg-TJ' as SupportedCacheLanguage,
  preloadStrategy: 'smart' as PreloadStrategy,
  logLevel: 'warn' as LogLevel,
  theme: 'default' as Theme,
  enableMonitoring: true,
  enableAnimations: true,
} as const;

// 配置验证函数
export function validateConfig(config: Partial<typeof TRANSLATION_CACHE_CONFIG>): boolean {
  try {
    // 验证缓存大小限制
    if (config.LIMITS?.MAX_SIZE && config.LIMITS.MAX_SIZE < 1024 * 1024) {
      console.warn('缓存大小过小，建议至少1MB');
    }
    
    // 验证过期时间
    if (config.EXPIRATION?.MAX_AGE && config.EXPIRATION.MAX_AGE < 24 * 60 * 60 * 1000) {
      console.warn('缓存过期时间过短，建议至少1天');
    }
    
    // 验证支持的语言
    if (config.SUPPORTED?.LANGUAGES) {
      const invalidLangs = config.SUPPORTED.LANGUAGES.filter(lang => 
        !['zh-CN', 'en-US', 'ru-RU', 'tg-TJ'].includes(lang)
      );
      if (invalidLangs.length > 0) {
        console.error('不支持的语言代码:', invalidLangs);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('配置验证失败:', error);
    return false;
  }
}

// 配置合并函数
export function mergeConfig(
  baseConfig: typeof TRANSLATION_CACHE_CONFIG,
  overrides: Partial<typeof TRANSLATION_CACHE_CONFIG>
): typeof TRANSLATION_CACHE_CONFIG {
  return {
    ...baseConfig,
    ...overrides,
    LIMITS: { ...baseConfig.LIMITS, ...overrides.LIMITS },
    EXPIRATION: { ...baseConfig.EXPIRATION, ...overrides.EXPIRATION },
    SUPPORTED: { ...baseConfig.SUPPORTED, ...overrides.SUPPORTED },
    PRELOAD: { ...baseConfig.PRELOAD, ...overrides.PRELOAD },
    NETWORK: { ...baseConfig.NETWORK, ...overrides.NETWORK },
    SERVICE_WORKER: { ...baseConfig.SERVICE_WORKER, ...overrides.SERVICE_WORKER },
    ERROR: { ...baseConfig.ERROR, ...overrides.ERROR },
    MONITORING: { ...baseConfig.MONITORING, ...overrides.MONITORING },
    UI: { ...baseConfig.UI, ...overrides.UI },
    DEVELOPMENT: { ...baseConfig.DEVELOPMENT, ...overrides.DEVELOPMENT },
  };
}