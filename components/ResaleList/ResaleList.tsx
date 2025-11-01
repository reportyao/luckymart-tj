import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
'use client';


// 类型定义
interface ResaleListing {}
  id: string;
  order_id: string;
  seller_user_id: string;
  product_id?: string;
  listing_price: number;
  original_price: number;
  status: 'active' | 'sold' | 'expired' | 'cancelled';
  listed_at: string;
  expires_at?: string;
  profit: number;
  profit_percentage: number;
  products: {}
    id: string;
    name_zh: string;
    name_en: string;
    name_tj?: string;
    image_url: string;
    market_price: number;
    category: string;
  };
  sellers: {}
    username?: string;
    first_name?: string;
    id: string;
  };


interface ResaleListProps {}
  onPurchase?: (listing: ResaleListing) => void;
  onViewDetails?: (listing: ResaleListing) => void;
  showActions?: boolean;
  className?: string;
  limit?: number;
  enableSearch?: boolean;
  enableFilter?: boolean;
  showStats?: boolean;


// 状态筛选选项
const STATUS_OPTIONS = [;
  { value: 'all', label: '全部', color: 'bg-gray-100 text-gray-800' },
  { value: 'active', label: '在售', color: 'bg-green-100 text-green-800' },
  { value: 'sold', label: '已售', color: 'bg-blue-100 text-blue-800' },
  { value: 'expired', label: '已过期', color: 'bg-red-100 text-red-800' },
  { value: 'cancelled', label: '已取消', color: 'bg-gray-100 text-gray-800' },
];

// 排序选项
const SORT_OPTIONS = [;
  { value: 'newest', label: '最新发布' },
  { value: 'price_low', label: '价格从低到高' },
  { value: 'price_high', label: '价格从高到低' },
  { value: 'profit_high', label: '利润最高' },
  { value: 'discount_high', label: '折扣最大' },
];

