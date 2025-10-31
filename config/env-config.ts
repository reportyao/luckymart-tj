/**
 * 环境变量配置管理工具
 * 统一管理所有环境变量的读取、验证和类型转换
 */

// 临时类型定义
interface EnvironmentConfig {
  api: any;
  env: any;
  database: any;
  security: any;
  supabase: any;
  telegram: any;
  payment: any;
  admin: any;
  redis: any;
  cache: any;
  test: any;
}

// 默认配置值
const DEFAULT_CONFIG = {
  // API配置默认值
  api: {
    baseUrl: 'http://localhost:3000',
    testBaseUrl: 'http://localhost:3000',
    botBaseUrl: 'http://localhost:3000',
    wsUrl: 'ws://localhost:3000/api/ws',
    timeout: 10000,
    botTimeout: 15000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  
  // 环境配置默认值
  env: {
    nodeEnv: 'development',
    nextPublicEnv: 'development',
    botMode: 'false',
    jestWorkerId: '',
  },
  
  // 数据库配置默认值
  database: {
    url: 'postgresql://username:password@localhost:5432/luckymart_tj',
    testUrl: 'postgresql://username:password@localhost:5432/luckymart_tj_test',
  },
  
  // 安全配置默认值
  security: {
    jwtSecret: 'your-jwt-secret-key',
    botJwtSecret: 'your-bot-jwt-secret-key',
  },
  
  // Supabase配置默认值
  supabase: {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key',
    serviceRoleKey: 'your-service-role-key',
  },
  
  // Telegram配置默认值
  telegram: {
    botToken: 'your-telegram-bot-token',
    miniAppUrl: 'http://localhost:3000',
  },
  
  // 支付配置默认值
  payment: {
    alifMobiPhone: '+992000000000',
    dcBankAccount: 'TJ00000000000000000000',
  },
  
  // 管理员配置默认值
  admin: {
    username: 'admin',
    password: 'admin123',
  },
  
  // Redis配置默认值
  redis: {
    host: 'localhost',
    port: 6379,
    password: '',
    db: 0,
    keyPrefix: 'luckymart:',
  },
  
  // 缓存配置默认值
  cache: {
    monitoring: {
      enabled: true,
      interval: 60000,
      hitRateThreshold: 80,
      errorRateThreshold: 5,
      memoryThreshold: 512,
      responseTimeThreshold: 100,
      alertChannels: ['console'],
    },
    cleanup: {
      periodic: true,
      interval: 300000,
    },
    preload: {
      enabled: true,
      keys: ['hot_products', 'app_config', 'lottery_config', 'payment_config'],
    },
    strategy: {
      default: 'memory_first',
      ttl: {
        product: 600,
        productHot: 300,
        productDetail: 1800,
        userProfile: 1800,
        userCart: 300,
        userOrders: 600,
        appConfig: 3600,
        lotteryConfig: 3600,
        paymentConfig: 7200,
        salesStats: 300,
        userStats: 600,
        productStats: 600,
      },
      batch: {
        size: 100,
        timeout: 5000,
      },
    },
    performance: {
      responseTimeLogging: true,
      operationLogging: true,
      metricsRetentionHours: 24,
    },
    limits: {
      keyMaxLength: 250,
    },
    redis: {
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      commandTimeout: 5000,
    },
  },
  
  // 测试配置默认值
  test: {
    accessToken: 'test-jwt-token',
    userTelegramId: '123456789',
    adminUsername: 'test_admin',
    adminPassword: 'test_admin_123',
  },
} as const;

/**
 * 安全地获取环境变量，如果不存在则返回默认值
 */
export function getEnvVar(
  key: keyof NodeJS.ProcessEnv,
  defaultValue?: string
): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`环境变量 ${key} 未设置且没有默认值`);
  }
  return value;
}

/**
 * 安全地获取数值类型的环境变量
 */
