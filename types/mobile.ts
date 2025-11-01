import React from 'react';
// 移动端组件通用类型定义

// 基础组件属性
export interface MobileComponentProps {
  className?: string;
  style?: React.CSSProperties;
  testId?: string;
}

// 手势配置
export interface GestureConfig {
  enabled?: boolean;
  threshold?: number;
  velocity?: number;
  direction?: 'horizontal' | 'vertical' | 'both';
}

// 触摸反馈配置
export interface TouchFeedbackConfig {
  type?: 'ripple' | 'press' | 'glow' | 'highlight' | 'scale';
  color?: string;
  duration?: number;
  hapticFeedback?: boolean;
  preventDefault?: boolean;
}

// 网络状态
export interface NetworkStatus {
  isOnline: boolean;
  quality: 'fast' | 'medium' | 'slow' | 'offline' | 'unknown';
  latency: number | null;
  effectiveType?: string;
}

// 设备信息
export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isWeChat: boolean;
  isTelegramWebView: boolean;
  screenOrientation: 'portrait' | 'landscape';
  viewportWidth: number;
  viewportHeight: number;
  pixelRatio: number;
}

// 动画配置
export interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  stiffness?: number;
  damping?: number;
}

// 加载状态
export type LoadState = 'idle' | 'loading' | 'success' | 'error' | 'end' | 'empty';

// 错误信息
export interface ErrorInfo {
  message: string;
  code?: string;
  stack?: string;
  timestamp: number;
}

// 分页信息
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// 列表项接口
export interface ListItem {
  id: string | number;
  [key: string]: any;
}

// 无限滚动配置
export interface InfiniteScrollConfig<T = any> {
  data: T[];
  loadMore: (page: number) => Promise<T[]> | T[];
  hasMore: boolean;
  threshold?: number;
  pageSize?: number;
  loadingComponent?: React.ReactNode;
  endComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  onLoadMore?: () => void;
  onError?: (error: Error) => void;
  onEmpty?: () => void;
  refreshTrigger?: any;
  preloadDistance?: number;
  debounceMs?: number;
}

// 抽屉菜单项
export interface DrawerItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href: string;
  badge?: number | string;
  disabled?: boolean;
  color?: string;
  children?: DrawerItem[];
}

// 底部导航项
export interface BottomNavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  badge?: number | string;
  disabled?: boolean;
  hidden?: boolean;
}

// 性能监控指标
export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  interactionDelay: number;
  networkLatency: number;
  timestamp: number;
}

// 缓存项
export interface CacheItem<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl?: number;
}

// LRU缓存
export interface LRUCacheOptions {
  maxSize?: number;
  ttl?: number;
}

// 主题模式
export type ThemeMode = 'light' | 'dark' | 'system';

// 键盘状态
export interface KeyboardState {
  isVisible: boolean;
  height: number;
  type: 'text' | 'numeric' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'none';
}

// 方向锁定
export type OrientationLock = 'portrait' | 'landscape' | 'any' | 'natural';

// 手势类型
export type GestureType = 
  | 'tap'
  | 'double-tap'
  | 'long-press'
  | 'swipe-left'
  | 'swipe-right'
  | 'swipe-up'
  | 'swipe-down'
  | 'pinch'
  | 'drag'
  | 'rotate';

// 振动类型
export type VibrationType = 
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'error'
  | 'warning'
  | 'longPress'
  | 'doubleTap';

// 动画类型
export type AnimationType = 
  | 'fade'
  | 'slide'
  | 'scale'
  | 'rotate'
  | 'bounce'
  | 'pulse'
  | 'flip';

// 按钮变体
export type ButtonVariant = 
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'ghost'
  | 'outline';

// 按钮尺寸
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

// 触摸区域
export type TouchArea = 'normal' | 'large' | 'extra-large';

// 加载动画类型
export type LoadingType = 'spinner' | 'pulse' | 'bounce' | 'dots' | 'skeleton';

// 组件状态
export type ComponentState = 'idle' | 'loading' | 'success' | 'error' | 'disabled';

// 响应式断点
export interface BreakpointConfig {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

// PWA相关类型
export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  outcome: 'accepted' | 'dismissed';
}

export interface PWAUpdateInfo {
  version: string;
  size: number;
  available: boolean;
  update: () => Promise<void>;
}

// 离线相关
export interface OfflineQueueItem {
  id: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  timestamp: number;
  retryCount: number;
  maxRetries?: number;
}

// 服务工作者消息
export interface ServiceWorkerMessage {
  type: string;
  payload?: any;
  timestamp: number;
}

// 缓存策略
export type CacheStrategy = 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only' | 'cache-only';

// 预加载配置
export interface PrefetchConfig {
  urls: string[];
  priority?: 'low' | 'normal' | 'high';
  enabled?: boolean;
}

// 性能优化配置
export interface PerformanceConfig {
  lazyLoading?: boolean;
  codeSplitting?: boolean;
  prefetching?: boolean;
  virtualScrolling?: boolean;
  imageOptimization?: boolean;
  compression?: boolean;
}

// 错误边界配置
export interface ErrorBoundaryConfig {
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
}

// 调试配置
export interface DebugConfig {
  enabled: boolean;
  showPerformanceMetrics: boolean;
  showMemoryUsage: boolean;
  showNetworkRequests: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

// 辅助功能配置
export interface AccessibilityConfig {
  ariaLabels?: Record<string, string>;
  role?: string;
  tabIndex?: number;
  liveRegion?: boolean;
  reducedMotion?: boolean;
}

// 自适应配置
export interface ResponsiveConfig {
  breakpoints?: BreakpointConfig;
  fluidTypography?: boolean;
  touchOptimized?: boolean;
  highDPIOptimized?: boolean;
}

// 可扩展的配置对象
export interface MobileConfig extends
  MobileComponentProps,
  GestureConfig,
  TouchFeedbackConfig,
  PerformanceConfig,
  AccessibilityConfig,
  ResponsiveConfig {
  debug?: DebugConfig;
  errorBoundary?: ErrorBoundaryConfig;
  prefetch?: PrefetchConfig;
}