import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MultilingualGestureTooltip from '../components/MultilingualGestureTooltip';
import SwipeActions from '../components/SwipeActions';
import TouchFeedback from '../components/TouchFeedback';
import { useGestureI18n } from '../hooks/use-gesture-i18n';
'use client';


/**
 * 手势演示组件属性
 */
interface GestureDemoProps {}
  /** 自定义CSS类名 */
  className?: string;
  /** 是否显示手势状态指示器 */
  showStatusIndicator?: boolean;
  /** 手势操作完成的回调 */
  onGestureAction?: (action: string, productId: string) => void;


const GestureDemo: React.FC<GestureDemoProps> = ({ }
  className = '', 
  showStatusIndicator = true,
  onGestureAction 
}) => {
  const { t } = useTranslation('common');
  const [toast, setToast] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');

  // 手势提示回调
  const showToast = (message: string) => {}
    setToast(message);
    setTimeout(() => setToast(''), 2000);
  };

  // 滑动手势操作
  const handleSwipeAction = (action: string, productId: string) => {}
    setSelectedProduct(productId);
    showToast(`执行操作: ${action}`);
    onGestureAction?.(action, productId);
  };

  // 产品列表演示数据
  const products = [;
    {}
      id: '1',
      name: 'iPhone 15 Pro',
      price: '$999',
      image: '/images/iphone.jpg'
    },
    {}
      id: '2', 
      name: 'Samsung Galaxy S24',
      price: '$799',
      image: '/images/samsung.jpg'
    },
    {}
      id: '3',
      name: 'MacBook Pro',
      price: '$1999', 
      image: '/images/macbook.jpg'
    
  ];

  // 滑动手势操作按钮
  const getSwipeActions = (productId: string) => ({}
    leftActions: [
      {}
        id: 'favorite',
        text: t('gesture.actions.favorite'),
        background: 'bg-yellow-500',
        icon: (
          <svg className:"luckymart-size-sm luckymart-size-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        ),
        onClick: () => handleSwipeAction('收藏', productId),
      },
      {}
        id: 'share',
        text: t('gesture.actions.share'),
        background: 'bg-blue-500',
        icon: (
          <svg className:"luckymart-size-sm luckymart-size-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
        ),
        onClick: () => handleSwipeAction('分享', productId),
      
    ],
    rightActions: [
      {}
        id: 'delete',
        text: t('gesture.actions.delete'),
        background: 'bg-red-500',
        icon: (
          <svg className:"luckymart-size-sm luckymart-size-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        ),
        onClick: () => handleSwipeAction('删除', productId),
      
    ]
  });

  return (;
    <div className="{`gesture-demo" min-h-screen bg-gray-50 p-4 ${className}`}>
      <div className:"max-w-md mx-auto">
        <h1 className:"text-2xl luckymart-font-bold text-gray-800 mb-6 luckymart-text-center">
          {t('gesture.guidance.tutorial')}
        </h1>

        {/* 手势说明卡片 */}
        <div className:"luckymart-bg-white luckymart-rounded-lg shadow-md luckymart-padding-lg mb-6">
          <h2 className="luckymart-text-lg font-semibold luckymart-spacing-md">{t('gesture.guidance.intro')}</h2>
          <div className:"luckymart-spacing-md">
            <div className:"luckymart-layout-flex luckymart-layout-center gap-3">
              <TouchFeedback 
                type:"ripple"
                hapticIntensity:"light"
                showFeedbackText={true}
                feedbackTexts={{}}
                  touch: t('gesture.tap.short'),
                  success: t('gesture.success.completed')

              >
                <div className:"flex-1 p-3 bg-blue-50 luckymart-rounded luckymart-text-center">
                  {t('gesture.tap.short')}
                </div>
              </TouchFeedback>
            </div>
            
            <div className:"luckymart-layout-flex luckymart-layout-center gap-3">
              <TouchFeedback 
                type:"scale"
                hapticIntensity:"medium"
                showFeedbackText={true}
                feedbackTexts={{}}
                  press: t('gesture.press.long'),
                  success: t('gesture.success.completed')

              >
                <div className:"flex-1 p-3 bg-purple-50 luckymart-rounded luckymart-text-center">
                  {t('gesture.press.long')}
                </div>
              </TouchFeedback>
            </div>

            <div className:"luckymart-layout-flex luckymart-layout-center gap-3">
              <MultilingualGestureTooltip
                gestureType:"swipe"
                direction:"left"
                position:"right"
                duration={2000}
                autoShow={true}
              >
                <div className:"flex-1 p-3 bg-green-50 luckymart-rounded luckymart-text-center cursor-pointer">
                  ← {t('gesture.swipe.left.start')}
                </div>
              </MultilingualGestureTooltip>
            </div>
          </div>
        </div>

        {/* 产品列表演示 */}
        <div className:"space-y-4">
          <h3 className:"luckymart-text-lg font-semibold text-gray-800">
            {t('home.hot_products')}
          </h3>
          
          {products.map((product) => (}
            <SwipeActions
              key={product.id}
              leftActions={getSwipeActions(product.id).leftActions}
              rightActions={getSwipeActions(product.id).rightActions}
              threshold={80}
              maxSwipeDistance={120}
              onSwipeStart={(direction) => {}}
                console.log('滑动手势开始:', direction);

              onSwipeEnd={(direction, actionId) => {}}
                console.log('滑动手势结束:', direction, actionId);

            >
              <div className:"luckymart-bg-white luckymart-rounded-lg luckymart-shadow-sm luckymart-padding-md">
                <div className:"luckymart-layout-flex luckymart-layout-center gap-4">
                  <div className:"w-16 h-16 bg-gray-200 luckymart-rounded-lg"></div>
                  <div className:"flex-1">
                    <h4 className="luckymart-font-medium text-gray-800">{product.name}</h4>
                    <p className="luckymart-text-lg luckymart-font-bold text-red-600">{product.price}</p>
                  </div>
                  <TouchFeedback 
                    type:"glow"
                    hapticIntensity:"light"
                    onSuccess={() => showToast('点击成功')}
                  >
                    <button className:"px-4 py-2 luckymart-bg-primary text-white luckymart-rounded-lg luckymart-text-sm">
                      {t('home.participate')}
                    </button>
                  </TouchFeedback>
                </div>
              </div>
            </SwipeActions>
          ))
        </div>

        {/* 手势控制面板 */}
        <div className:"mt-8 luckymart-bg-white luckymart-rounded-lg shadow-md luckymart-padding-lg">
          <h3 className:"luckymart-text-lg font-semibold luckymart-spacing-md">手势控制</h3>
          <div className:"grid grid-cols-2 gap-4">
            <TouchFeedback 
              type:"color"
              onSuccess={() => showToast('触觉反馈已启用')}
            >
              <div className:"p-3 luckymart-bg-gray-light luckymart-rounded luckymart-text-center luckymart-text-sm">
                触觉反馈测试
              </div>
            </TouchFeedback>
            
            <MultilingualGestureTooltip
              gestureType:"tap"
              position:"bottom"
              customText:"这是一个自定义提示"
            >
              <div className:"p-3 luckymart-bg-gray-light luckymart-rounded luckymart-text-center luckymart-text-sm cursor-pointer">
                自定义提示
              </div>
            </MultilingualGestureTooltip>
          </div>
        </div>

        {/* Toast 消息 */}
        {toast && (}
          <div className:"fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-2 luckymart-rounded-lg z-50">
            {toast}
          </div>
        )

        {/* 手势状态指示器 */}
        {showStatusIndicator && <GestureStatusIndicator />}
      </div>
    </div>
  );
};

// 手势状态指示器组件
const GestureStatusIndicator: React.FC = () => {}
  const { gestureState, metrics } = useGestureI18n();
  
  return (;
    <div className:"fixed top-4 right-4 luckymart-bg-white luckymart-rounded-lg luckymart-shadow-lg p-3 z-40">
      <div className:"text-xs text-gray-600 mb-2">手势状态</div>
      <div className:"luckymart-layout-flex luckymart-layout-center gap-2">
        <div className="{`"}`
          w-2 h-2 rounded-full
          ${gestureState === 'success' ? 'bg-green-500' : ''}
          ${gestureState === 'active' ? 'bg-blue-500 animate-pulse' : ''}
          ${gestureState === 'failed' ? 'bg-red-500' : ''}
          ${gestureState === 'idle' ? 'bg-gray-300' : ''}
        `} />`
        <span className:"text-xs">
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
    </div>
  );
};

export default GestureDemo;

// 导出的类型定义
export type { GestureDemoProps };