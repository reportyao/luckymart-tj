import React from 'react';
import VirtualScroller, { VirtualScrollerItem, useVirtualList } from './VirtualScroller';
import LazyImage from './LazyImage';
import { cn } from '@/lib/utils';

export interface VirtualListProps<T extends VirtualScrollerItem> {
  items: T[];
  itemRenderer: (item: T, index: number) => React.ReactNode;
  containerHeight?: number;
  itemHeight?: number | ((item: T) => number);
  className?: string;
  loading?: boolean;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  overscan?: number;
  getItemKey?: (item: T, index: number) => string | number;
  estimateItemHeight?: (item: T) => number;
}

// 基础虚拟列表
export function VirtualList<T extends VirtualScrollerItem>({
  items,
  itemRenderer,
  containerHeight = 400,
  itemHeight = 100,
  className,
  loading,
  onEndReached,
  onEndReachedThreshold = 0.8,
  overscan = 5,
  getItemKey,
  estimateItemHeight
}: VirtualListProps<T>) {
  return (
    <div className={cn('w-full', className)}>
      {loading ? (
        // 加载状态显示骨架屏
        <div className="luckymart-spacing-md">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-24 bg-gray-200 dark:bg-gray-700 luckymart-rounded luckymart-animation-pulse" />
          ))}
        </div>
      ) : (
        <VirtualScroller
          items={items}
          containerHeight={containerHeight}
          itemHeight={itemHeight}
          onEndReached={onEndReached}
          onEndReachedThreshold={onEndReachedThreshold}
          overscan={overscan}
          getItemKey={getItemKey}
          estimateItemHeight={estimateItemHeight}
          className="w-full"
        >
          {itemRenderer}
        </VirtualScroller>
      )}
    </div>
  );
}

// 产品列表虚拟组件
export interface ProductItem extends VirtualScrollerItem {
  id: string | number;
  name: string;
  price: number;
  image: string;
  rating?: number;
  originalPrice?: number;
  discount?: number;
  tags?: string[];
  status?: 'available' | 'out_of_stock' | 'limited';
  brand?: string;
  category?: string;
}

export const VirtualProductList: React.FC<{
  products: ProductItem[];
  containerHeight?: number;
  onProductClick?: (product: ProductItem) => void;
  onAddToCart?: (product: ProductItem) => void;
  className?: string;
}> = ({ 
  products, 
  containerHeight = 600,
  onProductClick,
  onAddToCart,
  className 
}) => {
  const productRenderer = (product: ProductItem, index: number) => (
    <VirtualProductCard 
      product={product} 
      onClick={() => onProductClick?.(product)}
      onAddToCart={() => onAddToCart?.(product)}
    />
  );

  return (
    <VirtualList
      items={products}
      itemRenderer={productRenderer}
      containerHeight={containerHeight}
      itemHeight={160}
      getItemKey={(item) => item.id}
      className={className}
    />
  );
};

