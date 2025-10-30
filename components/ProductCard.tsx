import React, { memo, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  images: string[];
  marketPrice: number;
  totalShares: number;
  pricePerShare: number;
  category: string;
  stock: number;
  status: string;
  currentRound?: {
    id: string;
    roundNumber: number;
    totalShares: number;
    soldShares: number;
    status: string;
    participants: number;
    progress: number;
  } | null;
  createdAt: string;
}

interface ProductCardProps {
  product: Product;
  index?: number;
  onParticipate?: (productId: string) => void;
}

const ProductCard = memo<ProductCardProps>(({ product, index = 0, onParticipate }) => {
  const router = useRouter();

  // 使用useMemo优化计算，避免重复计算
  const progress = useMemo(() => {
    if (!product.currentRound) return 0;
    return product.currentRound.progress;
  }, [product.currentRound?.progress]);

  const remainingShares = useMemo(() => {
    if (!product.currentRound) return 0;
    return product.currentRound.totalShares - product.currentRound.soldShares;
  }, [product.currentRound?.totalShares, product.currentRound?.soldShares]);

  const handleProductClick = () => {
    router.push(`/product/${product.id}`);
  };

  const handleParticipateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onParticipate?.(product.id);
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
      onClick={handleProductClick}
    >
      {/* 商品图片 */}
      <div className="aspect-square bg-gray-100 relative">
        {product.images && product.images[0] ? (
          <Image 
            src={product.images[0]} 
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={index < 3} // 前3张图片优先加载
            quality={85}
            placeholder="empty"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* 状态标签 */}
        {product.status === 'active' && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            在售
          </div>
        )}
        
        {product.status === 'sold_out' && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            售罄
          </div>
        )}
      </div>

      {/* 商品信息 */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <span>类别: {product.category}</span>
          <span>库存: {product.stock}</span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-2xl font-bold text-red-600">
              ¥{product.marketPrice.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">
              单价: ¥{product.pricePerShare}/份额
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              总份额: {product.totalShares}
            </div>
          </div>
        </div>

        {/* 当前夺宝进度 */}
        {product.currentRound ? (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">
                第{product.currentRound.roundNumber}期
              </span>
              <span className="font-medium">
                {product.currentRound.soldShares}/{product.currentRound.totalShares}份额
              </span>
            </div>
            
            {/* 进度条 */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">进度: {progress}%</span>
              <span className="text-green-600 font-medium">
                剩余: {remainingShares}份额
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-4 text-center text-gray-500 text-sm">
            暂无进行中的夺宝
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <button
            onClick={handleParticipateClick}
            disabled={!product.currentRound || product.currentRound.status !== 'active'}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
          >
            {product.currentRound?.status === 'active' ? '立即参与' : '暂不可参与'}
          </button>
          
          <Link
            href={`/product/${product.id}`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            查看详情
          </Link>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;