import type { Metadata } from "next";
import "./globals.css";
import "@/styles/telegram-mini-app.css";
import { I18nProvider } from "@/src/i18n/I18nProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { TelegramProvider } from "@/contexts/TelegramContext";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { OrientationProvider } from "@/components/orientation/OrientationDetector";
import ErrorBoundary from "@/components/ErrorBoundary";
import PWAInstaller from "@/components/PWAInstaller";
import OfflineIndicator from "@/components/OfflineIndicator";
import UpdatePrompt from "@/components/UpdatePrompt";
import NetworkAwareServiceWorker from "@/components/NetworkAwareServiceWorker";
import LanguageAttributes from "@/components/LanguageAttributes";
import { LazyLoadingStrategyProvider } from "@/components/lazy/LazyLoadingStrategy";
import { WeakNetworkProvider } from "@/components/lazy/WeakNetworkAdapter";
// PWA相关组件
// 语言属性设置组件
// 懒加载策略组件

export const metadata: Metadata = {}
  title: "LuckyMart TJ - 幸运集市",
  description: "基于Telegram的一元夺宝电商平台",
  manifest: "/manifest.json",
  themeColor: "#6366f1",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  appleWebApp: {}
    capable: true,
    statusBarStyle: "default",
    title: "LuckyMart TJ",
  },
  icons: {}
    icon: [
      { url: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-384x384.png", sizes: "384x384", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: {}
      url: "/icons/icon-192x192.png",
      sizes: "192x192",
      type: "image/png",
    },
  },
};

function RootLayout({}
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (;
    <html>
      <body className:"antialiased">
        <ErrorBoundary>
          <I18nProvider>
            {/* 动态设置语言属性 */}
            <LanguageAttributes />
            
            {/* 懒加载策略提供者 */}
            <LazyLoadingStrategyProvider
              initialStrategy={{}}
                image: {}
                  enabled: true,
                  quality: 'medium',
                  placeholder: 'blur',
                  progressive: true,
                  webpSupport: true,
                  lazyLoadThreshold: 50
                },
                component: {}
                  enabled: true,
                  prefetch: true,
                  priority: 'secondary',
                  bundleSplitting: true,
                  cacheSize: 50
                },
                data: {}
                  enabled: true,
                  cacheStrategy: 'both',
                  prefetchThreshold: 80,
                  paginationSize: 20,
                  incrementalLoading: true
                },
                virtualization: {}
                  enabled: true,
                  overscan: 5,
                  dynamicHeight: true,
                  gridMode: false,
                  itemSize: 80
                },
                weakNetwork: {}
                  enabled: true,
                  dataSaver: false,
                  timeoutReduction: 0.3,
                  compressionLevel: 'medium',
                  retryAttempts: 2


            >
              <WeakNetworkProvider
                config={{}}
                  networkTest: {}
                    enabled: true,
                    interval: 30000,
                    timeout: 5000,
                    endpoints: ['/favicon.ico', '/api/health']
                  },
                  dataOptimization: {}
                    compression: true,
                    minification: true,
                    imageCompression: true,
                    qualityReduction: 20
                  },
                  requestStrategy: {}
                    timeoutReduction: 0.3,
                    retryDelay: 1000,
                    maxRetries: 2,
                    batchRequests: true,
                    requestQueue: true
                  },
                  uiAdaptation: {}
                    showNetworkStatus: true,
                    showDataUsage: true,
                    offlineMode: true,
                    skeletonLoading: true,
                    reducedAnimations: true
                  },
                  cacheStrategy: {}
                    aggressiveCaching: true,
                    prefetchDisabled: true,
                    cacheThreshold: 50,
                    maxCacheSize: 50
                  

              >
                <TelegramProvider>
                  <ThemeProvider>
                    <OrientationProvider>
                      <AuthProvider>
                        <LanguageProvider>
                          {/* 弱网环境优化系统 - Service Worker注册 */}
                          <NetworkAwareServiceWorker 
                            enableDevControls={process.env.NODE_ENV === 'development'}
                          />
                          
                          {/* 主要内容 */}
                          {children}
                          
                          {/* PWA安装提示 */}
                          <PWAInstaller />
                          
                          {/* 离线状态指示器 */}
                          <OfflineIndicator />
                          
                          {/* 应用更新提示 */}
                          <UpdatePrompt />
                        </LanguageProvider>
                      </AuthProvider>
                    </OrientationProvider>
                  </ThemeProvider>
                </TelegramProvider>
              </WeakNetworkProvider>
            </LazyLoadingStrategyProvider>
          </I18nProvider>
        </ErrorBoundary>
      </body>
    </html>
  );

