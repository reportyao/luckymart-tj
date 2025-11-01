'use client';

import React from 'react';
import LazyImage from '@/components/performance/LazyImage';
import SkeletonCard from '@/components/performance/SkeletonCard';
import PerformanceMonitor from '@/components/performance/PerformanceMonitor';

function PerformanceTestPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">移动端性能优化组件测试</h1>
        
        {/* 图片懒加载测试 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">图片懒加载测试</h2>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <LazyImage
                key={i}
                src={`https://picsum.photos/300/300?random=${i + 1}`}
                alt={`测试图片 ${i + 1}`}
                className="w-full h-32 rounded"
                placeholder="/images/placeholder.png"
              />
            ))}
          </div>
        </div>

        {/* 骨架屏测试 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">骨架屏测试</h2>
          <div className="grid grid-cols-2 gap-4">
            <SkeletonCard variant="product" />
            <SkeletonCard variant="product" />
            <SkeletonCard variant="list" lines={3} />
            <SkeletonCard variant="detail" />
          </div>
        </div>
        
        {/* 性能监控 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">性能监控</h2>
          <p className="text-gray-600">性能监控面板已启用，可在右下角查看</p>
        </div>
      </div>
      
      {/* 性能监控面板 */}
      <PerformanceMonitor autoCollect={true} />
    </div>
  );
}