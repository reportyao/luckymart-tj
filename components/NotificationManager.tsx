'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Settings, Check, X } from 'lucide-react';

// Props接口定义
export interface NotificationManagerProps {
  /** 自定义CSS类名 */
  className?: string;
  /** 是否自动请求权限 */
  autoRequestPermission?: boolean;
  /** 是否显示测试通知按钮 */
  showTestNotification?: boolean;
  /** 初始权限状态 */
  initialPermission?: 'granted' | 'denied' | 'default';
  /** 自定义VAPID公钥 */
  customVapidKey?: string;
  /** 权限状态变化回调 */
  onPermissionChange?: (permission: string) => void;
  /** 订阅状态变化回调 */
  onSubscriptionChange?: (isSubscribed: boolean) => void;
  /** 测试通知回调 */
  onTestNotification?: () => void;
  /** 错误回调函数 */
  onError?: (error: Error) => void;
}

interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

const NotificationManager: React.FC<NotificationManagerProps> = ({
  className = '',
  autoRequestPermission = false,
  showTestNotification = true,
  initialPermission,
  customVapidKey,
  onPermissionChange,
  onSubscriptionChange,
  onTestNotification,
  onError
}) => {
  const [permission, setPermission] = useState<NotificationPermission['granted'] | NotificationPermission['denied'] | NotificationPermission['default']>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkPermissionStatus();
    checkSubscriptionStatus();
  }, []);

  const checkPermissionStatus = () => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  };

  const checkSubscriptionStatus = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();
        
        if (existingSubscription) {
          setSubscription({
            endpoint: existingSubscription.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(existingSubscription.getKey('p256dh')!),
              auth: arrayBufferToBase64(existingSubscription.getKey('auth')!)
            }
          });
          setIsSubscribed(true);
        }
      } catch (error) {
        console.error('检查订阅状态失败:', error);
      }
    }
  };

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      alert('您的浏览器不支持通知功能');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        setShowPermissionPrompt(false);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('请求通知权限失败:', error);
      return false;
    }
  }, []);

  const subscribeToPush = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('您的浏览器不支持推送通知');
      return false;
    }

    try {
      setIsLoading(true);
      
      // 注册Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      
      // 生成VAPID公钥
      const vapidPublicKey = await getVapidPublicKey();
      
      // 订阅推送服务
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
      
      // 保存订阅信息到服务器
      await saveSubscriptionToServer(pushSubscription);
      
      setSubscription({
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(pushSubscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(pushSubscription.getKey('auth')!)
        }
      });
      
      setIsSubscribed(true);
      setIsLoading(false);
      
      return true;
    } catch (error) {
      console.error('订阅推送服务失败:', error);
      setIsLoading(false);
      return false;
    }
  }, []);

  const unsubscribeFromPush = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (subscription) {
        // 从服务器删除订阅
        await deleteSubscriptionFromServer(subscription.endpoint);
      }
      
      // 取消推送订阅
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      
      if (pushSubscription) {
        await pushSubscription.unsubscribe();
      }
      
      setSubscription(null);
      setIsSubscribed(false);
      setIsLoading(false);
      
      return true;
    } catch (error) {
      console.error('取消订阅失败:', error);
      setIsLoading(false);
      return false;
    }
  }, [subscription]);

  const handleNotificationToggle = useCallback(async () => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return;
    }
    
    if (isSubscribed) {
      await unsubscribeFromPush();
    } else {
      await subscribeToPush();
    }
  }, [permission, isSubscribed, requestPermission, subscribeToPush, unsubscribeFromPush]);

  // 发送测试通知
  const sendTestNotification = useCallback(async () => {
    if (!isSubscribed || !subscription) return;
    
    try {
      await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          title: '测试通知',
          body: '这是一条测试通知，恭喜您可以正常接收推送消息了！',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          data: {
            url: '/',
            type: 'test'
          }
        })
      });
      
      alert('测试通知已发送，请查看您的设备通知');
    } catch (error) {
      console.error('发送测试通知失败:', error);
      alert('发送测试通知失败，请稍后重试');
    }
  }, [isSubscribed, subscription]);

  // 显示权限请求提示
  const showPermissionPromptIfNeeded = useCallback(() => {
    if (permission === 'default' && !isSubscribed) {
      setShowPermissionPrompt(true);
    }
  }, [permission, isSubscribed]);

  // 获取VAPID公钥（这里应该从服务器获取）
  const getVapidPublicKey = async (): Promise<string> => {
    try {
      const response = await fetch('/api/notifications/vapid-public-key');
      const data = await response.json();
      return data.publicKey;
    } catch (error) {
      console.error('获取VAPID公钥失败:', error);
      // 返回示例公钥，生产环境需要替换为真实的
      return 'BEl62iUYgUivxIkv69yViEuiBIa40HI80NQD6F0jFSJj7Up5khOs8HCAHOqBZGNqn1jWiGCZbfZMUjO_gCZME4Pg';
    }
  };

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

  // 保存订阅到服务器
  const saveSubscriptionToServer = async (subscription: PushSubscription) => {
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      })
    });
  };

  // 从服务器删除订阅
  const deleteSubscriptionFromServer = async (endpoint: string) => {
    await fetch('/api/notifications/unsubscribe', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ endpoint })
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="luckymart-layout-flex luckymart-layout-center justify-between luckymart-spacing-md">
        <div className="luckymart-layout-flex luckymart-layout-center">
          <Bell className="luckymart-size-sm luckymart-size-sm text-indigo-600 mr-2" />
          <h3 className="luckymart-text-lg font-semibold text-gray-900">推送通知</h3>
        </div>
        
        {/* 通知状态指示器 */}
        <div className="luckymart-layout-flex luckymart-layout-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            permission === 'granted' && isSubscribed 
              ? 'bg-green-500' 
              : permission === 'denied' 
                ? 'bg-red-500' 
                : 'bg-yellow-500'
          }`} />
          <span className="luckymart-text-sm text-gray-600">
            {permission === 'granted' && isSubscribed 
              ? '已启用' 
              : permission === 'denied' 
                ? '已拒绝' 
                : '未启用'}
          </span>
        </div>
      </div>

      {/* 权限提示 */}
      {showPermissionPrompt && permission === 'default' && (
        <div className="luckymart-spacing-md luckymart-padding-md bg-blue-50 luckymart-border border-blue-200 luckymart-rounded-lg">
          <div className="luckymart-layout-flex items-start">
            <Bell className="luckymart-size-sm luckymart-size-sm text-blue-600 mr-2 mt-0.5" />
            <div className="flex-1">
              <h4 className="luckymart-text-sm luckymart-font-medium text-blue-900 mb-1">
                启用推送通知
              </h4>
              <p className="luckymart-text-sm text-blue-700 mb-3">
                接收订单状态更新、促销活动、抽奖提醒等重要通知
              </p>
              <button
                onClick={handleNotificationToggle}
                className="luckymart-text-sm bg-blue-600 text-white px-3 py-1 luckymart-rounded hover:bg-blue-700 transition-colors"
              >
                启用通知
              </button>
            </div>
            <button
              onClick={() => setShowPermissionPrompt(false)}
              className="text-blue-400 hover:text-blue-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 通知设置 */}
      <div className="space-y-4">
        {/* 主开关 */}
        <div className="luckymart-layout-flex luckymart-layout-center justify-between">
          <div>
            <h4 className="luckymart-text-sm luckymart-font-medium text-gray-900">
              推送通知
            </h4>
            <p className="luckymart-text-sm luckymart-text-secondary">
              {permission === 'granted' && isSubscribed 
                ? '您将接收重要通知消息' 
                : '启用后可接收订单和活动通知'}
            </p>
          </div>
          <button
            onClick={handleNotificationToggle}
            disabled={isLoading}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              permission === 'granted' && isSubscribed 
                ? 'bg-indigo-600' 
                : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                permission === 'granted' && isSubscribed 
                  ? 'translate-x-5' 
                  : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 通知类型设置 */}
        {permission === 'granted' && isSubscribed && (
          <div className="luckymart-spacing-md">
            <h4 className="luckymart-text-sm luckymart-font-medium text-gray-900">通知类型</h4>
            
            <div className="luckymart-spacing-sm">
              <label className="luckymart-layout-flex luckymart-layout-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 luckymart-rounded"
                />
                <span className="ml-2 luckymart-text-sm text-gray-700">订单状态更新</span>
              </label>
              
              <label className="luckymart-layout-flex luckymart-layout-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 luckymart-rounded"
                />
                <span className="ml-2 luckymart-text-sm text-gray-700">促销活动</span>
              </label>
              
              <label className="luckymart-layout-flex luckymart-layout-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 luckymart-rounded"
                />
                <span className="ml-2 luckymart-text-sm text-gray-700">抽奖提醒</span>
              </label>
              
              <label className="luckymart-layout-flex luckymart-layout-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 luckymart-rounded"
                />
                <span className="ml-2 luckymart-text-sm text-gray-700">签到提醒</span>
              </label>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="luckymart-layout-flex luckymart-spacing-md pt-4">
          {permission === 'granted' && isSubscribed && (
            <button
              onClick={sendTestNotification}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 luckymart-rounded-lg luckymart-text-sm luckymart-font-medium hover:bg-indigo-700 transition-colors luckymart-layout-flex luckymart-layout-center justify-center"
            >
              <Check className="w-4 h-4 mr-1" />
              发送测试通知
            </button>
          )}
          
          <button
            onClick={showPermissionPromptIfNeeded}
            className="flex-1 luckymart-border border-gray-300 text-gray-700 py-2 px-4 luckymart-rounded-lg luckymart-text-sm luckymart-font-medium hover:bg-gray-50 transition-colors luckymart-layout-flex luckymart-layout-center justify-center"
          >
            <Settings className="w-4 h-4 mr-1" />
            设置
          </button>
        </div>
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div className="absolute inset-0 luckymart-bg-white bg-opacity-75 luckymart-layout-flex luckymart-layout-center justify-center luckymart-rounded-lg">
          <div className="luckymart-size-md luckymart-size-md border-2 border-indigo-600 border-t-transparent rounded-full luckymart-animation-spin" />
        </div>
      )}
    </div>
  );
};

export default NotificationManager;