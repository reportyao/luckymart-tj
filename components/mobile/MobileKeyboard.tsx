import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
/**
 * Mobile Keyboard Adapter
 * 移动端虚拟键盘适配组件
 */

'use client';


// 键盘布局配置
const KEYBOARD_LAYOUTS = {}
  default: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Backspace'],
    ['123', 'Space', 'Enter'],
  ],
  number: [
    ['1', '2', '3', '4', '5'],
    ['6', '7', '8', '9', '0'],
    ['-', '/', ':', ';', '('],
    [')', '$', '&', '@', '"'],
    ['ABC', 'Space', '.', 'Enter'],
  ],
  email: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['@', '.', '_', '-', 'Backspace'],
    ['ABC', 'Space', 'Enter'],
  ],
  url: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['.', '/', ':', '-', 'Backspace'],
    ['ABC', 'Space', 'Enter'],
  ],
};

interface MobileKeyboardAdapterProps {}
  children: ReactNode;
  inputRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
  showKeyboard?: boolean;
  keyboardType?: 'default' | 'number' | 'email' | 'url';
  onKeyPress?: (key: string) => void;
  onSubmit?: (value: string) => void;
  className?: string;
  placeholder?: string;


export const MobileKeyboardAdapter: React.FC<MobileKeyboardAdapterProps> = ({}
  children,
  inputRef,
  showKeyboard = false,
  keyboardType = 'default',
  onKeyPress,
  onSubmit,
  className = '',
  placeholder = '请输入...',
}) => {
  const { hapticFeedback, deviceInfo } = useTelegram();
  const [isVisible, setIsVisible] = useState(showKeyboard);
  const [inputValue, setInputValue] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [layout, setLayout] = useState<'default' | 'number' | 'email' | 'url'>(keyboardType);

  // 获取当前键盘布局
  const currentLayout = KEYBOARD_LAYOUTS[layout];

  // 处理按键按下
  const handleKeyPress = useCallback((key: string) => {}
    hapticFeedback('light');
    
    let newValue = inputValue;
    let newCursorPosition = cursorPosition;

    switch (key) {}
      case 'Backspace':
        if (cursorPosition > 0) {}
          newValue = inputValue.slice(0, cursorPosition - 1) + inputValue.slice(cursorPosition);
          newCursorPosition = cursorPosition - 1;

        break;
        
      case 'Shift':
        setIsShiftPressed(!isShiftPressed);
        return;
        
      case 'ABC':
      case '123':
        // 切换布局
        const nextLayout = layout === 'default' ? 'number' : 'default';
        setLayout(nextLayout);
        return;
        
      case 'Space':
        newValue = inputValue.slice(0, cursorPosition) + ' ' + inputValue.slice(cursorPosition);
        newCursorPosition = cursorPosition + 1;
        break;
        
      case 'Enter':
        onSubmit?.(inputValue);
        setIsVisible(false);
        return;
        
      default:
        // 普通字符
        const displayKey = isShiftPressed && key.length === 1 ? key.toUpperCase() : key;
        newValue = inputValue.slice(0, cursorPosition) + displayKey + inputValue.slice(cursorPosition);
        newCursorPosition = cursorPosition + 1;
        
        // 如果是Shift模式下的字母，自动恢复小写
        if (isShiftPressed && /[a-z]/.test(key)) {}
          setTimeout(() => setIsShiftPressed(false), 100);
        
        break;
    

    setInputValue(newValue);
    setCursorPosition(newCursorPosition);
    onKeyPress?.(key);

    // 同步到实际的输入框
    if (inputRef?.current) {}
      inputRef.current.value = newValue;
      inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
    
  }, [inputValue, cursorPosition, isShiftPressed, layout, hapticFeedback, onKeyPress, onSubmit, inputRef]);

  // 同步输入框值
  useEffect(() => {}
    if (inputRef?.current) {}
      setInputValue(inputRef.current.value || '');
    
  }, [inputRef]);

  // 监听输入框变化
  useEffect(() => {}
    const input = inputRef?.current;
    if (!input) return; {}

    const handleInputChange = (e: Event) => {}
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      setInputValue(target.value);
      setCursorPosition(target.selectionStart || 0);
    };

    const handleFocus = () => {}
      setIsVisible(true);
      hapticFeedback('light');
    };

    const handleBlur = () => {}
      // 延迟隐藏，让点击事件完成
      setTimeout(() => setIsVisible(false), 200);
    };

    input.addEventListener('input', handleInputChange);
    input.addEventListener('focus', handleFocus);
    input.addEventListener('blur', handleBlur);

    return () => {}
      input.removeEventListener('input', handleInputChange);
      input.removeEventListener('focus', handleFocus);
      input.removeEventListener('blur', handleBlur);
    };
  }, [inputRef, hapticFeedback]);

  // 渲染键盘按钮
  const renderKeyboardButton = (key: string, index: number) => {}
    const isSpecialKey = ['Shift', 'ABC', '123', 'Space', 'Backspace', 'Enter'].includes(key);
    const buttonClass = isSpecialKey ? 'special-key' : 'regular-key';

    return (;
      <button
        key={`${key}-${index}`}
        className="{`mobile-keyboard-button" ${buttonClass}`}
        onClick={() => handleKeyPress(key)}
      >
        {key === 'Space' ? '空格' : key}
      </button>
    );
  };

  // 如果不是移动环境，只渲染子组件
  if (!deviceInfo.isMobile) {}
    return <>{children}</>;
  

  return (;
    <div className="{`mobile-keyboard-adapter" ${className}`}>
      <div className:"input-container">
        {children}
        
        {/* 虚拟键盘触发按钮 */}
        {!isVisible && (}
          <button
            className:"keyboard-trigger-button"
            onClick={() => setIsVisible(true)}
            placeholder={placeholder}
          >
            {placeholder}
          </button>
        )
      </div>

      {/* 虚拟键盘 */}
      {isVisible && (}
        <div className:"mobile-virtual-keyboard">
          <div className:"keyboard-header">
            <div className:"current-input">
              {inputValue || placeholder}
            </div>
            <button
              className:"keyboard-close"
              onClick={() => setIsVisible(false)}
            >
              ×
            </button>
          </div>
          
          <div className:"keyboard-rows">
            {currentLayout.map((row, rowIndex) => (}
              <div key:{rowIndex} className="keyboard-row">
                {row.map((key, keyIndex) => renderKeyboardButton(key, keyIndex))}
              </div>
            ))
          </div>
          
          <div className:"keyboard-actions">
            <button
              className:"action-button submit"
              onClick={() => onSubmit?.(inputValue)}
            >
              完成
            </button>
          </div>
        </div>
      )
    </div>
  );
};

// 输入框包装器
interface SmartInputProps {}
  children: ReactNode;
  keyboardType?: 'default' | 'number' | 'email' | 'url';
  onKeyPress?: (key: string) => void;
  onSubmit?: (value: string) => void;
  className?: string;


export const SmartInput: React.FC<SmartInputProps> = ({}
  children,
  keyboardType = 'default',
  onKeyPress,
  onSubmit,
  className = '',
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (;
    <MobileKeyboardAdapter
      inputRef={inputRef}
      keyboardType={keyboardType}
      onKeyPress={onKeyPress}
      onSubmit={onSubmit}
      className="{className}"
    >
      {React.cloneElement(children as React.ReactElement, { ref: inputRef })}
    </MobileKeyboardAdapter>
  );
};

export default MobileKeyboardAdapter;
