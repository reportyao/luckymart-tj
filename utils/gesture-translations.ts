// 手势操作翻译键配置
export const GESTURE_KEYS = {
  // 基本手势
  tap: {
    short: 'gesture.tap.short',
    long: 'gesture.tap.long',
    double: 'gesture.tap.double',
  },
  
  // 滑动手势
  swipe: {
    left: {
      start: 'gesture.swipe.left.start',
      end: 'gesture.swipe.left.end',
      success: 'gesture.swipe.left.success',
    },
    right: {
      start: 'gesture.swipe.right.start',
      end: 'gesture.swipe.right.end',
      success: 'gesture.swipe.right.success',
    },
    up: {
      start: 'gesture.swipe.up.start',
      end: 'gesture.swipe.up.end',
      success: 'gesture.swipe.up.success',
    },
    down: {
      start: 'gesture.swipe.down.start',
      end: 'gesture.swipe.down.end',
      success: 'gesture.swipe.down.success',
    },
  },
  
  // 长按手势
  press: {
    short: 'gesture.press.short',
    long: 'gesture.press.long',
    duration: 'gesture.press.duration',
  },
  
  // 手势状态
  states: {
    ready: 'gesture.states.ready',
    active: 'gesture.states.active',
    success: 'gesture.states.success',
    failed: 'gesture.states.failed',
    cancelled: 'gesture.states.cancelled',
  },
  
  // 操作提示
  actions: {
    delete: 'gesture.actions.delete',
    edit: 'gesture.actions.edit',
    favorite: 'gesture.actions.favorite',
    share: 'gesture.actions.share',
    more: 'gesture.actions.more',
    back: 'gesture.actions.back',
    forward: 'gesture.actions.forward',
    refresh: 'gesture.actions.refresh',
    menu: 'gesture.actions.menu',
  },
  
  // 引导提示
  guidance: {
    intro: 'gesture.guidance.intro',
    hint: 'gesture.guidance.hint',
    help: 'gesture.guidance.help',
    tutorial: 'gesture.guidance.tutorial',
    next: 'gesture.guidance.next',
    previous: 'gesture.guidance.previous',
    skip: 'gesture.guidance.skip',
    finish: 'gesture.guidance.finish',
  },
  
  // 错误消息
  errors: {
    invalid: 'gesture.errors.invalid',
    timeout: 'gesture.errors.timeout',
    cancelled: 'gesture.errors.cancelled',
    blocked: 'gesture.errors.blocked',
    unsupported: 'gesture.errors.unsupported',
  },
  
  // 成功消息
  success: {
    completed: 'gesture.success.completed',
    action: 'gesture.success.action',
    feedback: 'gesture.success.feedback',
  },
} as const;

// 手势类型定义
export type GestureType = keyof typeof GESTURE_KEYS;
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

// 手势配置
export interface GestureConfig {
  minSwipeDistance: number; // 最小滑动距离（像素）
  maxTapDistance: number; // 最大点击距离（像素）
  longPressDuration: number; // 长按持续时间（毫秒）
  doubleTapDelay: number; // 双击延迟（毫秒）
  enableHaptic: boolean; // 启用触觉反馈
  enableSound: boolean; // 启用声音反馈
  enableVisual: boolean; // 启用视觉反馈
}

// 默认手势配置
export const DEFAULT_GESTURE_CONFIG: GestureConfig = {
  minSwipeDistance: 50,
  maxTapDistance: 10,
  longPressDuration: 500,
  doubleTapDelay: 300,
  enableHaptic: true,
  enableSound: false,
  enableVisual: true,
};

// 手势事件类型
export interface GestureEvent {
  type: GestureType;
  direction?: SwipeDirection;
  distance?: number;
  duration?: number;
  velocity?: number;
  position?: { x: number; y: number };
  timestamp: number;
}

// 手势状态
export type GestureState = 
  | 'idle'
  | 'touch'
  | 'move'
  | 'swipe'
  | 'tap'
  | 'press'
  | 'success'
  | 'failed'
  | 'cancelled';

// 手势监听器
export interface GestureListener {
  onTouchStart?: (event: GestureEvent) => void;
  onTouchMove?: (event: GestureEvent) => void;
  onTouchEnd?: (event: GestureEvent) => void;
  onSwipeLeft?: (event: GestureEvent) => void;
  onSwipeRight?: (event: GestureEvent) => void;
  onSwipeUp?: (event: GestureEvent) => void;
  onSwipeDown?: (event: GestureEvent) => void;
  onTap?: (event: GestureEvent) => void;
  onLongPress?: (event: GestureEvent) => void;
  onDoubleTap?: (event: GestureEvent) => void;
  onGestureSuccess?: (event: GestureEvent) => void;
  onGestureFailed?: (event: GestureEvent) => void;
}