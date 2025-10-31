# LuckyMart-TJ 懒加载组件使用示例

本文档展示了如何在项目中使用新实现的懒加载组件。

## 1. 基础图片懒加载

### 1.1 单张图片懒加载

```tsx
import { LazyImage } from '@/components/lazy';
import { useState } from 'react';

function ProductCard({ product }: { product: Product }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <LazyImage
        src={product.images?.[0] || '/images/placeholder.jpg'}
        alt={product.name}
        width={300}
        height={200}
        className="w-full h-48 object-cover"
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        quality={85}
        priority={false}
        loading="lazy"
        onLoad={() => setImageLoaded(true)}
        onError={() => console.error('图片加载失败')}
        fallbackSrc="/images/fallback.jpg"
        cacheKey={`product-${product.id}`}
        ttl={3600}
      />
      
      <div className="p-4">
        <h3 className="font-semibold text-lg">{product.name}</h3>
        <p className="text-gray-600">{product.description}</p>
        <div className="mt-2 text-xl font-bold text-purple-600">
          {product.price} TJS
        </div>
      </div>
    </div>
  );
}
```

### 1.2 图片网格懒加载

```tsx
import { VirtualImageGrid } from '@/components/lazy';

interface ImageItem {
  id: string;
  src: string;
  alt: string;
  width?: number;
  height?: number;
  category?: string;
}

function ImageGallery({ images }: { images: ImageItem[] }) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Set<string>>(new Set());

  const handleImageLoad = (imageId: string) => {
    setLoadedImages(prev => new Set(prev).add(imageId));
    console.log(`图片 ${imageId} 加载完成`);
  };

  const handleImageError = (imageId: string, error: Error) => {
    setErrors(prev => new Set(prev).add(imageId));
    console.error(`图片 ${imageId} 加载失败:`, error);
  };

  return (
    <div className="container mx-auto px-4">
      <h2 className="text-2xl font-bold mb-6">图片库</h2>
      
      <VirtualImageGrid
        images={images}
        columns={4}
        gap={16}
        itemHeight={200}
        className="gallery-grid"
        enableVirtualization={true}
        containerHeight={800}
        placeholder="blur"
        quality={80}
        onImageLoad={handleImageLoad}
        onImageError={handleImageError}
      />
      
      {/* 统计信息 */}
      <div className="mt-4 text-sm text-gray-600">
        已加载: {loadedImages.size} / {images.length} | 
        错误: {errors.size} | 
        成功率: {Math.round((loadedImages.size / images.length) * 100)}%
      </div>
    </div>
  );
}
```

## 2. 虚拟滚动列表

### 2.1 商品列表虚拟滚动

```tsx
import { VirtualizedList } from '@/components/lazy';
import { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
}

function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // 模拟加载更多数据
  const loadMoreProducts = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      // 模拟API请求
      const newProducts = await fetchProducts(products.length, 20);
      setProducts(prev => [...prev, ...newProducts]);
    } catch (error) {
      console.error('加载商品失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 渲染单个商品项
  const renderProductItem = (product: Product, index: number) => (
    <div className="flex items-center p-4 border-b hover:bg-gray-50 transition-colors">
      <div className="w-16 h-16 bg-gray-200 rounded-lg mr-4 flex-shrink-0">
        <LazyImage
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover rounded-lg"
          width={64}
          height={64}
          placeholder="empty"
          quality={75}
          loading="lazy"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-lg truncate">{product.name}</h3>
        <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
        <div className="mt-2 font-bold text-purple-600">
          {product.price} TJS
        </div>
      </div>
      
      <div className="ml-4">
        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
          购买
        </button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">商品列表</h2>
      
      <VirtualizedList
        items={products}
        itemHeight={100}
        containerHeight={600}
        renderItem={renderProductItem}
        overscan={5}
        className="product-list"
        onEndReached={loadMoreProducts}
        onEndReachedThreshold={0.8}
        onScroll={(scrollTop) => {
          // 滚动回调，可以用于实现滚动监听
          console.log('滚动位置:', scrollTop);
        }}
      />
      
      {/* 加载状态 */}
      {loading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center">
            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2"></div>
            加载中...
          </div>
        </div>
      )}
    </div>
  );
}
```

### 2.2 交易记录虚拟滚动

