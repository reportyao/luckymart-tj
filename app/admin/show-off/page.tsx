'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// SVG图标组件
const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FireIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
  </svg>
);

const ChartBarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const ShieldCheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const UserGroupIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

// 审核Tab组件
function AuditTab() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [processingBatch, setProcessingBatch] = useState(false);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/show-off/posts?status=${filter}`);
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.data.posts);
      }
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [filter]);

  // 批量审核
  const handleBatchReview = async (action: 'approve' | 'reject') => {
    if (selectedPosts.size === 0) {
      alert('请先选择要审核的晒单');
      return;
    }

    if (action === 'reject' && !confirm('确定要批量拒绝这些晒单吗?')) {
      return;
    }

    setProcessingBatch(true);
    try {
      const response = await fetch('/api/admin/show-off/audit/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postIds: Array.from(selectedPosts),
          action,
          rejectReason: action === 'reject' ? '批量审核拒绝' : undefined,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`批量${action === 'approve' ? '通过' : '拒绝'}成功`);
        setSelectedPosts(new Set());
        loadPosts();
      } else {
        alert(data.error || '操作失败');
      }
    } catch (error) {
      console.error('批量审核失败:', error);
      alert('操作失败');
    } finally {
      setProcessingBatch(false);
    }
  };

  const togglePostSelection = (postId: string) => {
    const newSelection = new Set(selectedPosts);
    if (newSelection.has(postId)) {
      newSelection.delete(postId);
    } else {
      newSelection.add(postId);
    }
    setSelectedPosts(newSelection);
  };

  const selectAll = () => {
    if (selectedPosts.size === posts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(posts.map(p => p.id)));
    }
  };

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
        {[
          { key: 'pending' as const, label: '待审核', color: 'text-yellow-600' },
          { key: 'approved' as const, label: '已通过', color: 'text-green-600' },
          { key: 'rejected' as const, label: '已拒绝', color: 'text-red-600' },
        ].map((option) => (
          <button
            key={option.key}
            onClick={() => setFilter(option.key)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              filter === option.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Batch Actions */}
      {filter === 'pending' && posts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={selectedPosts.size === posts.length && posts.length > 0}
                onChange={selectAll}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                已选择 {selectedPosts.size} 个晒单
              </span>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => handleBatchReview('approve')}
                disabled={selectedPosts.size === 0 || processingBatch}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
              >
                批量通过
              </button>
              <button
                onClick={() => handleBatchReview('reject')}
                disabled={selectedPosts.size === 0 || processingBatch}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
              >
                批量拒绝
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Posts List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">暂无数据</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-start space-x-4">
                {filter === 'pending' && (
                  <input
                    type="checkbox"
                    checked={selectedPosts.has(post.id)}
                    onChange={() => togglePostSelection(post.id)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                )}
                <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {post.images?.[0] && (
                    <Image
                      src={post.images[0]}
                      alt="晒单图片"
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{post.user?.username || '用户'}</h4>
                      <p className="text-sm text-gray-500 line-clamp-2">{post.content}</p>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <FireIcon className="w-4 h-4 mr-1" />
                        {post.likesCount || 0}
                      </span>
                      <span className="flex items-center">
                        <EyeIcon className="w-4 h-4 mr-1" />
                        {post.viewsCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 热度管理Tab组件
function HotnessTab() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [timeRange, setTimeRange] = useState('7d');

  const loadHotnessData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/show-off/hotness?timeRange=${timeRange}&limit=50`);
      const data = await response.json();
      setPosts(data.posts);
      setConfig(data.config);
    } catch (error) {
      console.error('加载热度数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotnessData();
  }, [timeRange]);

  const handleRecalculate = async () => {
    if (!confirm('确定要重新计算所有晒单的热度吗?')) return;

    try {
      const response = await fetch('/api/admin/show-off/hotness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weights: config,
          recalculate: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('热度重新计算成功');
        loadHotnessData();
      }
    } catch (error) {
      console.error('重新计算失败:', error);
      alert('操作失败');
    }
  };

  return (
    <div>
      {/* Controls */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">热度算法配置</h3>
          <button
            onClick={handleRecalculate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            重新计算热度
          </button>
        </div>
        {config && (
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">点赞权重</p>
              <p className="text-lg font-semibold text-gray-900">{config.likes}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">评论权重</p>
              <p className="text-lg font-semibold text-gray-900">{config.comments}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">浏览权重</p>
              <p className="text-lg font-semibold text-gray-900">{config.views}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">时间衰减</p>
              <p className="text-lg font-semibold text-gray-900">{config.time_decay}</p>
            </div>
          </div>
        )}
      </div>

      {/* Time Range Filter */}
      <div className="flex space-x-2 mb-6">
        {[
          { key: '7d', label: '近7天' },
          { key: '30d', label: '近30天' },
          { key: 'all', label: '全部' },
        ].map((option) => (
          <button
            key={option.key}
            onClick={() => setTimeRange(option.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              timeRange === option.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Hotness Ranking */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post, index) => (
            <div key={post.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-center space-x-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-yellow-400 text-white' :
                  index === 1 ? 'bg-gray-300 text-white' :
                  index === 2 ? 'bg-orange-400 text-white' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                  {post.images?.[0] && (
                    <Image
                      src={post.images[0]}
                      alt="晒单"
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 line-clamp-1">{post.content}</p>
                  <p className="text-xs text-gray-500">{post.user?.username}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">{post.hotnessScore}</p>
                  <p className="text-xs text-gray-500">热度值</p>
                </div>
                <div className="text-right text-sm text-gray-500 space-y-1">
                  <p>👍 {post.likesCount}</p>
                  <p>💬 {post.commentsCount}</p>
                  <p>👁️ {post.viewsCount}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 数据统计Tab组件
function AnalyticsTab() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await fetch('/api/admin/show-off/analytics');
        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error('加载统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">加载中...</p>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-600 mb-1">总晒单数</p>
          <p className="text-2xl font-bold text-gray-900">{analytics.overview?.totalPosts || 0}</p>
          <p className="text-xs text-gray-500 mt-1">
            通过率 {((analytics.overview?.approvedPosts / analytics.overview?.totalPosts) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-600 mb-1">总点赞数</p>
          <p className="text-2xl font-bold text-orange-600">{analytics.overview?.totalLikes || 0}</p>
          <p className="text-xs text-gray-500 mt-1">
            平均 {(analytics.overview?.totalLikes / analytics.overview?.totalPosts).toFixed(1)} 赞/篇
          </p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-600 mb-1">总评论数</p>
          <p className="text-2xl font-bold text-blue-600">{analytics.overview?.totalComments || 0}</p>
          <p className="text-xs text-gray-500 mt-1">
            平均 {(analytics.overview?.totalComments / analytics.overview?.totalPosts).toFixed(1)} 评论/篇
          </p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-600 mb-1">互动率</p>
          <p className="text-2xl font-bold text-green-600">{analytics.overview?.engagementRate?.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">
            较上周 {analytics.overview?.growthRate > 0 ? '+' : ''}{analytics.overview?.growthRate?.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Top Posts */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold text-gray-900 mb-4">热门晒单 Top 10</h3>
        <div className="space-y-3">
          {analytics.topPosts?.slice(0, 10).map((post: any, index: number) => (
            <div key={post.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <span className="font-bold text-gray-400 w-6">{index + 1}</span>
              <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden">
                {post.images?.[0] && (
                  <Image
                    src={post.images[0]}
                    alt="晒单"
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 line-clamp-1">{post.content}</p>
                <p className="text-xs text-gray-500">{post.user?.username}</p>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>👍 {post.likesCount}</span>
                <span>💬 {post.commentsCount}</span>
                <span>👁️ {post.viewsCount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 内容质量Tab组件
function QualityTab() {
  const [quality, setQuality] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadQuality = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/show-off/content-quality?filter=${filter}`);
        const data = await response.json();
        setQuality(data);
      } catch (error) {
        console.error('加载质量数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQuality();
  }, [filter]);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quality Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-600 mb-1">高质量</p>
          <p className="text-2xl font-bold text-green-600">{quality?.stats?.highQuality || 0}</p>
          <p className="text-xs text-gray-500 mt-1">得分 ≥ 80</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-600 mb-1">中等质量</p>
          <p className="text-2xl font-bold text-yellow-600">{quality?.stats?.mediumQuality || 0}</p>
          <p className="text-xs text-gray-500 mt-1">得分 60-79</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-600 mb-1">低质量</p>
          <p className="text-2xl font-bold text-red-600">{quality?.stats?.lowQuality || 0}</p>
          <p className="text-xs text-gray-500 mt-1">得分 &lt; 60</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-600 mb-1">可疑内容</p>
          <p className="text-2xl font-bold text-orange-600">{quality?.stats?.suspicious || 0}</p>
          <p className="text-xs text-gray-500 mt-1">需要人工审核</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex space-x-2">
        {[
          { key: 'all', label: '全部' },
          { key: 'low_quality', label: '低质量' },
          { key: 'suspicious', label: '可疑内容' },
        ].map((option) => (
          <button
            key={option.key}
            onClick={() => setFilter(option.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === option.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Quality Posts */}
      <div className="space-y-3">
        {quality?.posts?.map((post: any) => (
          <div key={post.id} className="bg-white rounded-lg border p-4">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                {post.images?.[0] && (
                  <Image
                    src={post.images[0]}
                    alt="晒单"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{post.user?.username}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{post.content}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${
                      post.qualityScore >= 80 ? 'text-green-600' :
                      post.qualityScore >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {post.qualityScore}
                    </p>
                    <p className="text-xs text-gray-500">质量分</p>
                  </div>
                </div>
                {post.issues && post.issues.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {post.issues.map((issue: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs"
                      >
                        {issue}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 推荐管理Tab组件
function RecommendationsTab() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecommendations = async () => {
    try {
      const response = await fetch('/api/admin/show-off/recommendations');
      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (error) {
      console.error('加载推荐失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/admin/show-off/recommendations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive }),
      });

      if (response.ok) {
        loadRecommendations();
      }
    } catch (error) {
      console.error('操作失败:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec) => (
        <div key={rec.id} className="bg-white rounded-lg border p-4">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden">
              {rec.post?.images?.[0] && (
                <Image
                  src={rec.post.images[0]}
                  alt="推荐晒单"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{rec.post?.user?.username}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{rec.post?.content}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {rec.position === 'homepage' ? '首页' : rec.position === 'detail' ? '详情页' : '个人页'}
                    </span>
                    <span>优先级: {rec.priority}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleActive(rec.id, rec.isActive)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      rec.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {rec.isActive ? '已启用' : '已禁用'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 主组件
function AdminShowOffPage() {
  const [activeTab, setActiveTab] = useState('audit');

  const tabs = [
    { key: 'audit', label: '审核管理', icon: CheckCircleIcon },
    { key: 'hotness', label: '热度管理', icon: FireIcon },
    { key: 'analytics', label: '数据统计', icon: ChartBarIcon },
    { key: 'quality', label: '内容质量', icon: ShieldCheckIcon },
    { key: 'recommendations', label: '推荐管理', icon: StarIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">晒单系统管理</h1>
              <p className="text-gray-600">审核、管理和优化用户晒单内容</p>
            </div>
            <Link
              href="/admin/dashboard"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              返回控制台
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 border-b">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {activeTab === 'audit' && <AuditTab />}
        {activeTab === 'hotness' && <HotnessTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'quality' && <QualityTab />}
        {activeTab === 'recommendations' && <RecommendationsTab />}
      </div>
    </div>
  );
}
export default AdminShowOffPage;
