'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Inline SVG Icons
const HeartIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);

const HeartSolidIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
  </svg>
);

interface ShowOffPost {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    vipLevel: number;
  };
  images: string[];
  product: {
    id: string;
    name: string;
    images: string[];
  };
  stats: {
    likeCount: number;
    commentCount: number;
  };
  hotScore: number;
  createdAt: string;
}

interface ShowOffCarouselProps {
  className?: string;
}

const ShowOffCarousel: React.FC<ShowOffCarouselProps> = ({ className = '' }) => {
  const [posts, setPosts] = useState<ShowOffPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 加载精选晒单
  useEffect(() => {
    const loadFeaturedPosts = async () => {
      try {
        const response = await fetch('/api/show-off/posts?sort=hottest&limit=5');
        const data = await response.json();
        
        if (data.success) {
          setPosts(data.data.posts);
        }
      } catch (error) {
        console.error('加载精选晒单失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedPosts();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Акнун';
    } else if (diffInHours < 24) {
      return `${diffInHours}соат`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}рӯз`;
    }
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="flex space-x-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex-1">
                  <div className="w-full aspect-square bg-gray-200 rounded-lg mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <div className={`${className}`}>
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🎉</span>
            <h3 className="text-lg font-semibold text-gray-900">Ошкоркунии бурд - Барои дидани бахшиш</h3>
          </div>
        </div>

        {/* 横向滑动晒单 */}
        <div className="relative">
          <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/show-off/${post.id}`}
                className="flex-shrink-0 w-48 bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* 图片 */}
                <div className="relative aspect-square">
                  <Image
                    src={post.images[0] || '/api/placeholder/192/192'}
                    alt={`Ошкоркунии ${post.user.name}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
                    <HeartSolidIcon className="w-3 h-3 inline mr-1" />
                    {post.stats.likeCount > 999 ? `${(post.stats.likeCount / 1000).toFixed(1)}K` : post.stats.likeCount}
                  </div>
                </div>

                {/* 信息 */}
                <div className="p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {post.user.avatar ? (
                        <Image
                          src={post.user.avatar}
                          alt={post.user.name}
                          width={24}
                          height={24}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        post.user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-900 truncate">{post.user.name}</span>
                    {post.user.vipLevel > 0 && (
                      <span className="inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                        ⭐Lv.{post.user.vipLevel}
                      </span>
                    )}
                  </div>
                  
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                    {post.product.name}
                  </h4>
                  
                  <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* 查看更多按钮 */}
          <div className="text-center mt-4">
            <Link
              href="/show-off"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
            >
              <span>Дидани бештар ошкоркунӣ→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowOffCarousel;