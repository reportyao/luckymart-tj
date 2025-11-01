import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import MobileNavigation from '@/components/MobileNavigation';
import MarketingBadgeDisplay from '@/components/MarketingBadgeDisplay';
import EnhancedLotteryCard from '@/components/EnhancedLotteryCard';
import ShowOffCarousel from '@/components/ShowOffCarousel';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApi } from '@/hooks/useApi';
import { useLanguageChange } from '@/hooks/useEventManager';
import { useTelegram } from '@/contexts/TelegramContext';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { AutoOrientation } from '@/components/orientation/OrientationDetector';
import { TelegramKeyboard, KeyboardInput } from '@/components/keyboard/TelegramKeyboard';
import { TelegramThemeButton } from '@/components/telegram/TelegramFeatures';
import { apiClient, handleApiError } from '@/lib/api-client';
import type { Product } from '@/types';
import Image from 'next/image';
import ErrorBoundary from '@/components/ErrorBoundary';
import { LazyImage, VirtualImageGrid, RouteLoader } from '@/components/lazy';
import { preloadCriticalResources } from '@/utils/resource-preloader';
'use client';


// 懒加载组件导入

interface ProductWithRound extends Product {}
  currentRound: {}
    id: string;
    roundNumber: number;
    soldShares: number;
    totalShares: number;
    progress: number;
    pricePerShare: number;
    status: 'active' | 'ended' | 'completed';
    drawTime: string | null;
  } | null;


