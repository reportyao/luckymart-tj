/**
 * Telegram Mini App 功能展示页面
 * 演示所有集成功能的完整示例
 */

'use client';

import React, { useState } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
import { useOrientation } from '@/components/orientation/OrientationDetector';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { TelegramKeyboard, KeyboardInput } from '@/components/keyboard/TelegramKeyboard';
import { MobileKeyboardAdapter } from '@/components/mobile/MobileKeyboard';
import { 
  TelegramShare, 
  TelegramSave, 
  TelegramMainButtonComponent, 
  TelegramNotification, 
  TelegramPayment, 
  TelegramThemeButton,
  TelegramBotNotification 
} from '@/components/telegram/TelegramFeatures';
import { ThemeMode } from '@/types/telegram';

export default function TelegramMiniAppDemo() {
  const { 
    user, 
    theme, 
    deviceInfo, 
    themeMode, 
    setThemeMode, 
    hapticFeedback, 
    showNotification,
    isLoading,
    error 
  } = useTelegram();
  
  const { orientation, isPortrait, isLandscape } = useOrientation();
  const [inputValue, setInputValue] = useState('');
  const [showKeyboardDemo, setShowKeyboardDemo] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // 主题切换
  const handleThemeChange = (mode: ThemeMode) => {
    hapticFeedback('light');
    setThemeMode(mode);
  };

  // 测试分享功能
  const handleShare = () => {
    setNotification({ type: 'success', message: '分享功能演示' });
  };

  // 测试保存功能
  const handleSave = () => {
    const demoData = {
      timestamp: new Date().toISOString(),
      content: '演示数据',
      user: user?.username || '匿名用户',
    };
    setNotification({ type: 'success', message: '保存功能演示' });
  };

  // 测试支付功能
  const handlePayment = () => {
    setNotification({ type: 'info', message: '支付功能演示（模拟）' });
  };

  // 测试主按钮
  const handleMainButtonClick = () => {
    hapticFeedback('medium');
    setNotification({ type: 'success', message: '主按钮被点击' });
  };

  if (isLoading) {
    return (
      <ResponsiveLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>正在初始化Telegram Mini App...</p>
          </div>
        </div>
      </ResponsiveLayout>
    );
  }

  if (error) {
    return (
      <ResponsiveLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-500 mb-4">初始化失败: {error}</p>
            <TelegramThemeButton onClick={() => window.location.reload()}>
              重新加载
            </TelegramThemeButton>
          </div>
        </div>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout showDebugInfo={true}>
      <div className="min-h-screen" style={{ background: theme.colors.background, color: theme.colors.foreground }}>
        
        {/* 通知组件 */}
        {notification && (
          <TelegramNotification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        <div className="container mx-auto px-4 py-6 space-y-8">
          
          {/* 标题区域 */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">
              LuckyMart TJ Telegram Mini App
            </h1>
            <p className="text-lg opacity-80">
              完整的Telegram集成功能演示
            </p>
            <div className="flex justify-center space-x-2">
              <span className="px-2 py-1 bg-primary text-primary-foreground rounded text-sm">
                {orientation === 'portrait' ? '竖屏' : '横屏'}
              </span>
              <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm">
                {deviceInfo.isTelegram ? 'Telegram环境' : '普通浏览器'}
              </span>
              <span className="px-2 py-1 bg-accent text-white rounded text-sm">
                {theme.isTelegramTheme ? 'Telegram主题' : '自定义主题'}
              </span>
            </div>
          </div>

          {/* 用户信息 */}
          {user && (
            <div className="card p-6 border rounded-lg" style={{ backgroundColor: theme.colors.muted }}>
              <h2 className="text-xl font-semibold mb-4">用户信息</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">ID:</span> {user.id}
                </div>
                <div>
                  <span className="font-medium">用户名:</span> {user.username || '未设置'}
                </div>
                <div>
                  <span className="font-medium">姓名:</span> {user.first_name} {user.last_name || ''}
                </div>
                <div>
                  <span className="font-medium">语言:</span> {user.language_code || 'zh'}
                </div>
              </div>
            </div>
          )}

          {/* 主题切换 */}
          <div className="card p-6 border rounded-lg" style={{ backgroundColor: theme.colors.muted }}>
            <h2 className="text-xl font-semibold mb-4">主题切换</h2>
            <div className="flex flex-wrap gap-3">
              <TelegramThemeButton 
                variant={themeMode === 'light' ? 'primary' : 'outline'}
                onClick={() => handleThemeChange(ThemeMode.LIGHT)}
              >
                浅色模式
              </TelegramThemeButton>
              <TelegramThemeButton 
                variant={themeMode === 'dark' ? 'primary' : 'outline'}
                onClick={() => handleThemeChange(ThemeMode.DARK)}
              >
                深色模式
              </TelegramThemeButton>
              <TelegramThemeButton 
                variant={themeMode === 'system' ? 'primary' : 'outline'}
                onClick={() => handleThemeChange(ThemeMode.SYSTEM)}
              >
                跟随系统
              </TelegramThemeButton>
            </div>
          </div>

          {/* 键盘适配演示 */}
          <div className="card p-6 border rounded-lg" style={{ backgroundColor: theme.colors.muted }}>
            <h2 className="text-xl font-semibold mb-4">键盘适配</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">普通输入框:</label>
                <TelegramKeyboard>
                  <KeyboardInput
                    type="text"
                    placeholder="请输入内容..."
                    value={inputValue}
                    onChange={setInputValue}
                  />
                </TelegramKeyboard>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">虚拟键盘演示:</label>
                <button
                  className="telegram-theme-button"
                  onClick={() => setShowKeyboardDemo(!showKeyboardDemo)}
                >
                  {showKeyboardDemo ? '隐藏' : '显示'}虚拟键盘
                </button>
                
                {showKeyboardDemo && (
                  <div className="mt-4">
                    <MobileKeyboardAdapter
                      keyboardType="default"
                      onSubmit={(value) => {
                        setInputValue(value);
                        setNotification({ type: 'success', message: `提交内容: ${value}` });
                      }}
                    >
                      <input
                        type="text"
                        className="telegram-keyboard-input"
                        placeholder="虚拟键盘输入..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                      />
                    </MobileKeyboardAdapter>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Telegram特色功能 */}
          <div className="card p-6 border rounded-lg" style={{ backgroundColor: theme.colors.muted }}>
            <h2 className="text-xl font-semibold mb-4">Telegram特色功能</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              
              <TelegramShare
                url="https://luckymart.tj"
                text="来看看这个很棒的一元夺宝平台！"
                title="LuckyMart TJ"
              >
                <TelegramThemeButton fullWidth>
                  分享到Telegram
                </TelegramThemeButton>
              </TelegramShare>

              <TelegramSave data={{ demo: true, timestamp: Date.now() }}>
                <TelegramThemeButton fullWidth>
                  保存到Telegram
                </TelegramThemeButton>
              </TelegramSave>

              <TelegramPayment
                price={9.99}
                description="LuckyMart会员套餐"
                onSuccess={() => setNotification({ type: 'success', message: '支付成功！' })}
                onError={(error) => setNotification({ type: 'error', message: error })}
              >
                <TelegramThemeButton fullWidth>
                  Telegram支付
                </TelegramThemeButton>
              </TelegramPayment>

              <TelegramBotNotification
                message="测试消息"
                type="info"
              >
                <TelegramThemeButton fullWidth>
                  发送到机器人
                </TelegramThemeButton>
              </TelegramBotNotification>

              <TelegramThemeButton 
                fullWidth
                onClick={() => {
                  hapticFeedback('medium');
                  setNotification({ type: 'info', message: '触觉反馈测试' });
                }}
              >
                触觉反馈
              </TelegramThemeButton>

              <TelegramThemeButton 
                fullWidth
                onClick={handleMainButtonClick}
              >
                主按钮测试
              </TelegramThemeButton>
            </div>
          </div>

          {/* Telegram主按钮 */}
          <TelegramMainButtonComponent
            text="点击测试"
            onClick={handleMainButtonClick}
          />

          {/* 设备信息 */}
          <div className="card p-6 border rounded-lg" style={{ backgroundColor: theme.colors.muted }}>
            <h2 className="text-xl font-semibold mb-4">设备信息</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">设备类型:</span> 
                <br />{deviceInfo.isMobile ? '移动端' : deviceInfo.isTablet ? '平板' : '桌面端'}
              </div>
              <div>
                <span className="font-medium">屏幕方向:</span> 
                <br />{isPortrait ? '竖屏' : isLandscape ? '横屏' : '未知'}
              </div>
              <div>
                <span className="font-medium">视口大小:</span> 
                <br />{deviceInfo.viewportWidth} × {deviceInfo.viewportHeight}
              </div>
              <div>
                <span className="font-medium">像素比:</span> 
                <br />{deviceInfo.pixelRatio}
              </div>
            </div>
          </div>

          {/* 主题颜色展示 */}
          <div className="card p-6 border rounded-lg" style={{ backgroundColor: theme.colors.muted }}>
            <h2 className="text-xl font-semibold mb-4">主题颜色</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(theme.colors).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div 
                    className="w-12 h-12 mx-auto mb-2 rounded border"
                    style={{ backgroundColor: value }}
                  />
                  <div className="text-xs font-medium capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-xs opacity-70 font-mono">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </ResponsiveLayout>
  );
}