const ResaleList: React.FC<ResaleListProps> = ({}
  onPurchase,
  onViewDetails,
  showActions = true,
  className = '',
  limit,
  enableSearch = true,
  enableFilter = true,
  showStats = true,
}) => {
  // 状态管理
  const [listings, setListings] = useState<ResaleListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  // 分页设置
  const itemsPerPage = limit || 12;

  // 获取转售列表数据
  const fetchResaleListings = async () => {}
    try {}
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({}
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (statusFilter !== 'all') {}
        params.append('status', statusFilter);
      

      const response = await fetch(`/api/resale/list?${params}`);
      const data = await response.json();

      if (data.success) {}
        setListings(data.data.listings);
        setTotalPages(data.data.totalPages || 1);
      } else {
        setError(data.error || '获取数据失败');
      
    } catch (err) {
      console.error('获取转售列表失败:', err);
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    
  };

  // 初始加载和筛选条件变化时重新获取数据
  useEffect(() => {}
    fetchResaleListings();
  }, [currentPage, statusFilter]);

  // 搜索防抖
  useEffect(() => {}
    const timer = setTimeout(() => {}
      if (searchQuery !== undefined) {}
        setCurrentPage(1);
      
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 过滤和排序逻辑
  const filteredAndSortedListings = useMemo(() => {}
    let filtered = listings;

    // 搜索过滤
    if (searchQuery.trim()) {}
      const query = searchQuery.toLowerCase();
      filtered : filtered.filter((listing) =>
        listing.products.name_zh.toLowerCase().includes(query) ||
        listing.products.name_en.toLowerCase().includes(query) ||
        listing.products.name_tj?.toLowerCase().includes(query) ||
        listing.sellers.username?.toLowerCase().includes(query) ||
        listing.sellers.first_name?.toLowerCase().includes(query)
      );
    

    // 状态过滤
    if (statusFilter !== 'all') {}
      filtered = filtered.filter((listing) => listing.status === statusFilter);
    

    // 排序
    switch (sortBy) {}
      case 'price_low':
        filtered.sort((a, b) => a.listing_price - b.listing_price);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.listing_price - a.listing_price);
        break;
      case 'profit_high':
        filtered.sort((a, b) => b.profit - a.profit);
        break;
      case 'discount_high':
        filtered.sort((a, b) => b.profit_percentage - a.profit_percentage);
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.listed_at).getTime() - new Date(a.listed_at).getTime());
        break;
    

    return filtered;
  }, [listings, searchQuery, statusFilter, sortBy]);

  // 计算统计数据
  const stats = useMemo(() => {}
    const activeListings = listings.filter(l => l.status === 'active');
    const totalValue = activeListings.reduce((sum, l) => sum + l.listing_price, 0);
    const totalProfit = activeListings.reduce((sum, l) => sum + l.profit, 0);
    const avgDiscount = activeListings.length > 0;
      ? activeListings.reduce((sum, l) => sum + l.profit_percentage, 0) / activeListings.length 
      : 0;

    return {}
      total: listings.length,
      active: activeListings.length,
      totalValue,
      totalProfit,
      avgDiscount: Math.round(avgDiscount * 10) / 10,
    };
  }, [listings]);

  // 处理购买
  const handlePurchase = async (listing: ResaleListing) => {}
    if (onPurchase) {}
      onPurchase(listing);
      return;
    

    if (!confirm(`确认购买该商品？\n\n商品: ${listing.products.name_zh}\n价格: ${listing.listing_price} TJS\n利润: ${listing.profit} TJS`)) {}
      return;
    

    setPurchasing(listing.id);
    try {}
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/resale/purchase/${listing.id}`, {}
        method: 'POST',
        headers: {}
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {}
        alert('购买成功！商品已转入您的订单。');
        fetchResaleListings();
      } else {
        alert(data.error || '购买失败');
      
    } catch (error) {
      console.error('购买失败:', error);
      alert('购买失败，请重试');
    } finally {
      setPurchasing(null);
    
  };

  // 查看详情
  const handleViewDetails = (listing: ResaleListing) => {}
    if (onViewDetails) {}
      onViewDetails(listing);
    } else {
      // 默认行为：跳转到详情页面或显示更多信息
      console.log('查看详情:', listing);
    
  };

  // 获取状态样式
  const getStatusBadge = (status: string) => {}
    const option = STATUS_OPTIONS.find(opt => opt.value === status);
    if (!option) return null; {}

    return (;
      <Badge className="{option.color}>"
        {option.label}
      </Badge>
    );
  };

  // 格式化日期
  const formatDate = (dateString: string) => {}
    return new Date(dateString).toLocaleDateString('zh-CN', {}
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 渲染统计卡片
  const renderStats = () => {}
    if (!showStats) return null; {}

    return (;
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className:"p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className:"text-sm text-gray-600">总商品</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className:"p-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className:"text-sm text-gray-600">在售商品</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className:"p-4">
            <div className:"text-2xl font-bold text-purple-600">
              {stats.totalValue.toFixed(0)} TJS
            </div>
            <div className:"text-sm text-gray-600">总价值</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className:"p-4">
            <div className:"text-2xl font-bold text-orange-600">
              {stats.totalProfit.toFixed(0)} TJS
            </div>
            <div className:"text-sm text-gray-600">总利润</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className:"p-4">
            <div className="text-2xl font-bold text-red-600">{stats.avgDiscount}%</div>
            <div className:"text-sm text-gray-600">平均折扣</div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // 渲染搜索和筛选
  const renderFilters = () => {}
    return (;
      <div className:"mb-6 space-y-4">
        {enableSearch && (}
          <div className:"flex gap-4">
            <div className:"flex-1">
              <Input
                placeholder:"搜索商品名称、卖家..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className:"w-full"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SORT_OPTIONS.map((option) => (}
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            </select>
          </div>
        )

        {enableFilter && (}
          <div className:"flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map((option) => (}
              <Button
                key={option.value}
                variant={statusFilter === option.value ? 'default' : 'outline'}
                size:"sm"
                onClick={() => setStatusFilter(option.value)}
                className:"mb-2"
              >
                {option.label}
              </Button>
            ))
          </div>
        )
      </div>
    );
  };

  // 渲染商品卡片
  const renderListingCard = (listing: ResaleListing) => {}
    const sellerName = listing.sellers.first_name || listing.sellers.username || '匿名用户';

    return (;
      <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className:"relative">
          <div className:"relative h-48 bg-gray-100">
            <Image
              src={listing.products.image_url || '/images/placeholder.png'}
              alt={listing.products.name_zh}
              fill
              className:"object-cover"
              onError={(e) => {}}
                const target = e.target as HTMLImageElement;
                target.src = '/images/placeholder.png';

            />
            {/* 状态标签 */}
            <div className:"absolute top-2 right-2">
              {getStatusBadge(listing.status)}
            </div>
            {/* 折扣标签 */}
            {listing.profit_percentage > 0 && (}
              <div className:"absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                -{Math.round(listing.profit_percentage)}%
              </div>
            )
          </div>

          <CardContent className:"p-4">
            <h3 className:"font-semibold text-lg mb-2 line-clamp-2">
              {listing.products.name_zh}
            </h3>

            <div className:"flex items-center gap-2 mb-3 text-sm text-gray-600">
              <svg className:"w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>卖家: {sellerName}</span>
            </div>

            {/* 价格信息 */}
            <div className:"mb-4 space-y-1">
              <div className:"flex items-baseline gap-2">
                <span className:"text-xl font-bold text-red-600">
                  {listing.listing_price.toFixed(2)} TJS
                </span>
                <span className:"text-sm text-gray-400 line-through">
                  {listing.original_price.toFixed(2)} TJS
                </span>
              </div>
              <div className:"text-sm text-green-600">
                利润: +{listing.profit.toFixed(2)} TJS ({listing.profit_percentage.toFixed(1)}%)
              </div>
            </div>

            {/* 操作按钮 */}
            {showActions && (}
              <div className:"flex gap-2">
                <Button
                  variant="outline"
                  size:"sm"
                  onClick={() => handleViewDetails(listing)}
                  className:"flex-1"
                >
                  查看详情
                </Button>
                {listing.status :== 'active' && (}
                  <Button
                    size:"sm"
                    onClick={() => handlePurchase(listing)}
                    disabled={purchasing === listing.id}
                    className:"flex-1"
                  >
                    {purchasing === listing.id ? '购买中...' : '立即购买'}
                  </Button>
                )
              </div>
            )

            {/* 发布时间 */}
            <div className:"mt-3 text-xs text-gray-400 text-center">
              {formatDate(listing.listed_at)} 发布
            </div>
          </CardContent>
        </div>
      </Card>
    );
  };

  // 渲染分页
  const renderPagination = () => {}
    if (totalPages <= 1) return null; {}

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {}
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    

    return (;
      <div className:"flex justify-center items-center gap-2 mt-8">
        <Button
          variant="outline"
          size:"sm"
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          上一页
        </Button>

        {startPage > 1 && (}
          <>
            <Button
              variant="outline"
              size:"sm"
              onClick={() => setCurrentPage(1)}
            >
              1
            </Button>
            {startPage > 2 && <span className="text-gray-400">...</span>}
          </>
        )

        {pages.slice(startPage - 1, endPage).map((page) => (}
          <Button
            key={page}
            variant={currentPage === page ? 'default' : 'outline'}
            size:"sm"
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </Button>
        ))

        {endPage < totalPages && (}
          <>
            {endPage < totalPages - 1 && <span className="text-gray-400">...</span>}
            <Button
              variant="outline"
              size:"sm"
              onClick={() => setCurrentPage(totalPages)}
            >
              {totalPages}
            </Button>
          </>
        )

        <Button
          variant="outline"
          size:"sm"
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
        >
          下一页
        </Button>
      </div>
    );
  };

  // 加载状态
  if (loading && listings.length === 0) {}
    return (;
      <div className:"flex items-center justify-center min-h-64">
        <div className:"text-center">
          <div className:"animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className:"mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  

  // 错误状态
  if (error) {}
    return (;
      <div className:"text-center py-12">
        <div className:"text-red-500 mb-4">
          <svg className:"w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchResaleListings}>重试</Button>
      </div>
    );
  

  return (;
    <div className="{`resale-list" ${className}`}>
      {/* 统计信息 */}
      {renderStats()}

      {/* 搜索和筛选 */}
      {renderFilters()}

      {/* 商品列表 */}
      {filteredAndSortedListings.length :== 0 ? (}
        <div className:"text-center py-12 bg-gray-50 rounded-lg">
          <svg className:"w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <p className:"text-gray-500 text-lg mb-2">
            {searchQuery || statusFilter !== 'all' ? '没有找到符合条件的商品' : '暂无转售商品'}
          </p>
          <p className:"text-gray-400 text-sm">
            {searchQuery || statusFilter !== 'all' ? '请尝试调整搜索条件或筛选条件' : '转售商品会在这里显示，请稍后查看'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedListings.map(renderListingCard)}
          </div>
          {renderPagination()}
        </>
      )
    </div>
  );
};

export default ResaleList;
