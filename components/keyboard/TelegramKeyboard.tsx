/**
 * Telegram Keyboard Components
 * Telegram键盘适配组件，支持虚拟键盘和输入优化
 */

'use client';

import React, { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
import { KeyboardType, KeyboardActionType, VirtualKeyboardConfig, VirtualKeyboardButton } from '@/types/telegram';

// 键盘状态钩子
const useKeyboardVisibility = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateKeyboardHeight = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      const heightDiff = windowHeight - viewportHeight;
      
      setKeyboardHeight(Math.abs(heightDiff));
      setIsKeyboardVisible(heightDiff > 0);
    };

    updateKeyboardHeight();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateKeyboardHeight);
      return () => window.visualViewport.removeEventListener('resize', updateKeyboardHeight);
    } else {
      window.addEventListener('resize', updateKeyboardHeight);
      return () => window.removeEventListener('resize', updateKeyboardHeight);
    }
  }, []);

  return { keyboardHeight, isKeyboardVisible };
};

// Telegram键盘组件
interface TelegramKeyboardProps {
  children: ReactNode;
  className?: string;
  preventScroll?: boolean;
  adjustPan?: boolean;
}

export const TelegramKeyboard: React.FC<TelegramKeyboardProps> = ({
  children,
  className = '',
  preventScroll = true,
  adjustPan = true,
}) => {
  const { hapticFeedback } = useTelegram();
  const { keyboardHeight, isKeyboardVisible } = useKeyboardVisibility();
  const containerRef = useRef<HTMLDivElement>(null);

  // 处理键盘显示时的滚动调整
  useEffect(() => {
    if (typeof window === 'undefined' || !preventScroll) return;

    const preventDefault = (e: Event) => {
      if (isKeyboardVisible) {
        e.preventDefault();
      }
    };

    if (adjustPan) {
      // 调整视口以避免键盘遮挡
      if (isKeyboardVisible && containerRef.current) {
        const container = containerRef.current;
        const focusedElement = document.activeElement;
        
        if (focusedElement && container.contains(focusedElement as Node)) {
          setTimeout(() => {
            focusedElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }, 100);
        }
      }
    }

    // 防止在键盘显示时滚动
    document.addEventListener('touchmove', preventDefault, { passive: false });
    
    return () => {
      document.removeEventListener('touchmove', preventDefault);
    };
  }, [isKeyboardVisible, preventScroll, adjustPan]);

  const containerClasses = [
    'telegram-keyboard-container',
    isKeyboardVisible && 'keyboard-visible',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div 
      ref={containerRef}
      className={containerClasses}
      style={{
        paddingBottom: isKeyboardVisible ? `${keyboardHeight}px` : '0px',
      }}
    >
      {children}
    </div>
  );
};

// 输入框适配组件
interface KeyboardInputProps {
  type?: KeyboardType;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  autoFocus?: boolean;
  required?: boolean;
  maxLength?: number;
  disabled?: boolean;
}

export const KeyboardInput: React.FC<KeyboardInputProps> = ({
  type = KeyboardType.TEXT,
  placeholder,
  value = '',
  onChange,
  onFocus,
  onBlur,
  className = '',
  autoFocus = false,
  required = false,
  maxLength,
  disabled = false,
}) => {
  const { hapticFeedback } = useTelegram();
  const inputRef = useRef<HTMLInputElement>(null);

  // 输入模式配置
  const getInputMode = () => {
    switch (type) {
      case KeyboardType.NUMBER:
        return 'numeric';
      case KeyboardType.EMAIL:
        return 'email';
      case KeyboardType.PHONE:
        return 'tel';
      case KeyboardType.URL:
        return 'url';
      case KeyboardType.SEARCH:
        return 'search';
      default:
        return 'text';
    }
  };

  // 处理聚焦
  const handleFocus = useCallback(() => {
    hapticFeedback('light');
    onFocus?.();
  }, [hapticFeedback, onFocus]);

  // 处理失焦
  const handleBlur = useCallback(() => {
    onBlur?.();
  }, [onBlur]);

  const inputClasses = [
    'telegram-keyboard-input',
    `keyboard-type-${type}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode={getInputMode()}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={inputClasses}
      autoFocus={autoFocus}
      required={required}
      maxLength={maxLength}
      disabled={disabled}
    />
  );
};

// 虚拟键盘组件
interface VirtualKeyboardProps {
  config: VirtualKeyboardConfig;
  onKeyPress?: (key: string) => void;
  className?: string;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  config,
  onKeyPress,
  className = '',
}) => {
  const { hapticFeedback } = useTelegram();
  const [inputValue, setInputValue] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  // 处理按键按下
  const handleKeyPress = useCallback((key: string) => {
    hapticFeedback('light');
    
    if (key === 'backspace') {
      if (cursorPosition > 0) {
        const newValue = inputValue.slice(0, cursorPosition - 1) + inputValue.slice(cursorPosition);
        setInputValue(newValue);
        setCursorPosition(cursorPosition - 1);
      }
    } else if (key === 'clear') {
      setInputValue('');
      setCursorPosition(0);
    } else if (key === 'enter') {
      onKeyPress?.('enter');
    } else {
      const newValue = inputValue.slice(0, cursorPosition) + key + inputValue.slice(cursorPosition);
      setInputValue(newValue);
      setCursorPosition(cursorPosition + 1);
    }
    
    onKeyPress?.(key);
  }, [inputValue, cursorPosition, hapticFeedback, onKeyPress]);

  if (!config.isVisible) return null;

  const keyboardClasses = [
    'virtual-keyboard',
    `layout-${config.layout}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={keyboardClasses} style={{ height: `${config.height}px` }}>
      <div className="virtual-keyboard-content">
        {config.buttons.map((button, index) => (
          <button
            key={index}
            className={`virtual-keyboard-button ${button.type || 'default'} ${button.className || ''}`}
            style={{ gridColumn: `span ${button.span || 1}` }}
            onClick={() => handleKeyPress(button.text)}
          >
            {button.text}
          </button>
        ))}
      </div>
    </div>
  );
};

// 键盘操作按钮组件
interface KeyboardActionProps {
  type: KeyboardActionType;
  text?: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export const KeyboardAction: React.FC<KeyboardActionProps> = ({
  type,
  text,
  onClick,
  disabled = false,
  className = '',
}) => {
  const { hapticFeedback } = useTelegram();

  const handleClick = () => {
    hapticFeedback('medium');
    onClick();
  };

  const getDefaultText = () => {
    switch (type) {
      case KeyboardActionType.DONE: return '完成';
      case KeyboardActionType.NEXT: return '下一步';
      case KeyboardActionType.PREV: return '上一步';
      case KeyboardActionType.GO: return '前往';
      case KeyboardActionType.SEARCH: return '搜索';
      case KeyboardActionType.SEND: return '发送';
      default: return text || '确定';
    }
  };

  const actionClasses = [
    'keyboard-action-button',
    `action-${type}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={actionClasses}
      onClick={handleClick}
      disabled={disabled}
    >
      {text || getDefaultText()}
    </button>
  );
};

export default TelegramKeyboard;