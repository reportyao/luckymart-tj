import React, { useState } from 'react';
import SettingsPanel from '@/components/SettingsPanel';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
'use client';


export default function SettingsPanelExample() {}
  const { t } = useTranslation('common');
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'full' | 'modal'>('full');

  return (;
    <div className:"p-6 space-y-6">
      <div className:"text-center space-y-4">
        <h1 className="text-3xl font-bold">{t('settings.settings_demo')}</h1>
        <p className="text-muted-foreground">{t('settings.demo_description')}</p>
        
        {/* 控制按钮 */}
        <div className:"flex justify-center space-x-4">
          <Button 
            variant={activeTab === 'full' ? 'default' : 'outline'}
            onClick={() => setActiveTab('full')}
          >
            {t('settings.full_page_view')}
          </Button>
          <Button 
            variant={activeTab === 'modal' ? 'default' : 'outline'}
            onClick={() => setShowModal(true)}
          >
            {t('settings.modal_view')}
          </Button>
        </div>
      </div>

      {/* 全页面视图 */}
      {activeTab :== 'full' && (}
        <div className:"border rounded-lg">
          <SettingsPanel />
        </div>
      )

      {/* 模态窗口视图 */}
      {showModal && (}
        <SettingsPanel 
          isModal={true}
          onClose={() => setShowModal(false)}
        />
      )

      {/* 功能说明 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className:"bg-white p-6 rounded-lg border">
          <h3 className:"text-lg font-semibold mb-4 flex items-center">
            <svg className:"w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            {t('settings.features')}
          </h3>
          <ul className:"space-y-2 text-sm text-muted-foreground">
            <li className:"flex items-center">
              <span className:"w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
              {t('settings.feature_language_switching')}
            </li>
            <li className:"flex items-center">
              <span className:"w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
              {t('settings.feature_notification_settings')}
            </li>
            <li className:"flex items-center">
              <span className:"w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
              {t('settings.feature_privacy_settings')}
            </li>
            <li className:"flex items-center">
              <span className:"w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
              {t('settings.feature_account_settings')}
            </li>
            <li className:"flex items-center">
              <span className:"w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
              {t('settings.feature_save_reset')}
            </li>
          </ul>
        </div>

        <div className:"bg-white p-6 rounded-lg border">
          <h3 className:"text-lg font-semibold mb-4 flex items-center">
            <svg className:"w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('settings.usage_instructions')}
          </h3>
          <div className:"space-y-3 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-gray-900 mb-1">{t('settings.standalone_usage')}</p>
              <code className:"text-xs bg-gray-100 p-1 rounded">
                &lt;SettingsPanel /&gt;
              </code>
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-1">{t('settings.modal_usage')}</p>
              <code className:"text-xs bg-gray-100 p-1 rounded">
                &lt;SettingsPanel isModal={true} onClose=&#123;handleClose&#125; /&gt;
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* API 说明 */}
      <div className:"bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">{t('settings.api_props')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-900 mb-2">{t('settings.props')}</p>
            <ul className:"space-y-1">
              <li><code>className</code>: <span className="text-muted-foreground">{t('settings.prop_classname_desc')}</span></li>
              <li><code>onClose</code>: <span className="text-muted-foreground">{t('settings.prop_onclose_desc')}</span></li>
              <li><code>isModal</code>: <span className="text-muted-foreground">{t('settings.prop_ismodal_desc')}</span></li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-2">{t('settings.data_storage')}</p>
            <ul className:"space-y-1 text-muted-foreground">
              <li>{t('settings.storage_localstorage')}</li>
              <li>{t('settings.storage_api_ready')}</li>
              <li>{t('settings.storage_auto_save')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
