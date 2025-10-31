/**
 * Telegram特色功能组件
 * 包括分享、保存、支付、通知等Telegram特有功能
 */

'use client';

import React, { useCallback, useState } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
import { TelegramMainButtonParams } from '@/types/telegram';

// Telegram分享组件
interface TelegramShareProps {
  url?: string;
  text?: string;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const TelegramShare: React.FC<TelegramShareProps> = ({
  url,
  text,
  title,
  children,
  className = '',
}) => {
  const { shareContent, hapticFeedback } = useTelegram();

  const handleShare = useCallback(async () => {
    hapticFeedback('medium');
    try {
      await shareContent({
        url: url || window.location.href,
        text: text || '来看看这个很棒的内容！',
        title: title || 'LuckyMart TJ',
      });
    } catch (error) {
      console.error('分享失败:', error);
    }
  }, [shareContent, hapticFeedback, url, text, title]);

  return (
    <button
      className={`telegram-share ${className}`}
      onClick={handleShare}
    >
      {children}
    </button>
  );
};

// Telegram保存组件
interface TelegramSaveProps {
  data: any;
  children: React.ReactNode;
  className?: string;
  showConfirm?: boolean;
}

export const TelegramSave: React.FC<TelegramSaveProps> = ({
  data,
  children,
  className = '',
  showConfirm = true,
}) => {
  const { saveToTelegram, showNotification, hapticFeedback } = useTelegram();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    
    hapticFeedback('light');
    setIsSaving(true);

    try {
      await saveToTelegram(data, () => {
        if (showConfirm) {
          showNotification('success', '已保存到Telegram');
        }
      });
    } catch (error) {
      console.error('保存失败:', error);
      showNotification('error', '保存失败');
    } finally {
      setIsSaving(false);
    }
  }, [data, saveToTelegram, showNotification, hapticFeedback, showConfirm, isSaving]);

  return (
    <button
      className={`telegram-save ${isSaving ? 'saving' : ''} ${className}`}
      onClick={handleSave}
      disabled={isSaving}
    >
      {children}
    </button>
  );
};

// Telegram主按钮组件
interface TelegramMainButtonComponentProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  color?: string;
  textColor?: string;
}

export const TelegramMainButtonComponent: React.FC<TelegramMainButtonComponentProps> = ({
  text,
  onClick,
  disabled = false,
  loading = false,
  className = '',
  color,
  textColor,
}) => {
  const { showMainButton, hideMainButton, hapticFeedback } = useTelegram();

  // 更新按钮参数
  React.useEffect(() => {
    const params: TelegramMainButtonParams = {
      text,
      color: color || '#007bff',
      text_color: textColor || '#ffffff',
      is_active: !disabled && !loading,
      is_visible: true,
    };

    showMainButton(params);

    return () => {
      hideMainButton();
    };
  }, [text, color, textColor, disabled, loading, showMainButton, hideMainButton]);

  const handleClick = useCallback(() => {
    if (disabled || loading) return;
    
    hapticFeedback('medium');
    onClick();
  }, [disabled, loading, hapticFeedback, onClick]);

  // 如果是Telegram环境，使用Telegram主按钮
  // 否则渲染普通的按钮组件
  return null; // Telegram环境不需要渲染实际的按钮
};

// Telegram通知组件
interface TelegramNotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  className?: string;
}

export const TelegramNotification: React.FC<TelegramNotificationProps> = ({
  type,
  message,
  duration = 3000,
  className = '',
}) => {
  const { showNotification, hapticFeedback } = useTelegram();
  const [isVisible, setIsVisible] = useState(true);

  React.useEffect(() => {
    hapticFeedback(type === 'error' ? 'heavy' : 'light');
    
    // 如果是错误，显示弹窗
    if (type === 'error') {
      showNotification('error', message);
    }

    // 自动隐藏
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [message, type, duration, showNotification, hapticFeedback]);

  // 错误类型在Telegram环境中通过弹窗显示，不需要渲染UI
  if (type === 'error') {
    return null;
  }

  if (!isVisible) return null;

  return (
    <div className={`telegram-notification ${type} ${className}`}>
      <div className="notification-content">
        <span className="notification-icon">
          {type === 'success' ? '✓' : type === 'warning' ? '⚠' : 'ℹ'}
        </span>
        <span className="notification-message">{message}</span>
      </div>
    </div>
  );
};

// Telegram支付组件
interface TelegramPaymentProps {
  price: number;
  description: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const TelegramPayment: React.FC<TelegramPaymentProps> = ({
  price,
  description,
  onSuccess,
  onError,
  children,
  className = '',
}) => {
  const { webApp, hapticFeedback, showNotification } = useTelegram();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = useCallback(async () => {
    if (!webApp) {
      showNotification('error', 'Telegram环境不可用');
      return;
    }

    hapticFeedback('medium');
    setIsProcessing(true);

    try {
      // 模拟支付流程
      // 实际应用中需要对接Telegram Stars支付API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showNotification('success', '支付成功');
      onSuccess?.();
    } catch (error) {
      console.error('支付失败:', error);
      const errorMessage = '支付失败，请重试';
      showNotification('error', errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [webApp, hapticFeedback, showNotification, onSuccess, onError]);

  return (
    <button
      className={`telegram-payment ${isProcessing ? 'processing' : ''} ${className}`}
      onClick={handlePayment}
      disabled={isProcessing}
    >
      {children}
    </button>
  );
};

// Telegram机器人通知组件
interface TelegramBotNotificationProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  userId?: number;
  className?: string;
}

export const TelegramBotNotification: React.FC<TelegramBotNotificationProps> = ({
  message,
  type = 'info',
  userId,
  className = '',
}) => {
  const { user, showNotification, hapticFeedback } = useTelegram();
  const [isSent, setIsSent] = useState(false);

  const sendToBot = useCallback(async () => {
    hapticFeedback('light');
    
    try {
      // 实际应用中需要调用Bot API
      console.log('发送到机器人:', { message, userId: userId || user?.id, type });
      
      setIsSent(true);
      showNotification('success', '已发送到机器人');
    } catch (error) {
      console.error('发送失败:', error);
      showNotification('error', '发送失败');
    }
  }, [message, userId, user?.id, hapticFeedback, showNotification]);

  return (
    <button
      className={`telegram-bot-notification ${isSent ? 'sent' : ''} ${className}`}
      onClick={sendToBot}
      disabled={isSent}
    >
      {isSent ? '已发送' : '发送到机器人'}
    </button>
  );
};

// Telegram主题按钮组件
interface TelegramThemeButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  fullWidth?: boolean;
}

export const TelegramThemeButton: React.FC<TelegramThemeButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  className = '',
  fullWidth = false,
}) => {
  const { hapticFeedback, theme } = useTelegram();

  const handleClick = useCallback(() => {
    hapticFeedback('light');
    onClick?.();
  }, [hapticFeedback, onClick]);

  const buttonClasses = [
    'telegram-theme-button',
    `variant-${variant}`,
    fullWidth && 'full-width',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={buttonClasses}
      onClick={handleClick}
      style={{
        backgroundColor: variant === 'primary' ? theme.colors.primary : 'transparent',
        color: variant === 'primary' ? theme.colors.background : theme.colors.foreground,
        borderColor: theme.colors.border,
      }}
    >
      {children}
    </button>
  );
};

export default TelegramThemeButton;