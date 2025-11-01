// 移动端常量配置
export const MOBILE_CONSTANTS = {
  // 动画时长
  ANIMATION: {
    FAST: 0.2,
    NORMAL: 0.3,
    SLOW: 0.5,
    VERY_SLOW: 0.8
  },

  // 阈值配置
  THRESHOLD: {
    SCROLL: 0.1,
    TAP: 0.8,
    SWIPE: 50,
    LONG_PRESS: 500,
    DOUBLE_TAP: 300
  },

  // 手势配置
  GESTURE: {
    SWIPE_THRESHOLD: 50,
    LONG_PRESS_DURATION: 500,
    DOUBLE_TAP_THRESHOLD: 300,
    PINCH_THRESHOLD: 0.1,
    DRAG_THRESHOLD: 10
  },

  // 触摸配置
  TOUCH: {
    MIN_TOUCH_SIZE: 44,
    LARGE_TOUCH_SIZE: 56,
    RIPPLE_DURATION: 600,
    PRESS_FEEDBACK_DURATION: 100
  },

  // 防抖配置
  DEBOUNCE: {
    CLICK: 300,
    SEARCH: 500,
    SCROLL: 100,
    RESIZE: 250
  },

  // 设备检测
  DEVICE: {
    MOBILE_BREAKPOINT: 768,
    TABLET_BREAKPOINT: 1024,
    DESKTOP_BREAKPOINT: 1200
  },

  // 性能配置
  PERFORMANCE: {
    MAX_RENDER_TIME: 16, // 60fps
    MAX_INTERACTION_DELAY: 100,
    MEMORY_THRESHOLD: 50 * 1024 * 1024, // 50MB
    CACHE_SIZE: 10
}
};

// 振动模式配置
export const VIBRATION_PATTERNS = {
  light: [10],
  medium: [20],
  heavy: [30],
  success: [10, 50, 10],
  error: [30, 100, 30],
  warning: [20, 50, 20],
  longPress: [50, 50],
  doubleTap: [15, 15]
} as const;

// 网络质量配置
export const NETWORK_QUALITY = {
  FAST: { latency: 100, label: '快速' },
  MEDIUM: { latency: 500, label: '中等' },
  SLOW: { latency: 1000, label: '慢速' },
  OFFLINE: { latency: null, label: '离线' }
} as const;

// 颜色主题配置
export const THEME_COLORS = {
  PRIMARY: '#8B5CF6',
  SECONDARY: '#6B7280',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6'
} as const;

// 缓存配置
export const CACHE_CONFIG = {
  DEFAULT_MAX_SIZE: 10,
  DEFAULT_TTL: 5 * 60 * 1000, // 5分钟
  STATIC_CACHE_TTL: 30 * 24 * 60 * 60 * 1000, // 30天
  API_CACHE_TTL: 5 * 60 * 1000, // 5分钟
  PAGE_CACHE_TTL: 60 * 60 * 1000 // 1小时
} as const;