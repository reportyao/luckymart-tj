'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PagePermission } from '@/components/admin/PagePermission';
import { AdminPermissions } from '@/lib/admin-permission-manager';
import { FiPackage, FiDollarSign, FiTrendingUp, FiTag, FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';

interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  avgPrice: number;
  monthlySales: number;
  activePromotions: number;
}

interface Category {
  id: string;
  name: string;
  productCount: number;
  sortOrder: number;
}

interface Promotion {
  id: string;
  name: string;
  type: string;
  discount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

function CommercePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProductStats>({
    totalProducts: 0,
    activeProducts: 0,
    avgPrice: 0,
    monthlySales: 0,
    activePromotions: 0
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'pricing' | 'promotions'>('overview');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      const [statsRes, categoriesRes, promotionsRes] = await Promise.all([
        fetch('/api/admin/commerce/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/commerce/categories', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/commerce/promotions', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const statsData = await statsRes.json();
      const categoriesData = await categoriesRes.json();
      const promotionsData = await promotionsRes.json();

      if (statsData.success) setStats(statsData.data);
      if (categoriesData.success) setCategories(categoriesData.data);
      if (promotionsData.success) setPromotions(promotionsData.data);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color }: any) => (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );

  const TabButton = ({ tab, label }: { tab: typeof activeTab; label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-6 py-3 font-medium transition-colors ${
        activeTab === tab
          ? 'text-indigo-600 border-b-2 border-indigo-600'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">商业变现管理</h1>
              <p className="mt-1 text-sm text-gray-600">商品管理、定价策略和促销活动</p>
            </div>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              返回
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard 
            icon={FiPackage} 
            title="商品总数" 
            value={stats.totalProducts} 
            color="bg-blue-500" 
          />
          <StatCard 
            icon={FiPackage} 
            title="上架商品" 
            value={stats.activeProducts} 
            color="bg-green-500" 
          />
          <StatCard 
            icon={FiDollarSign} 
            title="平均单价" 
            value={`${stats.avgPrice.toFixed(0)} TJS`} 
            color="bg-purple-500" 
          />
          <StatCard 
            icon={FiTrendingUp} 
            title="本月销量" 
            value={stats.monthlySales} 
            color="bg-orange-500" 
          />
          <StatCard 
            icon={FiTag} 
            title="进行中促销" 
            value={stats.activePromotions} 
            color="bg-pink-500" 
          />
        </div>

        {/* 标签导航 */}
        <div className="bg-white rounded-t-xl border-b">
          <div className="flex gap-8 px-6">
            <TabButton tab="overview" label="概览" />
            <TabButton tab="categories" label="分类管理" />
            <TabButton tab="pricing" label="价格策略" />
            <TabButton tab="promotions" label="促销活动" />
          </div>
        </div>

        {/* 内容区域 */}
        <div className="bg-white rounded-b-xl shadow-sm p-6">
          {/* 概览 */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => router.push('/admin/products/create')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-center"
                  >
                    <FiPlus className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">添加新商品</p>
                  </button>
                  <button 
                    onClick={() => router.push('/admin/products')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-center"
                  >
                    <FiPackage className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">查看所有商品</p>
                  </button>
                  <button 
                    onClick={() => setActiveTab('promotions')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-center"
                  >
                    <FiTag className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">创建促销活动</p>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">销售趋势</h3>
                <div className="h-64 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                  销售趋势图表（集成Recharts后显示）
                </div>
              </div>
            </div>
          )}

          {/* 分类管理 */}
          {activeTab === 'categories' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">商品分类</h3>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  <FiPlus />
                  添加分类
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类名称</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品数量</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">排序</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {category.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {category.productCount} 个商品
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {category.sortOrder}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 价格策略 */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">批量调价工具</h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">选择分类</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">全部分类</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">调整方式</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="percentage">按百分比</option>
                        <option value="fixed">固定金额</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">调整值</label>
                      <input 
                        type="number" 
                        placeholder="输入数值"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    应用调价
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">返币比例设置</h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">默认返币比例</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          defaultValue="10"
                          className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                        />
                        <span className="text-sm text-gray-600">%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">VIP用户返币比例</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          defaultValue="15"
                          className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                        />
                        <span className="text-sm text-gray-600">%</span>
                      </div>
                    </div>
                    <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                      保存设置
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 促销活动 */}
          {activeTab === 'promotions' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">促销活动列表</h3>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  <FiPlus />
                  创建促销
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">活动名称</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">折扣</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">开始时间</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">结束时间</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {promotions.map((promo) => (
                      <tr key={promo.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {promo.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {promo.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {promo.discount}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(promo.startDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(promo.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            promo.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {promo.isActive ? '进行中' : '已结束'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// 导出带权限控制的页面
function ProtectedCommercePage() {
  return (
    <PagePermission 
      permissions={AdminPermissions.products.all()}
      showFallback={true}
    >
      <CommercePage />
    </PagePermission>
  );
}

export default ProtectedCommercePage;
