'use client';

import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { SUPPORTED_LANGUAGES } from '@/src/i18n/config';

function I18nDemoPage() {
  const { t, i18n } = useTranslation(['common', 'auth', 'lottery', 'wallet']);
  const { language, setLanguage } = useLanguage();

  const languages = Object.entries(SUPPORTED_LANGUAGES);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            LuckyMartTJ 多语言国际化系统演示
          </h1>
          <p className="text-lg text-gray-600">
            i18next + React i18next 企业级解决方案
          </p>
        </div>

        {/* 语言切换器 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">
            语言切换测试
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {languages.map(([code, info]) => {
              const isActive = i18n.language === code;
              return (
                <button
                  key={code}
                  onClick={() => setLanguage(code.split('-')[0] as any)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-3xl mb-2">{info.flag}</div>
                  <div className="font-semibold text-gray-900">
                    {info.nativeName}
                  </div>
                  <div className="text-sm text-gray-500">{info.name}</div>
                  {isActive && (
                    <div className="mt-2 text-xs text-blue-600 font-semibold">
                      ✓ 当前语言
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 翻译内容展示 - Common命名空间 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">
            Common 命名空间
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">common:welcome</div>
              <div className="text-lg font-medium text-gray-900">
                {t('common:welcome')}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">common:description</div>
              <div className="text-lg font-medium text-gray-900">
                {t('common:description')}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">common:home</div>
              <div className="text-lg font-medium text-gray-900">
                {t('common:home')}
              </div>
            </div>
          </div>
        </div>

        {/* 翻译内容展示 - Auth命名空间 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">
            Auth 命名空间
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">auth:login</div>
              <div className="text-lg font-medium text-gray-900">
                {t('auth:login')}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">auth:register</div>
              <div className="text-lg font-medium text-gray-900">
                {t('auth:register')}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">auth:logout</div>
              <div className="text-lg font-medium text-gray-900">
                {t('auth:logout')}
              </div>
            </div>
          </div>
        </div>

        {/* 翻译内容展示 - Lottery命名空间 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">
            Lottery 命名空间
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">lottery:title</div>
              <div className="text-lg font-medium text-gray-900">
                {t('lottery:title')}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">lottery:participate</div>
              <div className="text-lg font-medium text-gray-900">
                {t('lottery:participate')}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">lottery:currentRound</div>
              <div className="text-lg font-medium text-gray-900">
                {t('lottery:currentRound')}
              </div>
            </div>
          </div>
        </div>

        {/* 翻译内容展示 - Wallet命名空间 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">
            Wallet 命名空间
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">wallet:title</div>
              <div className="text-lg font-medium text-gray-900">
                {t('wallet:title')}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">wallet:balance</div>
              <div className="text-lg font-medium text-gray-900">
                {t('wallet:balance')}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">wallet:recharge</div>
              <div className="text-lg font-medium text-gray-900">
                {t('wallet:recharge')}
              </div>
            </div>
          </div>
        </div>

        {/* 系统信息 */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">
            系统信息
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">当前语言代码:</span>
              <span className="font-mono font-semibold text-gray-900">
                {i18n.language}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">兼容层语言代码:</span>
              <span className="font-mono font-semibold text-gray-900">
                {language}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">加载的命名空间:</span>
              <span className="font-mono font-semibold text-gray-900">
                {Object.keys(i18n.options.ns || {}).join(', ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">支持的语言:</span>
              <span className="font-mono font-semibold text-gray-900">
                {Object.keys(SUPPORTED_LANGUAGES).join(', ')}
              </span>
            </div>
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            测试说明
          </h3>
          <ul className="list-disc list-inside space-y-2 text-blue-800">
            <li>点击上方的语言按钮切换语言</li>
            <li>观察所有翻译内容的实时更新</li>
            <li>系统信息会显示当前的语言状态</li>
            <li>语言偏好会自动保存到localStorage</li>
            <li>刷新页面后会保持之前选择的语言</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
