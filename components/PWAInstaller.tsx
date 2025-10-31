'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Download, Smartphone, Monitor } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [installChoice, setInstallChoice] = useState<'accepted' | 'dismissed' | null>(null);

  useEffect(() => {
    // 检查是否已经安装
    const checkInstallStatus = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
    };

    // 监听安装提示事件
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
      setIsInstallable(true);
      
      // 显示安装提示（延迟3秒后显示）
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
    };

    // 监听应用安装事件
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      
      // 显示安装成功提示
      console.log('PWA应用已安装');
    };

    checkInstallStatus();
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      setInstallChoice(choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setShowInstallPrompt(false);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('安装失败:', error);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowInstallPrompt(false);
    setInstallChoice('dismissed');
    
    // 24小时内不再显示
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }, []);

  // 检查是否应该显示提示
  const shouldShowPrompt = () => {
    if (isInstalled || !isInstallable || !deferredPrompt) {
      return false;
    }
    
    // 检查24小时冷却期
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const now = Date.now();
      const oneDayInMs = 24 * 60 * 60 * 1000;
      
      if (now - dismissedTime < oneDayInMs) {
        return false;
      }
    }
    
    return showInstallPrompt;
  };

  const getInstallInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return {
        icon: <Smartphone className="w-6 h-6" />,
        title: '添加到主屏幕',
        steps: [
          '点击Safari底部的分享按钮',
          '向下滚动并点击"添加到主屏幕"',
          '确认添加应用'
        ]
      };
    }
    
    if (userAgent.includes('android')) {
      return {
        icon: <Smartphone className="w-6 h-6" />,
        title: '安装应用',
        steps: [
          '点击浏览器菜单中的"安装应用"',
          '或在地址栏右侧点击安装图标',
          '确认安装应用'
        ]
      };
    }
    
    return {
      icon: <Monitor className="w-6 h-6" />,
      title: '安装应用',
      steps: [
        '点击浏览器地址栏右侧的安装图标',
        '或按 Ctrl+Shift+I (Windows) / Cmd+Shift+I (Mac)',
        '确认安装应用'
      ]
    };
  };

  if (!shouldShowPrompt()) {
    return null;
  }

  const instructions = getInstallInstructions();

  return (
    <>
      {/* 背景遮罩 */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      
      {/* 安装提示卡片 */}
      <div className="fixed bottom-4 left-4 right-4 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-w-sm mx-auto">
        <div className="p-4">
          {/* 关闭按钮 */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* 图标和标题 */}
          <div className="flex items-center mb-3">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
              {instructions.icon}
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {instructions.title}
              </h3>
              <p className="text-sm text-gray-600">
                LuckyMart-TJ 乐享商城
              </p>
            </div>
          </div>
          
          {/* 描述 */}
          <p className="text-sm text-gray-700 mb-4">
            获得更好的购物体验，享受原生应用般的流畅操作
          </p>
          
          {/* 安装步骤 */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">安装步骤：</h4>
            <ol className="text-xs text-gray-600 space-y-1">
              {instructions.steps.map((step, index) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block w-4 h-4 bg-indigo-100 text-indigo-600 rounded-full text-center text-xs leading-4 mr-2 flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex space-x-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-1" />
              安装应用
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              稍后再说
            </button>
          </div>
        </div>
      </div>
    </>
  );
}