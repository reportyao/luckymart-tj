import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  GESTURE_KEYS, 
  GestureConfig, 
  DEFAULT_GESTURE_CONFIG, 
  GestureEvent, 
  GestureState, 
  GestureListener,
  SwipeDirection 
} from '../utils/gesture-translations';

/**
 * 手势国际化 Hook
 * 提供多语言手势提示和手势操作支持
 */
export const useGestureI18n = (
  customConfig?: Partial<GestureConfig>,
  customListeners?: Partial<GestureListener>
) => {
  const { t, i18n } = useTranslation('common');
  const config = { ...DEFAULT_GESTURE_CONFIG, ...customConfig };
  
  const [gestureState, setGestureState] = useState<GestureState>('idle');
  const [lastGesture, setLastGesture] = useState<GestureEvent | null>(null);
  const [isGestureEnabled, setIsGestureEnabled] = useState(true);

  // 当前语言
  const currentLanguage = i18n.language as keyof typeof GESTURE_KEYS;

  // 获取手势提示文本
  const getGestureText = useCallback((key: string): string => {
    try {
      return t(key) || key;
    } catch (error) {
      console.warn(`Gesture translation key not found: ${key}`);
      return key;
    }
  }, [t]);

  // 获取滑动手势提示
  const getSwipeText = useCallback((
    direction: SwipeDirection,
    type: 'start' | 'end' | 'success'
  ): string => {
    const key = GESTURE_KEYS.swipe[direction][type];
    return getGestureText(key);
  }, [getGestureText]);

  // 获取操作提示
  const getActionText = useCallback((action: keyof typeof GESTURE_KEYS.actions): string => {
    const key = GESTURE_KEYS.actions[action];
    return getGestureText(key);
  }, [getGestureText]);

  // 获取状态提示
  const getStateText = useCallback((state: GestureState): string => {
    const key = GESTURE_KEYS.states[state as keyof typeof GESTURE_KEYS.states] || 'gesture.states.ready';
    return getGestureText(key);
  }, [getGestureText]);

  // 获取错误提示
  const getErrorText = useCallback((errorType: string): string => {
    const key = `gesture.errors.${errorType}` as keyof typeof GESTURE_KEYS.errors;
    const text = getGestureText(key);
    return text || getGestureText(GESTURE_KEYS.errors.invalid);
  }, [getGestureText]);

  // 获取成功提示
  const getSuccessText = useCallback((type: string = 'completed'): string => {
    const key = `gesture.success.${type}` as keyof typeof GESTURE_KEYS.success;
    const text = getGestureText(key);
    return text || getGestureText(GESTURE_KEYS.success.completed);
  }, [getGestureText]);

  // 获取引导提示
  const getGuidanceText = useCallback((guidanceType: keyof typeof GESTURE_KEYS.guidance): string => {
    const key = GESTURE_KEYS.guidance[guidanceType];
    return getGestureText(key);
  }, [getGestureText]);

  // 更新手势状态
  const updateGestureState = useCallback((newState: GestureState, event?: GestureEvent) => {
    setGestureState(newState);
    if (event) {
      setLastGesture(event);
    }
    
    // 触发自定义监听器
    if (customListeners) {
      switch (newState) {
        case 'success':
          if (customListeners.onGestureSuccess && event) {
            customListeners.onGestureSuccess(event);
          }
          break;
        case 'failed':
          if (customListeners.onGestureFailed && event) {
            customListeners.onGestureFailed(event);
          }
          break;
        case 'swipe':
          if (customListeners.onSwipeLeft && event?.direction === 'left') {
            customListeners.onSwipeLeft(event);
          } else if (customListeners.onSwipeRight && event?.direction === 'right') {
            customListeners.onSwipeRight(event);
          } else if (customListeners.onSwipeUp && event?.direction === 'up') {
            customListeners.onSwipeUp(event);
          } else if (customListeners.onSwipeDown && event?.direction === 'down') {
            customListeners.onSwipeDown(event);
          }
          break;
        case 'tap':
          if (customListeners.onTap && event) {
            customListeners.onTap(event);
          }
          break;
        case 'press':
          if (customListeners.onLongPress && event) {
            customListeners.onLongPress(event);
          }
          break;
      }
    }
  }, [customListeners]);

  // 触觉反馈
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!config.enableHaptic) return;
    
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30, 10, 30]
      };
      navigator.vibrate(patterns[type]);
    }
  }, [config.enableHaptic]);

  // 声音反馈
  const triggerSound = useCallback((type: 'success' | 'error' | 'tap' = 'tap') => {
    if (!config.enableSound) return;
    
    // 这里可以添加音频播放逻辑
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    const frequencies = {
      success: [523.25, 659.25, 783.99], // C-E-G 和弦
      error: [200, 150, 100], // 下降音调
      tap: [800] // 单音调
    };
    
    oscillator.frequency.setValueAtTime(frequencies[type][0], audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }, [config.enableSound]);

  // 视觉反馈
  const triggerVisual = useCallback((type: 'success' | 'error' | 'active' = 'active') => {
    if (!config.enableVisual) return;
    
    // 触发 CSS 动画或视觉反馈
    const event = new CustomEvent('gestureFeedback', {
      detail: { type, state: gestureState }
    });
    window.dispatchEvent(event);
  }, [config.enableVisual, gestureState]);

  // 统一的手势反馈
  const triggerFeedback = useCallback((
    type: 'success' | 'error' | 'tap' = 'tap',
    hapticType: 'light' | 'medium' | 'heavy' = 'light'
  ) => {
    triggerHaptic(hapticType);
    triggerSound(type);
    triggerVisual(type);
  }, [triggerHaptic, triggerSound, triggerVisual]);

  // 手势配置检查
  const validateGesture = useCallback((event: GestureEvent): boolean => {
    if (!isGestureEnabled) return false;
    
    switch (event.type) {
      case 'swipe':
        if (event.distance && event.distance < config.minSwipeDistance) {
          return false;
        }
        break;
      case 'tap':
        if (event.distance && event.distance > config.maxTapDistance) {
          return false;
        }
        break;
      case 'press':
        if (event.duration && event.duration < config.longPressDuration) {
          return false;
        }
        break;
    }
    
    return true;
  }, [isGestureEnabled, config]);

  // 手势性能监控
  const gestureMetrics = useMemo(() => ({
    totalGestures: lastGesture ? 1 : 0,
    successRate: gestureState === 'success' ? 1 : 0,
    averageDuration: lastGesture?.duration || 0,
    currentLanguage,
    gestureState,
    isEnabled: isGestureEnabled,
  }), [gestureState, lastGesture, currentLanguage, isGestureEnabled]);

  return {
    // 翻译相关
    getGestureText,
    getSwipeText,
    getActionText,
    getStateText,
    getErrorText,
    getSuccessText,
    getGuidanceText,
    
    // 手势控制
    updateGestureState,
    triggerFeedback,
    triggerHaptic,
    triggerSound,
    triggerVisual,
    validateGesture,
    
    // 状态管理
    gestureState,
    lastGesture,
    isGestureEnabled,
    setIsGestureEnabled,
    
    // 配置
    config,
    metrics: gestureMetrics,
  };
};