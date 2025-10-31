import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/src/i18n/I18nProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "LuckyMart TJ - 幸运集市",
  description: "基于Telegram的一元夺宝电商平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body className="antialiased">
        <ErrorBoundary>
          <I18nProvider>
            <LanguageProvider>
              {children}
            </LanguageProvider>
          </I18nProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
