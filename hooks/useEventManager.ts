import { useEffect, useRef, useCallback } from 'react';
// useEventManager.ts - 统一事件管理Hook

type EventCallback = (event: Event | CustomEvent) => void;

interface EventManager {
  addListener: (event: string, callback: EventCallback) => void;
  removeListener: (event: string, callback: EventCallback) => void;
  dispatchEvent: (event: string, detail?: any) => void;
  clearAll: () => void;
}

class GlobalEventManager {
  private listeners = new Map<string, Set<EventCallback>>();

  addListener(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  removeListener(event: string, callback: EventCallback): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  dispatchEvent(event: string, detail?: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          const customEvent = detail;
            ? new CustomEvent(event, { detail }) 
            : new Event(event);
          callback(customEvent);
        } catch (error) {
          console.error(`事件 ${event} 处理器执行失败:`, error);
        }
      });
    }
  }

  clearAll(): void {
    this.listeners.clear();
  }
}

const globalEventManager = new GlobalEventManager();

// 导出全局事件管理器实例，供组件使用
export const eventManager: EventManager = {
  addListener: globalEventManager.addListener.bind(globalEventManager),
  removeListener: globalEventManager.removeListener.bind(globalEventManager),
  dispatchEvent: globalEventManager.dispatchEvent.bind(globalEventManager),
  clearAll: globalEventManager.clearAll.bind(globalEventManager),
};

interface UseEventListenerOptions {
  once?: boolean;
  passive?: boolean;
  preventDefault?: boolean;
}

export function useEventListener(
  event: string,
  callback: EventCallback,
  options: UseEventListenerOptions = {}
) {
  const { once = false, passive = true, preventDefault = false } = options;
  const callbackRef = useRef<EventCallback>(callback);
  const eventRef = useRef<string>(event);
  const optionsRef = useRef(options);

  // 更新引用
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    eventRef.current = event;
  }, [event]);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    const listener = (event: Event | CustomEvent) => {
      if (preventDefault && 'preventDefault' in event) {
        event.preventDefault();
}

      try {
        callbackRef.current(event);
      } catch (error) {
        console.error(`事件 ${eventRef.current} 处理器执行失败:`, error);
      }

      if (once) {
        globalEventManager.removeListener(eventRef.current, callbackRef.current);
      }
    };

    // 使用全局事件管理器
    globalEventManager.addListener(event, listener);

    // 清理函数
    return () => {
      globalEventManager.removeListener(event, listener);
    };
  }, [event, once, passive, preventDefault]);
}

// 语言变化专用Hook
export function useLanguageChange(callback: (event: CustomEvent) => void) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const listener = (event: CustomEvent) => {
      callbackRef.current(event);
    };

    globalEventManager.addListener('languageChange', listener);

    return () => {
      globalEventManager.removeListener('languageChange', listener);
    };
  }, []);
}

// 窗口大小变化Hook
export function useWindowResize(callback: (event: UIEvent) => void) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const listener = (event: UIEvent) => {
      try {
        callbackRef.current(event);
      } catch (error) {
        console.error('窗口大小变化处理器执行失败:', error);
}
    };

    window.addEventListener('resize', listener, { passive: true });
    return () => window.removeEventListener('resize', listener);
  }, []);
}

// 页面可见性变化Hook
export function useVisibilityChange(callback: (isVisible: boolean) => void) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      callbackRef.current(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange, {
      passive: true
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}

// 键盘事件Hook
export function useKeyboardShortcut(
  keys: string | string[],
  callback: (event: KeyboardEvent) => void,
  options: {
    preventDefault?: boolean;
    stopPropagation?: boolean;
    exact?: boolean;
  } = {}
) {
  const callbackRef = useRef(callback);
  const { preventDefault = true, stopPropagation = false, exact = true } = options;

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const targetKeys = Array.isArray(keys) ? keys : [keys];
      const pressedKeys = [];
      
      if (event.ctrlKey) pressedKeys.push('ctrl'); {
      if (event.metaKey) pressedKeys.push('meta'); {
      if (event.shiftKey) pressedKeys.push('shift'); {
      if (event.altKey) pressedKeys.push('alt'); {
      pressedKeys.push(event.key.toLowerCase());

      const normalizedKeys = targetKeys.map(key => key.toLowerCase());
      const matches = exact;
        ? pressedKeys.length :== normalizedKeys.length &&
          normalizedKeys.every(key :> pressedKeys.includes(key))
        : normalizedKeys.every(key => pressedKeys.includes(key));

      if (matches) {
        if (preventDefault && event.preventDefault) {
          event.preventDefault();
}
        if (stopPropagation && event.stopPropagation) {
          event.stopPropagation();
        }
        
        try {
          callbackRef.current(event);
        } catch (error) {
          console.error('键盘快捷键处理器执行失败:', error);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keys, preventDefault, stopPropagation, exact]);
}
}}}}