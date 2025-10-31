'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Inline SVG Icons
const ChevronLeftIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ClockIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircleIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const EyeIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const HeartIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);

const ChatBubbleLeftIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
  </svg>
);

interface ShowOffPost {
  id: string;
  content: string;
  images: string[];
  product: {
    id: string;
    name: string;
    images: string[];
    marketPrice: number;
    winningInfo: {
      roundNumber: number;
      winningNumber: number;
      drawTime: string;
    };
  };
  stats: {
    likeCount: number;
    commentCount: number;
    shareCount: number;
    viewCount: number;
  };
  status: 'pending' | 'approved' | 'rejected';
  review: {
    reviewedAt?: string;
    rejectReason?: string;
    coinRewarded: boolean;
    coinRewardedAt?: string;
  };
  createdAt: string;
}

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

export default function MyShowOffPage() {
  const [posts, setPosts] = useState<ShowOffPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 加载我的晒单
  const loadMyShowOffPosts = async (pageNum: number = 1, append: boolean = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const statusParam = filter === 'all' ? '' : `&status=${filter}`;
      const response = await fetch(
        `/api/user/show-off/posts?page=${pageNum}&limit=10${statusParam}`
      );

      const data = await response.json();
      
      if (data.success) {
        if (append) {
          setPosts(prev => [...prev, ...data.data.posts]);
        } else {
          setPosts(data.data.posts);
        }
        setHasMore(data.data.pagination.hasMore);
        setPage(pageNum);
      } else {
        console.error('获取我的晒单失败:', data.error);
      }
    } catch (error) {
      console.error('加载我的晒单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载和筛选变化时重载
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setPosts([]);
    loadMyShowOffPosts(1, false);
  }, [filter]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      loadMyShowOffPosts(nextPage, true);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tg-TJ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString('tg-TJ')} сомонӣ`;
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          icon: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
          label: 'Ичозатдодашуда',
          color: 'text-green-700 bg-green-50 border-green-200'
        };
      case 'rejected':
        return {
          icon: <XCircleIcon className="w-5 h-5 text-red-500" />,
          label: 'Радшуда',
          color: 'text-red-700 bg-red-50 border-red-200'
        };
      case 'pending':
      default:
        return {
          icon: <ClockIcon className="w-5 h-5 text-yellow-500" />,
          label: 'Дар интизорӣ',
          color: 'text-yellow-700 bg-yellow-50 border-yellow-200'
        };
    }
  };

  const filterOptions = [
    { key: 'all' as FilterType, label: 'Ҳама', count: posts.length },
    { key: 'approved' as FilterType, label: 'Ичозатдодашуда', count: posts.filter(p => p.status === 'approved').length },
    { key: 'pending' as FilterType, label: 'Дар интизорӣ', count: posts.filter(p => p.status === 'pending').length },
    { key: 'rejected' as FilterType, label: 'Радшуда', count: posts.filter(p => p.status === 'rejected').length }
  ];

  const filteredPosts = filter === 'all' ? posts : posts.filter(post => post.status === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center space-x-3">
            <Link href="/profile" className="p-2 -ml-2 rounded-full hover:bg-gray-100">
              <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Ошкоркунии ман</h1>
              <p className="text-sm text-gray-500">Ошкоркунии худро идора кунед</p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="px-4 pb-3">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-3 text-center border">
              <div className="text-2xl font-bold text-blue-600">
                {posts.filter(p => p.status === 'approved').length}
              </div>
              <div className="text-xs text-gray-600">Ичозатдодашуда</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border">
              <div className="text-2xl font-bold text-yellow-600">
                {posts.filter(p => p.status === 'pending').length}
              </div>
              <div className="text-xs text-gray-600">Дар интизорӣ</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border">
              <div className="text-2xl font-bold text-red-600">
                {posts.filter(p => p.status === 'rejected').length}
              </div>
              <div className="text-xs text-gray-600">Радшуда</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 pb-3">
          <div className="flex bg-gray-100 rounded-lg p-1 overflow-x-auto">
            {filterOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setFilter(option.key)}
                className={`flex-shrink-0 flex items-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === option.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{option.label}</span>
                {option.key === 'all' ? (
                  <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                    {posts.length}
                  </span>
                ) : (
                  <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                    {option.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {loading && posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Боркунии маълумот...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'Ҳоло ошкоркуние нест' : `Ошкоркунии ${filterOptions.find(o => o.key === filter)?.label} нест`}
            </h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all' 
                ? 'Ба бурдборӣ равед ва агар бурд кардед, ошкор кунед!'
                : 'Шумо ҳоло ошкоркунии дар ин ҳолат надоред'
              }
            </p>
            <Link 
              href="/lottery" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Ба бурдборӣ равед
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => {
              const statusConfig = getStatusConfig(post.status);
              
              return (
                <div key={post.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  {/* Header */}
                  <div className="p-4 pb-3 border-b">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {statusConfig.icon}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                          {post.review.coinRewarded && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              +3.0 монета
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                      </div>
                      <Link
                        href={`/show-off/${post.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Дида мешавад
                      </Link>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4 pb-3">
                    <div className="flex space-x-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={post.product.images[0] || '/api/placeholder/64/64'}
                          alt={post.product.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 line-clamp-2 text-sm mb-1">
                          {post.product.name}
                        </h3>
                        <p className="text-xs text-gray-600">
                          Бурди {post.product.winningInfo.roundNumber} • Рақами {post.product.winningInfo.winningNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatPrice(post.product.marketPrice)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Images */}
                  {post.images.length > 0 && (
                    <div className="px-4 pb-3">
                      <div className="grid grid-cols-3 gap-2">
                        {post.images.slice(0, 3).map((image, index) => (
                          <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={image}
                              alt={`Ошкоркунӣ ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                        {post.images.length > 3 && (
                          <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
                            <span className="text-xs text-gray-600">+{post.images.length - 3}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  {post.content && (
                    <div className="px-4 pb-3">
                      <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="px-4 pb-4">
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <HeartIcon className="w-4 h-4" />
                        <span>{post.stats.likeCount}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ChatBubbleLeftIcon className="w-4 h-4" />
                        <span>{post.stats.commentCount}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <EyeIcon className="w-4 h-4" />
                        <span>{post.stats.viewCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rejection Reason */}
                  {post.status === 'rejected' && post.review.rejectReason && (
                    <div className="px-4 pb-4">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-700">
                          <span className="font-medium">Сабаби радкунӣ:</span> {post.review.rejectReason}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Reward Info */}
                  {post.review.coinRewarded && post.review.coinRewardedAt && (
                    <div className="px-4 pb-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-700">
                          <span className="font-medium">Бахшиш гирифта шуд:</span> 3.0 монета дар {formatDate(post.review.coinRewardedAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {hasMore && filteredPosts.length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Боркунӣ...
                </>
              ) : (
                'Бисёртар боркунед'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
