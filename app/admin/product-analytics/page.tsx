'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PerformanceData {
  id: string;
  productId: string;
  productName: { zh: string; en: string; ru: string };
  category: string;
  date: string;
  participantsCount: number;
  salesAmount: number;
  conversionRate: number;
  inventoryTurnover: number;
  avgPricePerShare: number;
  totalRevenue: number;
}

interface ConversionData {
  id: string;
  productId: string;
  productName: { zh: string; en: string; ru: string };
  date: string;
  pageViews: number;
  detailPageViews: number;
  favorites: number;
  addToCart: number;
  purchases: number;
  viewToDetailRate: number;
  detailToFavoriteRate: number;
  favoriteToCartRate: number;
  cartToPurchaseRate: number;
  overallConversionRate: number;
}

interface ProfitData {
  id: string;
  productId: string;
  productName: { zh: string; en: string; ru: string };
  category: string;
  marketPrice: number;
  date: string;
  revenue: number;
  productCost: number;
  platformFee: number;
  operationCost: number;
  grossProfit: number;
  netProfit: number;
  roi: number;
  profitMargin: number;
}

interface TrendingData {
  id: string;
  productId: string;
  productName: { zh: string; en: string; ru: string };
  category: string;
  date: string;
  rankPosition: number;
  popularityScore: number;
  salesTrend: number;
  searchVolume: number;
  marketPosition: string;
}

