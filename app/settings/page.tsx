'use client';

import Link from 'next/link';
import { useState } from 'react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

function SettingsPage() {
  const { t } = useTranslation(['common', 'settings']);
  const [notifications, setNotifications] = useState({
    lottery: true,
    orders: true,
    promotional: false
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <Link href="/profile" className="mr-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold">{t('common:settings.title')}</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* 语言设置 */}
        <div className="bg-white rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">{t('common:settings.language_settings')}</h2>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">{t('common:settings.select_language')}</span>
            <LanguageSwitcher />
          </div>
        </div>

        {/* 通知设置 */}
        <div className="bg-white rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">{t('common:settings.notification_settings')}</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{t('common:settings.lottery_notifications')}</h3>
                <p className="text-sm text-gray-500">{t('common:settings.lottery_notifications_desc')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={notifications.lottery}
                  onChange={(e) => setNotifications({...notifications, lottery: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{t('common:settings.order_notifications')}</h3>
                <p className="text-sm text-gray-500">{t('common:settings.order_notifications_desc')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={notifications.orders}
                  onChange={(e) => setNotifications({...notifications, orders: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{t('common:settings.promotional_notifications')}</h3>
                <p className="text-sm text-gray-500">{t('common:settings.promotional_notifications_desc')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={notifications.promotional}
                  onChange={(e) => setNotifications({...notifications, promotional: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* 其他设置 */}
        <div className="bg-white rounded-xl overflow-hidden">
          <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{t('common:settings.about_us')}</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* 版本信息 */}
        <div className="text-center text-sm text-gray-500 py-4">
          <p>{t('common:settings.version')}</p>
          <p className="mt-1">{t('common:settings.copyright')}</p>
        </div>
      </div>
    </div>
  );
}
