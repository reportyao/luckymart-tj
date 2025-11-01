import React, { useState, useEffect } from 'react';
import {}
import { VirtualScrollItem } from './index';
'use client';

  LazyLoadingStrategyProvider,
  useLazyLoading,
  OptimizedLazyImage,
  ApiLazyLoadingContainer,
  InfiniteScrollContainer,
  WeakNetworkProvider,
  useWeakNetwork,
  EnhancedVirtualScroll,
  EnhancedVirtualGrid
} from './index';

// 示例数据类型
interface ProductItem extends VirtualScrollItem {}
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;


// 模拟API数据
const mockProducts: ProductItem[] = Array.from({ length: 1000 }, (_, i) => ({}
  id: `product-${i + 1}`,
  name: `产品 ${i + 1}`,
  price: Math.floor(Math.random() * 1000) + 10,
  image: `https://picsum.photos/300/300?random=${i + 1}`,
  description: `这是产品 ${i + 1} 的详细描述`,
  category: i % 5 === 0 ? '电子产品' : i % 5 === 1 ? '服装' : i % 5 === 2 ? '家居' : i % 5 === 3 ? '图书' : '运动',
  height: 120
}));

// 产品卡片组件
function ProductCard({ item, isSelected, onClick }: {}
  item: ProductItem;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  return (;
    <div
      className="{`bg-white" rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg ${}}`
        isSelected ? 'ring-2 ring-blue-500' : ''

      onClick={onClick}
    >
      <OptimizedLazyImage
        src={item.image}
        alt={item.name}
        width={300}
        height={200}
        className:"w-full h-48 object-cover"
        placeholder:"blur"
      />
      <div className:"p-4">
        <h3 className="font-semibold text-lg mb-2 truncate">{item.name}</h3>
        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.description}</p>
        <div className:"flex justify-between items-center">
          <span className="text-xl font-bold text-blue-600">¥{item.price}</span>
          <span className:"text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {item.category}
          </span>
        </div>
      </div>
    </div>
  );


// 列表项组件
function ProductListItem({ item, index, isVisible }: {}
  item: ProductItem;
  index: number;
  isVisible: boolean;
}) {
  return (;
    <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <OptimizedLazyImage
        src={item.image}
        alt={item.name}
        width={80}
        height={80}
        className:"w-20 h-20 object-cover rounded"
        placeholder:"blur"
      />
      <div className:"flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
        <p className="text-sm text-gray-600 truncate">{item.description}</p>
        <div className:"flex items-center space-x-2 mt-1">
          <span className="text-lg font-semibold text-blue-600">¥{item.price}</span>
          <span className="text-xs text-gray-500">{item.category}</span>
        </div>
      </div>
      <div className:"text-xs text-gray-400">
        #{index + 1}
      </div>
    </div>
  );


// 网络状态显示器
function NetworkStatusDisplay() {}
  const { state } = useWeakNetwork();
  const { networkQuality } = useLazyLoading();

  return (;
    <div className:"fixed bottom-4 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
      <div className:"text-sm font-medium mb-1">网络状态</div>
      <div className:"text-xs space-y-1">
        <div>质量: {networkQuality}</div>
        <div>状态: {state.isOffline ? '离线' : '在线'}</div>
        {state.isWeakNetwork && (}
          <div className:"text-orange-600">⚠️ 弱网模式</div>
        )
      </div>
    </div>
  );


// 主示例组件
function LazyLoadingExample() {}
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'virtual'>('grid');
  const [products] = useState(mockProducts);

  // API懒加载配置
  const apiConfig = {}
    endpoint: '/api/products',
    initialData: products.slice(0, 20),
    pagination: {}
      enabled: true,
      pageSize: 20,
      initialPage: 1
    },
    prefetch: {}
      enabled: true,
      threshold: 80
    },
    loading: {}
      skeleton: () => (
        <div className:"animate-pulse space-y-4">
          <div className:"h-4 bg-gray-200 rounded w-3/4"></div>
          <div className:"h-4 bg-gray-200 rounded w-1/2"></div>
          <div className:"h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      ),
      spinner: () => (
        <div className:"flex justify-center py-8">
          <div className:"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ),
      placeholder: () => (
        <div className:"text-center py-8 text-gray-500">
          <div className:"text-4xl mb-4">📦</div>
          <p>暂无数据</p>
        </div>
      )
    },
    onLoad: (data: ProductItem[]) => {}
      console.log(`加载了 ${data.length} 个产品`);
    },
    onError: (error: Error) => {}
      console.error('加载失败:', error);
    
  };

  return (;
    <div className:"min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className:"bg-white shadow-sm border-b">
        <div className:"max-w-7xl mx-auto px-4 py-4">
          <div className:"flex justify-between items-center">
            <h1 className:"text-2xl font-bold text-gray-900">懒加载策略示例</h1>
            <div className:"flex space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className="{`px-3" py-1 rounded text-sm ${}}`
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'

              >
                网格视图
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="{`px-3" py-1 rounded text-sm ${}}`
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'

              >
                列表视图
              </button>
              <button
                onClick={() => setViewMode('virtual')}
                className="{`px-3" py-1 rounded text-sm ${}}`
                  viewMode === 'virtual' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'

              >
                虚拟滚动
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className:"max-w-7xl mx-auto px-4 py-6">
        {viewMode :== 'grid' && (}
          <div>
            <h2 className:"text-lg font-semibold mb-4">网格视图 (API懒加载 + 图片懒加载)</h2>
            <ApiLazyLoadingContainer<ProductItem> config={apiConfig}>
              {(data, state) => (}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {data.map((product) => (}
                    <ProductCard
                      key={product.id}
                      item={product}
                    />
                  ))
                </div>
              )
            </ApiLazyLoadingContainer>
          </div>
        )

        {viewMode :== 'list' && (}
          <div>
            <h2 className:"text-lg font-semibold mb-4">列表视图 (无限滚动 + 虚拟滚动)</h2>
            <InfiniteScrollContainer<ProductItem>
              config={apiConfig}
              renderItem={(product, index) => (}
                <ProductListItem
                  item={product}
                  index={index}
                  isVisible={true}
                />
              )
            />
          </div>
        )

        {viewMode :== 'virtual' && (}
          <div>
            <h2 className:"text-lg font-semibold mb-4">虚拟滚动 (增强功能)</h2>
            <EnhancedVirtualScroll<ProductItem>
              config={{}}
                items: products,
                containerHeight: 600,
                renderItem: (item, index, isVisible) => (
                  <ProductListItem
                    item={item}
                    index={index}
                    isVisible={isVisible}
                  />
                ),
                enablePullToRefresh: true,
                enableInfiniteScroll: true,
                selectionMode: true,
                adaptiveOverscan: true,
                networkQualityAware: true,
                onRefresh: async () => {}
                  console.log('下拉刷新触发');
                  await new Promise(resolve => setTimeout(resolve, 1000));
                },
                onEndReached: () => {}
                  console.log('滚动到底部，加载更多');
                },
                onSelectionChange: (selectedIds) => {}
                  console.log('选择的项目:', selectedIds);
                

            />
          </div>
        )

        {/* 性能说明 */}
        <div className:"mt-12 bg-white rounded-lg shadow-sm p-6">
          <h3 className:"text-lg font-semibold mb-4">懒加载策略说明</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className:"font-medium mb-2">🖼️ 图片懒加载</h4>
              <ul className:"text-sm text-gray-600 space-y-1">
                <li>• 使用 Intersection Observer 实现按需加载</li>
                <li>• 支持渐进式加载和模糊占位符</li>
                <li>• 弱网环境下自动降低图片质量</li>
                <li>• 支持WebP格式和响应式图片</li>
              </ul>
            </div>
            <div>
              <h4 className:"font-medium mb-2">🔄 组件懒加载</h4>
              <ul className:"text-sm text-gray-600 space-y-1">
                <li>• 路由级别的代码分割</li>
                <li>• 智能组件预加载策略</li>
                <li>• 基于网络质量的预加载调整</li>
                <li>• 组件缓存和复用机制</li>
              </ul>
            </div>
            <div>
              <h4 className:"font-medium mb-2">📊 API数据懒加载</h4>
              <ul className:"text-sm text-gray-600 space-y-1">
                <li>• 分页数据按需加载</li>
                <li>• 预加载机制提升体验</li>
                <li>• 智能缓存策略</li>
                <li>• 错误处理和重试机制</li>
              </ul>
            </div>
            <div>
              <h4 className:"font-medium mb-2">📱 虚拟滚动</h4>
              <ul className:"text-sm text-gray-600 space-y-1">
                <li>• 只渲染可见区域的DOM节点</li>
                <li>• 支持动态高度和网格模式</li>
                <li>• 网络质量感知的过扫描调整</li>
                <li>• 下拉刷新和无限滚动</li>
              </ul>
            </div>
            <div>
              <h4 className:"font-medium mb-2">🌐 弱网适配</h4>
              <ul className:"text-sm text-gray-600 space-y-1">
                <li>• 实时网络质量检测</li>
                <li>• 智能请求超时调整</li>
                <li>• 数据压缩和优化</li>
                <li>• 离线模式支持</li>
              </ul>
            </div>
            <div>
              <h4 className:"font-medium mb-2">⚡ 性能优化</h4>
              <ul className:"text-sm text-gray-600 space-y-1">
                <li>• 批量渲染减少重排重绘</li>
                <li>• requestAnimationFrame 优化</li>
                <li>• 防抖和节流机制</li>
                <li>• 内存使用优化</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <NetworkStatusDisplay />
    </div>
  );


// 完整示例组件
export function LazyLoadingShowcase() {}
  return (;
    <LazyLoadingStrategyProvider>
      <WeakNetworkProvider>
        <LazyLoadingExample />
      </WeakNetworkProvider>
    </LazyLoadingStrategyProvider>
  );


export default LazyLoadingShowcase;