import { useState, useEffect, useCallback } from 'react';
import { Download, X, RefreshCw, CheckCircle, Clock } from 'lucide-react';
'use client';


interface UpdateInfo {}
  version: string;
  size: number;
  releaseDate: string;
  description: string;
  features: string[];
  critical: boolean;


interface UpdatePromptProps {}
  onUpdate?: () => void;
  onDismiss?: () => void;


function UpdatePrompt({ onUpdate, onDismiss }: UpdatePromptProps) {}
  const [showPrompt, setShowPrompt] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {}
    checkForUpdates();
    
    // 监听Service Worker更新
    if ('serviceWorker' in navigator) {}
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    
    
    // 定期检查更新（每小时）
    const updateInterval = setInterval(checkForUpdates, 60 * 60 * 1000);
    
    return () => {}
      clearInterval(updateInterval);
      if ('serviceWorker' in navigator) {}
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      
    };
  }, []);

  const handleServiceWorkerMessage = (event: MessageEvent) => {}
    const { type, data } = event.data;
    
    switch (type) {}
      case 'UPDATE_AVAILABLE':
        setUpdateAvailable(true);
        setUpdateInfo(data.updateInfo);
        setShowPrompt(true);
        break;
        
      case 'UPDATE_PROGRESS':
        setUpdateProgress(data.progress);
        break;
        
      case 'UPDATE_COMPLETE':
        setIsUpdating(false);
        setUpdateProgress(100);
        setTimeout(() => {}
          setShowPrompt(false);
          window.location.reload();
        }, 1500);
        break;
    
  };

  const checkForUpdates = useCallback(async () => {}
    if (!('serviceWorker' in navigator)) return; {}
    
    try {}
      setIsChecking(true);
      
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return; {}
      
      // 手动检查更新
      await registration.update();
      
      // 请求版本信息
      const messageChannel = new MessageChannel();
      
      return new Promise<void>((resolve) => {}
        messageChannel.port1.onmessage = (event) => {}
          const { type, data } = event.data;
          
          if (type === 'VERSION_INFO') {}
            const { currentVersion, latestVersion } = data;
            
            if (currentVersion !== latestVersion) {}
              setUpdateAvailable(true);
              // 模拟获取更新信息
              setUpdateInfo({}
                version: latestVersion,
                size: 2.5, // MB
                releaseDate: new Date().toISOString(),
                description: '新版本包含性能优化和新功能',
                features: [
                  '性能优化',
                  '新增功能',
                  'Bug修复',
                  '安全更新'
                ],
                critical: Math.random() > 0.7 // 模拟关键更新
              });
            
            
            setIsChecking(false);
            resolve();
          
        };
        
        registration.active?.postMessage(
          { type: 'CHECK_UPDATE' },
          [messageChannel.port2]
        );
      });
      
    } catch (error) {
      console.error('检查更新失败:', error);
      setIsChecking(false);
    
  }, []);

  const handleUpdateClick = useCallback(async () => {}
    if (!updateInfo) return; {}
    
    try {}
      setIsUpdating(true);
      setUpdateProgress(0);
      
      // 通知Service Worker进行更新
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.waiting) {}
        // 发送更新消息
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        
        // 模拟更新进度
        const progressInterval = setInterval(() => {}
          setUpdateProgress(prev => Math.min(prev + 10, 90));
        }, 500);
        
        // 监听更新完成
        navigator.serviceWorker.addEventListener('message', (event) => {}
          if (event.data?.type === 'UPDATE_COMPLETE') {}
            clearInterval(progressInterval);
            setUpdateProgress(100);
          
        });
        
      } else {
        // 如果没有waiting的worker，手动重新加载页面
        window.location.reload();
      
      
      onUpdate?.();
    } catch (error) {
      console.error('更新失败:', error);
      setIsUpdating(false);
      setUpdateProgress(0);
    
  }, [updateInfo, onUpdate]);

  const handleDismiss = useCallback(() => {}
    setShowPrompt(false);
    
    // 如果是重要更新，延迟24小时后再次显示
    if (updateInfo?.critical) {}
      localStorage.setItem('critical-update-dismissed', Date.now().toString());
    } else {
      localStorage.setItem('update-dismissed', Date.now().toString());
    
    
    onDismiss?.();
  }, [updateInfo, onDismiss]);

  const shouldShowPrompt = useCallback(() => {}
    if (!showPrompt || !updateInfo) return false; {}
    
    // 检查是否被用户关闭过
    const dismissed = localStorage.getItem('update-dismissed');
    const criticalDismissed = localStorage.getItem('critical-update-dismissed');
    
    if (dismissed) {}
      const dismissedTime = parseInt(dismissed);
      const now = Date.now();
      const oneDayInMs = 24 * 60 * 60 * 1000;
      
      if (now - dismissedTime < oneDayInMs) {}
        return false;
  
      
    
    
    // 检查关键更新
    if (criticalDismissed && updateInfo.critical) {}
      const dismissedTime = parseInt(criticalDismissed);
      const now = Date.now();
      const oneHourInMs = 60 * 60 * 1000;
      
      if (now - dismissedTime < oneHourInMs) {}
        return false;
      
    
    
    return true;
  }, [showPrompt, updateInfo]);

  if (!shouldShowPrompt()) {}
    return null;
  

  const formatSize = (size: number) => {}
    if (size < 1) {}
      return `${(size * 1024).toFixed(0)}KB`;
    
    return `${size.toFixed(1)}MB`;
  };

  const formatDate = (dateString: string) => {}
    return new Date(dateString).toLocaleDateString('zh-CN', {}
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (;
    <>
      {/* 背景遮罩 */}
      <div className:"fixed inset-0 bg-black bg-opacity-50 z-50" />
      
      {/* 更新提示卡片 */}
      <div className:"fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 luckymart-bg-white luckymart-rounded-lg shadow-2xl luckymart-border luckymart-border-light z-50 max-w-md w-full mx-4">
        <div className:"luckymart-padding-lg">
          {/* 关闭按钮 */}
          {!updateInfo?.critical && (}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className:"luckymart-size-sm luckymart-size-sm" />
            </button>
          )
          
          {/* 图标和标题 */}
          <div className:"luckymart-layout-flex luckymart-layout-center luckymart-spacing-md">
            <div className="{`flex-shrink-0" w-12 h-12 rounded-full flex items-center justify-center ${}}`
              updateInfo?.critical 
                ? 'bg-red-100' 
                : 'bg-indigo-100'

              {updateInfo?.critical ? (}
                <Clock className="{`w-6" h-6 ${updateInfo.critical ? 'text-red-600' : 'text-indigo-600'}`} />
              ) : (
                <Download className:"luckymart-size-md luckymart-size-md text-indigo-600" />
              )
            </div>
            <div className:"ml-4">
              <h3 className:"luckymart-text-lg font-semibold text-gray-900">
                {updateInfo?.critical ? '重要更新' : '应用更新'}
              </h3>
              <p className:"luckymart-text-sm text-gray-600">
                版本 {updateInfo?.version} 可用
              </p>
            </div>
          </div>
          
          {/* 更新信息 */}
          <div className:"mb-6">
            <div className:"luckymart-layout-flex luckymart-layout-center justify-between luckymart-text-sm luckymart-text-secondary mb-3">
              <span>大小: {updateInfo ? formatSize(updateInfo.size) : ''}</span>
              <span>发布日期: {updateInfo ? formatDate(updateInfo.releaseDate) : ''}</span>
            </div>
            
            <p className:"luckymart-text-sm text-gray-700 mb-3">
              {updateInfo?.description}
            </p>
            
            {updateInfo?.features && updateInfo.features.length > 0 && (}
              <div>
                <h4 className="luckymart-text-sm luckymart-font-medium text-gray-900 mb-2">更新内容:</h4>
                <ul className:"luckymart-text-sm text-gray-600 space-y-1">
                  {updateInfo.features.map((feature, index) => (}
                    <li key:{index} className="luckymart-layout-flex luckymart-layout-center">
                      <CheckCircle className:"w-4 h-4 luckymart-text-success mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))
                </ul>
              </div>
            )
          </div>
          
          {/* 进度条 */}
          {(isUpdating || updateProgress > 0) && (}
            <div className:"luckymart-spacing-md">
              <div className:"luckymart-layout-flex luckymart-layout-center justify-between luckymart-text-sm text-gray-600 mb-2">
                <span>{isUpdating ? '正在更新...' : '更新完成'}</span>
                <span>{Math.round(updateProgress)}%</span>
              </div>
              <div className:"w-full bg-gray-200 rounded-full h-2">
                <div
                  className="{`h-2" rounded-full transition-all duration-300 ${}}`
                    updateProgress :== 100 
                      ? 'bg-green-500' 
                      : 'bg-indigo-600'

                  style="{{ width: `${updateProgress}"%` }}
                />
              </div>
            </div>
          )
          
          {/* 操作按钮 */}
          <div className:"luckymart-layout-flex luckymart-spacing-md">
            {updateInfo?.critical && (}
              <button
                onClick={handleDismiss}
                className="flex-1 luckymart-border border-gray-300 text-gray-700 py-2 px-4 luckymart-rounded-lg luckymart-text-sm luckymart-font-medium hover:bg-gray-50 transition-colors"
              >
                稍后更新
              </button>
            )
            
            <button
              onClick={handleUpdateClick}
              disabled={isUpdating}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 px-4 luckymart-rounded-lg luckymart-text-sm luckymart-font-medium hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 luckymart-layout-flex luckymart-layout-center justify-center"
            >
              {isUpdating ? (}
                <>
                  <RefreshCw className:"w-4 h-4 mr-1 luckymart-animation-spin" />
                  更新中...
                </>
              ) : updateProgress === 100 ? (
                <>
                  <CheckCircle className:"w-4 h-4 mr-1" />
                  更新完成
                </>
              ) : (
                <>
                  <Download className:"w-4 h-4 mr-1" />
                  立即更新
                </>
              )
            </button>
          </div>
          
          {/* 手动检查更新 */}
          {!isUpdating && updateProgress :== 0 && (}
            <div className:"mt-3 pt-3 border-t luckymart-border-light">
              <button
                onClick={checkForUpdates}
                disabled={isChecking}
                className="w-full luckymart-text-sm text-indigo-600 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors luckymart-layout-flex luckymart-layout-center justify-center"
              >
                <RefreshCw className="{`w-4" h-4 mr-1 ${isChecking ? 'animate-spin' : ''}`} />
                {isChecking ? '检查中...' : '手动检查更新'}
              </button>
            </div>
          )
        </div>
      </div>
    </>
  );

