'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeftIcon, FireIcon, ClockIcon, HeartIcon, ChatBubbleLeftIcon, ShareIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface ShowOffPost {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    vipLevel: number;
  };
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
  hotScore: number;
  createdAt: string;
}

interface ShowOffGalleryProps {
  posts: ShowOffPost[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  sort: 'latest' | 'hottest';
  onSortChange: (sort: 'latest' | 'hottest') => void;
}

const ShowOffGallery: React.FC<ShowOffGalleryProps> = ({
  posts,
  loading,
  hasMore,
  onLoadMore,
  sort,
  onSortChange
}) => {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [imageLoadingStates, setImageLoadingStates] = useState<{ [key: string]: boolean }>({});

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/show-off/posts/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'like' }),
      });

      const data = await response.json();
      
      if (data.success) {
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          if (data.data.isLiked) {
            newSet.add(postId);
          } else {
            newSet.delete(postId);
          }
          return newSet;
        });
      }
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Акнун';
    } else if (diffInHours < 24) {
      return `${diffInHours} соат пеш`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} рӯз пеш`;
    }
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString('tg-TJ')} сомонӣ`;
  };

  const handleImageLoad = (imageKey: string) => {
    setImageLoadingStates(prev => ({
      ...prev,
      [imageKey]: false
    }));
  };

  const handleImageLoadStart = (imageKey: string) => {
    setImageLoadingStates(prev => ({
      ...prev,
      [imageKey]: true
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/lottery" className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Ошкоркунии бурдборӣ</h1>
                <p className="text-sm text-gray-500">Бурдборӣи худро мубодила кунед</p>
              </div>
            </div>
            <Link href="/show-off/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Ошкор кунед
            </Link>
          </div>
        </div>

        {/* Sort Tabs */}
        <div className="px-4 pb-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onSortChange('latest')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                sort === 'latest'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ClockIcon className="w-4 h-4" />
              <span>Охиринҳо</span>
            </button>
            <button
              onClick={() => onSortChange('hottest')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                sort === 'hottest'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FireIcon className="w-4 h-4" />
              <span>Машҳуртарин</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {posts.length === 0 && !loading ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ҳоло ошкоркуние нест</h3>
            <p className="text-gray-500 mb-6">Бо интизорӣ барои ошкоркунии аввалин!</p>
            <Link href="/lottery" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              Ба бурдборӣ равед
            </Link>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="break-inside-avoid bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                {/* User Info */}
                <div className="p-4 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                      {post.user.avatar ? (
                        <Image
                          src={post.user.avatar}
                          alt={post.user.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        post.user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{post.user.name}</p>
                        {post.user.vipLevel > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                            ⭐Lv.{post.user.vipLevel}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Images */}
                <div className="px-4 pb-3">
                  <div className="grid grid-cols-2 gap-2">
                    {post.images.slice(0, 4).map((image, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                        {imageLoadingStates[`${post.id}-${index}`] && (
                          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <Image
                          src={image}
                          alt={`Ошкоркунии ${post.user.name}`}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          onLoadStart={() => handleImageLoadStart(`${post.id}-${index}`)}
                          onLoad={() => handleImageLoad(`${post.id}-${index}`)}
                          onError={(e) => {
                            console.error('Image load error:', image);
                            setImageLoadingStates(prev => ({
                              ...prev,
                              [`${post.id}-${index}`]: false
                            }));
                          }}
                        />
                        {post.images.length > 4 && index === 3 && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <span className="text-white text-sm font-medium">+{post.images.length - 4}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Product Info */}
                <div className="px-4 pb-3">
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 border-l-4 border-green-400">
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{post.product.name}</h3>
                    <p className="text-xs text-gray-600 mt-1">
                      Бурди {post.product.winningInfo.roundNumber} • Рақами {post.product.winningInfo.winningNumber}
                    </p>
                    <p className="text-xs text-gray-500">{formatPrice(post.product.marketPrice)}</p>
                  </div>
                </div>

                {/* Content */}
                {post.content && (
                  <div className="px-4 pb-3">
                    <p className="text-sm text-gray-700 line-clamp-3">{post.content}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="px-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center space-x-1 transition-colors ${
                          likedPosts.has(post.id)
                            ? 'text-red-500'
                            : 'text-gray-500 hover:text-red-500'
                        }`}
                      >
                        {likedPosts.has(post.id) ? (
                          <HeartSolidIcon className="w-5 h-5" />
                        ) : (
                          <HeartIcon className="w-5 h-5" />
                        )}
                        <span className="text-sm">{post.stats.likeCount}</span>
                      </button>
                      <Link
                        href={`/show-off/${post.id}`}
                        className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
                      >
                        <ChatBubbleLeftIcon className="w-5 h-5" />
                        <span className="text-sm">{post.stats.commentCount}</span>
                      </Link>
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-green-500 transition-colors">
                        <ShareIcon className="w-5 h-5" />
                        <span className="text-sm">{post.stats.shareCount}</span>
                      </button>
                    </div>
                    <div className="text-xs text-gray-400">
                      {post.stats.viewCount} дидан
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={onLoadMore}
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
};

export default ShowOffGallery;
