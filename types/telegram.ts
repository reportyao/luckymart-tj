/**
 * Telegram Web Apps SDK 类型定义
 * 为LuckyMart TJ平台提供完整的Telegram Mini App支持
 */

// Telegram用户信息接口
export interface TelegramUser {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  allows_write_to_pm?: boolean;
}

// Telegram主题颜色接口
export interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
}

// Telegram Web Apps API接口
export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    receiver?: TelegramUser;
    chat?: any;
    start_param?: string;
    can_send_after?: number;
    auth_date: number;
    hash: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: TelegramThemeParams;
  isExpanded: boolean;
  viewportStableHeight?: number;
  
  // 方法
  ready: () => void;
  expand: () => void;
  close: () => void;
  MainButton: TelegramMainButton;
  HapticFeedback: TelegramHapticFeedback;
  CloudStorage: TelegramCloudStorage;
  openTelegramLink: (url: string) => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openInvoice: (url: string, options?: { callback?: (status: string) => void }) => void;
  showPopup: (params: TelegramShowPopupParams) => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  showScanQrPopup: (params: TelegramShowScanQrParams) => void;
  closeScanQrPopup: () => void;
  readTextFromClipboard: () => Promise<string>;
  requestWriteAccess: () => Promise<boolean>;
  switchInlineQuery: (query: string, choose_chat_types?: string[]) => void;
}

// Telegram主按钮接口
export interface TelegramMainButton {
  text: string;
  color: string;
  textColor: string;
  isVisible: boolean;
  isProgressVisible: boolean;
  isActive: boolean;
  
  setText: (text: string) => TelegramMainButton;
  onClick: (callback: () => void) => TelegramMainButton;
  offClick: (callback: () => void) => TelegramMainButton;
  show: () => TelegramMainButton;
  hide: () => TelegramMainButton;
  enable: () => TelegramMainButton;
  disable: () => TelegramMainButton;
  showProgress: (leaveActive?: boolean) => TelegramMainButton;
  hideProgress: () => TelegramMainButton;
  setParams: (params: TelegramMainButtonParams) => TelegramMainButton;
}

// Telegram主按钮参数
export interface TelegramMainButtonParams {
  text?: string;
  text_color?: string;
  color?: string;
  is_active?: boolean;
  is_visible?: boolean;
}

// Telegram触觉反馈接口
export interface TelegramHapticFeedback {
  impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
  selectionChanged: () => void;
}

// Telegram云存储接口
export interface TelegramCloudStorage {
  setItem: (key: string, value: string, callback?: (error?: string) => void) => void;
  getItem: (key: string, callback?: (error?: string, result?: string) => void) => void;
  getItems: (keys: string[], callback?: (error?: string, result?: { [key: string]: string }) => void) => void;
  removeItem: (key: string, callback?: (error?: string) => void) => void;
  removeItems: (keys: string[], callback?: (error?: string) => void) => void;
  getKeys: (callback?: (error?: string, result?: string[]) => void) => void;
}

// Telegram弹窗参数
export interface TelegramShowPopupParams {
  title?: string;
  message: string;
  buttons?: TelegramPopupButton[];
}

// Telegram弹窗按钮
export interface TelegramPopupButton {
  id?: string;
  type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
  text: string;
}

// Telegram扫码参数
export interface TelegramShowScanQrParams {
  text?: string;
}

// 键盘类型枚举
export enum KeyboardType {
  NONE = 'none',
  TEXT = 'text',
  NUMBER = 'number',
  PHONE = 'phone',
  URL = 'url',
  EMAIL = 'email',
  PASSWORD = 'password',
  SEARCH = 'search'
}

// 键盘动作按钮类型
export enum KeyboardActionType {
  DONE = 'done',
  NEXT = 'next',
  PREV = 'prev',
  GO = 'go',
  SEARCH = 'search',
  SEND = 'send'
}

// 自定义键盘配置
export interface CustomKeyboardConfig {
  type: KeyboardType;
  placeholder?: string;
  action?: {
    type: KeyboardActionType;
    text?: string;
  };
  maxLength?: number;
  autoFocus?: boolean;
  inputMode?: 'text' | 'numeric' | 'email' | 'tel' | 'url' | 'decimal';
}

// 屏幕方向枚举
export enum ScreenOrientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape',
  UNKNOWN = 'unknown'
}

// 设备信息接口
export interface DeviceInfo {
  isTelegram: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenOrientation: ScreenOrientation;
  viewportWidth: number;
  viewportHeight: number;
  pixelRatio: number;
  userAgent: string;
  platform: string;
  isIOS: boolean;
  isAndroid: boolean;
  isWeChat: boolean;
  isTelegramWebView: boolean;
}

// 主题模式枚举
export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system'
}

// Telegram主题配置
export interface TelegramTheme {
  mode: ThemeMode;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    accent: string;
    muted: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  isTelegramTheme: boolean;
}

// React上下文类型
export interface TelegramContextType {
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  theme: TelegramTheme;
  deviceInfo: DeviceInfo;
  themeMode: ThemeMode;
  isLoading: boolean;
  error: string | null;
  // 方法
  setThemeMode: (mode: ThemeMode) => void;
  showMainButton: (params: TelegramMainButtonParams) => void;
  hideMainButton: () => void;
  hapticFeedback: (type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  showNotification: (type: 'error' | 'success' | 'warning', message: string) => void;
  shareContent: (data: { url?: string; text?: string; title?: string }) => Promise<void>;
  saveToTelegram: (data: any, callback?: () => void) => Promise<void>;
}

// 键盘状态接口
export interface KeyboardState {
  isVisible: boolean;
  height: number;
  type: KeyboardType;
}

// 响应式布局配置
export interface ResponsiveLayoutConfig {
  breakpoints: {
    xs: number;    // 320px - 767px (小屏手机)
    sm: number;    // 768px - 1023px (大屏手机/小平板)
    md: number;    // 1024px - 1439px (平板)
    lg: number;    // 1440px - 1919px (桌面)
    xl: number;    // 1920px+ (大屏幕)
  };
  orientations: {
    portrait: { minWidth: number; maxWidth: number };
    landscape: { minWidth: number; maxWidth: number };
  };
}

// 内联键盘按钮配置
export interface InlineKeyboardButton {
  text: string;
  callback_data: string;
  url?: string;
  callbackGame?: any;
  switchInlineQuery?: string;
  switchInlineQueryCurrentChat?: string;
  callbackGame?: any;
  pay?: boolean;
}

// 虚拟键盘配置
export interface VirtualKeyboardConfig {
  isVisible: boolean;
  height: number;
  layout: 'default' | 'number' | 'email' | 'url';
  buttons: VirtualKeyboardButton[];
}

// 虚拟键盘按钮
export interface VirtualKeyboardButton {
  text: string;
  action?: () => void;
  type?: 'default' | 'action' | 'emoji';
  span?: number; // 跨列数
  className?: string;
}