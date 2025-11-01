'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface SettingsData {
  language: string;
  notifications: {
    lottery: boolean;
    orders: boolean;
    promotional: boolean;
    email: boolean;
    sms: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    showOnlineStatus: boolean;
    allowDirectMessages: boolean;
    dataSharing: boolean;
  };
  account: {
    username: string;
    email: string;
    phone: string;
    twoFactorEnabled: boolean;
    autoLogout: number; // minutes
  };
}

const defaultSettings: SettingsData = {
  language: 'zh-CN',
  notifications: {
    lottery: true,
    orders: true,
    promotional: false,
    email: true,
    sms: false
  },
  privacy: {
    profileVisibility: 'public',
    showOnlineStatus: true,
    allowDirectMessages: true,
    dataSharing: false
  },
  account: {
    username: '',
    email: '',
    phone: '',
    twoFactorEnabled: false,
    autoLogout: 30
  }
};

interface SettingsPanelProps {
  className?: string;
  onClose?: () => void;
  isModal?: boolean;
}

export default function SettingsPanel({ className = '', onClose, isModal = false }: SettingsPanelProps) {
  const { t } = useTranslation(['common', 'settings']);
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [originalSettings, setOriginalSettings] = useState<SettingsData>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 加载设置
  useEffect(() => {
    loadSettings();
  }, []);

  // 检查是否有更改
  useEffect(() => {
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(changed);
  }, [settings, originalSettings]);

  const loadSettings = async () => {
    try {
      // 从localStorage或API加载设置
      const savedSettings = localStorage.getItem('app-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
        setOriginalSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      // 保存到localStorage（实际项目中可能需要发送到API）
      localStorage.setItem('app-settings', JSON.stringify(settings));
      setOriginalSettings(settings);
      toast.success(t('common:operation_success'));
      onClose?.();
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error(t('common:save_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    toast.success(t('settings.reset_success'));
  };

  const updateNotificationSetting = (key: keyof SettingsData['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const updatePrivacySetting = (key: keyof SettingsData['privacy'], value: any) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }));
  };

  const updateAccountSetting = (key: keyof SettingsData['account'], value: any) => {
    setSettings(prev => ({
      ...prev,
      account: {
        ...prev.account,
        [key]: value
      }
    }));
  };

  const handleClose = () => {
    if (hasChanges) {
      if (confirm(t('settings.unsaved_changes'))) {
        onClose?.();
      }
    } else {
      onClose?.();
    }
  };

  const panelContent = (
    <div className="space-y-6">
      <Tabs defaultValue="language" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="language">{t('settings.language')}</TabsTrigger>
          <TabsTrigger value="notifications">{t('settings.notifications')}</TabsTrigger>
          <TabsTrigger value="privacy">{t('settings.privacy')}</TabsTrigger>
          <TabsTrigger value="account">{t('settings.account')}</TabsTrigger>
        </TabsList>

        {/* 语言设置 */}
        <TabsContent value="language" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                {t('settings.language_settings')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">{t('settings.select_language')}</Label>
                  <p className="text-sm text-muted-foreground">{t('settings.language_description')}</p>
                </div>
                <LanguageSwitcher />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 通知设置 */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM8.25 2.25h7.5v19.5h-7.5V2.25zM11.25 18h1.5" />
                </svg>
                {t('settings.notification_settings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">{t('settings.lottery_notifications')}</Label>
                    <p className="text-sm text-muted-foreground">{t('settings.lottery_notifications_desc')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.notifications.lottery}
                      onChange={(e) => updateNotificationSetting('lottery', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">{t('settings.order_notifications')}</Label>
                    <p className="text-sm text-muted-foreground">{t('settings.order_notifications_desc')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.notifications.orders}
                      onChange={(e) => updateNotificationSetting('orders', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">{t('settings.promotional_notifications')}</Label>
                    <p className="text-sm text-muted-foreground">{t('settings.promotional_notifications_desc')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.notifications.promotional}
                      onChange={(e) => updateNotificationSetting('promotional', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">{t('settings.email_notifications')}</Label>
                    <p className="text-sm text-muted-foreground">{t('settings.email_notifications_desc')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.notifications.email}
                      onChange={(e) => updateNotificationSetting('email', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">{t('settings.sms_notifications')}</Label>
                    <p className="text-sm text-muted-foreground">{t('settings.sms_notifications_desc')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.notifications.sms}
                      onChange={(e) => updateNotificationSetting('sms', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 隐私设置 */}
        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {t('settings.privacy_settings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="font-medium">{t('settings.profile_visibility')}</Label>
                  <p className="text-sm text-muted-foreground mb-2">{t('settings.profile_visibility_desc')}</p>
                  <select 
                    value={settings.privacy.profileVisibility}
                    onChange={(e) => updatePrivacySetting('profileVisibility', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="public">{t('settings.profile_public')}</option>
                    <option value="friends">{t('settings.profile_friends')}</option>
                    <option value="private">{t('settings.profile_private')}</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">{t('settings.show_online_status')}</Label>
                    <p className="text-sm text-muted-foreground">{t('settings.show_online_status_desc')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.privacy.showOnlineStatus}
                      onChange={(e) => updatePrivacySetting('showOnlineStatus', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">{t('settings.allow_direct_messages')}</Label>
                    <p className="text-sm text-muted-foreground">{t('settings.allow_direct_messages_desc')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.privacy.allowDirectMessages}
                      onChange={(e) => updatePrivacySetting('allowDirectMessages', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">{t('settings.data_sharing')}</Label>
                    <p className="text-sm text-muted-foreground">{t('settings.data_sharing_desc')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.privacy.dataSharing}
                      onChange={(e) => updatePrivacySetting('dataSharing', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 账户设置 */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {t('settings.account_settings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">{t('settings.username')}</Label>
                  <Input
                    id="username"
                    value={settings.account.username}
                    onChange={(e) => updateAccountSetting('username', e.target.value)}
                    placeholder={t('settings.enter_username')}
                  />
                </div>

                <div>
                  <Label htmlFor="email">{t('settings.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.account.email}
                    onChange={(e) => updateAccountSetting('email', e.target.value)}
                    placeholder={t('settings.enter_email')}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">{t('settings.phone')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={settings.account.phone}
                    onChange={(e) => updateAccountSetting('phone', e.target.value)}
                    placeholder={t('settings.enter_phone')}
                  />
                </div>

                <div>
                  <Label htmlFor="auto-logout">{t('settings.auto_logout')}</Label>
                  <select 
                    id="auto-logout"
                    value={settings.account.autoLogout}
                    onChange={(e) => updateAccountSetting('autoLogout', parseInt(e.target.value))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value={15}>15 {t('settings.minutes')}</option>
                    <option value={30}>30 {t('settings.minutes')}</option>
                    <option value={60}>1 {t('settings.hour')}</option>
                    <option value={120}>2 {t('settings.hours')}</option>
                    <option value={0}>{t('settings.never')}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">{t('settings.two_factor_auth')}</Label>
                  <p className="text-sm text-muted-foreground">{t('settings.two_factor_auth_desc')}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.account.twoFactorEnabled}
                    onChange={(e) => updateAccountSetting('twoFactorEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 操作按钮 */}
      <div className="flex justify-between space-x-4">
        <Button 
          variant="outline" 
          onClick={resetSettings}
          disabled={isLoading}
        >
          {t('settings.reset_to_default')}
        </Button>
        
        <div className="flex space-x-2">
          {isModal && (
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading}
            >
              {t('common:cancel')}
            </Button>
          )}
          <Button 
            onClick={saveSettings}
            disabled={!hasChanges || isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? t('common:loading') : t('common:confirm')}
          </Button>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto ${className}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{t('settings.title')}</h2>
            <button 
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {panelContent}
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('settings.description')}</p>
      </div>
      {panelContent}
    </div>
  );
}