export function getEnvNumber(
  key: keyof NodeJS.ProcessEnv,
  defaultValue?: number
): number {
  const value = getEnvVar(key, defaultValue?.toString());
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new Error(`环境变量 ${key} 不是有效的数字: ${value}`);
  }
  return num;
}

/**
 * 安全地获取布尔类型的环境变量
 */
export function getEnvBoolean(
  key: keyof NodeJS.ProcessEnv,
  defaultValue?: boolean
): boolean {
  const value = getEnvVar(key, defaultValue?.toString());
  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
}

/**
 * 获取环境变量数组（逗号分隔）
 */
export function getEnvArray(
  key: keyof NodeJS.ProcessEnv,
  defaultValue?: string[]
): string[] {
  const value = getEnvVar(key, defaultValue?.join(','));
  return value.split(',').map(item => item.trim()).filter(item => item);
}

/**
 * 获取完整的应用配置
 */
export function getAppConfig(): EnvironmentConfig {
  return {
    // API配置
    api: {
      baseUrl: getEnvVar('NEXT_PUBLIC_API_BASE_URL', DEFAULT_CONFIG.api.baseUrl),
      testBaseUrl: getEnvVar('TEST_API_BASE_URL', DEFAULT_CONFIG.api.testBaseUrl),
      botBaseUrl: getEnvVar('BOT_API_BASE_URL', DEFAULT_CONFIG.api.botBaseUrl),
      wsUrl: getEnvVar('NEXT_PUBLIC_WS_URL', DEFAULT_CONFIG.api.wsUrl),
      timeout: getEnvNumber('API_TIMEOUT', DEFAULT_CONFIG.api.timeout),
      botTimeout: getEnvNumber('BOT_TIMEOUT', DEFAULT_CONFIG.api.botTimeout),
      retryAttempts: getEnvNumber('RETRY_ATTEMPTS', DEFAULT_CONFIG.api.retryAttempts),
      retryDelay: getEnvNumber('RETRY_DELAY', DEFAULT_CONFIG.api.retryDelay),
    },
    
    // 环境配置
    env: {
      nodeEnv: getEnvVar('NODE_ENV', DEFAULT_CONFIG.env.nodeEnv),
      nextPublicEnv: getEnvVar('NEXT_PUBLIC_ENV', DEFAULT_CONFIG.env.nextPublicEnv),
      botMode: getEnvVar('BOT_MODE', DEFAULT_CONFIG.env.botMode),
      jestWorkerId: getEnvVar('JEST_WORKER_ID', DEFAULT_CONFIG.env.jestWorkerId),
    },
    
    // 数据库配置
    database: {
      url: getEnvVar('DATABASE_URL', DEFAULT_CONFIG.database.url),
      testUrl: getEnvVar('TEST_DATABASE_URL', DEFAULT_CONFIG.database.testUrl),
    },
    
    // 安全配置
    security: {
      jwtSecret: getEnvVar('JWT_SECRET', DEFAULT_CONFIG.security.jwtSecret),
      botJwtSecret: getEnvVar('BOT_JWT_SECRET', DEFAULT_CONFIG.security.botJwtSecret),
    },
    
    // Supabase配置
    supabase: {
      url: getEnvVar('NEXT_PUBLIC_SUPABASE_URL', DEFAULT_CONFIG.supabase.url),
      anonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', DEFAULT_CONFIG.supabase.anonKey),
      serviceRoleKey: getEnvVar('SUPABASE_SERVICE_ROLE_KEY', DEFAULT_CONFIG.supabase.serviceRoleKey),
    },
    
    // Telegram配置
    telegram: {
      botToken: getEnvVar('TELEGRAM_BOT_TOKEN', DEFAULT_CONFIG.telegram.botToken),
      miniAppUrl: getEnvVar('MINI_APP_URL', DEFAULT_CONFIG.telegram.miniAppUrl),
    },
    
    // 支付配置
    payment: {
      alifMobiPhone: getEnvVar('ALIF_MOBI_PHONE', DEFAULT_CONFIG.payment.alifMobiPhone),
      dcBankAccount: getEnvVar('DC_BANK_ACCOUNT', DEFAULT_CONFIG.payment.dcBankAccount),
    },
    
    // 管理员配置
    admin: {
      username: getEnvVar('ADMIN_USERNAME', DEFAULT_CONFIG.admin.username),
      password: getEnvVar('ADMIN_PASSWORD', DEFAULT_CONFIG.admin.password),
    },
    
    // Redis配置
    redis: {
      host: getEnvVar('REDIS_HOST', DEFAULT_CONFIG.redis.host),
      port: getEnvNumber('REDIS_PORT', DEFAULT_CONFIG.redis.port),
      password: getEnvVar('REDIS_PASSWORD', DEFAULT_CONFIG.redis.password),
      db: getEnvNumber('REDIS_DB', DEFAULT_CONFIG.redis.db),
      keyPrefix: getEnvVar('REDIS_KEY_PREFIX', DEFAULT_CONFIG.redis.keyPrefix),
    },
    
    // 缓存配置
    cache: {
      monitoring: {
        enabled: getEnvBoolean('CACHE_MONITORING_ENABLED', DEFAULT_CONFIG.cache.monitoring.enabled),
        interval: getEnvNumber('CACHE_MONITORING_INTERVAL', DEFAULT_CONFIG.cache.monitoring.interval),
        hitRateThreshold: getEnvNumber('CACHE_HIT_RATE_THRESHOLD', DEFAULT_CONFIG.cache.monitoring.hitRateThreshold),
        errorRateThreshold: getEnvNumber('CACHE_ERROR_RATE_THRESHOLD', DEFAULT_CONFIG.cache.monitoring.errorRateThreshold),
        memoryThreshold: getEnvNumber('CACHE_MEMORY_THRESHOLD', DEFAULT_CONFIG.cache.monitoring.memoryThreshold),
        responseTimeThreshold: getEnvNumber('CACHE_RESPONSE_TIME_THRESHOLD', DEFAULT_CONFIG.cache.monitoring.responseTimeThreshold),
        alertChannels: getEnvArray('CACHE_ALERT_CHANNELS', [...DEFAULT_CONFIG.cache.monitoring.alertChannels]),
      },
      cleanup: {
        periodic: getEnvBoolean('CACHE_PERIODIC_CLEANUP', DEFAULT_CONFIG.cache.cleanup.periodic),
        interval: getEnvNumber('CACHE_CLEANUP_INTERVAL', DEFAULT_CONFIG.cache.cleanup.interval),
      },
      preload: {
        enabled: getEnvBoolean('CACHE_PRELOADING_ENABLED', DEFAULT_CONFIG.cache.preload.enabled),
        keys: getEnvArray('CACHE_PRELOAD_KEYS', [...DEFAULT_CONFIG.cache.preload.keys]),
      },
      strategy: {
        default: getEnvVar('DEFAULT_CACHE_STRATEGY', DEFAULT_CONFIG.cache.strategy.default),
        ttl: {
          product: getEnvNumber('PRODUCT_CACHE_TTL', DEFAULT_CONFIG.cache.strategy.ttl.product),
          productHot: getEnvNumber('PRODUCT_HOT_CACHE_TTL', DEFAULT_CONFIG.cache.strategy.ttl.productHot),
          productDetail: getEnvNumber('PRODUCT_DETAIL_CACHE_TTL', DEFAULT_CONFIG.cache.strategy.ttl.productDetail),
          userProfile: getEnvNumber('USER_PROFILE_CACHE_TTL', DEFAULT_CONFIG.cache.strategy.ttl.userProfile),
          userCart: getEnvNumber('USER_CART_CACHE_TTL', DEFAULT_CONFIG.cache.strategy.ttl.userCart),
          userOrders: getEnvNumber('USER_ORDERS_CACHE_TTL', DEFAULT_CONFIG.cache.strategy.ttl.userOrders),
          appConfig: getEnvNumber('APP_CONFIG_CACHE_TTL', DEFAULT_CONFIG.cache.strategy.ttl.appConfig),
          lotteryConfig: getEnvNumber('LOTTERY_CONFIG_CACHE_TTL', DEFAULT_CONFIG.cache.strategy.ttl.lotteryConfig),
          paymentConfig: getEnvNumber('PAYMENT_CONFIG_CACHE_TTL', DEFAULT_CONFIG.cache.strategy.ttl.paymentConfig),
          salesStats: getEnvNumber('SALES_STATS_CACHE_TTL', DEFAULT_CONFIG.cache.strategy.ttl.salesStats),
          userStats: getEnvNumber('USER_STATS_CACHE_TTL', DEFAULT_CONFIG.cache.strategy.ttl.userStats),
          productStats: getEnvNumber('PRODUCT_STATS_CACHE_TTL', DEFAULT_CONFIG.cache.strategy.ttl.productStats),
        },
        batch: {
          size: getEnvNumber('BATCH_CACHE_SIZE', DEFAULT_CONFIG.cache.strategy.batch.size),
          timeout: getEnvNumber('BATCH_CACHE_TIMEOUT', DEFAULT_CONFIG.cache.strategy.batch.timeout),
        },
      },
      performance: {
        responseTimeLogging: getEnvBoolean('CACHE_RESPONSE_TIME_LOGGING', DEFAULT_CONFIG.cache.performance.responseTimeLogging),
        operationLogging: getEnvBoolean('CACHE_OPERATION_LOGGING', DEFAULT_CONFIG.cache.performance.operationLogging),
        metricsRetentionHours: getEnvNumber('CACHE_METRICS_RETENTION_HOURS', DEFAULT_CONFIG.cache.performance.metricsRetentionHours),
      },
      limits: {
        keyMaxLength: getEnvNumber('CACHE_KEY_MAX_LENGTH', DEFAULT_CONFIG.cache.limits.keyMaxLength),
      },
      redis: {
        maxRetriesPerRequest: getEnvNumber('REDIS_MAX_RETRIES_PER_REQUEST', DEFAULT_CONFIG.cache.redis.maxRetriesPerRequest),
        connectTimeout: getEnvNumber('REDIS_CONNECT_TIMEOUT', DEFAULT_CONFIG.cache.redis.connectTimeout),
        commandTimeout: getEnvNumber('REDIS_COMMAND_TIMEOUT', DEFAULT_CONFIG.cache.redis.commandTimeout),
      },
    },
    
    // 测试配置
    test: {
      accessToken: getEnvVar('TEST_ACCESS_TOKEN', DEFAULT_CONFIG.test.accessToken),
      userTelegramId: getEnvVar('TEST_USER_TELEGRAM_ID', DEFAULT_CONFIG.test.userTelegramId),
      adminUsername: getEnvVar('TEST_ADMIN_USERNAME', DEFAULT_CONFIG.test.adminUsername),
      adminPassword: getEnvVar('TEST_ADMIN_PASSWORD', DEFAULT_CONFIG.test.adminPassword),
    },
  };
}

/**
 * 验证必需的环境变量
 */
export function validateEnvironment(): void {
  const requiredVars = [
    'JWT_SECRET',
    'TELEGRAM_BOT_TOKEN',
  ];

  const missingVars = requiredVars.filter(varName => 
    !process.env[varName] || process.env[varName]?.includes('your-')
  );

  if (missingVars.length > 0) {
    console.warn('⚠️  以下环境变量未设置或仍使用默认值:', missingVars.join(', '));
  }
}

/**
 * 检查当前环境
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isTest(): boolean {
  return process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;
}

export function isBotMode(): boolean {
  return getEnvBoolean('BOT_MODE', false);
}