// 懒加载组件索引文件
// Lazy Loading Components Index

// 核心组件
export { default as LazyImage } from './LazyImage';
export { default as VirtualizedList } from './VirtualizedList';
export { default as VirtualizedGrid } from './VirtualizedGrid';
export { default as VirtualImageGrid } from './VirtualImageGrid';
export { default as LazyImageGrid } from './LazyImageGrid';
export { default as SmartComponentLoader } from './SmartComponentLoader';
export { default as RouteLoader } from './RouteLoader';

// 组件配置
export { ComponentConfigs } from './SmartComponentLoader';
export { LazyComponents } from './RouteLoader';

// Hooks
export { useVirtualList } from './VirtualizedList';
export { useVirtualGrid } from './VirtualizedGrid';

// 类型定义
export interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  quality?: number;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string;
  srcSet?: string;
  fallbackSrc?: string;
  cacheKey?: string;
  ttl?: number;
}

export interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number | ((index: number) => number);
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  scrollToIndex?: number;
  onScroll?: (scrollTop: number) => void;
}

export interface VirtualizedGridProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  columns: number;
  gap?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  scrollToIndex?: number;
  onScroll?: (scrollTop: number) => void;
}

export interface VirtualImageGridProps {
  images: Array<{
    id: string;
    src: string;
    alt: string;
    width?: number;
    height?: number;
    category?: string;
  }>;
  columns?: number;
  gap?: number;
  className?: string;
  itemHeight?: number;
  onImageLoad?: (imageId: string) => void;
  onImageError?: (imageId: string, error: Error) => void;
  placeholder?: 'blur' | 'empty';
  quality?: number;
  enableVirtualization?: boolean;
  containerHeight?: number;
}

export interface SmartComponentLoaderProps {
  config: {
    importFn: () => Promise<{ default: React.ComponentType<any> }>;
    loadingComponent?: React.ComponentType;
    fallbackComponent?: React.ComponentType;
    strategy: {
      immediate: boolean;
      lazy: boolean;
      prefetch: boolean;
      priority: number;
    };
    dependencies?: any[];
  };
  props?: any;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export interface RouteLoaderProps {
  children: React.ReactNode;
  priority?: 'core' | 'secondary' | 'admin';
  fallback?: React.ReactNode;
  showStats?: boolean;
}

// 使用示例

/**
 * 基础图片懒加载示例
 * 
 * ```tsx
 * import { LazyImage } from '@/components/lazy';
 * 
 * function MyComponent() {
 *   return (
 *     <LazyImage
 *       src="/path/to/image.jpg"
 *       alt="示例图片"
 *       width={300}
 *       height={200}
 *       placeholder="blur"
 *       quality={85}
 *       priority={false}
 *       onLoad={() => console.log('图片加载完成')}
 *       onError={(error) => console.error('图片加载失败', error)}
 *     />
 *   );
 * }
 * ```
 */

/**
 * 虚拟滚动列表示例
 * 
 * ```tsx
 * import { VirtualizedList } from '@/components/lazy';
 * 
 * interface Item {
 *   id: string;
 *   title: string;
 *   description: string;
 * }
 * 
 * function VirtualList({ items }: { items: Item[] }) {
 *   return (
 *     <VirtualizedList
 *       items={items}
 *       itemHeight={80}
 *       containerHeight={600}
 *       renderItem={(item) => (
 *         <div className="p-4 border-b">
 *           <h3>{item.title}</h3>
 *           <p>{item.description}</p>
 *         </div>
 *       )}
 *       onEndReached={() => {
 *         // 加载更多数据
 *         loadMoreItems();
 *       }}
 *     />
 *   );
 * }
 * ```
 */

/**
 * 虚拟图片网格示例
 * 
 * ```tsx
 * import { VirtualImageGrid } from '@/components/lazy';
 * 
 * function ImageGallery({ images }: { images: ImageItem[] }) {
 *   return (
 *     <VirtualImageGrid
 *       images={images}
 *       columns={3}
 *       gap={16}
 *       itemHeight={200}
 *       enableVirtualization={true}
 *       onImageLoad={(imageId) => console.log(`图片 ${imageId} 加载完成`)}
 *       onImageError={(imageId, error) => console.error(`图片 ${imageId} 加载失败`, error)}
 *     />
 *   );
 * }
 * ```
 */

/**
 * 智能组件懒加载示例
 * 
 * ```tsx
 * import { SmartComponentLoader, ComponentConfigs } from '@/components/lazy';
 * 
 * function MyComponent() {
 *   return (
 *     <SmartComponentLoader
 *       config={ComponentConfigs.LotteryCard}
 *       props={{ roundId: '123' }}
 *       onLoad={() => console.log('组件加载完成')}
 *       onError={(error) => console.error('组件加载失败', error)}
 *     />
 *   );
 * }
 * ```
 */

/**
 * 路由懒加载示例
 * 
 * ```tsx
 * import { RouteLoader } from '@/components/lazy';
 * 
 * function AppLayout() {
 *   return (
 *     <RouteLoader priority="core" showStats={true}>
 *       <YourAppContent />
 *     </RouteLoader>
 *   );
 * }
 * ```
 */