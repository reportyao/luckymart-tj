/**
 * API配置 - 统一管理所有API URL
 * 避免硬编码${API_BASE_URL}
 */

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

// 默认API基础URL
const DEFAULT_API_BASE_URL = 'http://localhost:3000';

// 开发环境配置
const DEVELOPMENT_CONFIG: ApiConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL,
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// 测试环境配置
const TEST_CONFIG: ApiConfig = {
  baseURL: process.env.TEST_API_BASE_URL || DEFAULT_API_BASE_URL,
  timeout: 5000,
  retryAttempts: 2,
  retryDelay: 500,
};

// 生产环境配置
const PRODUCTION_CONFIG: ApiConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// Bot环境配置
const BOT_CONFIG: ApiConfig = {
  baseURL: process.env.BOT_API_BASE_URL || DEFAULT_API_BASE_URL,
  timeout: 15000,
  retryAttempts: 5,
  retryDelay: 2000,
};

// 根据环境变量确定当前配置
export const getApiConfig = (): ApiConfig => {
  if (process.env.NODE_ENV === 'production') {
    return PRODUCTION_CONFIG;
  }
  
  if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
    return TEST_CONFIG;
  }
  
  if (process.env.BOT_MODE === 'true') {
    return BOT_CONFIG;
  }
  
  return DEVELOPMENT_CONFIG;
};

// 便捷的baseURL导出
export const API_BASE_URL = getApiConfig().baseURL;

// 专门的测试环境API配置
export const getTestApiConfig = (): ApiConfig => ({
  ...TEST_CONFIG,
  baseURL: process.env.TEST_API_BASE_URL || API_BASE_URL,
});

// 专门的Bot环境API配置
export const getBotApiConfig = (): ApiConfig => ({
  ...BOT_CONFIG,
  baseURL: process.env.BOT_API_BASE_URL || API_BASE_URL,
});

// 前端开发环境API配置
export const getDevApiConfig = (): ApiConfig => ({
  ...DEVELOPMENT_CONFIG,
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL,
});

// WebSocket配置
export interface WebSocketConfig {
  url: string;
  reconnectAttempts: number;
  reconnectDelay: number;
}

export const getWebSocketConfig = (): WebSocketConfig => {
  const baseUrl = getApiConfig().baseURL.replace('http', 'ws');
  return {
    url: process.env.NEXT_PUBLIC_WS_URL || `${baseUrl}/api/ws`,
    reconnectAttempts: 5,
    reconnectDelay: 3000,
  };
};

// 导出类型定义
export type { ApiConfig };
export type { WebSocketConfig };