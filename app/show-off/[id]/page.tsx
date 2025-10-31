'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ChevronLeftIcon, 
  HeartIcon, 
  ChatBubbleLeftIcon, 
  ShareIcon,
  FireIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
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
    description?: string;
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
  isLiked: boolean;
}

interface Comment {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    vipLevel: number;
  };
  content: string;
  likeCount: number;
  createdAt: string;
  replies: Comment[];
}

export default function ShowOffDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  
  const [post, setPost] = useState<ShowOffPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 加载晒单详情
  useEffect(() => {
    const loadPostDetail = async () => {
      if (!postId) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/show-off/posts/${postId}`);
        const data = await response.json();
        
        if (data.success) {
          setPost(data.data);
        } else {
          console.error('获取晒单详情失败:', data.error);
        }
      } catch (error) {
        console.error('加载晒单详情失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPostDetail();
  }, [postId]);

  // 加载评论
  useEffect(() => {
    const loadComments = async () => {
      if (!postId) return;
      
      try {
        const response = await fetch(`/api/show-off/posts/${postId}/comments`);
        const data = await response.json();
        
        if (data.success) {
          setComments(data.data.comments);
        }
      } catch (error) {
        console.error('加载评论失败:', error);
      }
    };

    loadComments();
  }, [postId]);

  const handleLike = async () => {
    if (!post) return;
    
    try {
      const response = await fetch(`/api/show-off/posts/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setPost(prev => prev ? {
          ...prev,
          isLiked: data.data.isLiked,
          stats: {
            ...prev.stats,
            likeCount: data.data.likeCount
          }
        } : null);
      }
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/show-off/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim()
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setNewComment('');
        // 重新加载评论
        const commentsResponse = await fetch(`/api/show-off/posts/${postId}/comments`);
        const commentsData = await commentsResponse.response.json();
        if (commentsData.success) {
          setComments(commentsData.data.comments);
        }
        // 更新评论数
        setPost(prev => prev ? {
          ...prev,
          stats: {
            ...prev.stats,
            commentCount: prev.stats.commentCount + 1
          }
        } : null);
      } else {
        alert(data.error || 'Ирсоли шарҳ ноком шуд');
      }
    } catch (error) {
      console.error('发送评论失败:', error);
      alert('Хатогӣ рӯй дод. Лутфан дубора кӯшиш кунед.');
    } finally {
      setSubmittingComment(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Боркунии маълумот...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.467-.582-6.347-1.591M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v-.106A12.318 12.318 0 0118 16.5c-2.335 0-4.52-.937-6.081-2.57" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ошкоркунӣ ёфт нашуд</h3>
          <p className="text-gray-500 mb-6">Ошкоркунии бо ин ID мавҷуд нест ё нест карда шудааст.</p>
          <Link href="/show-off" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            Ба рӯйхати ошкоркунӣ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100"
            >
              <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Маълумоти ошкоркунӣ</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pb-20">
        {/* User Info */}
        <div className="bg-white p-4 border-b">
          <div className="flex items-center space-x-3">
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
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <p className="font-medium text-gray-900">{post.user.name}</p>
                {post.user.vipLevel > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                    ⭐Lv.{post.user.vipLevel}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Images Carousel */}
        {post.images.length > 0 && (
          <div className="bg-white border-b">
            <div className="relative aspect-square max-w-md mx-auto">
              <Image
                src={post.images[currentImageIndex]}
                alt={`Ошкоркунӣ ${currentImageIndex + 1}`}
                fill
                className="object-cover"
                priority
              />
              
              {/* Image Navigation */}
              {post.images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : post.images.length - 1)}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(prev => prev < post.images.length - 1 ? prev + 1 : 0)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {/* Dots Indicator */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {post.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Product Info */}
        <div className="bg-white p-4 border-b">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border-l-4 border-green-400">
            <h3 className="font-semibold text-gray-900 text-lg mb-2">{post.product.name}</h3>
            {post.product.description && (
              <p className="text-gray-700 mb-3">{post.product.description}</p>
            )}
            <div className="space-y-1 text-sm">
              <p className="text-gray-600">
                <span className="font-medium">Бурди:</span> {post.product.winningInfo.roundNumber}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Рақами бурд:</span> {post.product.winningInfo.winningNumber}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Санаи бурд:</span> {new Date(post.product.winningInfo.drawTime).toLocaleDateString('tg-TJ')}
              </p>
              <p className="text-gray-800 font-medium">
                <span className="font-medium">Нархи бозор:</span> {formatPrice(post.product.marketPrice)}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {post.content && (
          <div className="bg-white p-4 border-b">
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 transition-colors ${
                  post.isLiked
                    ? 'text-red-500'
                    : 'text-gray-500 hover:text-red-500'
                }`}
              >
                {post.isLiked ? (
                  <HeartSolidIcon className="w-6 h-6" />
                ) : (
                  <HeartIcon className="w-6 h-6" />
                )}
                <span className="font-medium">{post.stats.likeCount}</span>
              </button>
              
              <div className="flex items-center space-x-2 text-gray-500">
                <ChatBubbleLeftIcon className="w-6 h-6" />
                <span className="font-medium">{post.stats.commentCount}</span>
              </div>
              
              <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
                <ShareIcon className="w-6 h-6" />
                <span className="font-medium">{post.stats.shareCount}</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <EyeIcon className="w-4 h-4" />
                <span>{post.stats.viewCount}</span>
              </div>
              {post.hotScore > 0 && (
                <div className="flex items-center space-x-1">
                  <FireIcon className="w-4 h-4 text-orange-500" />
                  <span className="text-orange-600 font-medium">{post.hotScore.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="bg-white">
          {/* Comment Input */}
          <div className="p-4 border-b">
            <form onSubmit={handleSubmitComment} className="space-y-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Фикри худро нависед..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                maxLength={500}
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  {newComment.length}/500 ҳарф
                </p>
                <button
                  type="submit"
                  disabled={!newComment.trim() || submittingComment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submittingComment ? 'Ирсол карда истодааст...' : 'Ирсол кардан'}
                </button>
              </div>
            </form>
          </div>

          {/* Comments List */}
          <div className="divide-y">
            {comments.length === 0 ? (
              <div className="p-8 text-center">
                <ChatBubbleLeftIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Ҳоло шарҳе нест. Шумо аввалин кас бошед!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="p-4">
                  <div className="flex space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {comment.user.avatar ? (
                        <Image
                          src={comment.user.avatar}
                          alt={comment.user.name}
                          width={32}
                          height={32}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        comment.user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm">{comment.user.name}</span>
                        {comment.user.vipLevel > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                            ⭐Lv.{comment.user.vipLevel}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed mb-2">{comment.content}</p>
                      <div className="flex items-center space-x-4">
                        <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors">
                          <HeartIcon className="w-4 h-4" />
                          <span className="text-xs">{comment.likeCount}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
