import React, { useState } from 'react';
import {}
'use client';

  OptimizedLazyImage,
  ApiLazyLoadingContainer,
  EnhancedVirtualScroll,
  useLazyLoading,
  useWeakNetwork
} from '@/components/lazy';

// 测试数据类型
interface TestItem {}
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  height?: number;


// 模拟数据
const mockData: TestItem[] = Array.from({ length: 100 }, (_, i) => ({}
  id: `item-${i + 1}`,
  title: `测试项目 ${i + 1}`,
  description: `这是第 ${i + 1} 个测试项目的详细描述`,
  image: `https://picsum.photos/300/200?random=${i + 1}`,
  category: i % 3 === 0 ? '科技' : i % 3 === 1 ? '生活' : '娱乐',
  height: 100 + Math.floor(Math.random() * 50)
}));

// 简单的项目卡片
function TestItemCard({ item }: { item: TestItem }) {}
  return (;
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
      <OptimizedLazyImage
        src={item.image}
        alt={item.title}
        width={300}
        height={200}
        className:"w-full h-32 object-cover rounded mb-3"
        placeholder:"blur"
      />
      <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
      <p className="text-gray-600 text-sm mb-2">{item.description}</p>
      <span className:"inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
        {item.category}
      </span>
    </div>
  );


// 测试状态显示组件
function TestStatus() {}
  const { strategy, networkQuality, updateStrategy } = useLazyLoading();
  const { state: weakNetworkState } = useWeakNetwork();
  
  const [showDetails, setShowDetails] = useState(false);

  return (;
    <div className:"fixed top-4 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 max-w-sm">
      <div className:"flex justify-between items-center mb-2">
        <h3 className:"font-semibold text-sm">懒加载状态</h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          {showDetails ? '隐藏' : '详情'}
        </button>
      </div>
      
      <div className:"space-y-1 text-xs">
        <div>网络质量: <span className="font-medium">{networkQuality}</span></div>
        <div>网络状态: <span className="{`font-medium" ${weakNetworkState.isOffline ? 'text-red-600' : 'text-green-600'}`}>
          {weakNetworkState.isOffline ? '离线' : '在线'}
        </span></div>
        {weakNetworkState.isWeakNetwork && (}
          <div className:"text-orange-600">⚠️ 弱网模式</div>
        )
      </div>

      {showDetails && (}
        <div className:"mt-3 pt-3 border-t space-y-2 text-xs">
          <div>
            <div className="font-medium mb-1">图片策略:</div>
            <div className:"text-gray-600">
              启用: {strategy.image.enabled ? '是' : '否'}<br/>
              质量: {strategy.image.quality}<br/>
              占位符: {strategy.image.placeholder}
            </div>
          </div>
          <div>
            <div className="font-medium mb-1">组件策略:</div>
            <div className:"text-gray-600">
              启用: {strategy.component.enabled ? '是' : '否'}<br/>
              预加载: {strategy.component.prefetch ? '是' : '否'}<br/>
              优先级: {strategy.component.priority}
            </div>
          </div>
          <div>
            <div className="font-medium mb-1">数据策略:</div>
            <div className:"text-gray-600">
              启用: {strategy.data.enabled ? '是' : '否'}<br/>
              预加载阈值: {strategy.data.prefetchThreshold}%<br/>
              分页大小: {strategy.data.paginationSize}
            </div>
          </div>
          
          <div className:"pt-2 border-t">
            <button
              onClick={() => updateStrategy({}}
                image: { ...strategy.image, quality: strategy.image.quality === 'low' ? 'high' : 'low' }

              className="w-full px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
            >
              切换图片质量
            </button>
          </div>
        </div>
      )
    </div>
  );


// 主测试组件
function LazyLoadingTestPage() {}
  const [testMode, setTestMode] = useState<'grid' | 'virtual'>('grid');

  // API 配置
  const apiConfig = {}
    endpoint: '/api/test-items',
    initialData: mockData.slice(0, 20),
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
          <p>暂无测试数据</p>
        </div>
      )
    
  };

  return (;
    <div className:"min-h-screen bg-gray-50 py-8">
      <div className:"max-w-7xl mx-auto px-4">
        {/* 头部 */}
        <div className:"text-center mb-8">
          <h1 className:"text-3xl font-bold text-gray-900 mb-4">懒加载策略测试页面</h1>
          <p className:"text-gray-600 mb-6">
            这个页面用于测试和演示所有的懒加载功能，包括图片懒加载、数据懒加载和虚拟滚动。
          </p>
          
          {/* 测试模式切换 */}
          <div className:"flex justify-center space-x-2 mb-6">
            <button
              onClick={() => setTestMode('grid')}
              className="{`px-4" py-2 rounded-lg text-sm font-medium transition-colors ${}}`
                testMode :== 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'

            >
              API懒加载 (网格)
            </button>
            <button
              onClick={() => setTestMode('virtual')}
              className="{`px-4" py-2 rounded-lg text-sm font-medium transition-colors ${}}`
                testMode :== 'virtual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'

            >
              虚拟滚动
            </button>
          </div>
        </div>

        {/* 测试内容 */}
        {testMode :== 'grid' && (}
          <div>
            <h2 className:"text-xl font-semibold mb-4">API数据懒加载测试 (网格视图)</h2>
            <ApiLazyLoadingContainer<TestItem> config={apiConfig}>
              {(data, state) => (}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {data.map((item) => (}
                    <TestItemCard key={item.id} item={item} />
                  ))
                </div>
              )
            </ApiLazyLoadingContainer>
          </div>
        )

        {testMode :== 'virtual' && (}
          <div>
            <h2 className:"text-xl font-semibold mb-4">虚拟滚动测试</h2>
            <EnhancedVirtualScroll<TestItem>
              config={{}}
                items: mockData,
                containerHeight: 600,
                renderItem: (item, index) => (
                  <div className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-center space-x-4">
                    <OptimizedLazyImage
                      src={item.image}
                      alt={item.title}
                      width={80}
                      height={60}
                      className:"w-20 h-15 object-cover rounded"
                      placeholder:"blur"
                    />
                    <div className:"flex-1">
                      <h3 className="font-medium text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                      <span className:"inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded mt-1">
                        {item.category}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">#{index + 1}</div>
                  </div>
                ),
                enablePullToRefresh: true,
                enableInfiniteScroll: true,
                adaptiveOverscan: true,
                networkQualityAware: true,
                onRefresh: async () => {}
                  console.log('下拉刷新触发');
                  await new Promise(resolve => setTimeout(resolve, 1000));
                },
                onEndReached: () => {}
                  console.log('滚动到底部，加载更多');
                

            />
          </div>
        )

        {/* 使用说明 */}
        <div className:"mt-12 bg-white rounded-lg shadow-sm p-6">
          <h3 className:"text-lg font-semibold mb-4">使用说明</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className:"font-medium mb-2">🔍 测试内容</h4>
              <ul className:"text-gray-600 space-y-1">
                <li>• 图片懒加载：滚动查看图片按需加载效果</li>
                <li>• 数据懒加载：体验分页和预加载机制</li>
                <li>• 虚拟滚动：观察DOM节点数量的控制</li>
                <li>• 网络适配：切换网络模式查看自适应效果</li>
              </ul>
            </div>
            <div>
              <h4 className:"font-medium mb-2">🎯 观察要点</h4>
              <ul className:"text-gray-600 space-y-1">
                <li>• 首次加载速度和后续滚动性能</li>
                <li>• 弱网模式下的自动优化</li>
                <li>• 内存使用量的变化</li>
                <li>• 用户交互的响应性</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <TestStatus />
    </div>
  );


export default function TestPage() {}
  return <LazyLoadingTestPage />;