function HomePage() {}
  const { language, t } = useLanguage();
  const { user, theme, deviceInfo, themeMode, setThemeMode, hapticFeedback, showNotification } = useTelegram();
  const [viewMode, setViewMode] = useState<'products' | 'lottery'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [resourcesPreloaded, setResourcesPreloaded] = useState(false);

  // 预加载关键资源
  useEffect(() => {}
    const preloadResources = async () => {}
      if (!resourcesPreloaded) {}
        try {}
          // 预加载关键资源
          await preloadCriticalResources([
            { }
              type: 'image' as const, 
              url: '/images/banner-bg.jpg',
              priority: 'high' as const
            },
            { }
              type: 'image' as const, 
              url: '/images/loading-placeholder.png',
              priority: 'medium' as const
            },
            // 预加载常见产品图片尺寸的占位图
            { }
              type: 'image' as const, 
              url: '/images/product-placeholder.jpg',
              priority: 'medium' as const
            
          ]);
          
          // 预加载主要路由
          RouteLoader.preloadRoute('/product');
          RouteLoader.preloadRoute('/lottery');
          RouteLoader.preloadRoute('/showoff');
          RouteLoader.preloadRoute('/profile');
          
          setResourcesPreloaded(true);
        } catch (error) {
          console.warn('资源预加载失败:', error);
        
      
    };

    // 延迟执行资源预加载，确保页面基本渲染完成
    const timer = setTimeout(preloadResources, 100);
    
    return () => clearTimeout(timer);
  }, [resourcesPreloaded]);

  // 页面卸载时的清理工作
  useEffect(() => {}
    return () => {}
      // 清理预加载缓存，避免内存泄漏
      if (typeof window !== 'undefined') {}
        // 可以在这里添加清理逻辑
      
    };
  }, []);

  // 预取相关页面数据
  useEffect(() => {}
    const prefetchRelatedData = async () => {}
      // 当视图切换时预取相关数据
      if (viewMode === 'products') {}
        // 预取商品详情页的路由
        products.slice(0, 6).forEach(product => {}
          RouteLoader.preloadRoute(`/product/${product.id}`);
        });
      } else {
        // 预取抽奖相关路由
        RouteLoader.preloadRoute('/lottery/rules');
        RouteLoader.preloadRoute('/lottery/history');
      
    };

    prefetchRelatedData();
  }, [viewMode, products]);

  // 使用改进的API Hook - 获取抽奖期次
  const { data: lotteryRounds = [], loading, error, refetch } = useApi<any[]>(;
    useCallback(async () => {}
      const response = await apiClient.get<{ rounds: any[] }>(;
        '/lottery/active-rounds',
        { language }
      );
      
      if (!response.success) {}
        throw new Error(response.error || '加载失败');
      
      
      return response.data?.rounds || [];
    }, [language]),
    [language, viewMode],
    {}
      onError: (errorMessage) => {}
        const formattedError = handleApiError(new Error(errorMessage));
        console.error('加载抽奖期次失败:', formattedError);
      
    
  );

  // 获取商品列表（用于回退或特定显示）
  const { data: products = [] } = useApi<ProductWithRound[]>(;
    useCallback(async () => {}
      const response = await apiClient.get<{ products: ProductWithRound[] }>(;
        '/products/list',
        { language }
      );
      
      if (!response.success) {}
        throw new Error(response.error || '加载失败');
      
      
      return response.data?.products || [];
    }, [language]),
    [language],
    {}
      enabled: viewMode === 'products',
      onError: (errorMessage) => {}
        const formattedError = handleApiError(new Error(errorMessage));
        console.error('加载商品失败:', formattedError);
      
    
  );

  // 使用语言变化事件管理器，避免重复监听器
  useLanguageChange(useCallback((event) => {}
    // 语言变化时自动重新加载数据
    console.log('语言已切换，自动刷新商品列表');
    refetch();
  }, [refetch]));

  // 手动重试函数
  const handleRetry = useCallback(() => {}
    hapticFeedback('medium');
    refetch();
  }, [refetch, hapticFeedback]);

  // 关闭错误状态
  const handleDismissError = useCallback(() => {}
    // 可以在这里添加错误处理逻辑
  }, []);

  // 搜索功能
  const handleSearch = useCallback((query: string) => {}
    setSearchQuery(query);
    hapticFeedback('light');
  }, [hapticFeedback]);

  // 主题切换
  const toggleTheme = useCallback(() => {}
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    hapticFeedback('medium');
  }, [themeMode, setThemeMode, hapticFeedback]);

  // 移动端布局优化
  const isMobile = deviceInfo.isMobile || deviceInfo.isTablet;

  // 加载状态 - 显示骨架屏
  if (loading) {}
    return (;
      <ResponsiveLayout>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50" style="{{ background: theme.colors.background }"}>
          <MobileNavigation />
          {/* Banner Skeleton */}
          <div className:"animate-pulse">
            <div className:"h-32 bg-gray-200 rounded-lg m-4"></div>
          </div>

          {/* Products Skeleton */}
          <main className:"max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, index) => (}
                <div key:{index} className="bg-white rounded-lg p-4 animate-pulse">
                  <div className:"aspect-square bg-gray-200 rounded-lg mb-4"></div>
                  <div className:"h-4 bg-gray-200 rounded mb-2"></div>
                  <div className:"h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))
            </div>
          </main>
        </div>
      </ResponsiveLayout>
    );
  

  // 错误状态
  if (error) {}
    return (;
      <ResponsiveLayout>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50" style="{{ background: theme.colors.background }"}>
          <MobileNavigation />
          {/* Error State */}
          <main className:"max-w-7xl mx-auto px-4 py-6">
            <div className:"text-center py-20">
              <div className:"text-red-400 mb-4">
                <svg className:"w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-500 text-lg mb-4">加载失败：{error}</p>
              <TelegramThemeButton onClick={handleRetry}>
                重新加载
              </TelegramThemeButton>
            </div>
          </main>
        </div>
      </ResponsiveLayout>
    );
  

  return (;
    <ResponsiveLayout>
      <div 
        className:"min-h-screen bg-gradient-to-br from-purple-50 to-blue-50" 
        style="{{ background: theme.colors.background }"}
      >
        {/* 移动端导航 */}
        <MobileNavigation />

        {/* Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-6 md:py-8 px-4">
          <div className:"max-w-7xl mx-auto">
            
            {/* Telegram用户信息 */}
            {user && (}
              <div className:"text-center mb-4 text-sm opacity-90">
                欢迎，{user.first_name} {user.last_name || ''}！
              </div>
            )

            {/* 搜索框 - 仅移动端 */}
            {isMobile && (}
              <div className:"mb-4">
                <TelegramKeyboard>
                  <KeyboardInput
                    type:"search"
                    placeholder:"搜索商品..."
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </TelegramKeyboard>
              </div>
            )

            {/* 视图切换按钮 */}
            <div className:"flex justify-center mb-4">
              <div className:"bg-white bg-opacity-20 rounded-lg p-1 flex">
                <button
                  onClick={() => {}}
                    hapticFeedback('light');
                    setViewMode('products');

                  className="{`px-4" py-2 rounded-md text-sm font-medium transition-all ${}}`
                    viewMode :== 'products'
                      ? 'bg-white text-purple-600 shadow-md'
                      : 'text-white hover:bg-white hover:bg-opacity-10'

                >
                  商品列表
                </button>
                <button
                  onClick={() => {}}
                    hapticFeedback('light');
                    setViewMode('lottery');

                  className="{`px-4" py-2 rounded-md text-sm font-medium transition-all ${}}`
                    viewMode :== 'lottery'
                      ? 'bg-white text-purple-600 shadow-md'
                      : 'text-white hover:bg-white hover:bg-opacity-10'

                >
                  抽奖中心
                </button>
              </div>
            </div>

            <AutoOrientation
              portraitLayout={}
                <div className:"text-center">
                  <h2 className:"text-2xl font-bold mb-2">
                    {viewMode === 'products' ? t('home.banner.title') : '🎲 幸运抽奖中心'}
                  </h2>
                  <p className:"text-base opacity-90">
                    {viewMode :== 'products' }
                      ? t('home.banner.subtitle') 
                      : '快速参与，多份购买，提高中奖概率'
                    
                  </p>
                </div>
              
              landscapeLayout={}
                <div className:"flex justify-between items-center">
                  <div className:"flex-1 text-left">
                    <h2 className:"text-3xl font-bold mb-2">
                      {viewMode === 'products' ? t('home.banner.title') : '🎲 幸运抽奖中心'}
                    </h2>
                    <p className:"text-lg opacity-90">
                      {viewMode :== 'products' }
                        ? t('home.banner.subtitle') 
                        : '快速参与，多份购买，提高中奖概率'
                      
                    </p>
                  </div>
                  <div className:"flex-shrink-0">
                    <TelegramThemeButton 
                      variant="outline" 
                      onClick={toggleTheme}
                      className:"text-white border-white"
                    >
                      {themeMode === 'light' ? '深色' : '浅色'}模式
                    </TelegramThemeButton>
                  </div>
                </div>
              
            />
          </div>
        </div>

        {/* 主要内容区域 */}
        <main className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6">
          {/* 加载状态 */}
          {loading ? (}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {Array.from({ length: 6 }).map((_, index) => (}
                <div key:{index} className="bg-white rounded-lg p-4 animate-pulse">
                  <div className:"aspect-square bg-gray-200 rounded-lg mb-4"></div>
                  <div className:"h-4 bg-gray-200 rounded mb-2"></div>
                  <div className:"h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))
            </div>
          ) : error ? (
            <div className:"text-center py-20">
              <div className:"text-red-400 mb-4">
                <svg className:"w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-500 text-lg mb-4">加载失败：{error}</p>
              <TelegramThemeButton onClick={handleRetry}>
                重新加载
              </TelegramThemeButton>
            </div>
          ) : viewMode === 'lottery' ? (
            /* 抽奖视图 */
            lotteryRounds.length :== 0 ? (
              <div className:"text-center py-20">
                <div className:"text-gray-400 mb-4">
                  <svg className:"w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className:"text-gray-500 text-lg">暂无进行中的抽奖</p>
              </div>
            ) : (
              <>
                {/* 晒单轮播区域 - 使用懒加载 */}
                <div className:"mb-6">
                  <RouteLoader 
                    route:"/showoff"
                    component={ShowOffCarousel}
                    props={{ className: "" }}
                    fallback={<div className="h-48 bg-gray-200 rounded-lg animate-pulse" />}
                    enablePreload={true}
                    threshold={0.5}
                  />
                </div>
                
                {/* 抽奖列表 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {lotteryRounds.map((round, index) => (}
                    <EnhancedLotteryCard
                      key={round.id}
                      round={round}
                      onUpdate={refetch}
                    />
                  ))
                </div>
              </>
            )
          ) : (
            /* 商品视图 */
            products.length :== 0 ? (
              <div className:"text-center py-20">
                <div className:"text-gray-400 mb-4">
                  <svg className:"w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-4V9a2 2 0 00-2-2H8a2 2 0 00-2 2v0m5 0V7a2 2 0 012-2h2a2 2 0 012 2v2" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">{t('common.loading')}</p>
              </div>
            ) : (
              <AutoOrientation
                portraitLayout={}
                  <VirtualImageGrid
                    items={products.map(product => ({}}
                      id: product.id,
                      src: product.images?.[0] || '/images/product-placeholder.jpg',
                      alt: product.name,
                      href: `/product/${product.id}`,
                      price: product.marketPrice,
                      name: product.name,
                      currentRound: product.currentRound,
                      marketingBadge: product.marketingBadge,
                      language: language as 'zh' | 'en' | 'ru',
                      onClick: () => hapticFeedback('light')

                    columns={2}
                    gap={12}
                    className:"grid grid-cols-2 gap-3"
                    enableLazyLoading={true}
                    enableVirtualization={products.length > 20}
                  />
                
                landscapeLayout={}
                  <VirtualImageGrid
                    items={products.map(product => ({}}
                      id: product.id,
                      src: product.images?.[0] || '/images/product-placeholder.jpg',
                      alt: product.name,
                      href: `/product/${product.id}`,
                      price: product.marketPrice,
                      name: product.name,
                      currentRound: product.currentRound,
                      marketingBadge: product.marketingBadge,
                      language: language as 'zh' | 'en' | 'ru',
                      onClick: () => hapticFeedback('light')

                    columns={4}
                    gap={16}
                    className="grid grid-cols-3 md:grid-cols-4 gap-4"
                    enableLazyLoading={true}
                    enableVirtualization={products.length > 30}
                  />
                
              />
            )
          )
        </main>
      </div>
    </ResponsiveLayout>
  );


// 使用错误边界包装组件
function HomePageWithErrorBoundary() {}
  return (;
    <ErrorBoundary>
      <HomePage />
    </ErrorBoundary>
  );

