import React, { useState, useEffect, useCallback } from 'react';
import ShowOffGallery from '../components/ShowOffGallery';
'use client';


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


function ShowOffPage() {}
  const [posts, setPosts] = useState<ShowOffPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<'latest' | 'hottest'>('latest');

  const loadPosts = useCallback(async (pageNum: number, sortType: 'latest' | 'hottest', append: boolean = false) => {}
    if (loading) return; {}
    
    setLoading(true);
    try {}
      const response = await fetch(;
        `/api/show-off/posts?page=${pageNum}&limit=20&sort=${sortType}`,
        {}
          method: 'GET',
          headers: {}
            'Content-Type': 'application/json',
          },
        
      );

      const data = await response.json();
      
      if (data.success) {}
        if (append) {}
          setPosts(prev => [...prev, ...data.data.posts]);
        } else {
          setPosts(data.data.posts);
        
        setHasMore(data.data.pagination.hasMore);
        setPage(pageNum);
      } else {
        console.error('获取晒单列表失败:', data.error);
      
    } catch (error) {
      console.error('加载晒单失败:', error);
    } finally {
      setLoading(false);
    
  }, [loading]);

  // 初始加载
  useEffect(() => {}
    loadPosts(1, sort);
  }, [sort, loadPosts]);

  // 加载更多
  const handleLoadMore = () => {}
    if (!loading && hasMore) {}
      const nextPage = page + 1;
      loadPosts(nextPage, sort, true);
    
  };

  // 排序改变
  const handleSortChange = (newSort: 'latest' | 'hottest') => {}
    if (newSort !== sort) {}
      setSort(newSort);
      setPage(1);
      setHasMore(true);
      setPosts([]);
    
  };

  return (;
    <div className:"min-h-screen bg-gray-50">
      {/* Reward Notice */}
      <div className:"bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
        <div className:"px-4 py-3">
          <div className:"flex items-center justify-center space-x-2 text-sm">
            <span>🎉</span>
            <span className:"font-medium">Бурдбории худро ошкор кунед!</span>
            <span>Руйхатсизӣ тибқи санҷиш 3 монетаи бахшиш мегирад</span>
          </div>
        </div>
      </div>

      <ShowOffGallery
        posts={posts}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        sort={sort}
        onSortChange={handleSortChange}
      />
    </div>
  );