function ProductAnalyticsPage() {
  const router = useRouter();
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // 数据状态
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [conversionData, setConversionData] = useState<ConversionData[]>([]);
  const [profitData, setProfitData] = useState<ProfitData[]>([]);
  const [trendingData, setTrendingData] = useState<TrendingData[]>([]);
  
  // 统计数据
  const [summary, setSummary] = useState<any>({});
  const [conversionSummary, setConversionSummary] = useState<any>({});
  const [profitSummary, setProfitSummary] = useState<any>({});
  const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('admin_token');
    const info = localStorage.getItem('admin_info');
    
    if (!token || !info) {
      router.push('/admin');
      return;
    }

    setAdminInfo(JSON.parse(info));
    loadAnalyticsData();
  }, [router]);

  const loadAnalyticsData = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      // 并行加载所有数据
      const [performanceRes, conversionRes, profitRes, trendingRes] = await Promise.all([
        fetch(`/api/admin/products/performance?startDate=${startDate}&endDate=${endDate}&limit=50`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/admin/products/conversion?startDate=${startDate}&endDate=${endDate}&limit=50`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/admin/products/profit?startDate=${startDate}&endDate=${endDate}&limit=50`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/admin/products/trending?startDate=${startDate}&endDate=${endDate}&limit=50`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [performance, conversion, profit, trending] = await Promise.all([
        performanceRes.json(),
        conversionRes.json(),
        profitRes.json(),
        trendingRes.json()
      ]);

      if (performance.success) {
        setPerformanceData(performance.data.performance);
        setSummary(performance.data.summary);
      }

      if (conversion.success) {
        setConversionData(conversion.data.conversion);
        setConversionSummary(conversion.data.summary);
      }

      if (profit.success) {
        setProfitData(profit.data.profit);
        setProfitSummary(profit.data.summary);
      }

      if (trending.success) {
        setTrendingData(trending.data.trending);
        setTopProducts(trending.data.topProducts || []);
      }
    } catch (error) {
      console.error('加载分析数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'TJS'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  if (!adminInfo || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard" className="text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">商品运营数据分析</h1>
          </div>
          <button
            onClick={loadAnalyticsData}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            刷新数据
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 选项卡导航 */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: '概览仪表板', icon: '📊' },
                { id: 'performance', name: '商品表现', icon: '📈' },
                { id: 'conversion', name: '转化漏斗', icon: '🔄' },
                { id: 'profit', name: '利润分析', icon: '💰' },
                { id: 'trending', name: '热销趋势', icon: '🔥' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 概览仪表板 */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 核心指标卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">👥</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">总参与人数</p>
                    <p className="text-2xl font-semibold text-gray-900">{summary.totalParticipants?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold">💵</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">总销售额</p>
                    <p className="text-2xl font-semibold text-gray-900">{formatCurrency(summary.totalSalesAmount || 0)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600 font-semibold">📊</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">平均转化率</p>
                    <p className="text-2xl font-semibold text-gray-900">{formatPercentage(summary.avgConversionRate || 0)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-semibold">💰</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">总净利润</p>
                    <p className="text-2xl font-semibold text-gray-900">{formatCurrency(profitSummary.totalNetProfit || 0)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 热销商品排行榜 */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">🔥 热销商品排行榜</h3>
              </div>
              <div className="p-6">
                {topProducts.length > 0 ? (
                  <div className="space-y-4">
                    {topProducts.slice(0, 10).map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            index === 2 ? 'bg-orange-500' : 'bg-gray-300'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{product.productName.zh || product.productName.en}</p>
                            <p className="text-sm text-gray-500">{product.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(product.marketPrice)}</p>
                          <p className="text-sm text-gray-500">热度: {product.popularityScore}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">暂无数据</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 商品表现分析 */}
        {activeTab === 'performance' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">📈 商品表现统计</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">参与人数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">销售额</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">转化率</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">库存周转</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {performanceData.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.productName.zh}</div>
                          <div className="text-sm text-gray-500">{item.category}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.participantsCount.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.salesAmount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatPercentage(item.conversionRate)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.inventoryTurnover.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 转化漏斗分析 */}
        {activeTab === 'conversion' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">🔄 转化漏斗分析</h3>
            </div>
            <div className="p-6">
              {/* 转化率概览 */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{conversionSummary.totalPageViews?.toLocaleString() || 0}</p>
                  <p className="text-sm text-gray-600">页面浏览</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{conversionSummary.avgViewToDetailRate?.toFixed(1) || 0}%</p>
                  <p className="text-sm text-gray-600">浏览→详情</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{conversionSummary.avgDetailToFavoriteRate?.toFixed(1) || 0}%</p>
                  <p className="text-sm text-gray-600">详情→收藏</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{conversionSummary.avgFavoriteToCartRate?.toFixed(1) || 0}%</p>
                  <p className="text-sm text-gray-600">收藏→加购</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{conversionSummary.avgOverallConversionRate?.toFixed(1) || 0}%</p>
                  <p className="text-sm text-gray-600">总转化率</p>
                </div>
              </div>

              {/* 详细数据表格 */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">浏览量</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">详情页</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">收藏</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">加购</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">购买</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {conversionData.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.productName.zh}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.pageViews.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.detailPageViews.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.favorites.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.addToCart.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.purchases.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 利润分析 */}
        {activeTab === 'profit' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">💰 利润分析</h3>
            </div>
            <div className="p-6">
              {/* 利润概览 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(profitSummary.totalRevenue || 0)}</p>
                  <p className="text-sm text-gray-600">总收入</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(profitSummary.totalProductCost || 0)}</p>
                  <p className="text-sm text-gray-600">商品成本</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{formatCurrency(profitSummary.totalNetProfit || 0)}</p>
                  <p className="text-sm text-gray-600">净利润</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{profitSummary.avgProfitMargin?.toFixed(1) || 0}%</p>
                  <p className="text-sm text-gray-600">利润率</p>
                </div>
              </div>

              {/* 详细数据表格 */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">收入</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">成本</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">毛利润</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">净利润</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROI</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {profitData.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.productName.zh}</div>
                          <div className="text-sm text-gray-500">{item.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.revenue)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.productCost)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.grossProfit)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.netProfit)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatPercentage(item.roi)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 热销趋势 */}
        {activeTab === 'trending' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">🔥 热销趋势分析</h3>
            </div>
            <div className="p-6">
              {/* 趋势概览 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{trendingData.length}</p>
                  <p className="text-sm text-gray-600">活跃商品</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{trendingData.reduce((sum, item) => sum + item.searchVolume, 0).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">总搜索量</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{trendingData.reduce((sum, item) => sum + item.popularityScore, 0).toFixed(0)}</p>
                  <p className="text-sm text-gray-600">总热度</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{trendingData.filter(item => item.salesTrend > 0).length}</p>
                  <p className="text-sm text-gray-600">增长商品</p>
                </div>
              </div>

              {/* 详细数据表格 */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">排名</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">热度得分</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">销售趋势</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">搜索量</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">市场定位</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {trendingData
                      .sort((a, b) => b.popularityScore - a.popularityScore)
                      .slice(0, 20)
                      .map((item, index) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            index === 2 ? 'bg-orange-500' : 'bg-gray-300'
                          }`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.productName.zh}</div>
                            <div className="text-sm text-gray-500">{item.category}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.popularityScore.toFixed(1)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.salesTrend > 0 ? 'bg-green-100 text-green-800' : 
                            item.salesTrend < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.salesTrend > 0 ? '+' : ''}{item.salesTrend.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.searchVolume.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.marketPosition || 'normal'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}function WrappedProductAnalyticsPage() {
  return (
    <div>
      <ProductAnalyticsPage />
    </div>
  );
}

export default WrappedProductAnalyticsPage;
