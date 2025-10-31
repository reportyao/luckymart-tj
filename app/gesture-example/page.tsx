'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { I18nProvider } from '@/src/i18n/I18nProvider';
import MultilingualGestureTooltip from '@/components/MultilingualGestureTooltip';
import SwipeActions from '@/components/SwipeActions';
import TouchFeedback from '@/components/TouchFeedback';
import { useGestureI18n } from '@/hooks/use-gesture-i18n';

const GestureExamplePage: React.FC = () => {
  return (
    <I18nProvider>
      <GestureExampleContent />
    </I18nProvider>
  );
};

const GestureExampleContent: React.FC = () => {
  const { t, i18n } = useTranslation('common');
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [notifications, setNotifications] = useState<string[]>([]);

  // 添加通知
  const addNotification = (message: string) => {
    setNotifications(prev => [...prev.slice(-2), message]); // 保持最多3条通知
  };

  // 语言切换
  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
    setSelectedLanguage(lang);
    addNotification(`语言已切换为: ${lang}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* 头部区域 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">
              {t('gesture.guidance.tutorial')}
            </h1>
            
            {/* 语言选择器 */}
            <div className="flex gap-2">
              {[
                { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
                { code: 'en-US', name: 'English', flag: '🇬🇧' },
                { code: 'ru-RU', name: 'Русский', flag: '🇷🇺' },
                { code: 'tg-TJ', name: 'Тоҷикӣ', flag: '🇹🇯' }
              ].map((lang) => (
                <TouchFeedback
                  key={lang.code}
                  type="scale"
                  hapticIntensity="light"
                  onSuccess={() => changeLanguage(lang.code)}
                >
                  <button
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedLanguage === lang.code
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-1">{lang.flag}</span>
                    {lang.name}
                  </button>
                </TouchFeedback>
              ))}
            </div>
          </div>
          
          <p className="text-gray-600">
            {t('gesture.guidance.intro')} - {t('app_name')}
          </p>
        </div>

        {/* 手势说明卡片 */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          
          {/* 基础手势 */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {t('gesture.tap.short')} & {t('gesture.press.long')}
            </h2>
            
            <div className="space-y-4">
              {/* 单击示例 */}
              <div className="flex items-center justify-between">
                <span className="text-gray-700">{t('gesture.tap.short')}</span>
                <TouchFeedback
                  type="ripple"
                  hapticIntensity="light"
                  soundFeedback={true}
                  feedbackTexts={{
                    touch: t('gesture.tap.short'),
                    success: t('gesture.success.completed')
                  }}
                  onSuccess={() => addNotification(t('gesture.tap.short') + ' 成功！')}
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center cursor-pointer">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                  </div>
                </TouchFeedback>
              </div>

              {/* 长按示例 */}
              <div className="flex items-center justify-between">
                <span className="text-gray-700">{t('gesture.press.long')}</span>
                <TouchFeedback
                  type="scale"
                  hapticIntensity="medium"
                  feedbackTexts={{
                    press: t('gesture.press.long'),
                    success: t('gesture.success.completed')
                  }}
                  onSuccess={() => addNotification(t('gesture.press.long') + ' 成功！')}
                >
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center cursor-pointer">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                  </div>
                </TouchFeedback>
              </div>

              {/* 双击示例 */}
              <div className="flex items-center justify-between">
                <span className="text-gray-700">{t('gesture.tap.double')}</span>
                <TouchFeedback
                  type="glow"
                  hapticIntensity="heavy"
                  feedbackTexts={{
                    touch: t('gesture.tap.double'),
                    success: t('gesture.success.completed')
                  }}
                  onSuccess={() => addNotification(t('gesture.tap.double') + ' 成功！')}
                >
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center cursor-pointer">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </TouchFeedback>
              </div>
            </div>
          </div>

          {/* 滑动手势 */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {t('gesture.swipe.left.start')}
            </h2>
            
            <div className="space-y-4">
              {/* 左滑示例 */}
              <div className="flex items-center justify-between">
                <span className="text-gray-700">{t('gesture.swipe.left.start')}</span>
                <MultilingualGestureTooltip
                  gestureType="swipe"
                  direction="left"
                  position="left"
                  duration={3000}
                  autoShow={true}
                >
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center cursor-pointer">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                </MultilingualGestureTooltip>
              </div>

              {/* 右滑示例 */}
              <div className="flex items-center justify-between">
                <span className="text-gray-700">{t('gesture.swipe.right.start')}</span>
                <MultilingualGestureTooltip
                  gestureType="swipe"
                  direction="right"
                  position="right"
                  duration={3000}
                  autoShow={true}
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center cursor-pointer">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </MultilingualGestureTooltip>
              </div>

              {/* 下滑示例 */}
              <div className="flex items-center justify-between">
                <span className="text-gray-700">{t('gesture.swipe.down.start')}</span>
                <MultilingualGestureTooltip
                  gestureType="swipe"
                  direction="down"
                  position="bottom"
                  duration={3000}
                  autoShow={true}
                >
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center cursor-pointer">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </MultilingualGestureTooltip>
              </div>
            </div>
          </div>
        </div>

        {/* 产品列表演示 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {t('home.hot_products')} - {t('gesture.actions.more')}
          </h2>
          
          <ProductList 
            onAction={(action, product) => {
              addNotification(`${action}: ${product.name}`);
            }}
          />
        </div>

        {/* 手势控制面板 */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {t('settings.title')}
          </h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            
            {/* 触觉反馈控制 */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-700">触觉反馈</h3>
              <TouchFeedback 
                type="color"
                hapticIntensity="light"
                onSuccess={() => addNotification('轻触震动反馈')}
              >
                <button className="w-full p-3 bg-gray-100 rounded-lg text-sm">
                  轻触测试
                </button>
              </TouchFeedback>
              
              <TouchFeedback 
                type="color"
                hapticIntensity="medium"
                onSuccess={() => addNotification('中等震动反馈')}
              >
                <button className="w-full p-3 bg-gray-100 rounded-lg text-sm">
                  中等测试
                </button>
              </TouchFeedback>
              
              <TouchFeedback 
                type="color"
                hapticIntensity="heavy"
                onSuccess={() => addNotification('重度震动反馈')}
              >
                <button className="w-full p-3 bg-gray-100 rounded-lg text-sm">
                  重度测试
                </button>
              </TouchFeedback>
            </div>

            {/* 视觉反馈控制 */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-700">视觉反馈</h3>
              
              <TouchFeedback type="ripple">
                <button className="w-full p-3 bg-blue-100 rounded-lg text-sm">
                  涟漪效果
                </button>
              </TouchFeedback>
              
              <TouchFeedback type="scale">
                <button className="w-full p-3 bg-green-100 rounded-lg text-sm">
                  缩放效果
                </button>
              </TouchFeedback>
              
              <TouchFeedback type="glow">
                <button className="w-full p-3 bg-purple-100 rounded-lg text-sm">
                  发光效果
                </button>
              </TouchFeedback>
            </div>

            {/* 提示组件控制 */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-700">智能提示</h3>
              
              <MultilingualGestureTooltip
                gestureType="tap"
                customText="点击获取帮助"
                position="top"
              >
                <button className="w-full p-3 bg-yellow-100 rounded-lg text-sm">
                  帮助提示
                </button>
              </MultilingualGestureTooltip>
              
              <MultilingualGestureTooltip
                gestureType="press"
                customText="长按查看详情"
                position="bottom"
              >
                <button className="w-full p-3 bg-orange-100 rounded-lg text-sm">
                  详情提示
                </button>
              </MultilingualGestureTooltip>
              
              <MultilingualGestureTooltip
                gestureType="swipe"
                direction="up"
                customText="上滑查看更多"
                position="top"
              >
                <button className="w-full p-3 bg-indigo-100 rounded-lg text-sm">
                  更多提示
                </button>
              </MultilingualGestureTooltip>
            </div>
          </div>
        </div>

        {/* 通知系统 */}
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <div className="flex flex-col gap-2 max-w-sm mx-auto">
            {notifications.map((notification, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="bg-black text-white px-4 py-2 rounded-lg text-sm shadow-lg"
              >
                {notification}
              </motion.div>
            ))}
          </div>
        </div>

        {/* 手势状态指示器 */}
        <GestureStatusIndicator />
      </div>
    </div>
  );
};

// 产品列表组件
interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  category: string;
}

const ProductList: React.FC<{ onAction: (action: string, product: Product) => void }> = ({ onAction }) => {
  const { t } = useTranslation('common');
  
  const products: Product[] = [
    {
      id: '1',
      name: 'iPhone 15 Pro',
      price: '$999',
      image: '📱',
      category: 'Electronics'
    },
    {
      id: '2',
      name: 'MacBook Air M3',
      price: '$1,199',
      image: '💻',
      category: 'Electronics'
    },
    {
      id: '3',
      name: 'AirPods Pro',
      price: '$249',
      image: '🎧',
      category: 'Accessories'
    }
  ];

  const getSwipeActions = (product: Product) => ({
    leftActions: [
      {
        id: 'favorite',
        text: t('gesture.actions.favorite'),
        background: 'bg-yellow-500',
        icon: '❤️',
        onClick: () => onAction('收藏', product),
      },
      {
        id: 'share',
        text: t('gesture.actions.share'),
        background: 'bg-blue-500',
        icon: '📤',
        onClick: () => onAction('分享', product),
      }
    ],
    rightActions: [
      {
        id: 'info',
        text: t('gesture.actions.more'),
        background: 'bg-gray-500',
        icon: 'ℹ️',
        onClick: () => onAction('详情', product),
      }
    ]
  });

  return (
    <div className="space-y-3">
      {products.map((product) => (
        <SwipeActions
          key={product.id}
          leftActions={getSwipeActions(product).leftActions}
          rightActions={getSwipeActions(product).rightActions}
          threshold={80}
          maxSwipeDistance={120}
          onSwipeStart={(direction) => {
            console.log('滑动手势开始:', direction);
          }}
          onSwipeEnd={(direction, actionId) => {
            console.log('滑动手势结束:', direction, actionId);
          }}
        >
          <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-4">
            <div className="text-3xl">{product.image}</div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-800">{product.name}</h4>
              <p className="text-lg font-bold text-red-600">{product.price}</p>
              <p className="text-sm text-gray-500">{product.category}</p>
            </div>
            <TouchFeedback 
              type="scale"
              hapticIntensity="light"
              onSuccess={() => onAction('购买', product)}
            >
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">
                {t('home.participate')}
              </button>
            </TouchFeedback>
          </div>
        </SwipeActions>
      ))}
    </div>
  );
};

// 手势状态指示器组件
const GestureStatusIndicator: React.FC = () => {
  const { gestureState, metrics } = useGestureI18n();
  
  return (
    <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-40">
      <div className="text-xs text-gray-600 mb-2">手势状态</div>
      <div className="flex items-center gap-2 mb-2">
        <div className={`
          w-2 h-2 rounded-full
          ${gestureState === 'success' ? 'bg-green-500' : ''}
          ${gestureState === 'active' ? 'bg-blue-500 animate-pulse' : ''}
          ${gestureState === 'failed' ? 'bg-red-500' : ''}
          ${gestureState === 'idle' ? 'bg-gray-300' : ''}
        `} />
        <span className="text-xs">
          {gestureState === 'idle' && '等待操作'}
          {gestureState === 'active' && '手势进行中'}
          {gestureState === 'success' && '操作成功'}
          {gestureState === 'failed' && '操作失败'}
          {gestureState === 'swipe' && '滑动操作'}
          {gestureState === 'tap' && '点击操作'}
          {gestureState === 'press' && '长按操作'}
          {gestureState === 'cancelled' && '已取消'}
        </span>
      </div>
      <div className="text-xs text-gray-500">
        语言: {metrics.currentLanguage}
      </div>
    </div>
  );
};

export default GestureExamplePage;