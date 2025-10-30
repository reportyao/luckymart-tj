import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ProductCard from './ProductCard';

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

interface ProductListProps {
  initialProducts?: Product[];
  category?: string;
  status?: string;
  language?: string;
}

const ITEMS_PER_PAGE = 20;
const LOAD_MORE_THRESHOLD = 5;

const ProductList: React.FC<ProductListProps> = ({
  initialProducts = [],
  category = 'all',
  status = 'active',
  language = 'zh'
}) => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 优化的数据获取函数
  const fetchProducts = useCallback(async (page: number, append = false) => {
    try {
      setError(null);
      
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        category,
        status,
        language
      });

      const response = await fetch(`/api/products/list?${params}`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const newProducts = result.data.products;
        const pagination = result.data.pagination;
        
        setProducts(prev => append ? [...prev, ...newProducts] : newProducts);
        setHasMore(page < pagination.totalPages);
        setCurrentPage(page);
        
        // 记录性能指标
        if (result.responseTime) {
          console.log(`Product list page ${page} loaded in ${result.responseTime}ms`);
        }
      } else {
        throw new Error(result.error || '获取商品列表失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '网络请求失败';
      setError(errorMessage);
      console.error('获取商品列表失败:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [category, status, language]);

  // 初始化加载
  useEffect(() => {
    fetchProducts(1, false);
  }, [fetchProducts]);

  // 无限滚动加载
  useEffect(() => {
    if (!hasMore || loadingMore) return;

    const currentRef = loadMoreRef.current;
    if (!currentRef) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !loadingMore && hasMore) {
          fetchProducts(currentPage + 1, true);
        }
      },
      {
        rootMargin: '100px',
      }
    );

    observerRef.current.observe(currentRef);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [fetchProducts, currentPage, loadingMore, hasMore]);

  // 下拉刷新
  const handleRefresh = useCallback(() => {
    setCurrentPage(1);
    setHasMore(true);
    fetchProducts(1, false);
  }, [fetchProducts]);

  // 参与夺宝
  const handleParticipate = useCallback(async (productId: string) => {
    try {
      // 这里可以添加参与夺宝的逻辑
      router.push(`/product/${productId}?action=participate`);
    } catch (error) {
      console.error('参与夺宝失败:', error);
    }
  }, [router]);

  // 筛选选项
  const filterOptions = useMemo(() => ({
    categories: ['all', '电子产品', '服装', '家居', '美食', '其他'],
    statuses: ['all', 'active', 'sold_out', 'ended']
  }), []);

  // 性能优化的过滤函数
  const handleCategoryChange = useCallback((newCategory: string) => {
    if (newCategory === category) return;
    router.push(`/?category=${newCategory}&status=${status}`, { scroll: false });
  }, [category, status, router]);

  const handleStatusChange = useCallback((newStatus: string) => {
    if (newStatus === status) return;
    router.push(`/?category=${category}&status=${newStatus}`, { scroll: false });
  }, [category, status, router]);

  // 加载状态组件
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      <span className="ml-2 text-gray-600">加载中...</span>
    </div>
  );

  // 空状态组件
  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="text-gray-400 text-6xl mb-4">📦</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">暂无商品</h3>
      <p className="text-gray-600 mb-4">当前筛选条件下没有找到商品</p>
      <button
        onClick={handleRefresh}
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
      >
        刷新试试
      </button>
    </div>
  );

  // 错误状态组件
  const ErrorState = () => (
    <div className="text-center py-12">
      <div className="text-red-500 text-6xl mb-4">❌</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
      <p className="text-gray-600 mb-4">{error}</p>
      <button
        onClick={() => fetchProducts(1, false)}
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
      >
        重试
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 筛选器 */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          {/* 类别筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              商品类别
            </label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {filterOptions.categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? '全部类别' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* 状态筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              商品状态
            </label>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {filterOptions.statuses.map((stat) => (
                <option key={stat} value={stat}>
                  {stat === 'all' ? '全部状态' : 
                   stat === 'active' ? '在售' :
                   stat === 'sold_out' ? '售罄' : '已结束'}
                </option>
              ))}
            </select>
          </div>

          {/* 刷新按钮 */}
          <div className="flex items-end">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm transition-colors"
            >
              {loading ? '刷新中...' : '刷新'}
            </button>
          </div>
        </div>
      </div>

      {/* 商品列表 */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorState />
      ) : products.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                onParticipate={handleParticipate}
              />
            ))}
          </div>

          {/* 加载更多指示器 */}
          {hasMore && (
            <div ref={loadMoreRef} className="text-center py-8">
              {loadingMore ? (
                <LoadingSpinner />
              ) : (
                <div className="text-gray-500">
                  滚动加载更多...
                </div>
              )}
            </div>
          )}

          {/* 没有更多数据 */}
          {!hasMore && products.length > 0 && (
            <div className="text-center py-8 text-gray-500">
              没有更多商品了
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductList;