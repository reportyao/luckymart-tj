import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonCardProps {
  variant?: 'product' | 'list' | 'detail' | 'profile' | 'comment' | 'chart';
  animated?: boolean;
  lines?: number;
  showAvatar?: boolean;
  showImage?: boolean;
  imageHeight?: string | number;
  className?: string;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({
  variant = 'list',
  animated = true,
  lines = 2,
  showAvatar = true,
  showImage = true,
  imageHeight = '200px',
  className
}) => {
  const skeletonClass = cn(
    'bg-gray-200 dark:bg-gray-700 rounded',
    animated && 'animate-pulse'
  );

  const ProductSkeleton = () => (
    <div className="p-4 space-y-3">
      {showImage && (
        <div 
          className={cn(skeletonClass, 'w-full')}
          style={{ height: imageHeight }}
        />
      )}
      <div className="space-y-2">
        <div className={cn(skeletonClass, 'h-4 w-3/4')} />
        <div className={cn(skeletonClass, 'h-4 w-1/2')} />
      </div>
      <div className="flex justify-between items-center">
        <div className={cn(skeletonClass, 'h-6 w-20')} />
        <div className={cn(skeletonClass, 'h-8 w-16 rounded-full')} />
      </div>
    </div>
  );

  const ListSkeleton = () => (
    <div className="flex items-center space-x-3 p-3">
      {showImage && (
        <div className={cn(skeletonClass, 'w-16 h-16 flex-shrink-0')} />
      )}
      <div className="flex-1 space-y-2">
        <div className={cn(skeletonClass, 'h-4 w-full')} />
        {lines > 1 && <div className={cn(skeletonClass, 'h-4 w-2/3')} />}
        {lines > 2 && <div className={cn(skeletonClass, 'h-4 w-1/2')} />}
      </div>
    </div>
  );

  const DetailSkeleton = () => (
    <div className="p-6 space-y-6">
      {showImage && (
        <div className={cn(skeletonClass, 'w-full h-80')} />
      )}
      <div className="space-y-4">
        <div className={cn(skeletonClass, 'h-8 w-3/4')} />
        <div className={cn(skeletonClass, 'h-6 w-1/2')} />
        <div className={cn(skeletonClass, 'h-10 w-1/3')} />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn(skeletonClass, 'h-4 w-full')} />
        ))}
      </div>
    </div>
  );

  const ProfileSkeleton = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-4">
        {showAvatar && (
          <div className={cn(skeletonClass, 'w-16 h-16 rounded-full')} />
        )}
        <div className="space-y-2 flex-1">
          <div className={cn(skeletonClass, 'h-5 w-1/2')} />
          <div className={cn(skeletonClass, 'h-4 w-1/3')} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="text-center space-y-1">
            <div className={cn(skeletonClass, 'h-6 w-12 mx-auto')} />
            <div className={cn(skeletonClass, 'h-3 w-16 mx-auto')} />
          </div>
        ))}
      </div>
    </div>
  );

  const CommentSkeleton = () => (
    <div className="p-4 space-y-3">
      <div className="flex items-center space-x-3">
        {showAvatar && (
          <div className={cn(skeletonClass, 'w-8 h-8 rounded-full')} />
        )}
        <div className="flex-1 space-y-1">
          <div className={cn(skeletonClass, 'h-3 w-1/4')} />
          <div className={cn(skeletonClass, 'h-3 w-1/6')} />
        </div>
      </div>
      <div className="pl-11 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i} 
            className={cn(
              skeletonClass, 
              'h-3',
              i === lines - 1 ? 'w-3/4' : 'w-full'
            )} 
          />
        ))}
      </div>
    </div>
  );

  const ChartSkeleton = () => (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className={cn(skeletonClass, 'h-6 w-1/3')} />
        <div className={cn(skeletonClass, 'h-4 w-1/4')} />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <div className={cn(skeletonClass, 'h-4 w-20')} />
            <div className={cn(skeletonClass, 'h-6 flex-1')} />
            <div className={cn(skeletonClass, 'h-4 w-16')} />
          </div>
        ))}
      </div>
    </div>
  );

  const renderSkeleton = () => {
    switch (variant) {
      case 'product':
        return <ProductSkeleton />;
      case 'list':
        return <ListSkeleton />;
      case 'detail':
        return <DetailSkeleton />;
      case 'profile':
        return <ProfileSkeleton />;
      case 'comment':
        return <CommentSkeleton />;
      case 'chart':
        return <ChartSkeleton />;
      default:
        return <ListSkeleton />;
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {renderSkeleton()}
    </div>
  );
};

export default SkeletonCard;

// 骨架屏容器组件
export const SkeletonContainer: React.FC<{
  children: React.ReactNode;
  isLoading: boolean;
  fallback?: React.ReactNode;
  minHeight?: string | number;
  className?: string;
}> = ({ 
  children, 
  isLoading, 
  fallback, 
  minHeight = '200px',
  className 
}) => {
  return (
    <div 
      className={cn('relative', className)}
      style={{ minHeight }}
    >
      {isLoading ? (
        fallback || <div className="p-4">
          <SkeletonCard variant="list" />
        </div>
      ) : (
        children
      )}
    </div>
  );
};

// 骨架屏Grid布局
export const SkeletonGrid: React.FC<{
  count?: number;
  columns?: number;
  gap?: string;
  variant?: 'product' | 'list' | 'detail';
  className?: string;
}> = ({ 
  count = 6, 
  columns = 2, 
  gap = '1rem',
  variant = 'product',
  className 
}) => (
  <div 
    className={cn('grid', className)}
    style={{ 
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap 
    }}
  >
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard 
        key={i} 
        variant={variant} 
        showImage={variant !== 'list'}
      />
    ))}
  </div>
);

// 骨架屏列表
export const SkeletonList: React.FC<{
  count?: number;
  lines?: number;
  showAvatar?: boolean;
  showImage?: boolean;
  className?: string;
}> = ({ 
  count = 5, 
  lines = 2, 
  showAvatar = true, 
  showImage = false,
  className 
}) => (
  <div className={cn('space-y-3', className)}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard 
        key={i} 
        variant="list" 
        lines={lines}
        showAvatar={showAvatar}
        showImage={showImage}
      />
    ))}
  </div>
);

// 骨架屏加载状态管理Hook
export const useSkeletonLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = React.useState(initialState);
  const [hasLoaded, setHasLoaded] = React.useState(false);

  const startLoading = React.useCallback(() => {
    setIsLoading(true);
    setHasLoaded(false);
  }, []);

  const stopLoading = React.useCallback(() => {
    setIsLoading(false);
    setHasLoaded(true);
  }, []);

  const reset = React.useCallback(() => {
    setIsLoading(initialState);
    setHasLoaded(false);
  }, [initialState]);

  return {
    isLoading,
    hasLoaded,
    startLoading,
    stopLoading,
    reset
  };
};