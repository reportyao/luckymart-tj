/**
 * 移动端多语言文本优化使用示例
 * 展示如何在现有组件中集成新的文本优化功能
 */

'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import MobileText, {
  MobileTitle,
  MobileButtonText,
  MobileFormLabel,
  MobileStatusBadge,
  MobileNavText,
  MobileProductText,
} from '@/components/MobileText';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * 示例：优化后的产品卡片组件
 */
export function OptimizedProductCard({ product }: { product: any }) {
  const { t } = useTranslation(['lottery', 'common']);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* 商品图片 */}
      <div className="aspect-square bg-gray-100 relative">
        {/* 图片内容 */}
        <div className="absolute top-2 right-2">
          <MobileStatusBadge
            text={product.status === 'active' ? 'lottery:product_card.in_sale' : 'lottery:product_card.sold_out'}
            className="bg-green-500 text-white"
          />
        </div>
      </div>

      {/* 商品信息 */}
      <div className="p-4">
        {/* 使用优化的标题组件 */}
        <MobileTitle
          text={product.name}
          context="title"
          maxChars={25}
          enableTruncation={true}
          showTooltip={true}
          className="mb-2"
        />
        
        {/* 使用优化的产品信息组件 */}
        <MobileProductText
          text={`${t('lottery:product_card.category')}: ${product.category}`}
          context="product"
          className="mb-1"
        />
        
        <MobileProductText
          text={`${t('lottery:product_card.stock')}: ${product.stock}`}
          context="product"
          className="mb-3"
        />

        {/* 价格信息 */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <MobileTitle
              text={`¥${product.marketPrice.toLocaleString()}`}
              context="title"
              className="text-red-600 text-lg"
            />
            <MobileProductText
              text={`${t('lottery:product_card.unit_price')}: ¥${product.pricePerShare}/${t('lottery:product_card.share_unit')}`}
              context="product"
            />
          </div>
          <div className="text-right">
            <MobileProductText
              text={`${t('lottery:product_card.total_shares_label')}: ${product.totalShares}`}
              context="product"
            />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <MobileButtonText
            text={
              product.currentRound?.status === 'active'
                ? 'lottery:product_card.participate'
                : 'lottery:product_card.participate_disabled'
            }
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white"
            disabled={!product.currentRound || product.currentRound.status !== 'active'}
          />
          
          <MobileButtonText
            text="lottery:product_card.view_details"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * 示例：优化后的导航组件
 */
export function OptimizedMobileNavigation() {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const navigationItems = [
    { href: '/', label: 'nav.home' },
    { href: '/resale', label: 'nav.resale' },
    { href: '/orders', label: 'nav.orders' },
    { href: '/transactions', label: 'nav.transactions' },
    { href: '/referral', label: 'nav.referral' },
    { href: '/team', label: 'nav.team' },
    { href: '/profile', label: 'nav.profile' },
    { href: '/settings', label: 'nav.settings' },
  ];

  return (
    <nav className="space-y-2">
      {navigationItems.map((item) => (
        <div key={item.href} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50">
          {/* 图标 */}
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          
          {/* 使用优化的导航文本组件 */}
          <MobileNavText
            text={t(item.label)}
            context="navigation"
            maxChars={language === 'tg' ? 10 : 15}
            enableTruncation={true}
            className="flex-1"
          />
        </div>
      ))}
    </nav>
  );
}

/**
 * 示例：优化后的表单组件
 */
export function OptimizedFormExample() {
  const { t } = useTranslation();

  return (
    <form className="space-y-4">
      {/* 使用优化的表单标签 */}
      <div>
        <MobileFormLabel
          text="form.username"
          htmlFor="username"
          className="block mb-2"
        />
        <input
          type="text"
          id="username"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder={t('form.username_placeholder')}
        />
      </div>

      <div>
        <MobileFormLabel
          text="form.email"
          htmlFor="email"
          className="block mb-2"
        />
        <input
          type="email"
          id="email"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder={t('form.email_placeholder')}
        />
      </div>

      <div>
        <MobileFormLabel
          text="form.description"
          htmlFor="description"
          className="block mb-2"
        />
        <textarea
          id="description"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder={t('form.description_placeholder')}
        />
      </div>

      <MobileButtonText
        text="form.submit"
        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium"
        type="submit"
      />
    </form>
  );
}

/**
 * 示例：多语言状态显示
 */
export function MultiLanguageStatusDemo() {
  const { t, i18n } = useTranslation();
  const { language } = useLanguage();

  const statusTexts = {
    active: t('status.active'),
    inactive: t('status.inactive'),
    pending: t('status.pending'),
    completed: t('status.completed'),
    cancelled: t('status.cancelled'),
  };

  return (
    <div className="space-y-3">
      {Object.entries(statusTexts).map(([key, text]) => (
        <div key={key} className="flex items-center gap-3">
          <MobileStatusBadge
            text={text}
            context="status"
            className={`
              ${key === 'active' ? 'bg-green-500 text-white' : ''}
              ${key === 'inactive' ? 'bg-gray-500 text-white' : ''}
              ${key === 'pending' ? 'bg-yellow-500 text-white' : ''}
              ${key === 'completed' ? 'bg-blue-500 text-white' : ''}
              ${key === 'cancelled' ? 'bg-red-500 text-white' : ''}
            `}
            showTooltip={true}
          />
          
          <MobileText
            text={text}
            context="content"
            className="text-gray-700"
          />
        </div>
      ))}
      
      {/* 展示当前语言和字符数差异 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <MobileTitle
          text="Current Language Analysis"
          context="title"
          level={3}
          className="mb-3"
        />
        
        <div className="space-y-2 text-sm text-gray-600">
          <div>
            <strong>Current Language:</strong> {language} ({i18n.language})
          </div>
          <div>
            <strong>Sample Text Length:</strong> {statusTexts.active.length} characters
          </div>
          <div>
            <strong>Mobile Text Class:</strong> mobile-text--{language}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 示例：产品列表页面集成
 */
export function OptimizedProductList({ products }: { products: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <OptimizedProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

/**
 * 示例：复杂页面布局
 */
export function OptimizedComplexPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <MobileTitle
              text="移动端多语言文本优化示例"
              context="title"
              className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600"
            />
            
            <MobileNavText
              text="示例页面"
              context="navigation"
              className="text-gray-600"
            />
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：产品列表 */}
          <div className="space-y-4">
            <MobileTitle
              text="产品列表"
              context="title"
              level={2}
              className="mb-4"
            />
            
            {/* 这里可以插入产品列表 */}
            <div className="space-y-3">
              {/* 示例产品 */}
            </div>
          </div>

          {/* 右侧：表单和状态 */}
          <div className="space-y-6">
            <div>
              <MobileTitle
                text="表单示例"
                context="title"
                level={2}
                className="mb-4"
              />
              <OptimizedFormExample />
            </div>

            <div>
              <MobileTitle
                text="状态显示示例"
                context="title"
                level={2}
                className="mb-4"
              />
              <MultiLanguageStatusDemo />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default OptimizedComplexPage;