```tsx
import { VirtualizedList } from '@/components/lazy';
import { useVirtualList } from '@/components/lazy';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

function TransactionHistory({ transactions }: { transactions: Transaction[] }) {
  // 使用虚拟列表Hook
  const {
    visibleItems,
    totalHeight,
    scrollToIndex,
    scrollToTop
  } = useVirtualList(transactions, {
    itemHeight: 80,
    containerHeight: 600,
    overscan: 3
  });

  const renderTransactionItem = (transaction: Transaction, index: number) => {
    const isIncome = transaction.type === 'income';
    
    return (
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
            isIncome ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {isIncome ? (
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            )}
          </div>
          
          <div>
            <div className="font-medium">{transaction.description}</div>
            <div className="text-sm text-gray-500">{transaction.date}</div>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
            {isIncome ? '+' : '-'}{transaction.amount} TJS
          </div>
          <div className={`text-xs px-2 py-1 rounded-full ${
            transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {transaction.status === 'completed' ? '已完成' :
             transaction.status === 'pending' ? '处理中' : '失败'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="transaction-history">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">交易记录</h2>
        <div className="space-x-2">
          <button
            onClick={scrollToTop}
            className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
          >
            回到顶部
          </button>
        </div>
      </div>
      
      <VirtualizedList
        items={transactions}
        itemHeight={80}
        containerHeight={600}
        renderItem={renderTransactionItem}
        className="border rounded-lg bg-white"
      />
    </div>
  );
}
```

## 3. 智能组件懒加载

### 3.1 组件懒加载

```tsx
import { SmartComponentLoader, ComponentConfigs } from '@/components/lazy';
import { useState } from 'react';

// 抽奖卡片组件
function LotterySection() {
  const [selectedRound, setSelectedRound] = useState<string | null>(null);

  return (
    <div className="lottery-section">
      <h2 className="text-2xl font-bold mb-6">抽奖中心</h2>
      
      {/* 动态加载抽奖卡片 */}
      <SmartComponentLoader
        config={ComponentConfigs.LotteryCard}
        props={{
          roundId: selectedRound || 'latest',
          onUpdate: () => {
            // 抽奖卡片更新回调
            console.log('抽奖卡片已更新');
          }
        }}
        onLoad={() => console.log('抽奖卡片加载完成')}
        onError={(error) => console.error('抽奖卡片加载失败:', error)}
      />
      
      {/* 条件渲染 - 当选择具体期号时加载 */}
      {selectedRound && (
        <SmartComponentLoader
          config={{
            ...ComponentConfigs.LotteryCard,
            strategy: { immediate: true, lazy: false, prefetch: false, priority: 1 }
          }}
          props={{
            roundId: selectedRound,
            showDetails: true
          }}
        />
      )}
    </div>
  );
}

// 钱包组件
function WalletSection() {
  return (
    <div className="wallet-section">
      <SmartComponentLoader
        config={ComponentConfigs.WalletCard}
        props={{
          showBalance: true,
          showTransactions: true,
          compact: false
        }}
      />
    </div>
  );
}