// 产品卡片组件
const VirtualProductCard: React.FC<{
  product: ProductItem;
  onClick?: () => void;
  onAddToCart?: () => void;
}> = ({ product, onClick, onAddToCart }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'out_of_stock': return 'text-red-600 bg-red-50';
      case 'limited': return 'text-orange-600 bg-orange-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'out_of_stock': return '已售完';
      case 'limited': return '限量';
      default: return '现货';
    }
  };

  return (
    <div 
      className="luckymart-layout-flex luckymart-padding-md border-b luckymart-border-light dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* 产品图片 */}
      <div className="w-20 h-20 flex-shrink-0 mr-4">
        <LazyImage
          src={product.image}
          alt={product.name}
          placeholder="/images/placeholder.png"
          className="w-full h-full luckymart-rounded object-cover"
          aspectRatio={1}
        />
      </div>

      {/* 产品信息 */}
      <div className="flex-1 min-w-0">
        <div className="luckymart-layout-flex justify-between items-start mb-2">
          <h3 className="luckymart-text-sm luckymart-font-medium text-gray-900 dark:text-gray-100 truncate pr-2">
            {product.name}
          </h3>
          {product.status && (
            <span className={cn(
              'px-2 py-1 text-xs rounded-full flex-shrink-0',
              getStatusColor(product.status)
            )}>
              {getStatusText(product.status)}
            </span>
          )}
        </div>

        {/* 价格信息 */}
        <div className="luckymart-layout-flex luckymart-layout-center mb-2">
          <span className="luckymart-text-lg luckymart-font-bold text-red-600">
            ¥{product.price.toFixed(2)}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="luckymart-text-sm luckymart-text-secondary line-through ml-2">
              ¥{product.originalPrice.toFixed(2)}
            </span>
          )}
          {product.discount && product.discount > 0 && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 luckymart-rounded ml-2">
              -{product.discount}%
            </span>
          )}
        </div>

        {/* 评分和标签 */}
        <div className="luckymart-layout-flex luckymart-layout-center justify-between">
          <div className="luckymart-layout-flex luckymart-layout-center">
            {product.rating && (
              <div className="luckymart-layout-flex luckymart-layout-center mr-3">
                <span className="text-yellow-400 mr-1">★</span>
                <span className="luckymart-text-sm text-gray-600">{product.rating}</span>
              </div>
            )}
            {product.tags && product.tags.length > 0 && (
              <div className="luckymart-layout-flex flex-wrap gap-1">
                {product.tags.slice(0, 2).map((tag, index) => (
                  <span 
                    key={index}
                    className="text-xs bg-blue-100 text-blue-600 px-2 py-1 luckymart-rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="luckymart-layout-flex flex-col justify-center ml-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart?.();
          }}
          disabled={product.status === 'out_of_stock'}
          className={cn(
            'px-3 py-2 text-sm rounded transition-colors',
            product.status === 'out_of_stock' 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          )}
        >
          {product.status === 'out_of_stock' ? '已售完' : '加入购物车'}
        </button>
      </div>
    </div>
  );
};

// 用户列表虚拟组件
export interface UserItem extends VirtualScrollerItem {
  id: string | number;
  name: string;
  avatar: string;
  email?: string;
  status: 'online' | 'offline' | 'away';
  role?: string;
  lastActive?: Date;
  level?: number;
  points?: number;
}

export const VirtualUserList: React.FC<{
  users: UserItem[];
  containerHeight?: number;
  onUserClick?: (user: UserItem) => void;
  className?: string;
}> = ({ 
  users, 
  containerHeight = 500,
  onUserClick,
  className 
}) => {
  const userRenderer = (user: UserItem, index: number) => (
    <VirtualUserCard 
      user={user} 
      onClick={() => onUserClick?.(user)}
    />
  );

  return (
    <VirtualList
      items={users}
      itemRenderer={userRenderer}
      containerHeight={containerHeight}
      itemHeight={80}
      getItemKey={(item) => item.id}
      className={className}
    />
  );
};

// 用户卡片组件
const VirtualUserCard: React.FC<{
  user: UserItem;
  onClick?: () => void;
}> = ({ user, onClick }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-400';
      case 'away': return 'bg-yellow-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return '在线';
      case 'away': return '离开';
      default: return '离线';
    }
  };

  return (
    <div 
      className="luckymart-layout-flex luckymart-layout-center luckymart-padding-md border-b luckymart-border-light dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* 头像 */}
      <div className="w-12 h-12 relative mr-4">
        <LazyImage
          src={user.avatar}
          alt={user.name}
          placeholder="/images/avatar-placeholder.png"
          className="w-full h-full rounded-full object-cover"
          aspectRatio={1}
        />
        <div className={cn(
          'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white',
          getStatusColor(user.status)
        )} />
      </div>

      {/* 用户信息 */}
      <div className="flex-1 min-w-0">
        <div className="luckymart-layout-flex luckymart-layout-center justify-between mb-1">
          <h3 className="luckymart-text-sm luckymart-font-medium text-gray-900 dark:text-gray-100 truncate">
            {user.name}
          </h3>
          <span className={cn(
            'px-2 py-1 text-xs rounded-full',
            user.status === 'online' ? 'bg-green-100 text-green-600' :
            user.status === 'away' ? 'bg-yellow-100 text-yellow-600' :
            'bg-gray-100 text-gray-600'
          )}>
            {getStatusText(user.status)}
          </span>
        </div>

        <div className="luckymart-layout-flex luckymart-layout-center justify-between luckymart-text-sm text-gray-600 dark:text-gray-400">
          <div className="luckymart-layout-flex luckymart-layout-center">
            {user.email && <span className="truncate max-w-32">{user.email}</span>}
            {user.role && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-600 luckymart-rounded text-xs">{user.role}</span>}
          </div>
          
          {user.level && user.points && (
            <div className="luckymart-layout-flex luckymart-layout-center">
              <span className="text-purple-600">Lv.{user.level}</span>
              <span className="ml-2 text-yellow-600">{user.points}积分</span>
            </div>
          )}
        </div>

        {user.lastActive && (
          <div className="text-xs luckymart-text-secondary mt-1">
            最后活跃: {user.lastActive.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

// 使用虚拟列表的Hook
export const useVirtualListWithScroll = <T extends VirtualScrollerItem>(
  items: T[],
  options: {
    containerHeight?: number;
    itemHeight?: number | ((item: T) => number);
    overscan?: number;
  } = {}
) => {
  const {
    containerHeight = 400,
    itemHeight = 100,
    overscan = 5
  } = options;

  const [scrollTop, setScrollTop] = React.useState(0);
  const [containerHeightState, setContainerHeight] = React.useState(containerHeight);

  const virtualList = useVirtualList({
    items,
    itemHeight,
    containerHeight: containerHeightState,
    overscan
  });

  return {
    ...virtualList,
    setScrollTop,
    setContainerHeight
  };
};

export default VirtualList;