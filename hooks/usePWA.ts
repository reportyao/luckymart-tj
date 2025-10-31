'use client';

import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface UpdateInfo {
  version: string;
  size: number;
  releaseDate: string;
  description: string;
  features: string[];
  critical: boolean;
}

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isUpdateAvailableForClient, setIsUpdateAvailableForClient] = useState(false);

  useEffect(() => {
    // 检查是否已安装
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
    };

    // 监听应用安装事件
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // 监听Service Worker更新
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'UPDATE_AVAILABLE':
          setIsUpdateAvailable(true);
          setUpdateInfo(data.updateInfo);
          break;
          
        case 'CACHE_UPDATED':
          console.log('缓存已更新:', data.cacheName);
          break;
          
        case 'OFFLINE_FALLBACK':
          console.log('离线降级:', data.url);
          break;
      }
    };

    checkInstallStatus();
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 触发安装提示
  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      
      setDeferredPrompt(null);
      return choiceResult.outcome === 'accepted';
    } catch (error) {
      console.error('安装失败:', error);
      return false;
    }
  }, [deferredPrompt]);

  // 检查更新
  const checkForUpdates = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      // 手动检查更新
      await registration.update();

      // 发送更新检查消息
      if (registration.active) {
        const messageChannel = new MessageChannel();
        
        return new Promise<void>((resolve) => {
          messageChannel.port1.onmessage = (event) => {
            const { type, data } = event.data;
            
            if (type === 'VERSION_INFO') {
              const { currentVersion, latestVersion } = data;
              
              if (currentVersion !== latestVersion) {
                setIsUpdateAvailableForClient(true);
                // 模拟获取更新信息
                setUpdateInfo({
                  version: latestVersion,
                  size: 2.5,
                  releaseDate: new Date().toISOString(),
                  description: '新版本包含性能优化和新功能',
                  features: ['性能优化', '新功能', 'Bug修复', '安全更新'],
                  critical: Math.random() > 0.7
                });
              }
              
              resolve();
            }
          };
          
          registration.active?.postMessage(
            { type: 'CHECK_UPDATE' },
            [messageChannel.port2]
          );
        });
      }
    } catch (error) {
      console.error('检查更新失败:', error);
    }
  }, []);

  // 触发更新
  const triggerUpdate = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return false;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.waiting) {
        // 发送SKIP_WAITING消息
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('触发更新失败:', error);
      return false;
    }
  }, []);

  // 获取缓存状态
  const getCacheStatus = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return null;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return null;

      const messageChannel = new MessageChannel();
      
      return new Promise<any>((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          const { type, data } = event.data;
          
          if (type === 'CACHE_STATUS') {
            resolve(data.status);
          }
        };
        
        registration.active?.postMessage(
          { type: 'GET_CACHE_STATUS' },
          [messageChannel.port2]
        );
      });
    } catch (error) {
      console.error('获取缓存状态失败:', error);
      return null;
    }
  }, []);

  // 清除缓存
  const clearCache = useCallback(async (cacheNames?: string[]) => {
    if (!('serviceWorker' in navigator)) return false;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return false;

      registration.active?.postMessage({
        type: 'CLEAR_CACHE',
        payload: { cacheNames }
      });
      
      return true;
    } catch (error) {
      console.error('清除缓存失败:', error);
      return false;
    }
  }, []);

  // 订阅推送通知
  const subscribeToPush = useCallback(async (vapidPublicKey: string): Promise<PushSubscription | null> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.error('浏览器不支持推送通知');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
      
      const subscription: PushSubscription = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(pushSubscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(pushSubscription.getKey('auth')!)
        }
      };
      
      return subscription;
    } catch (error) {
      console.error('订阅推送通知失败:', error);
      return null;
    }
  }, []);

  // 取消推送通知订阅
  const unsubscribeFromPush = useCallback(async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      
      if (pushSubscription) {
        await pushSubscription.unsubscribe();
      }
      
      return true;
    } catch (error) {
      console.error('取消订阅失败:', error);
      return false;
    }
  }, []);

  return {
    // 安装相关
    isInstallable,
    isInstalled,
    deferredPrompt,
    triggerInstall,
    
    // 更新相关
    isUpdateAvailable,
    isUpdateAvailableForClient,
    updateInfo,
    checkForUpdates,
    triggerUpdate,
    
    // 缓存相关
    getCacheStatus,
    clearCache,
    
    // 推送通知相关
    subscribeToPush,
    unsubscribeFromPush,
  };
}

// 辅助函数
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};