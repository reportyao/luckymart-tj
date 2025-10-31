// SkeletonLoader.tsx - 骨架屏加载组件
'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

interface SkeletonLoaderProps {
  type?: 'card' | 'list' | 'banner';
  count?: number;
  className?: string;
}

export const SkeletonCard: React.FC = () => (
  <div className="luckymart-bg-white rounded-xl luckymart-shadow-lg overflow-hidden">
    <Skeleton className="aspect-square w-full" />
    <div className="luckymart-padding-md">
      <Skeleton className="luckymart-size-md w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-2/3 mb-3" />
      <div className="luckymart-layout-flex justify-between luckymart-layout-center mb-3">
        <Skeleton className="luckymart-size-md w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-2 w-full" />
    </div>
  </div>
);

export const SkeletonList: React.FC = () => (
  <div className="luckymart-bg-white luckymart-rounded-lg luckymart-shadow luckymart-padding-md">
    <div className="luckymart-layout-flex luckymart-layout-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="luckymart-size-lg w-16" />
    </div>
  </div>
);

export const SkeletonBanner: React.FC = () => (
  <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12 px-4">
    <div className="max-w-7xl mx-auto luckymart-text-center">
      <Skeleton className="luckymart-size-lg w-64 mx-auto luckymart-spacing-md bg-white/20" />
      <Skeleton className="luckymart-size-md w-96 mx-auto bg-white/20" />
    </div>
  </div>
);

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  type = 'card', 
  count = 6,
  className = ''
}) => {
  const renderSkeletons = () => {
    switch (type) {
      case 'list':
        return Array.from({ length: count }, (_, i) => (
          <SkeletonList key={i} />
        ));
      case 'banner':
        return <SkeletonBanner />;
      case 'card':
      default:
        return Array.from({ length: count }, (_, i) => (
          <SkeletonCard key={i} />
        ));
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {renderSkeletons()}
    </div>
  );
};

export default SkeletonLoader;