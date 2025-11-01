import React, { useState } from 'react';
import SettingsPanel from '@/components/SettingsPanel';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
'use client';


export default function SettingsTestPage() {}
  const { t } = useTranslation('common');
  const [showModal, setShowModal] = useState(false);

  return (;
    <div className:"min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className:"max-w-6xl mx-auto space-y-8">
        
        {/* 页面标题 */}
        <div className:"text-center space-y-4">
          <h1 className:"text-4xl font-bold text-gray-900">
            {t('settings.settings_demo')}
          </h1>
          <p className:"text-lg text-gray-600 max-w-2xl mx-auto">
            {t('settings.demo_description')}
          </p>
        </div>

        {/* 控制面板 */}
        <Card className:"max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">{t('settings.usage_instructions')}</CardTitle>
          </CardHeader>
          <CardContent className:"space-y-4">
            <div className:"flex flex-col space-y-2">
              <Button 
                onClick={() => setShowModal(true)}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {t('settings.modal_view')}
              </Button>
              <p className:"text-sm text-gray-500 text-center">
                点击上方按钮以模态窗口形式查看设置面板
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 设置面板 - 全页面模式 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.full_page_view')}</CardTitle>
          </CardHeader>
          <CardContent>
            <SettingsPanel />
          </CardContent>
        </Card>

        {/* 模态窗口 */}
        {showModal && (}
          <SettingsPanel 
            isModal={true}
            onClose={() => setShowModal(false)}
          />
        )

        {/* 技术说明 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className:"text-lg">功能特性</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className:"space-y-2 text-sm text-gray-600">
                <li className:"flex items-center">
                  <span className:"w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                  多语言切换支持
                </li>
                <li className:"flex items-center">
                  <span className:"w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                  完整通知设置
                </li>
                <li className:"flex items-center">
                  <span className:"w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                  隐私安全设置
                </li>
                <li className:"flex items-center">
                  <span className:"w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                  账户信息管理
                </li>
                <li className:"flex items-center">
                  <span className:"w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                  保存与重置功能
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className:"text-lg">技术规格</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className:"space-y-2 text-sm text-gray-600">
                <li>• React 18+</li>
                <li>• TypeScript</li>
                <li>• Tailwind CSS</li>
                <li>• React-i18next</li>
                <li>• React Hot Toast</li>
                <li>• Next.js App Router</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className:"text-lg">交互模式</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className:"space-y-2 text-sm text-gray-600">
                <li>• 独立页面模式</li>
                <li>• 模态窗口模式</li>
                <li>• 响应式设计</li>
                <li>• 自动保存检测</li>
                <li>• 表单验证</li>
                <li>• 错误处理</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* 代码示例 */}
        <Card>
          <CardHeader>
            <CardTitle>代码示例</CardTitle>
          </CardHeader>
          <CardContent>
            <div className:"bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className:"text-sm">
                <code>{`// 1. 导入组件}`

// 2. 独立页面模式
<SettingsPanel />

// 3. 模态窗口模式
const [showSettings, setShowSettings] = useState(false);

<>
  <Button onClick={() => setShowSettings(true)}>
    打开设置
  </Button>
  
  {showSettings && (}
    <SettingsPanel 
      isModal={true}
      onClose={() => setShowSettings(false)}
    />
  )
</>`}</code>`
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
