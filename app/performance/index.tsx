'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const performancePages = [
  {
    title: '性能监控面板',
    description: '查看系统性能指标和统计数据',
    href: '/performance',
    icon: '📊',
    color: 'bg-blue-500'
  },
  {
    title: '移动端优化演示',
    description: '完整的移动端性能优化功能演示',
    href: '/performance/mobile-demo',
    icon: '📱',
    color: 'bg-green-500'
  },
  {
    title: '组件功能测试',
    description: '测试图片懒加载、骨架屏等核心组件',
    href: '/performance/test',
    icon: '🧪',
    color: 'bg-purple-500'
  }
];

export default function PerformanceIndexPage() {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-gray-900">
              移动端性能优化系统
            </h1>
            <Link 
              href="/"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              返回首页
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            移动端性能优化解决方案
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            通过图片懒加载、虚拟滚动、骨架屏、代码分割和性能监控等技术，
            显著提升移动端用户体验和应用性能
          </p>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl mb-2">🚀</div>
            <div className="text-2xl font-bold text-blue-600">60-80%</div>
            <div className="text-sm text-gray-600">页面加载速度提升</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl mb-2">📋</div>
            <div className="text-2xl font-bold text-green-600">90%+</div>
            <div className="text-sm text-gray-600">大列表渲染性能提升</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl mb-2">💾</div>
            <div className="text-2xl font-bold text-purple-600">95%+</div>
            <div className="text-sm text-gray-600">内存使用量减少</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl mb-2">📡</div>
            <div className="text-2xl font-bold text-orange-600">30-50%</div>
            <div className="text-sm text-gray-600">数据传输量减少</div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {performancePages.map((page) => {
            const isActive = pathname === page.href;
            return (
              <Link
                key={page.href}
                href={page.href}
                className={cn(
                  'group relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden',
                  isActive ? 'ring-2 ring-blue-500' : ''
                )}
              >
                <div className="p-8">
                  <div className={cn(
                    'inline-flex items-center justify-center w-16 h-16 rounded-xl text-white text-2xl mb-6',
                    page.color
                  )}>
                    {page.icon}
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {page.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed">
                    {page.description}
                  </p>
                  
                  <div className="mt-6 flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                    <span>立即访问</span>
                    <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                {isActive && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      当前页面
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Features Overview */}
        <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            核心功能特性
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🖼️</div>
              <h4 className="font-semibold text-gray-900 mb-2">图片懒加载</h4>
              <p className="text-sm text-gray-600">
                Intersection Observer API + 现代图片格式 + 响应式加载
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-3">📋</div>
              <h4 className="font-semibold text-gray-900 mb-2">虚拟滚动</h4>
              <p className="text-sm text-gray-600">
                只渲染可见区域 + 动态高度支持 + O(1)复杂度
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-3">💀</div>
              <h4 className="font-semibold text-gray-900 mb-2">骨架屏</h4>
              <p className="text-sm text-gray-600">
                统一组件库 + 多种样式 + 平滑过渡效果
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-3">⚡</div>
              <h4 className="font-semibold text-gray-900 mb-2">代码分割</h4>
              <p className="text-sm text-gray-600">
                动态导入 + 智能预加载 + 网络感知优化
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-3">📊</div>
              <h4 className="font-semibold text-gray-900 mb-2">性能监控</h4>
              <p className="text-sm text-gray-600">
                Core Web Vitals + 实时监控 + 智能建议
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-3">🔧</div>
              <h4 className="font-semibold text-gray-900 mb-2">API接口</h4>
              <p className="text-sm text-gray-600">
                性能数据收集 + 图片优化 + 智能分析
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-3">⚙️</div>
              <h4 className="font-semibold text-gray-900 mb-2">配置优化</h4>
              <p className="text-sm text-gray-600">
                Next.js优化 + 缓存策略 + Bundle分析
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-3">📱</div>
              <h4 className="font-semibold text-gray-900 mb-2">移动优先</h4>
              <p className="text-sm text-gray-600">
                响应式设计 + 触摸优化 + 网络适配
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500">
          <p>© 2025 LuckyMart TJ 移动端性能优化系统</p>
          <p className="mt-2 text-sm">
            让您的应用在移动设备上飞起来！ 🚀
          </p>
        </div>
      </div>
    </div>
  );
}