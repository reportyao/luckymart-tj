/**
 * 环境变量类型定义
 * 确保所有环境变量都有正确的类型和默认值
 */

declare namespace NodeJS {
  interface ProcessEnv {
    // API配置
    readonly NEXT_PUBLIC_API_BASE_URL: string;
    readonly TEST_API_BASE_URL: string;
    readonly BOT_API_BASE_URL: string;
    readonly NEXT_PUBLIC_WS_URL: string;
    
    // API超时配置
    readonly API_TIMEOUT: string;
    readonly BOT_TIMEOUT: string;
    
    // 重试配置
    readonly RETRY_ATTEMPTS: string;
    readonly RETRY_DELAY: string;
    
    // 环境配置
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly NEXT_PUBLIC_ENV: string;
    readonly BOT_MODE: string;
    readonly JEST_WORKER_ID: string;
    
    // 数据库配置
    readonly DATABASE_URL: string;
    readonly TEST_DATABASE_URL: string;
    
    // JWT配置
    readonly JWT_SECRET: string;
    readonly BOT_JWT_SECRET: string;
    
    // Supabase配置
    readonly NEXT_PUBLIC_SUPABASE_URL: string;
    readonly NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    readonly SUPABASE_SERVICE_ROLE_KEY: string;
    
    // Telegram配置
    readonly TELEGRAM_BOT_TOKEN: string;
    readonly MINI_APP_URL: string;
    
    // 支付配置
    readonly ALIF_MOBI_PHONE: string;
    readonly DC_BANK_ACCOUNT: string;
    
    // 管理员配置
    readonly ADMIN_USERNAME: string;
    readonly ADMIN_PASSWORD: string;
    
    // Redis配置
    readonly REDIS_HOST: string;
    readonly REDIS_PORT: string;
    readonly REDIS_PASSWORD: string;
    readonly REDIS_DB: string;
    readonly REDIS_KEY_PREFIX: string;
    
    // 缓存监控配置
    readonly CACHE_MONITORING_ENABLED: string;
    readonly CACHE_MONITORING_INTERVAL: string;
    readonly CACHE_HIT_RATE_THRESHOLD: string;
    readonly CACHE_ERROR_RATE_THRESHOLD: string;
    readonly CACHE_MEMORY_THRESHOLD: string;
    readonly CACHE_RESPONSE_TIME_THRESHOLD: string;
    readonly CACHE_ALERT_CHANNELS: string;
    readonly CACHE_PERIODIC_CLEANUP: string;
    readonly CACHE_CLEANUP_INTERVAL: string;
    readonly CACHE_PRELOADING_ENABLED: string;
    readonly CACHE_PRELOAD_KEYS: string;
    readonly DEFAULT_CACHE_STRATEGY: string;
    readonly PRODUCT_CACHE_TTL: string;
    readonly PRODUCT_HOT_CACHE_TTL: string;
    readonly PRODUCT_DETAIL_CACHE_TTL: string;
    readonly USER_PROFILE_CACHE_TTL: string;
    readonly USER_CART_CACHE_TTL: string;
    readonly USER_ORDERS_CACHE_TTL: string;
    readonly APP_CONFIG_CACHE_TTL: string;
    readonly LOTTERY_CONFIG_CACHE_TTL: string;
    readonly PAYMENT_CONFIG_CACHE_TTL: string;
    readonly SALES_STATS_CACHE_TTL: string;
    readonly USER_STATS_CACHE_TTL: string;
    readonly PRODUCT_STATS_CACHE_TTL: string;
    readonly CACHE_KEY_MAX_LENGTH: string;
    readonly BATCH_CACHE_SIZE: string;
    readonly BATCH_CACHE_TIMEOUT: string;
    readonly REDIS_MAX_RETRIES_PER_REQUEST: string;
    readonly REDIS_CONNECT_TIMEOUT: string;
    readonly REDIS_COMMAND_TIMEOUT: string;
    readonly CACHE_RESPONSE_TIME_LOGGING: string;
    readonly CACHE_OPERATION_LOGGING: string;
    readonly CACHE_METRICS_RETENTION_HOURS: string;
    
    // 测试环境专用配置
    readonly TEST_ACCESS_TOKEN: string;
    readonly TEST_USER_TELEGRAM_ID: string;
    readonly TEST_ADMIN_USERNAME: string;
    readonly TEST_ADMIN_PASSWORD: string;
  }
}

/**
 * API配置接口
 */
export interface EnvironmentConfig {
  // API配置
  api: {
    baseUrl: string;
    testBaseUrl: string;
    botBaseUrl: string;
    wsUrl: string;
    timeout: number;
    botTimeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
  
  // 环境配置
  env: {
    nodeEnv: string;
    nextPublicEnv: string;
    botMode: string;
    jestWorkerId: string;
  };
  
  // 数据库配置
  database: {
    url: string;
    testUrl: string;
  };
  
  // 安全配置
  security: {
    jwtSecret: string;
    botJwtSecret: string;
  };
  
  // Supabase配置
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  
  // Telegram配置
  telegram: {
    botToken: string;
    miniAppUrl: string;
  };
  
  // 支付配置
  payment: {
    alifMobiPhone: string;
    dcBankAccount: string;
  };
  
  // 管理员配置
  admin: {
    username: string;
    password: string;
  };
  
  // Redis配置
  redis: {
    host: string;
    port: number;
    password: string;
    db: number;
    keyPrefix: string;
  };
  
  // 缓存配置
  cache: {
    monitoring: {
      enabled: boolean;
      interval: number;
      hitRateThreshold: number;
      errorRateThreshold: number;
      memoryThreshold: number;
      responseTimeThreshold: number;
      alertChannels: string[];
    };
    cleanup: {
      periodic: boolean;
      interval: number;
    };
    preload: {
      enabled: boolean;
      keys: string[];
    };
    strategy: {
      default: string;
      ttl: {
        product: number;
        productHot: number;
        productDetail: number;
        userProfile: number;
        userCart: number;
        userOrders: number;
        appConfig: number;
        lotteryConfig: number;
        paymentConfig: number;
        salesStats: number;
        userStats: number;
        productStats: number;
      };
      batch: {
        size: number;
        timeout: number;
      };
    };
    performance: {
      responseTimeLogging: boolean;
      operationLogging: boolean;
      metricsRetentionHours: number;
    };
    limits: {
      keyMaxLength: number;
    };
    redis: {
      maxRetriesPerRequest: number;
      connectTimeout: number;
      commandTimeout: number;
    };
  };
  
  // 测试配置
  test: {
    accessToken: string;
    userTelegramId: string;
    adminUsername: string;
    adminPassword: string;
  };
}