// 用户配置组件
function UserProfileSection() {
  const [activeTab, setActiveTab] = useState('profile');

  const getComponentConfig = (tab: string) => {
    switch (tab) {
      case 'profile':
        return ComponentConfigs.ProfileCard;
      case 'orders':
        return ComponentConfigs.OrderList;
      case 'transactions':
        return ComponentConfigs.TransactionList;
      default:
        return ComponentConfigs.ProfileCard;
    }
  };

  return (
    <div className="user-profile">
      <div className="tabs mb-4">
        <button
          onClick={() => setActiveTab('profile')}
          className={`mr-2 px-4 py-2 rounded ${activeTab === 'profile' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
        >
          个人信息
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`mr-2 px-4 py-2 rounded ${activeTab === 'orders' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
        >
          订单记录
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded ${activeTab === 'transactions' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
        >
          交易记录
        </button>
      </div>
      
      <SmartComponentLoader
        config={getComponentConfig(activeTab)}
        props={{
          userId: 'current-user-id',
          showActions: true
        }}
      />
    </div>
  );
}
```

## 4. 路由懒加载

### 4.1 主页面集成

```tsx
import { RouteLoader, useRoutePreloading } from '@/components/lazy';
import { useResourcePreloader } from '@/utils/resource-preloader';
import LazyImage from '@/components/lazy/LazyImage';
import VirtualizedList from '@/components/lazy/VirtualizedList';
import SmartComponentLoader, { ComponentConfigs } from '@/components/lazy/SmartComponentLoader';
import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApi } from '@/hooks/useApi';
import { apiClient } from '@/lib/api-client';

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
  const { t } = useLanguage();
  const { preloadCoreRoutes, smartPreload } = useRoutePreloading();
  const { preloadImages } = useResourcePreloader();

  // 页面加载时预加载核心资源
  useEffect(() => {
    preloadCoreRoutes();
    smartPreload('navigation');
    
    // 预加载关键图片
    preloadImages([
      '/images/banners/hero-bg.jpg',
      '/images/icons/lottery-icon.png',
      '/images/icons/wallet-icon.png',
      '/images/common/placeholder.png'
    ]);
  }, [preloadCoreRoutes, smartPreload, preloadImages]);

  // 使用缓存的数据
  const { data: lotteryRounds = [] } = useApi(
    async () => {
      // 尝试从缓存获取
      const cached = await productCache.get('lottery-rounds');
      if (cached) return cached;

      // 从API获取并缓存
      const response = await apiClient.get('/lottery/active-rounds');
      if (response.success) {
        await productCache.set('lottery-rounds', response.data);
      }
      
      return response.data || [];
    },
    []
  );

  const { data: products = [] } = useApi(
    async () => {
      const response = await apiClient.get('/products/list');
      return response.data?.products || [];
    },
    []
  );

  return (
    <RouteLoader priority="core" showStats={process.env.NODE_ENV === 'development'}>
      <ResponsiveLayout>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
          {/* Banner区域 */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-8 px-4">
            <div className="max-w-7xl mx-auto text-center text-white">
              <h1 className="text-3xl font-bold mb-4">LuckyMart TJ</h1>
              <p className="text-lg opacity-90">幸运抽奖，一元夺宝</p>
              
              {/* Hero背景图 */}
              <LazyImage
                src="/images/banners/hero-bg.jpg"
                alt="Hero Background"
                width={1200}
                height={400}
                className="w-full h-64 object-cover rounded-lg mt-4"
                priority={true}
                quality={90}
              />
            </div>
          </div>

          {/* 主要内容 */}
          <main className="max-w-7xl mx-auto px-4 py-6">
            {/* 抽奖中心 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">🎲 抽奖中心</h2>
              
              <VirtualizedList
                items={lotteryRounds}
                itemHeight={200}
                containerHeight={600}
                renderItem={(round) => (
                  <SmartComponentLoader
                    config={ComponentConfigs.LotteryCard}
                    props={{ round }}
                  />
                )}
                overscan={3}
                onEndReached={() => {
                  // 加载更多抽奖期次
                  console.log('加载更多抽奖期次');
                }}
              />
            </section>

            {/* 商品列表 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">🛍️ 热门商品</h2>
              
              <VirtualizedList
                items={products}
                itemHeight={150}
                containerHeight={450}
                renderItem={(product) => (
                  <div className="flex items-center p-4 bg-white rounded-lg shadow-sm mb-4">
                    <div className="w-24 h-24 mr-4 flex-shrink-0">
                      <LazyImage
                        src={product.images?.[0] || '/images/placeholder.jpg'}
                        alt={product.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover rounded-lg"
                        placeholder="blur"
                        quality={80}
                        loading="lazy"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <p className="text-gray-600">{product.description}</p>
                      <div className="mt-2 font-bold text-purple-600">
                        {product.marketPrice} TJS
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <SmartComponentLoader
                        config={ComponentConfigs.WalletCard}
                        props={{ 
                          showBalance: true,
                          compact: true
                        }}
                      />
                    </div>
                  </div>
                )}
              />
            </section>
          </main>
        </div>
      </ResponsiveLayout>
    </RouteLoader>
  );
}

export default HomePage;
```

### 4.2 管理页面集成

```tsx
import { RouteLoader } from '@/components/lazy';
import { SmartComponentLoader, ComponentConfigs } from '@/components/lazy/SmartComponentLoader';
import { useState } from 'react';

function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('users');

  const sectionConfigs = {
    users: ComponentConfigs.UserManagement,
    products: ComponentConfigs.ProductManagement,
    analytics: ComponentConfigs.AnalyticsPanel,
    settings: ComponentConfigs.SystemSettings
  };

  return (
    <RouteLoader priority="admin">
      <div className="admin-dashboard">
        <header className="bg-white shadow-sm border-b p-4">
          <h1 className="text-2xl font-bold">管理后台</h1>
          
          <nav className="mt-4 space-x-4">
            <button
              onClick={() => setActiveSection('users')}
              className={`px-4 py-2 rounded ${
                activeSection === 'users' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              用户管理
            </button>
            <button
              onClick={() => setActiveSection('products')}
              className={`px-4 py-2 rounded ${
                activeSection === 'products' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              商品管理
            </button>
            <button
              onClick={() => setActiveSection('analytics')}
              className={`px-4 py-2 rounded ${
                activeSection === 'analytics' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              数据分析
            </button>
            <button
              onClick={() => setActiveSection('settings')}
              className={`px-4 py-2 rounded ${
                activeSection === 'settings' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              系统设置
            </button>
          </nav>
        </header>

        <main className="p-6">
          <SmartComponentLoader
            config={sectionConfigs[activeSection as keyof typeof sectionConfigs]}
            props={{
              // 传递管理相关的props
              adminMode: true,
              showAdvanced: true,
              onDataChange: (data) => {
                console.log('数据变更:', data);
              }
            }}
          />
        </main>
      </div>
    </RouteLoader>
  );
}

export default AdminDashboard;
```

## 5. 性能监控和调试

### 5.1 懒加载性能监控

```tsx
import { useResourcePreloader } from '@/utils/resource-preloader';
import { useState, useEffect } from 'react';

function PerformanceMonitor() {
  const { getPreloadStatus } = useResourcePreloader();
  const [status, setStatus] = useState({
    enabled: true,
    preloadedCount: 0,
    loadingCount: 0,
    queueLength: 0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getPreloadStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, [getPreloadStatus]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-sm z-50">
      <div className="font-semibold mb-2">资源预加载监控</div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>启用状态:</span>
          <span className={status.enabled ? 'text-green-400' : 'text-red-400'}>
            {status.enabled ? '开启' : '关闭'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>已预加载:</span>
          <span className="font-mono">{status.preloadedCount}</span>
        </div>
        
        <div className="flex justify-between">
          <span>加载中:</span>
          <span className="font-mono">{status.loadingCount}</span>
        </div>
        
        <div className="flex justify-between">
          <span>队列长度:</span>
          <span className="font-mono">{status.queueLength}</span>
        </div>
      </div>
    </div>
  );
}

export default PerformanceMonitor;
```

### 5.2 开发环境调试面板

```tsx
import { useVirtualList } from '@/components/lazy';
import { useState } from 'react';

function LazyLoadingDebugPanel() {
  const [showDebug, setShowDebug] = useState(false);
  const [debugStats, setDebugStats] = useState({
    renderTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    loadingErrors: 0
  });

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* 调试开关 */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="fixed top-4 left-4 bg-blue-600 text-white px-3 py-2 rounded text-sm z-40"
      >
        调试面板
      </button>

      {/* 调试面板 */}
      {showDebug && (
        <div className="fixed top-16 left-4 bg-white border rounded-lg shadow-lg p-4 w-80 z-40">
          <h3 className="font-semibold mb-3">懒加载调试面板</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>渲染时间:</span>
              <span className="font-mono">{debugStats.renderTime}ms</span>
            </div>
            
            <div className="flex justify-between">
              <span>内存使用:</span>
              <span className="font-mono">{debugStats.memoryUsage}MB</span>
            </div>
            
            <div className="flex justify-between">
              <span>缓存命中率:</span>
              <span className="font-mono">{debugStats.cacheHitRate}%</span>
            </div>
            
            <div className="flex justify-between">
              <span>加载错误:</span>
              <span className="font-mono text-red-600">{debugStats.loadingErrors}</span>
            </div>
          </div>
          
          <div className="mt-4 space-x-2">
            <button
              onClick={() => {
                // 清理缓存
                console.log('清理缓存');
              }}
              className="px-2 py-1 bg-red-500 text-white rounded text-xs"
            >
              清理缓存
            </button>
            <button
              onClick={() => {
                // 重新加载组件
                window.location.reload();
              }}
              className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
            >
              重新加载
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default LazyLoadingDebugPanel;
```

## 6. 最佳实践

### 6.1 性能优化建议

1. **图片优化**
   - 使用适当的图片格式（WebP/AVIF）
   - 合理设置图片尺寸和质量
   - 启用图片缓存

2. **虚拟滚动**
   - 对于大量数据的列表使用虚拟滚动
   - 合理设置overscan值
   - 避免在renderItem中执行复杂计算

3. **组件懒加载**
   - 根据用户行为智能预加载
   - 使用适当的加载策略
   - 提供良好的loading和error状态

4. **路由预加载**
   - 核心路由立即预加载
   - 次要路由延迟预加载
   - 避免过度预加载

### 6.2 错误处理

```tsx
// 全局错误边界组件
class LazyLoadErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('懒加载组件错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="text-red-800 font-semibold">组件加载失败</h3>
          <p className="text-red-600 text-sm mt-1">
            {this.state.error?.message || '未知错误'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 使用错误边界包装懒加载组件
<LazyLoadErrorBoundary>
  <SmartComponentLoader
    config={ComponentConfigs.LotteryCard}
    props={{ roundId: '123' }}
  />
</LazyLoadErrorBoundary>
```

这些示例展示了如何使用LuckyMart-TJ项目中实现的懒加载组件和功能。通过合理使用这些组件，可以显著提升应用的性能和用户体验。