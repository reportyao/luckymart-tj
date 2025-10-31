'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  EyeIcon,
  ClockIcon,
  FireIcon
} from '@heroicons/react/24/outline';

interface ShowOffPost {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    vipLevel: number;
    preferredLanguage: string;
  };
  content: string;
  images: string[];
  product: {
    id: string;
    name: string;
    winningNumber: number;
    drawTime: string;
  };
  stats: {
    likeCount: number;
    commentCount: number;
    shareCount: number;
    viewCount: number;
  };
  review: {
    autoReviewPassed?: boolean;
    autoReviewReason?: string;
    reviewedBy?: string;
    reviewedAt?: string;
    rejectReason?: string;
  };
  createdAt: string;
}

type FilterType = 'pending' | 'approved' | 'rejected';

export default function AdminShowOffPage() {
  const [posts, setPosts] = useState<ShowOffPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<ShowOffPost | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // 加载审核列表
  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/show-off/posts?status=${filter}`);
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.data.posts);
      } else {
        console.error('获取审核列表失败:', data.error);
      }
    } catch (error) {
      console.error('加载审核列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [filter]);

  // 审核操作
  const handleReview = async (postId: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !rejectReason.trim()) {
      alert('Лутфан сабаби радкуниро нависед');
      return;
    }

    setProcessingId(postId);
    try {
      const response = await fetch('/api/admin/show-off/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          action,
          reason: rejectReason
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        setShowDetailModal(false);
        setRejectReason('');
        setSelectedPost(null);
        loadPosts(); // 重新加载列表
      } else {
        alert(data.error || 'Амалиёти санҷиш ноком шуд');
      }
    } catch (error) {
      console.error('审核操作失败:', error);
      alert('Хатогӣ рӯй дод. Лутфан дубора кӯшиш кунед.');
    } finally {
      setProcessingId(null);
    }
  };

  const openDetailModal = (post: ShowOffPost) => {
    setSelectedPost(post);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setRejectReason('');
    setSelectedPost(null);
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

  const filterOptions = [
    { key: 'pending' as FilterType, label: 'Дар интизорӣ', color: 'bg-yellow-100 text-yellow-800' },
    { key: 'approved' as FilterType, label: 'Ичозатдодашуда', color: 'bg-green-100 text-green-800' },
    { key: 'rejected' as FilterType, label: 'Радшуда', color: 'bg-red-100 text-red-800' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Идоракунии ошкоркунӣ</h1>
              <p className="text-gray-600">Санҷиш ва идоракунии ошкоркунии корбарон</p>
            </div>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Ба панели идоракунӣ
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center">
                <ClockIcon className="w-8 h-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Дар интизорӣ</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {posts.filter(p => filter === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center">
                <CheckCircleIcon className="w-8 h-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ичозатдодашуда</p>
                  <p className="text-2xl font-bold text-green-600">
                    {posts.filter(p => p.status === 'approved').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center">
                <XCircleIcon className="w-8 h-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Радшуда</p>
                  <p className="text-2xl font-bold text-red-600">
                    {posts.filter(p => p.status === 'rejected').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 pb-4">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {filterOptions.map((option) => (
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
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Боркунии маълумот...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.467-.582-6.347-1.591M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v-.106A12.318 12.318 0 0118 16.5c-2.335 0-4.52-.937-6.081-2.57" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ошкоркунии {filterOptions.find(o => o.key === filter)?.label} нест
            </h3>
            <p className="text-gray-500">
              Ҳоло ошкоркуние дар ин ҳолат мавҷуд нест
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                        {post.user.avatar ? (
                          <Image
                            src={post.user.avatar}
                            alt={post.user.name}
                            width={48}
                            height={48}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          post.user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{post.user.name}</h3>
                        <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        filterOptions.find(o => o.key === filter)?.color
                      }`}>
                        {filterOptions.find(o => o.key === filter)?.label}
                      </span>
                      {post.review.autoReviewPassed && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          Автоматӣ
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">{post.product.name}</h4>
                    <p className="text-sm text-gray-600">
                      Рақами бурд: {post.product.winningNumber} • 
                      Санҷиш: {new Date(post.product.drawTime).toLocaleDateString('tg-TJ')}
                    </p>
                  </div>

                  {/* Images */}
                  {post.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      {post.images.slice(0, 4).map((image, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={image}
                            alt={`Ошкоркунӣ ${index + 1}`}
                            width={100}
                            height={100}
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                            onClick={() => openDetailModal(post)}
                          />
                        </div>
                      ))}
                      {post.images.length > 4 && (
                        <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="text-sm text-gray-600">+{post.images.length - 4}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  {post.content && (
                    <div className="mb-4">
                      <p className="text-gray-700 leading-relaxed">{post.content}</p>
                    </div>
                  )}

                  {/* Review Info */}
                  {post.review.autoReviewPassed === false && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-yellow-800">
                        <span className="font-medium">Автоматӣ рад шудааст:</span> {post.review.autoReviewReason}
                      </p>
                    </div>
                  )}

                  {post.review.rejectReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-red-800">
                        <span className="font-medium">Сабаби радкунӣ:</span> {post.review.rejectReason}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <EyeIcon className="w-4 h-4" />
                        <span>{post.stats.viewCount}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FireIcon className="w-4 h-4" />
                        <span>{post.stats.likeCount}</span>
                      </div>
                    </div>
                    
                    {filter === 'pending' && (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => openDetailModal(post)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <EyeIcon className="w-4 h-4 mr-2" />
                          Дида мешавад
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Маълумоти пурраи ошкоркунӣ</h3>
                <button
                  onClick={closeDetailModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* User Info */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Маълумоти корбар</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p><span className="font-medium">Ном:</span> {selectedPost.user.name}</p>
                  <p><span className="font-medium">Санаи ошкоркунӣ:</span> {formatDate(selectedPost.createdAt)}</p>
                  {selectedPost.review.reviewedAt && (
                    <p><span className="font-medium">Санаи санҷиш:</span> {formatDate(selectedPost.review.reviewedAt)}</p>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Маълумоти маҳсулот</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p><span className="font-medium">Номи маҳсулот:</span> {selectedPost.product.name}</p>
                  <p><span className="font-medium">Рақами бурд:</span> {selectedPost.product.winningNumber}</p>
                  <p><span className="font-medium">Санаи бурд:</span> {new Date(selectedPost.product.drawTime).toLocaleDateString('tg-TJ')}</p>
                </div>
              </div>

              {/* Images */}
              {selectedPost.images.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Расмҳо ({selectedPost.images.length})</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedPost.images.map((image, index) => (
                      <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={image}
                          alt={`Ошкоркунӣ ${index + 1}`}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Content */}
              {selectedPost.content && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Матн</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-700 leading-relaxed">{selectedPost.content}</p>
                  </div>
                </div>
              )}

              {/* Auto Review Info */}
              {selectedPost.review.autoReviewPassed === false && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Натиҷаи автоматӣ</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800">{selectedPost.review.autoReviewReason}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              {filter === 'pending' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Сабаби радкунӣ (барои радкунӣ)
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Дар ин ҷо сабаби радкуниро нависед..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleReview(selectedPost.id, 'approve')}
                      disabled={processingId === selectedPost.id}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {processingId === selectedPost.id ? (
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-5 h-5 mr-2" />
                          Ичозат додан
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleReview(selectedPost.id, 'reject')}
                      disabled={processingId === selectedPost.id || !rejectReason.trim()}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {processingId === selectedPost.id ? (
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <>
                          <XCircleIcon className="w-5 h-5 mr-2" />
                          Рад кунед
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
