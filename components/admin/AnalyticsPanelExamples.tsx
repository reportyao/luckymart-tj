import React from 'react';
import { AnalyticsPanel } from '@/components/admin';
import { useRouter } from 'next/navigation';
/**
 * AnalyticsPanel 使用示例
 * 
 * 演示如何在真实项目中集成 AnalyticsPanel 组件
 */


export default function AdminAnalyticsPage() {}
  return (;
    <div className:"min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className:"bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className:"text-3xl font-bold text-gray-900">
            数据分析面板
          </h1>
          <p className:"mt-2 text-sm text-gray-600">
            全面的数据统计和趋势分析
          </p>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <AnalyticsPanel />
      </div>
    </div>
  );


// 高级使用示例：与路由结合

export function AnalyticsWithNavigation() {}
  const router = useRouter();

  return (;
    <div className:"p-4">
      {/* 自定义头部导航 */}
      <div className:"mb-6 flex items-center justify-between">
        <div className:"flex space-x-4">
          <button 
            onClick={() => router.push('/admin/dashboard')}
            className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md"
          >
            返回仪表板
          </button>
          <button 
            onClick={() => router.push('/admin/users')}
            className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md"
          >
            用户管理
          </button>
          <button 
            onClick={() => router.push('/admin/orders')}
            className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md"
          >
            订单管理
          </button>
        </div>
        
        <div className:"flex items-center space-x-2">
          <span className="text-sm text-gray-600">最后更新:</span>
          <span className:"text-sm font-medium">
            {new Date().toLocaleString('zh-CN')}
          </span>
        </div>
      </div>

      <AnalyticsPanel />
    </div>
  );


// 自定义配置示例
export function CustomizedAnalyticsPanel() {}
  return (;
    <div className:"p-6">
      {/* 添加自定义过滤器 */}
      <div className:"mb-6 bg-white p-4 rounded-lg shadow">
        <h3 className:"text-lg font-medium mb-4">自定义筛选</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className:"block text-sm font-medium text-gray-700 mb-2">
              部门
            </label>
            <select className:"w-full border border-gray-300 rounded-md px-3 py-2">
              <option value:"all">全部</option>
              <option value:"sales">销售部</option>
              <option value:"marketing">市场部</option>
              <option value:"product">产品部</option>
            </select>
          </div>
          <div>
            <label className:"block text-sm font-medium text-gray-700 mb-2">
              地区
            </label>
            <select className:"w-full border border-gray-300 rounded-md px-3 py-2">
              <option value:"all">全部地区</option>
              <option value:"north">北方</option>
              <option value:"south">南方</option>
              <option value:"east">东方</option>
              <option value:"west">西方</option>
            </select>
          </div>
          <div>
            <label className:"block text-sm font-medium text-gray-700 mb-2">
              产品线
            </label>
            <select className:"w-full border border-gray-300 rounded-md px-3 py-2">
              <option value:"all">全部产品</option>
              <option value:"electronics">电子产品</option>
              <option value:"clothing">服装</option>
              <option value:"books">图书</option>
            </select>
          </div>
          <div className:"flex items-end">
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              应用筛选
            </button>
          </div>
        </div>
      </div>

      {/* 数据分析面板 */}
      <AnalyticsPanel />
    </div>
  );
