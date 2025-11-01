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
// PWA相关组件
import PWAInstaller from "@/components/PWAInstaller";
import OfflineIndicator from "@/components/OfflineIndicator";
import UpdatePrompt from "@/components/UpdatePrompt";
import NetworkAwareServiceWorker from "@/components/NetworkAwareServiceWorker";
// 语言属性设置组件
import LanguageAttributes from "@/components/LanguageAttributes";

export const metadata: Metadata = {
  title: "LuckyMart TJ - 幸运集市",
  description: "基于Telegram的一元夺宝电商平台",
  manifest: "/manifest.json",
  themeColor: "#6366f1",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LuckyMart TJ",
  },
  icons: {
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
    apple: {
      url: "/icons/icon-192x192.png",
      sizes: "192x192",
      type: "image/png",
    },
  },
};

function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body className="antialiased">
        <ErrorBoundary>
          <I18nProvider>
            {/* 动态设置语言属性 */}
            <LanguageAttributes />
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
          </I18nProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
