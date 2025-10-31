'use client';

import React, { useState, useMemo } from 'react';
import LazyImage from './LazyImage';
import VirtualizedList from './VirtualizedList';

interface LazyImageGridProps {
  images: Array<{
    id: string;
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
  }>;
  columns?: number;
  gap?: number;
  className?: string;
  itemHeight?: number;
  containerHeight?: number;
  onImageLoad?: (imageId: string) => void;
  onImageError?: (imageId: string, error: Error) => void;
  placeholder?: 'blur' | 'empty';
  quality?: number;
  priority?: boolean;
}

const LazyImageGrid: React.FC<LazyImageGridProps> = ({
  images,
  columns = 3,
  gap = 16,
  className = '',
  itemHeight = 200,
  containerHeight = 600,
  onImageLoad,
  onImageError,
  placeholder = 'empty',
  quality = 85,
  priority = false
}) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const [imageLoadStates, setImageLoadStates] = useState<Map<string, { loaded: boolean; error: boolean }>>(
    new Map()
  );

  // 计算网格项
  const gridItems = useMemo(() => {
    return images.map((image, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      
      return {
        ...image,
        gridColumn: col + 1,
        gridRow: row + 1,
        gridArea: `${row + 1} / ${col + 1} / ${row + 2} / ${col + 2}`
      };
    });
  }, [images, columns]);

  // 处理图片加载
  const handleImageLoad = useCallback((imageId: string) => {
    setImageLoadStates(prev => new Map(prev).set(imageId, { loaded: true, error: false }));
    onImageLoad?.(imageId);
  }, [onImageLoad]);

  // 处理图片错误
  const handleImageError = useCallback((imageId: string, error: Error) => {
    setImageLoadStates(prev => new Map(prev).set(imageId, { loaded: false, error: true }));
    onImageError?.(imageId, error);
  }, [onImageError]);

  // 渲染单个网格项
  const renderGridItem = useCallback((image: typeof gridItems[0]) => {
    const loadState = imageLoadStates.get(image.id);
    
    return (
      <div
        key={image.id}
        className="relative overflow-hidden rounded-lg bg-gray-100"
        style={{
          aspectRatio: image.width && image.height 
            ? `${image.width}/${image.height}` 
            : '1',
          gridColumn: image.gridColumn,
          gridRow: image.gridRow
        }}
      >
        <LazyImage
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          className={`w-full h-full object-cover transition-transform duration-300 hover:scale-105 ${
            loadState?.error ? 'opacity-50' : ''
          }`}
          placeholder={placeholder}
          quality={quality}
          priority={priority && gridItems.indexOf(image) < columns * 2} // 只预加载前两行
          loading="lazy"
          onLoad={() => handleImageLoad(image.id)}
          onError={(error) => handleImageError(image.id, error)}
          sizes={`(max-width: 768px) ${100/columns}vw, (max-width: 1200px) ${100/(columns*2)}vw, ${100/(columns*3)}vw`}
        />
        
        {/* 加载状态指示器 */}
        {loadState && !loadState.loaded && !loadState.error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-25">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* 错误状态指示器 */}
        {loadState?.error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
      </div>
    );
  }, [imageLoadStates, handleImageLoad, handleImageError, placeholder, quality, priority, columns, gridItems]);

  // 统计信息
  const stats = useMemo(() => {
    const loaded = Array.from(imageLoadStates.values()).filter(state => state.loaded).length;
    const errors = Array.from(imageLoadStates.values()).filter(state => state.error).length;
    const loading = images.length - loaded - errors;
    
    return { loaded, errors, loading, total: images.length };
  }, [imageLoadStates, images.length]);

  return (
    <div className={`lazy-image-grid ${className}`}>
      {/* 统计信息 - 开发环境显示 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
          图片加载状态: 已加载 {stats.loaded}/{stats.total}, 错误 {stats.errors}, 加载中 {stats.loading}
        </div>
      )}
      
      {/* 网格容器 */}
      <div
        className="grid gap-4 auto-rows-fr"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridAutoRows: '1fr',
          gap: `${gap}px`
        }}
      >
        {gridItems.map((item) => renderGridItem(item))}
      </div>
      
      {/* 虚拟滚动优化 - 当图片数量较多时 */}
      {images.length > 100 && (
        <div className="mt-8 border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">大数据量优化视图</h3>
          <VirtualizedList
            items={gridItems}
            itemHeight={itemHeight}
            containerHeight={containerHeight}
            renderItem={(item) => (
              <div className="flex gap-4 p-2 border rounded">
                <div className="w-16 h-16 flex-shrink-0">
                  {renderGridItem(item)}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.alt}</div>
                  <div className="text-xs text-gray-500">ID: {item.id}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    位置: ({item.gridRow}, {item.gridColumn})
                  </div>
                </div>
              </div>
            )}
            overscan={3}
            onEndReached={() => {
              console.log('已滚动到底部，加载更多...');
              // 这里可以添加加载更多图片的逻辑
            }}
          />
        </div>
      )}
    </div>
  );
};

export default LazyImageGrid;