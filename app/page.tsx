'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import MobileNavigation from '@/components/MobileNavigation';
import MarketingBadgeDisplay from '@/components/MarketingBadgeDisplay';
import EnhancedLotteryCard from '@/components/EnhancedLotteryCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApi } from '@/hooks/useApi';
import { useLanguageChange } from '@/hooks/useEventManager';
import ErrorState from '@/components/ErrorState';
import SkeletonLoader from '@/components/SkeletonLoader';
import ErrorBoundary from '@/components/ErrorBoundary';
import { apiClient, handleApiError } from '@/lib/api-client';
import type { Product } from '@/types';
import Image from 'next/image';

interface ProductWithRound extends Product {
  currentRound: {
    id: string;
    roundNumber: number;
    soldShares: number;
    totalShares: number;
    progress: number;
    pricePerShare: number;
    status: 'active' | 'ended' | 'completed';
    drawTime: string | null;
  } | null;
}

function HomePage() {
  const { language, t } = useLanguage();
  const [viewMode, setViewMode] = useState<'products' | 'lottery'>('products');

  // 使用改进的API Hook - 获取抽奖期次
  const { data: lotteryRounds = [], loading, error, refetch } = useApi<any[]>(
    useCallback(async () => {
      const response = await apiClient.get<{ rounds: any[] }>(
        '/lottery/active-rounds',
        { language }
      );
      
      if (!response.success) {
        throw new Error(response.error || '加载失败');
      }
      
      return response.data?.rounds || [];
    }, [language]),
    [language, viewMode],
    {
      onError: (errorMessage) => {
        const formattedError = handleApiError(new Error(errorMessage));
        console.error('加载抽奖期次失败:', formattedError);
      }
    }
  );

  // 获取商品列表（用于回退或特定显示）
  const { data: products = [] } = useApi<ProductWithRound[]>(
    useCallback(async () => {
      const response = await apiClient.get<{ products: ProductWithRound[] }>(
        '/products/list',
        { language }
      );
      
      if (!response.success) {
        throw new Error(response.error || '加载失败');
      }
      
      return response.data?.products || [];
    }, [language]),
    [language],
    {
      enabled: viewMode === 'products',
      onError: (errorMessage) => {
        const formattedError = handleApiError(new Error(errorMessage));
        console.error('加载商品失败:', formattedError);
      }
    }
  );

  // 使用语言变化事件管理器，避免重复监听器
  useLanguageChange(useCallback((event) => {
    // 语言变化时自动重新加载数据
    console.log('语言已切换，自动刷新商品列表');
    refetch();
  }, [refetch]));

  // 手动重试函数
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // 关闭错误状态
  const handleDismissError = useCallback(() => {
    // 可以在这里添加错误处理逻辑
  }, []);

  // 加载状态 - 显示骨架屏
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <MobileNavigation />
        {/* Banner Skeleton */}
        <SkeletonLoader type="banner" />

        {/* Products Skeleton */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          <SkeletonLoader type="card" count={6} />
        </main>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <MobileNavigation />
        {/* Error State */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          <ErrorState
            error={error}
            onRetry={handleRetry}
            onDismiss={handleDismissError}
            className="mb-8"
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* 移动端导航 */}
      <MobileNavigation />

      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-6 md:py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* 视图切换按钮 */}
          <div className="flex justify-center mb-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-1 flex">
              <button
                onClick={() => setViewMode('products')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'products'
                    ? 'bg-white text-purple-600 shadow-md'
                    : 'text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                商品列表
              </button>
              <button
                onClick={() => setViewMode('lottery')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'lottery'
                    ? 'bg-white text-purple-600 shadow-md'
                    : 'text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                抽奖中心
              </button>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4">
              {viewMode === 'products' ? t('home.banner.title') : '🎲 幸运抽奖中心'}
            </h2>
            <p className="text-base md:text-lg opacity-90">
              {viewMode === 'products' 
                ? t('home.banner.subtitle') 
                : '快速参与，多份购买，提高中奖概率'
              }
            </p>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6">
        {/* 加载状态 */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <SkeletonLoader type="card" count={6} />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="text-red-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-500 text-lg mb-4">加载失败：{error}</p>
            <button
              onClick={refetch}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              重新加载
            </button>
          </div>
        ) : viewMode === 'lottery' ? (
          /* 抽奖视图 */
          lotteryRounds.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">暂无进行中的抽奖</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {lotteryRounds.map((round, index) => (
                <EnhancedLotteryCard
                  key={round.id}
                  round={round}
                  onUpdate={refetch}
                />
              ))}
            </div>
          )
        ) : (
          /* 商品视图 */
          products.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-4V9a2 2 0 00-2-2H8a2 2 0 00-2 2v0m5 0V7a2 2 0 012-2h2a2 2 0 012 2v2" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">{t('common.loading')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {products.map((product, index) => (
                <Link 
                  key={product.id} 
                  href={`/product/${product.id}`}
                  className="bg-white rounded-lg md:rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {/* 营销角标 */}
                    <MarketingBadgeDisplay 
                      badge={product.marketingBadge} 
                      language={language as 'zh' | 'en' | 'ru'}
                    />
                    
                    {product.images && product.images[0] ? (
                      <Image
                        src={product.images[0]} 
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        loading={index < 8 ? 'eager' : 'lazy'}
                        quality={85}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-12 h-12 md:w-16 md:h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-2 md:p-3">
                    <h3 className="font-semibold text-sm md:text-base mb-1 line-clamp-2 min-h-[2.5rem] md:min-h-[3rem]">{product.name}</h3>
                    
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-purple-600 font-bold text-base md:text-lg">
                        {product.marketPrice}
                      </span>
                      <span className="text-xs text-gray-500">
                        {t('common.tjs')}
                      </span>
                    </div>

                    {product.currentRound && (
                      <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>{t('home.progress')}</span>
                          <span className="font-medium">{product.currentRound.soldShares}/{product.currentRound.totalShares}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-purple-600 to-blue-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${product.currentRound.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
}

// 使用错误边界包装组件
export default function HomePageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <HomePage />
    </ErrorBoundary>
  );
}
