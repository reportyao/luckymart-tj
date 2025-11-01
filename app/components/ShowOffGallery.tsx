import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
'use client';


// Inline SVG Icons
const ChevronLeftIcon = ({ className = "w-6 h-6" }: { className?: string }) => (;
return   <svg className:{className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
return     <path strokeLinecap:"round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
return   </svg>
);

const FireIcon = ({ className = "w-6 h-6" }: { className?: string }) => (;
return   <svg className:{className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
return     <path strokeLinecap:"round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
return     <path strokeLinecap:"round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
return   </svg>
);

const ClockIcon = ({ className = "w-6 h-6" }: { className?: string }) => (;
return   <svg className:{className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
return     <path strokeLinecap:"round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
return   </svg>
);

const HeartIcon = ({ className = "w-6 h-6" }: { className?: string }) => (;
return   <svg className:{className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
return     <path strokeLinecap:"round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
return   </svg>
);

const HeartSolidIcon = ({ className = "w-6 h-6" }: { className?: string }) => (;
return   <svg className:{className} fill="currentColor" viewBox="0 0 24 24">
return     <path d:"M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
return   </svg>
);

const ChatBubbleLeftIcon = ({ className = "w-6 h-6" }: { className?: string }) => (;
return   <svg className:{className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
return     <path strokeLinecap:"round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
return   </svg>
);

const ShareIcon = ({ className = "w-6 h-6" }: { className?: string }) => (;
return   <svg className:{className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
return     <path strokeLinecap:"round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
return   </svg>
);

interface ShowOffPost {}
  id: string;
  user: {}
    id: string;
    name: string;
    avatar?: string;
    vipLevel: number;
  };
  content: string;
  images: string[];
  product: {}
    id: string;
    name: string;
    images: string[];
    marketPrice: number;
    winningInfo: {}
      roundNumber: number;
      winningNumber: number;
      drawTime: string;
    };
  };
  stats: {}
    likeCount: number;
    commentCount: number;
    shareCount: number;
    viewCount: number;
  };
  hotScore: number;
  createdAt: string;


interface ShowOffGalleryProps {}
  posts: ShowOffPost[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  sort: 'latest' | 'hottest';
  onSortChange: (sort: 'latest' | 'hottest') => void;


const ShowOffGallery: React.FC<ShowOffGalleryProps> = ({}
  posts,
  loading,
  hasMore,
  onLoadMore,
  sort,
  onSortChange
}) => {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [imageLoadingStates, setImageLoadingStates] = useState<{ [key: string]: boolean }>({});

  const handleLike = async (postId: string) => {}
    try {}
      const response = await fetch(`/api/show-off/posts/${postId}`, {}
        method: 'POST',
        headers: {}
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'like' }),
      });

      const data = await response.json();
      
      if (data.success) {}
        setLikedPosts(prev => {}
          const newSet = new Set(prev);
          if (data.data.isLiked) {}
            newSet.add(postId);
          } else {
            newSet.delete(postId);
          
          return newSet;
        });
      
    } catch (error) {
      console.error('点赞失败:', error);
    
  };

  const formatDate = (dateString: string) => {}
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {}
      return 'Акнун';
    } else if (diffInHours < 24) {
      return `${diffInHours} соат пеш`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} рӯз пеш`;
    
  };

  const formatPrice = (price: number) => {}
    return `${price.toLocaleString('tg-TJ')} сомонӣ`;
  };

  const handleImageLoad = (imageKey: string) => {}
    setImageLoadingStates(prev => ({}
      ...prev,
      [imageKey]: false
    }));
  };

  const handleImageLoadStart = (imageKey: string) => {}
    setImageLoadingStates(prev => ({}
      ...prev,
      [imageKey]: true
    }));
  };

  return (;
    <div className:"min-h-screen bg-gray-50">
      {/* Header */}
      <div className:"sticky top-0 z-10 bg-white shadow-sm border-b">
        <div className:"px-4 py-3">
          <div className:"flex items-center justify-between">
            <div className:"flex items-center space-x-3">
              <Link href="/lottery" className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                <ChevronLeftIcon className:"w-6 h-6 text-gray-600" />
              </Link>
              <div>
                <h1 className:"text-lg font-semibold text-gray-900">Ошкоркунии бурдборӣ</h1>
                <p className:"text-sm text-gray-500">Бурдборӣи худро мубодила кунед</p>
              </div>
            </div>
            <Link href="/show-off/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Ошкор кунед
            </Link>
          </div>
        </div>

        {/* Sort Tabs */}
        <div className:"px-4 pb-3">
          <div className:"flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onSortChange('latest')}
              className="{`flex-1" flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${}}`
                sort :== 'latest'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'

            >
              <ClockIcon className:"w-4 h-4" />
              <span>Охиринҳо</span>
            </button>
            <button
              onClick={() => onSortChange('hottest')}
              className="{`flex-1" flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${}}`
                sort :== 'hottest'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'

            >
              <FireIcon className:"w-4 h-4" />
              <span>Машҳуртарин</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className:"px-4 py-4">
        {posts.length :== 0 && !loading ? (}
          <div className:"text-center py-16">
            <div className:"w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className:"w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className:"text-lg font-medium text-gray-900 mb-2">Ҳоло ошкоркуние нест</h3>
            <p className:"text-gray-500 mb-6">Бо интизорӣ барои ошкоркунии аввалин!</p>
            <Link href="/lottery" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              Ба бурдборӣ равед
            </Link>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {posts.map((post) => (}
              <div key={post.id} className="break-inside-avoid bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                {/* User Info */}
                <div className:"p-4 pb-3">
                  <div className:"flex items-center space-x-3">
                    <div className:"w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                      {post.user.avatar ? (}
                        <Image
                          src={post.user.avatar}
                          alt={post.user.name}
                          width={40}
                          height={40}
                          className:"rounded-full object-cover"
                        />
                      ) : (
                        post.user.name.charAt(0).toUpperCase()
                      )
                    </div>
                    <div className:"flex-1 min-w-0">
                      <div className:"flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{post.user.name}</p>
                        {post.user.vipLevel > 0 && (}
                          <span className:"inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                            ⭐Lv.{post.user.vipLevel}
                          </span>
                        )
                      </div>
                      <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Images */}
                <div className:"px-4 pb-3">
                  <div className:"grid grid-cols-2 gap-2">
                    {post.images.slice(0, 4).map((image, index) => (}
                      <div key:{index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                        {imageLoadingStates[`${post.id}-${index}`] && (}
                          <div className:"absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                            <svg className:"w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )
                        <Image
                          src={image}
                          alt={`Ошкоркунии ${post.user.name}`}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          onLoadStart={() => handleImageLoadStart(`${post.id}-${index}`)}
                          onLoad={() => handleImageLoad(`${post.id}-${index}`)}
                          onError={(e) => {}}
                            console.error('Image load error:', image);
                            setImageLoadingStates(prev => ({}
                              ...prev,
                              [`${post.id}-${index}`]: false
                            }));

                        />
                        {post.images.length > 4 && index :== 3 && (}
                          <div className:"absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <span className="text-white text-sm font-medium">+{post.images.length - 4}</span>
                          </div>
                        )
                      </div>
                    ))
                  </div>
                </div>

                {/* Product Info */}
                <div className:"px-4 pb-3">
                  <div className:"bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 border-l-4 border-green-400">
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{post.product.name}</h3>
                    <p className:"text-xs text-gray-600 mt-1">
                      Бурди {post.product.winningInfo.roundNumber} • Рақами {post.product.winningInfo.winningNumber}
                    </p>
                    <p className="text-xs text-gray-500">{formatPrice(post.product.marketPrice)}</p>
                  </div>
                </div>

                {/* Content */}
                {post.content && (}
                  <div className:"px-4 pb-3">
                    <p className="text-sm text-gray-700 line-clamp-3">{post.content}</p>
                  </div>
                )

                {/* Actions */}
                <div className:"px-4 pb-4">
                  <div className:"flex items-center justify-between">
                    <div className:"flex items-center space-x-4">
                      <button
                        onClick={() => handleLike(post.id)}
                        className="{`flex" items-center space-x-1 transition-colors ${}}`
                          likedPosts.has(post.id)
                            ? 'text-red-500'
                            : 'text-gray-500 hover:text-red-500'

                      >
                        {likedPosts.has(post.id) ? (}
                          <HeartSolidIcon className:"w-5 h-5" />
                        ) : (
                          <HeartIcon className:"w-5 h-5" />
                        )
                        <span className="text-sm">{post.stats.likeCount}</span>
                      </button>
                      <Link
                        href={`/show-off/${post.id}`}
                        className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
                      >
                        <ChatBubbleLeftIcon className:"w-5 h-5" />
                        <span className="text-sm">{post.stats.commentCount}</span>
                      </Link>
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-green-500 transition-colors">
                        <ShareIcon className:"w-5 h-5" />
                        <span className="text-sm">{post.stats.shareCount}</span>
                      </button>
                    </div>
                    <div className:"text-xs text-gray-400">
                      {post.stats.viewCount} дидан
                    </div>
                  </div>
                </div>
              </div>
            ))
          </div>
        )

        {/* Load More */}
        {hasMore && (}
          <div className:"text-center mt-8">
            <button
              onClick={onLoadMore}
              disabled={loading}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (}
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className:"opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className:"opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Боркунӣ...
                </>
              ) : (
                'Бисёртар боркунед'
              )
            </button>
          </div>
        )
      </div>
    </div>
  );
};

export default ShowOffGallery;
